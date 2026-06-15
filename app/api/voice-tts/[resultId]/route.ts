import { createInsForgeServerClient } from "@/lib/insforge/server";
import { removeVoiceObject } from "@/lib/voices/storage";
import type { VoiceTtsRecord } from "@/lib/voices/types";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ resultId: string }> }
) {
  const { resultId } = await context.params;
  const client = await createInsForgeServerClient();
  const { data: authData } = await client.auth.getCurrentUser();

  if (!authData.user) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { data: result, error } = await client.database
    .from("voice_tts_results")
    .select("*")
    .eq("id", resultId)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (error) {
    return Response.json(
      { message: error.message ?? "Could not load generated audio." },
      { status: 500 }
    );
  }

  if (!result) {
    return Response.json({ message: "Generated audio not found." }, { status: 404 });
  }

  const record = result as VoiceTtsRecord;
  const { error: deleteError } = await client.database
    .from("voice_tts_results")
    .delete()
    .eq("id", resultId)
    .eq("user_id", authData.user.id);

  if (deleteError) {
    return Response.json(
      { message: deleteError.message ?? "Could not delete generated audio." },
      { status: 500 }
    );
  }

  await removeVoiceObject(client, record.audio_key);

  return Response.json({ ok: true });
}
