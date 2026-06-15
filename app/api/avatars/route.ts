import { createInsForgeServerClient } from "@/lib/insforge/server";
import { toAvatarListItem, type AvatarRecord } from "@/lib/avatars/types";

export async function GET() {
  const client = await createInsForgeServerClient();
  const { data: authData } = await client.auth.getCurrentUser();

  if (!authData.user) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await client.database
    .from("avatars")
    .select(
      "id,user_id,name,style,prompt,status,source_image_url,source_image_key,landscape_image_url,landscape_image_key,portrait_image_url,portrait_image_key,provider,model,trigger_run_id,error_message,created_at,updated_at"
    )
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      { message: error.message ?? "Could not load avatars." },
      { status: 500 }
    );
  }

  return Response.json({
    avatars: ((data ?? []) as AvatarRecord[]).map(toAvatarListItem),
  });
}
