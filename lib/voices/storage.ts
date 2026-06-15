import { randomUUID } from "node:crypto";
import type { InsForgeClient } from "@insforge/sdk";
import { VOICE_BUCKET } from "@/lib/voices/types";

const extensionByType: Record<string, string> = {
  "audio/aac": "aac",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/x-wav": "wav",
};

export function getAudioExtension(file: File | Blob) {
  return extensionByType[file.type] ?? "mp3";
}

export function buildVoiceKey(userId: string, kind: string, extension = "mp3") {
  return `${userId}/${kind}-${Date.now()}-${randomUUID()}.${extension}`;
}

export async function uploadVoiceBlob(
  client: InsForgeClient,
  key: string,
  blob: Blob
) {
  const { data, error } = await client.storage.from(VOICE_BUCKET).upload(key, blob);

  if (error || !data) {
    throw new Error(error?.message ?? "Voice upload failed.");
  }

  return {
    url: data.url,
    key: data.key,
  };
}

export async function removeVoiceObject(
  client: InsForgeClient,
  key?: string | null
) {
  if (key) {
    await client.storage.from(VOICE_BUCKET).remove(key);
  }
}
