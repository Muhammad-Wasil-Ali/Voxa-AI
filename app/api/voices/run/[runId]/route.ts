import { runs } from "@trigger.dev/sdk/v3";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import { toVoiceCloneListItem, type VoiceCloneRecord } from "@/lib/voices/types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ runId: string }> }
) {
  const { runId } = await context.params;
  const client = await createInsForgeServerClient();
  const { data: authData } = await client.auth.getCurrentUser();

  if (!authData.user) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { data: voice, error } = await client.database
    .from("voice_clones")
    .select(
      "id,user_id,name,status,sample_audio_url,sample_audio_key,cloned_voice_ref,cloned_voice_artifact_url,cloned_voice_artifact_key,cloned_voice_metadata,provider,model,trigger_run_id,error_message,created_at,updated_at"
    )
    .eq("user_id", authData.user.id)
    .eq("trigger_run_id", runId)
    .maybeSingle();

  if (error) {
    return Response.json(
      { message: error.message ?? "Could not load voice run." },
      { status: 500 }
    );
  }

  const run = await runs.retrieve(runId);

  return Response.json({
    run: {
      id: run.id,
      status: run.status,
      metadata: run.metadata,
      isCompleted: run.isCompleted,
      isFailed: run.isFailed,
      isSuccess: run.isSuccess,
    },
    voice: voice ? toVoiceCloneListItem(voice as VoiceCloneRecord) : null,
  });
}
