import { createInsForgeServerClient } from "@/lib/insforge/server";
import { generateDeepgramTts } from "@/lib/voices/deepgram";
import { defaultDeepgramVoices } from "@/lib/voices/types";

const PREVIEW_TEXT =
  "This is a preview of your selected Deepgram voice for VoxaAI Studio.";

export async function GET(
  _request: Request,
  context: { params: Promise<{ voiceId: string }> }
) {
  const { voiceId } = await context.params;
  const client = await createInsForgeServerClient();
  const { data: authData } = await client.auth.getCurrentUser();

  if (!authData.user) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }

  const voice = defaultDeepgramVoices.find((item) => item.id === voiceId);

  if (!voice) {
    return Response.json({ message: "Voice not found." }, { status: 404 });
  }

  try {
    const audio = await generateDeepgramTts({
      text: PREVIEW_TEXT,
      model: voice.id,
    });

    return new Response(audio, {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Type": audio.type || "audio/mpeg",
      },
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "Could not generate preview.",
      },
      { status: 500 }
    );
  }
}
