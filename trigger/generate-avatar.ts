import { logger, metadata, task } from "@trigger.dev/sdk/v3";
import { AVATAR_BUCKET, AVATAR_MODEL, type AvatarStyle } from "@/lib/avatars/types";
import { buildAvatarKey, uploadAvatarBlob } from "@/lib/avatars/storage";
import {
  buildAvatarPrompt,
  generateGeminiAvatarImage,
} from "@/lib/avatars/gemini";
import { createInsForgeAdminClient } from "@/lib/insforge/admin";

type GenerateAvatarPayload = {
  avatarId: string;
  userId: string;
  sourceImageKey: string;
  style: AvatarStyle;
  prompt?: string | null;
};

function setProgress(progress: number, stage: string, message: string) {
  metadata.set("progress", progress);
  metadata.set("stage", stage);
  metadata.set("message", message);
}

async function updateAvatar(
  avatarId: string,
  values: Record<string, unknown>
) {
  const admin = createInsForgeAdminClient();
  const { error } = await admin.database
    .from("avatars")
    .update(values)
    .eq("id", avatarId);

  if (error) {
    throw new Error(error.message ?? "Could not update avatar.");
  }
}

export const generateAvatarTask = task({
  id: "generate-avatar",
  maxDuration: 3600,
  run: async (payload: GenerateAvatarPayload) => {
    const admin = createInsForgeAdminClient();

    try {
      setProgress(12, "preparing", "Preparing source image");
      await updateAvatar(payload.avatarId, {
        status: "generating",
        error_message: null,
      });

      const { data: sourceBlob, error: downloadError } = await admin.storage
        .from(AVATAR_BUCKET)
        .download(payload.sourceImageKey);

      if (downloadError || !sourceBlob) {
        throw new Error(downloadError?.message ?? "Could not read source image.");
      }

      const sourceType = sourceBlob.type || "image/png";
      const prompt = buildAvatarPrompt(payload.style, payload.prompt);

      setProgress(35, "generating 16:9", "Generating landscape avatar");
      const landscapeBlob = await generateGeminiAvatarImage({
        source: sourceBlob,
        mimeType: sourceType,
        prompt,
        aspectRatio: "16:9",
      });

      setProgress(62, "generating 9:16", "Generating portrait avatar");
      const portraitBlob = await generateGeminiAvatarImage({
        source: sourceBlob,
        mimeType: sourceType,
        prompt,
        aspectRatio: "9:16",
      });

      setProgress(82, "saving", "Saving generated previews");
      const landscape = await uploadAvatarBlob(
        admin,
        buildAvatarKey(payload.userId, "landscape", "png"),
        landscapeBlob
      );
      const portrait = await uploadAvatarBlob(
        admin,
        buildAvatarKey(payload.userId, "portrait", "png"),
        portraitBlob
      );

      await updateAvatar(payload.avatarId, {
        status: "completed",
        landscape_image_url: landscape.url,
        landscape_image_key: landscape.key,
        portrait_image_url: portrait.url,
        portrait_image_key: portrait.key,
        provider: "google-gemini",
        model: AVATAR_MODEL,
        error_message: null,
      });

      setProgress(100, "complete", "Avatar previews are ready");

      return {
        avatarId: payload.avatarId,
        landscapeImageUrl: landscape.url,
        portraitImageUrl: portrait.url,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Avatar generation failed.";

      logger.error("Avatar generation failed", {
        avatarId: payload.avatarId,
        message,
      });

      metadata.set("progress", 100);
      metadata.set("stage", "failed");
      metadata.set("message", message);

      await updateAvatar(payload.avatarId, {
        status: "failed",
        error_message: message,
      });

      throw error;
    }
  },
});
