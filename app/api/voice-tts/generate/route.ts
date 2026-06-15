import { auth, tasks } from "@trigger.dev/sdk/v3";
import type { generateVoiceTtsTask } from "@/trigger/voice-cloning";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import {
  TTS_TEXT_LIMIT,
  calculateTtsCredits,
  defaultDeepgramVoices,
  toVoiceTtsListItem,
  type VoiceCloneRecord,
  type VoiceSource,
  type VoiceTtsRecord,
} from "@/lib/voices/types";
import { getReplicateTtsModel } from "@/lib/voices/replicate";

type GenerateBody = {
  voiceSource?: VoiceSource;
  voiceId?: string;
  text?: string;
};

function getBodyValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const client = await createInsForgeServerClient();
  const { data: authData } = await client.auth.getCurrentUser();

  if (!authData.user) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as GenerateBody;
  const voiceSource = body.voiceSource;
  const voiceId = getBodyValue(body.voiceId);
  const text = getBodyValue(body.text);

  if (text.length < 1 || text.length > TTS_TEXT_LIMIT) {
    return Response.json(
      { message: `Enter between 1 and ${TTS_TEXT_LIMIT} characters.` },
      { status: 400 }
    );
  }

  if (voiceSource !== "custom" && voiceSource !== "deepgram-default") {
    return Response.json({ message: "Choose a valid voice." }, { status: 400 });
  }

  let voiceName = "";
  let provider = "";
  let model = "";
  let customVoiceRef: string | null = null;

  if (voiceSource === "deepgram-default") {
    const defaultVoice = defaultDeepgramVoices.find((voice) => voice.id === voiceId);
    if (!defaultVoice) {
      return Response.json(
        { message: "Choose a valid Deepgram voice." },
        { status: 400 }
      );
    }
    voiceName = defaultVoice.name;
    provider = "deepgram";
    model = defaultVoice.id;
  } else {
    const { data: customVoice, error } = await client.database
      .from("voice_clones")
      .select("*")
      .eq("id", voiceId)
      .eq("user_id", authData.user.id)
      .eq("status", "completed")
      .maybeSingle();

    if (error) {
      return Response.json(
        { message: error.message ?? "Could not load custom voice." },
        { status: 500 }
      );
    }

    if (!customVoice) {
      return Response.json(
        { message: "Choose a completed custom voice." },
        { status: 400 }
      );
    }

    const record = customVoice as VoiceCloneRecord;
    voiceName = record.name;
    provider = "replicate";
    model = getReplicateTtsModel();
    customVoiceRef = record.cloned_voice_ref ?? record.sample_audio_url;
  }

  const credits = calculateTtsCredits(text.length);
  const { data: inserted, error: insertError } = await client.database
    .from("voice_tts_results")
    .insert([
      {
        user_id: authData.user.id,
        voice_source: voiceSource,
        voice_id: voiceId,
        voice_name: voiceName,
        input_text: text,
        character_count: text.length,
        credits_charged: credits,
        status: "pending",
        provider,
        model,
      },
    ])
    .select()
    .single();

  if (insertError || !inserted) {
    return Response.json(
      { message: insertError?.message ?? "Could not create TTS job." },
      { status: 500 }
    );
  }

  const result = inserted as VoiceTtsRecord;
  const { data: nextBalance, error: creditError } = await client.database.rpc(
    "deduct_voice_tts_credits",
    {
      p_user_id: authData.user.id,
      p_amount: credits,
      p_result_id: result.id,
    }
  );

  if (creditError) {
    await client.database
      .from("voice_tts_results")
      .delete()
      .eq("id", result.id)
      .eq("user_id", authData.user.id);

    return Response.json(
      { message: creditError.message ?? "Insufficient credits." },
      { status: 402 }
    );
  }

  const handle = await tasks.trigger<typeof generateVoiceTtsTask>(
    "generate-voice-tts",
    {
      resultId: result.id,
      userId: authData.user.id,
      voiceSource,
      voiceId,
      voiceName,
      text,
      customVoiceRef,
    },
    {
      tags: [`user:${authData.user.id}`, `tts:${result.id}`],
      metadata: {
        progress: 5,
        stage: "queued",
        message: "Text to speech generation queued",
      },
    }
  );

  const { data: updated, error: updateError } = await client.database
    .from("voice_tts_results")
    .update({
      status: "generating",
      trigger_run_id: handle.id,
    })
    .eq("id", result.id)
    .select()
    .single();

  if (updateError || !updated) {
    return Response.json(
      { message: updateError?.message ?? "Could not attach TTS run." },
      { status: 500 }
    );
  }

  const publicAccessToken = await auth.createPublicToken({
    scopes: {
      read: {
        runs: [handle.id],
      },
    },
    expirationTime: "2h",
    realtime: {
      skipColumns: ["payload"],
    },
  });

  return Response.json({
    result: toVoiceTtsListItem(updated as VoiceTtsRecord),
    resultId: result.id,
    runId: handle.id,
    creditsCharged: credits,
    creditBalance: Number(nextBalance ?? 0),
    publicAccessToken,
  });
}
