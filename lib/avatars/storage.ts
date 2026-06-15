import { randomUUID } from "node:crypto";
import type { InsForgeClient } from "@insforge/sdk";
import { AVATAR_BUCKET } from "@/lib/avatars/types";

const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function getImageExtension(file: File | Blob) {
  return extensionByType[file.type] ?? "png";
}

export function buildAvatarKey(userId: string, kind: string, extension = "png") {
  return `${userId}/${kind}-${Date.now()}-${randomUUID()}.${extension}`;
}

export async function uploadAvatarBlob(
  client: InsForgeClient,
  key: string,
  blob: Blob
) {
  const { data, error } = await client.storage.from(AVATAR_BUCKET).upload(key, blob);

  if (error || !data) {
    throw new Error(error?.message ?? "Avatar upload failed.");
  }

  return {
    url: data.url,
    key: data.key,
  };
}
