import { logger, metadata, task } from "@trigger.dev/sdk/v3";
import { createInsForgeAdminClient } from "@/lib/insforge/admin";
import { generateDeepgramTts } from "@/lib/voices/deepgram";
import {
  cloneVoiceWithReplicate,
  generateCustomTtsWithReplicate,
} from "@/lib/voices/replicate";
import { buildVoiceKey, removeVoiceObject, uploadVoiceBlob } from "@/lib/voices/storage";
import { defaultDeepgramVoices } from "@/lib/voices/types";

type CloneVoicePayload = {
  voiceId: string;
  userId: string;
  name: string;
  sampleAudioUrl: string;
  sampleAudioKey: string;
};

type GenerateVoiceTtsPayload = {
  resultId: string;
  userId: string;
  voiceSource: "custom" | "deepgram-default";
  voiceId: string;
  voiceName: string;
  text: string;
  customVoiceRef?: string | null;
};

function setProgress(progress: number, stage: string, message: string) {
  metadata.set("progress", progress);
  metadata.set("stage", stage);
  metadata.set("message", message);
}

async function updateVoiceClone(
  voiceId: string,
  values: Record<string, unknown>
) {
  const admin = createInsForgeAdminClient();
  const { error } = await admin.database
    .from("voice_clones")
    .update(values)
    .eq("id", voiceId);

  if (error) {
    throw new Error(error.message ?? "Could not update voice clone.");
  }
}

async function updateTtsResult(
  resultId: string,
  values: Record<string, unknown>
) {
  const admin = createInsForgeAdminClient();
  const { error } = await admin.database
    .from("voice_tts_results")
    .update(values)
    .eq("id", resultId);

  if (error) {
    throw new Error(error.message ?? "Could not update generated audio.");
  }
}

export const cloneVoiceTask = task({
  id: "clone-voice",
  maxDuration: 3600,
  run: async (payload: CloneVoicePayload) => {
    const admin = createInsForgeAdminClient();

    try {
      setProgress(15, "preparing", "Preparing voice sample");
      await updateVoiceClone(payload.voiceId, {
        status: "generating",
        error_message: null,
      });

      setProgress(45, "cloning", "Creating voice reference with Replicate");
      const clone = await cloneVoiceWithReplicate({
        name: payload.name,
        sampleUrl: payload.sampleAudioUrl,
      });

      await updateVoiceClone(payload.voiceId, {
        status: "completed",
        cloned_voice_ref: clone.voiceRef,
        cloned_voice_artifact_url: clone.artifactUrl,
        cloned_voice_metadata: clone.metadata,
        provider: "replicate",
        model: clone.model,
        error_message: null,
      });

      setProgress(100, "complete", "Voice clone is ready");

      return {
        voiceId: payload.voiceId,
        voiceRef: clone.voiceRef,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Voice cloning failed.";

      logger.error("Voice cloning failed", {
        voiceId: payload.voiceId,
        message,
      });

      metadata.set("progress", 100);
      metadata.set("stage", "failed");
      metadata.set("message", message);

      await admin.database.from("voice_clones").delete().eq("id", payload.voiceId);
      await removeVoiceObject(admin, payload.sampleAudioKey);

      throw error;
    }
  },
});

export const generateVoiceTtsTask = task({
  id: "generate-voice-tts",
  maxDuration: 3600,
  run: async (payload: GenerateVoiceTtsPayload) => {
    const admin = createInsForgeAdminClient();

    try {
      setProgress(12, "preparing", "Preparing text to speech request");
      await updateTtsResult(payload.resultId, {
        status: "generating",
        error_message: null,
      });

      let audio: Blob;
      let provider = "deepgram";
      let model = payload.voiceId;

      if (payload.voiceSource === "custom") {
        if (!payload.customVoiceRef) {
          throw new Error("Custom voice reference is missing.");
        }

        setProgress(45, "generating", "Generating speech with cloned voice");
        const result = await generateCustomTtsWithReplicate({
          text: payload.text,
          voiceRef: payload.customVoiceRef,
        });
        audio = result.audio;
        provider = "replicate";
        model = result.model;
      } else {
        const defaultVoice = defaultDeepgramVoices.find(
          (voice) => voice.id === payload.voiceId
        );

        if (!defaultVoice) {
          throw new Error("Default voice not found.");
        }

        setProgress(45, "generating", "Generating speech with Deepgram");
        audio = await generateDeepgramTts({
          text: payload.text,
          model: defaultVoice.id,
        });
      }

      setProgress(78, "saving", "Saving generated audio");
      const uploaded = await uploadVoiceBlob(
        admin,
        buildVoiceKey(payload.userId, "tts", "mp3"),
        audio
      );

      await updateTtsResult(payload.resultId, {
        status: "completed",
        audio_url: uploaded.url,
        audio_key: uploaded.key,
        provider,
        model,
        error_message: null,
      });

      setProgress(100, "complete", "Generated audio is ready");

      return {
        resultId: payload.resultId,
        audioUrl: uploaded.url,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Text to speech failed.";

      logger.error("Voice TTS generation failed", {
        resultId: payload.resultId,
        message,
      });

      metadata.set("progress", 100);
      metadata.set("stage", "failed");
      metadata.set("message", message);

      await updateTtsResult(payload.resultId, {
        status: "failed",
        error_message: message,
      });

      throw error;
    }
  },
});
