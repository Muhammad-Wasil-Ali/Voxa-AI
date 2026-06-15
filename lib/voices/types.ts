export const VOICE_BUCKET = "voices";
export const TTS_TEXT_LIMIT = 2000;
export const TTS_CREDITS_PER_BLOCK = 10;
export const TTS_CREDIT_BLOCK_SIZE = 500;

export type VoiceStatus = "pending" | "generating" | "completed" | "failed";
export type VoiceSource = "custom" | "deepgram-default";

export const defaultDeepgramVoices = [
  {
    id: "aura-asteria-en",
    name: "Asteria",
    image: "/avatars/emma.png",
    previewUrl: "/api/voices/preview/aura-asteria-en",
    description: "Warm, expressive narration for product and creator content.",
  },
  {
    id: "aura-orion-en",
    name: "Orion",
    image: "/avatars/adam.png",
    previewUrl: "/api/voices/preview/aura-orion-en",
    description: "Confident studio voice for explainers and crisp reads.",
  },
  {
    id: "aura-luna-en",
    name: "Luna",
    image: "/avatars/jen.png",
    previewUrl: "/api/voices/preview/aura-luna-en",
    description: "Bright and polished voice for short social scripts.",
  },
  {
    id: "aura-arcas-en",
    name: "Arcas",
    image: "/avatars/jack.png",
    previewUrl: "/api/voices/preview/aura-arcas-en",
    description: "Clear, upbeat delivery for tutorials and promos.",
  },
] as const;

export type VoiceCloneRecord = {
  id: string;
  user_id: string;
  name: string;
  status: VoiceStatus;
  sample_audio_url: string;
  sample_audio_key: string;
  cloned_voice_ref: string | null;
  cloned_voice_artifact_url: string | null;
  cloned_voice_artifact_key: string | null;
  cloned_voice_metadata: Record<string, unknown>;
  provider: string;
  model: string;
  trigger_run_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type VoiceCloneListItem = {
  id: string;
  name: string;
  type: "Custom";
  source: "custom";
  status: VoiceStatus;
  sampleAudioUrl: string;
  clonedVoiceRef: string | null;
  artifactUrl: string | null;
  triggerRunId: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type VoiceTtsRecord = {
  id: string;
  user_id: string;
  voice_source: VoiceSource;
  voice_id: string;
  voice_name: string;
  input_text: string;
  character_count: number;
  credits_charged: number;
  status: VoiceStatus;
  audio_url: string | null;
  audio_key: string | null;
  provider: string;
  model: string;
  trigger_run_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type VoiceTtsListItem = {
  id: string;
  voiceSource: VoiceSource;
  voiceId: string;
  voiceName: string;
  inputText: string;
  characterCount: number;
  creditsCharged: number;
  status: VoiceStatus;
  audioUrl: string | null;
  triggerRunId: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export function calculateTtsCredits(characterCount: number) {
  return Math.ceil(characterCount / TTS_CREDIT_BLOCK_SIZE) * TTS_CREDITS_PER_BLOCK;
}

export function toVoiceCloneListItem(
  voice: VoiceCloneRecord
): VoiceCloneListItem {
  return {
    id: voice.id,
    name: voice.name,
    type: "Custom",
    source: "custom",
    status: voice.status,
    sampleAudioUrl: voice.sample_audio_url,
    clonedVoiceRef: voice.cloned_voice_ref,
    artifactUrl: voice.cloned_voice_artifact_url,
    triggerRunId: voice.trigger_run_id,
    errorMessage: voice.error_message,
    createdAt: voice.created_at,
  };
}

export function toVoiceTtsListItem(tts: VoiceTtsRecord): VoiceTtsListItem {
  return {
    id: tts.id,
    voiceSource: tts.voice_source,
    voiceId: tts.voice_id,
    voiceName: tts.voice_name,
    inputText: tts.input_text,
    characterCount: tts.character_count,
    creditsCharged: tts.credits_charged,
    status: tts.status,
    audioUrl: tts.audio_url,
    triggerRunId: tts.trigger_run_id,
    errorMessage: tts.error_message,
    createdAt: tts.created_at,
  };
}
