import { auth, tasks } from "@trigger.dev/sdk/v3";
import type { generateAvatarTask } from "@/trigger/generate-avatar";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import {
  AVATAR_MODEL,
  isAvatarStyle,
  toAvatarListItem,
  type AvatarRecord,
} from "@/lib/avatars/types";
import {
  buildAvatarKey,
  getImageExtension,
  uploadAvatarBlob,
} from "@/lib/avatars/storage";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

function getFormFile(formData: FormData) {
  const value = formData.get("image");
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
  const style = String(formData.get("style") ?? "");
  const prompt = String(formData.get("prompt") ?? "").trim();

  if (!file) {
    return Response.json(
      { message: "Upload an avatar image first." },
      { status: 400 }
    );
  }

  if (!file.type.startsWith("image/") || file.size > MAX_FILE_SIZE) {
    return Response.json(
      { message: "Use a PNG, JPG, or WebP image under 8 MB." },
      { status: 400 }
    );
  }

  if (!isAvatarStyle(style)) {
    return Response.json({ message: "Choose a valid style." }, { status: 400 });
  }

  const source = await uploadAvatarBlob(
    client,
    buildAvatarKey(authData.user.id, "source", getImageExtension(file)),
    file
  );

  const { data, error } = await client.database
    .from("avatars")
    .insert([
      {
        user_id: authData.user.id,
        name: `${style} AI Avatar`,
        style,
        prompt: prompt || null,
        status: "pending",
        source_image_url: source.url,
        source_image_key: source.key,
        provider: "google-gemini",
        model: AVATAR_MODEL,
      },
    ])
    .select()
    .single();

  if (error || !data) {
    return Response.json(
      { message: error?.message ?? "Could not create avatar job." },
      { status: 500 }
    );
  }

  const avatar = data as AvatarRecord;
  const handle = await tasks.trigger<typeof generateAvatarTask>(
    "generate-avatar",
    {
      avatarId: avatar.id,
      userId: authData.user.id,
      sourceImageKey: source.key,
      style,
      prompt: prompt || null,
    },
    {
      tags: [`user:${authData.user.id}`, `avatar:${avatar.id}`],
      metadata: {
        progress: 5,
        stage: "queued",
        message: "Avatar generation queued",
      },
    }
  );

  const { data: updated, error: updateError } = await client.database
    .from("avatars")
    .update({
      status: "generating",
      trigger_run_id: handle.id,
    })
    .eq("id", avatar.id)
    .select()
    .single();

  if (updateError || !updated) {
    return Response.json(
      { message: updateError?.message ?? "Could not attach generation run." },
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
    avatar: toAvatarListItem(updated as AvatarRecord),
    avatarId: avatar.id,
    runId: handle.id,
    publicAccessToken,
  });
}
