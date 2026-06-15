import { createInsForgeServerClient } from "@/lib/insforge/server";
import { removeVoiceObject } from "@/lib/voices/storage";
import type { VoiceCloneRecord } from "@/lib/voices/types";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ voiceId: string }> }
) {
  const { voiceId } = await context.params;
  const client = await createInsForgeServerClient();
  const { data: authData } = await client.auth.getCurrentUser();

  if (!authData.user) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { data: voice, error } = await client.database
    .from("voice_clones")
    .select("*")
    .eq("id", voiceId)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (error) {
    return Response.json(
      { message: error.message ?? "Could not load voice." },
      { status: 500 }
    );
  }

  if (!voice) {
    return Response.json({ message: "Voice not found." }, { status: 404 });
  }

  const record = voice as VoiceCloneRecord;
  const { error: deleteError } = await client.database
    .from("voice_clones")
    .delete()
    .eq("id", voiceId)
    .eq("user_id", authData.user.id);

  if (deleteError) {
    return Response.json(
      { message: deleteError.message ?? "Could not delete voice." },
      { status: 500 }
    );
  }

  await removeVoiceObject(client, record.sample_audio_key);
  await removeVoiceObject(client, record.cloned_voice_artifact_key);

  return Response.json({ ok: true });
}
