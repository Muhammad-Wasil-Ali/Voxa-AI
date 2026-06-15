import Replicate from "replicate";

const DEFAULT_CHATTERBOX_MODEL = "resemble-ai/chatterbox";
type ReplicateModelId = `${string}/${string}` | `${string}/${string}:${string}`;

function getReplicateClient() {
  const token = process.env.REPLICATE_API_TOKEN?.trim();

  if (!token) {
    throw new Error("Missing REPLICATE_API_TOKEN.");
  }

  return new Replicate({ auth: token });
}

export function getReplicateCloneModel() {
  return (
    process.env.REPLICATE_VOICE_CLONE_MODEL?.trim() || DEFAULT_CHATTERBOX_MODEL
  ) as ReplicateModelId;
}

export function getReplicateTtsModel() {
  return (process.env.REPLICATE_VOICE_TTS_MODEL?.trim() ||
    DEFAULT_CHATTERBOX_MODEL) as ReplicateModelId;
}

async function outputToBlob(output: unknown) {
  const maybeUrl =
    output &&
    typeof output === "object" &&
    "url" in output &&
    typeof output.url === "function"
      ? String(output.url())
      : typeof output === "string"
        ? output
        : null;

  if (!maybeUrl) {
    throw new Error("Replicate did not return an audio URL.");
  }

  const response = await fetch(maybeUrl);
  if (!response.ok) {
    throw new Error("Could not download Replicate generated audio.");
  }

  return new Blob([await response.arrayBuffer()], {
    type: response.headers.get("content-type") ?? "audio/wav",
  });
}

export async function cloneVoiceWithReplicate({
  name,
  sampleUrl,
}: {
  name: string;
  sampleUrl: string;
}) {
  return {
    model: getReplicateCloneModel(),
    voiceRef: sampleUrl,
    artifactUrl: sampleUrl,
    metadata: {
      name,
      sampleUrl,
      strategy: "chatterbox-zero-shot-sample",
    },
  };
}

export async function generateCustomTtsWithReplicate({
  text,
  voiceRef,
}: {
  text: string;
  voiceRef: string;
}) {
  const model = getReplicateTtsModel();
  const output = await getReplicateClient().run(model, {
    input: {
      prompt: text,
      audio_prompt_path: voiceRef,
    },
  });

  return {
    model,
    audio: await outputToBlob(output),
  };
}
