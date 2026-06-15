import { auth, tasks } from "@trigger.dev/sdk/v3";
import type { cloneVoiceTask } from "@/trigger/voice-cloning";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import { getReplicateCloneModel } from "@/lib/voices/replicate";
import {
  buildVoiceKey,
  getAudioExtension,
  uploadVoiceBlob,
} from "@/lib/voices/storage";
import { toVoiceCloneListItem, type VoiceCloneRecord } from "@/lib/voices/types";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function getFormFile(formData: FormData) {
  const value = formData.get("sample");
  return value instanceof File ? value : null;
}

export async function POST(request: Request) {
  const client = await createInsForgeServerClient();
  const { data: authData } = await client.auth.getCurrentUser();

  if (!authData.user) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = getFormFile(formData);
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2) {
    return Response.json(
      { message: "Enter a voice name with at least 2 characters." },
      { status: 400 }
    );
  }

  if (!file) {
    return Response.json(
      { message: "Upload a 10-second voice sample first." },
      { status: 400 }
    );
  }

  if (!file.type.startsWith("audio/") || file.size > MAX_FILE_SIZE) {
    return Response.json(
      { message: "Use an audio file under 20 MB." },
      { status: 400 }
    );
  }

  const source = await uploadVoiceBlob(
    client,
    buildVoiceKey(authData.user.id, "sample", getAudioExtension(file)),
    file
  );

  const model = getReplicateCloneModel();
  const { data, error } = await client.database
    .from("voice_clones")
    .insert([
      {
        user_id: authData.user.id,
        name,
        status: "pending",
        sample_audio_url: source.url,
        sample_audio_key: source.key,
        provider: "replicate",
        model,
      },
    ])
    .select()
    .single();

  if (error || !data) {
    return Response.json(
      { message: error?.message ?? "Could not create voice clone job." },
      { status: 500 }
    );
  }

  const voice = data as VoiceCloneRecord;
  const handle = await tasks.trigger<typeof cloneVoiceTask>(
    "clone-voice",
    {
      voiceId: voice.id,
      userId: authData.user.id,
      name,
      sampleAudioUrl: source.url,
      sampleAudioKey: source.key,
    },
    {
      tags: [`user:${authData.user.id}`, `voice:${voice.id}`],
      metadata: {
        progress: 5,
        stage: "queued",
        message: "Voice cloning queued",
      },
    }
  );

  const { data: updated, error: updateError } = await client.database
    .from("voice_clones")
    .update({
      status: "generating",
      trigger_run_id: handle.id,
    })
    .eq("id", voice.id)
    .select()
    .single();

  if (updateError || !updated) {
    return Response.json(
      { message: updateError?.message ?? "Could not attach voice clone run." },
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
    voice: toVoiceCloneListItem(updated as VoiceCloneRecord),
    voiceId: voice.id,
    runId: handle.id,
    publicAccessToken,
  });
}
