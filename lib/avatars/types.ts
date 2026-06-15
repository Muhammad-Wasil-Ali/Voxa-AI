export const AVATAR_BUCKET = "avatars";
export const AVATAR_MODEL = "gemini-2.5-flash-image";

export const avatarStyles = [
  "Podcast",
  "Casual",
  "3D Cartoon",
  "Stylized",
] as const;

export type AvatarStyle = (typeof avatarStyles)[number];

export type AvatarStatus = "pending" | "generating" | "completed" | "failed";

export type AvatarRecord = {
  id: string;
  user_id: string;
  name: string;
  style: AvatarStyle;
  prompt: string | null;
  status: AvatarStatus;
  source_image_url: string;
  source_image_key: string;
  landscape_image_url: string | null;
  landscape_image_key: string | null;
  portrait_image_url: string | null;
  portrait_image_key: string | null;
  provider: string;
  model: string;
  trigger_run_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type AvatarListItem = {
  id: string;
  name: string;
  style: AvatarStyle;
  prompt: string | null;
  status: AvatarStatus;
  sourceImageUrl: string;
  landscapeImageUrl: string | null;
  portraitImageUrl: string | null;
  triggerRunId: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export function isAvatarStyle(value: unknown): value is AvatarStyle {
  return avatarStyles.includes(value as AvatarStyle);
}

export function toAvatarListItem(avatar: AvatarRecord): AvatarListItem {
  return {
    id: avatar.id,
    name: avatar.name,
    style: avatar.style,
    prompt: avatar.prompt,
    status: avatar.status,
    sourceImageUrl: avatar.source_image_url,
    landscapeImageUrl: avatar.landscape_image_url,
    portraitImageUrl: avatar.portrait_image_url,
    triggerRunId: avatar.trigger_run_id,
    errorMessage: avatar.error_message,
    createdAt: avatar.created_at,
  };
}
