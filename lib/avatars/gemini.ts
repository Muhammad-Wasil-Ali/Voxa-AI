import { AVATAR_MODEL, type AvatarStyle } from "@/lib/avatars/types";

type GeminiPart = {
  text?: string;
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

const GEMINI_API_KEY_ENV_NAMES = [
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GOOGLE_AI_API_KEY",
  "GOOGLE_GEMINI_API",
] as const;

export function getGeminiApiKey() {
  for (const name of GEMINI_API_KEY_ENV_NAMES) {
    const value = process.env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

export function buildAvatarPrompt(style: AvatarStyle, prompt?: string | null) {
  const styleDirection: Record<AvatarStyle, string> = {
    Podcast:
      "a polished podcast host avatar with studio lighting, clean framing, expressive but professional presence",
    Casual:
      "a natural casual creator avatar with approachable styling, soft lighting, and modern social media polish",
    "3D Cartoon":
      "a high-quality 3D cartoon avatar with friendly proportions, tactile materials, and clean character design",
    Stylized:
      "a stylized editorial avatar with distinctive visual treatment, refined color grading, and premium art direction",
  };

  return [
    `Transform the provided person image into ${styleDirection[style]}.`,
    "Preserve the person's identity, face structure, and recognizable features.",
    "Create a clean avatar suitable for AI video, social content, and creator branding.",
    "Avoid text, logos, watermarks, extra people, distorted hands, and busy backgrounds.",
    prompt ? `Customization request: ${prompt}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateGeminiAvatarImage({
  source,
  mimeType,
  prompt,
  aspectRatio,
}: {
  source: Blob;
  mimeType: string;
  prompt: string;
  aspectRatio: "16:9" | "9:16";
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(apiKey);

  if (!apiKey) {
    throw new Error(
      `Missing Gemini API key. Set ${GEMINI_API_KEY_ENV_NAMES.join(" or ")}.`,
    );
  }

  const sourceBuffer = Buffer.from(await source.arrayBuffer());
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${AVATAR_MODEL}:generateContent`;
  const headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  };

  const buildBody = (includeImageConfig: boolean) => ({
    contents: [
      {
        parts: [
          {
            text: `${prompt} The final image must use a ${aspectRatio} aspect ratio.`,
          },
          {
            inlineData: {
              mimeType,
              data: sourceBuffer.toString("base64"),
            },
          },
        ],
      },
    ],
    ...(includeImageConfig
      ? {
          generationConfig: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio,
            },
          },
        }
      : {}),
  });

  let response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(buildBody(true)),
  });

  let body = (await response.json()) as GeminiResponse;
  console.log(response);
  if (
    !response.ok &&
    /Unknown name|Cannot find field/i.test(body.error?.message ?? "")
  ) {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(buildBody(false)),
    });
    body = (await response.json()) as GeminiResponse;
  }

  if (!response.ok) {
    const message = body.error?.message ?? "Gemini image generation failed.";
    const status = body.error?.status ?? "";

    if (
      response.status === 429 ||
      /quota|resource_exhausted|rate limit/i.test(`${status} ${message}`)
    ) {
      throw new Error(
        "Gemini quota exceeded for the configured API key. Update GEMINI_API_KEY or GOOGLE_API_KEY with a key from the new Google AI Studio account, then restart the app and update the same env var in Trigger.dev before generating again.",
      );
    }

    throw new Error(message);
  }

  const imagePart = body.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data,
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini did not return an image.");
  }

  return new Blob([Buffer.from(imagePart.inlineData.data, "base64")], {
    type: imagePart.inlineData.mimeType ?? "image/png",
  });
}
