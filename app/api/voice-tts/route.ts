import { createInsForgeServerClient } from "@/lib/insforge/server";
import { toVoiceTtsListItem, type VoiceTtsRecord } from "@/lib/voices/types";

export async function GET() {
  const client = await createInsForgeServerClient();
  const { data: authData } = await client.auth.getCurrentUser();

  if (!authData.user) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await client.database
    .from("voice_tts_results")
    .select(
      "id,user_id,voice_source,voice_id,voice_name,input_text,character_count,credits_charged,status,audio_url,audio_key,provider,model,trigger_run_id,error_message,created_at,updated_at"
    )
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      { message: error.message ?? "Could not load generated audio." },
      { status: 500 }
    );
  }

  return Response.json({
    results: ((data ?? []) as VoiceTtsRecord[]).map(toVoiceTtsListItem),
  });
}
