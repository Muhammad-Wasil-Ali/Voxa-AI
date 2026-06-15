import { createInsForgeServerClient } from "@/lib/insforge/server";
import {
  defaultDeepgramVoices,
  toVoiceCloneListItem,
  type VoiceCloneRecord,
} from "@/lib/voices/types";

export async function GET() {
  const client = await createInsForgeServerClient();
  const { data: authData } = await client.auth.getCurrentUser();

  if (!authData.user) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await client.database
    .from("voice_clones")
    .select(
      "id,user_id,name,status,sample_audio_url,sample_audio_key,cloned_voice_ref,cloned_voice_artifact_url,cloned_voice_artifact_key,cloned_voice_metadata,provider,model,trigger_run_id,error_message,created_at,updated_at"
    )
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      { message: error.message ?? "Could not load voices." },
      { status: 500 }
    );
  }

  const { data: balance } = await client.database
    .from("user_credit_balances")
    .select("balance")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  return Response.json({
    customVoices: ((data ?? []) as VoiceCloneRecord[]).map(toVoiceCloneListItem),
    defaultVoices: defaultDeepgramVoices,
    creditBalance: Number(balance?.balance ?? 1250),
  });
}
