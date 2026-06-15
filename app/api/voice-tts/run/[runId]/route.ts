import { runs } from "@trigger.dev/sdk/v3";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import { toVoiceTtsListItem, type VoiceTtsRecord } from "@/lib/voices/types";

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

  const { data: result, error } = await client.database
    .from("voice_tts_results")
    .select(
      "id,user_id,voice_source,voice_id,voice_name,input_text,character_count,credits_charged,status,audio_url,audio_key,provider,model,trigger_run_id,error_message,created_at,updated_at"
    )
    .eq("user_id", authData.user.id)
    .eq("trigger_run_id", runId)
    .maybeSingle();

  if (error) {
    return Response.json(
      { message: error.message ?? "Could not load TTS run." },
      { status: 500 }
    );
  }

  if (!result) {
    return Response.json({ message: "Run not found." }, { status: 404 });
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
    result: toVoiceTtsListItem(result as VoiceTtsRecord),
  });
}
