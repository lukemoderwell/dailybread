import { experimental_transcribe as transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 60; // Increased for transcription

interface TTSRequest {
  text: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
}

interface WordTimestamp {
  word: string;
  startSecond: number;
  endSecond: number;
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

    // Transcribe the audio to get word-level timestamps
    let wordTimestamps: WordTimestamp[] = [];
    try {
      console.log('Transcribing audio for word timestamps...');
      const transcription = await transcribe({
        model: openai.transcription('whisper-1'),
        audio: new Uint8Array(audioBuffer),
      });

      // Extract word-level timestamps from segments
      if (transcription.segments) {
        transcription.segments.forEach(segment => {
          // Split segment text into words and estimate timing
          const words = segment.text.trim().split(/\s+/);
          const segmentDuration = segment.endSecond - segment.startSecond;
          const timePerWord = segmentDuration / words.length;

          words.forEach((word, index) => {
            wordTimestamps.push({
              word: word,
              startSecond: segment.startSecond + (index * timePerWord),
              endSecond: segment.startSecond + ((index + 1) * timePerWord),
            });
          });
        });
      }

      console.log('Word timestamps generated:', wordTimestamps.length);
    } catch (error) {
      console.error('Transcription error:', error);
      // Continue without timestamps if transcription fails
    }

    // Return both audio and timestamps
    return new Response(JSON.stringify({
      audio: Buffer.from(audioBuffer).toString('base64'),
      wordTimestamps,
    }), {
      headers: {
        "Content-Type": "application/json",
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
