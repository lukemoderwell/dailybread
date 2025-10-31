export const runtime = "edge";
export const maxDuration = 30;

interface TTSRequest {
  text: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
}

export async function POST(req: Request) {
  try {
    const { text, voice = "alloy" }: TTSRequest = await req.json();

    console.log('TTS request:', { textLength: text.length, voice });

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('Calling OpenAI TTS API...');

    // Use OpenAI REST API directly (works with edge runtime)
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: voice,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI TTS error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate speech", details: error }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('TTS generated successfully');

    const audioBuffer = await response.arrayBuffer();
    console.log('Returning audio, size:', audioBuffer.byteLength);

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate speech", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
