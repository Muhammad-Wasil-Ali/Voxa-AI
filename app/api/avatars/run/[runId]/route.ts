import { runs } from "@trigger.dev/sdk/v3";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import { toAvatarListItem, type AvatarRecord } from "@/lib/avatars/types";

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

  const { data: avatar, error } = await client.database
    .from("avatars")
    .select(
      "id,user_id,name,style,prompt,status,source_image_url,source_image_key,landscape_image_url,landscape_image_key,portrait_image_url,portrait_image_key,provider,model,trigger_run_id,error_message,created_at,updated_at"
    )
    .eq("user_id", authData.user.id)
    .eq("trigger_run_id", runId)
    .maybeSingle();

  if (error) {
    return Response.json(
      { message: error.message ?? "Could not load avatar run." },
      { status: 500 }
    );
  }

  if (!avatar) {
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
    avatar: toAvatarListItem(avatar as AvatarRecord),
  });
}
