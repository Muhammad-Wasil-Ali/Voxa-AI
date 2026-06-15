export function getDeepgramApiKey() {
  const apiKey = process.env.DEEPGRAM_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing DEEPGRAM_API_KEY.");
  }

  return apiKey;
}

export async function generateDeepgramTts({
  text,
  model,
}: {
  text: string;
  model: string;
}) {
  const response = await fetch(
    `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        Authorization: `Token ${getDeepgramApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    }
  );

  if (!response.ok) {
    let message = "Deepgram TTS generation failed.";
    try {
      const body = (await response.json()) as {
        err_msg?: string;
        message?: string;
      };
      message = body.err_msg ?? body.message ?? message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return new Blob([await response.arrayBuffer()], {
    type: response.headers.get("content-type") ?? "audio/mpeg",
  });
}
