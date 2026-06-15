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
        name: `${style} Avatar`,
        style,
        prompt: prompt || null,
        status: "completed",
        source_image_url: source.url,
        source_image_key: source.key,
        landscape_image_url: source.url,
        landscape_image_key: source.key,
        portrait_image_url: source.url,
        portrait_image_key: source.key,
        provider: "upload",
        model: AVATAR_MODEL,
      },
    ])
    .select()
    .single();

  if (error || !data) {
    return Response.json(
      { message: error?.message ?? "Could not save avatar." },
      { status: 500 }
    );
  }

  return Response.json({ avatar: toAvatarListItem(data as AvatarRecord) });
}
