export const runtime = "edge";
export const maxDuration = 30;

interface TTSRequest {
  text: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
}

// Generate a cache key from text + voice
function generateCacheKey(text: string, voice: string): string {
  // Simple hash function for edge runtime
  const str = `${text}:${voice}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `tts_${Math.abs(hash).toString(36)}`;
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

    // Generate cache key
    const cacheKey = generateCacheKey(text, voice);

    // Check cache first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        console.log('Checking TTS cache...');
        const cacheResponse = await fetch(
          `${supabaseUrl}/rest/v1/tts_cache?cache_key=eq.${cacheKey}&select=storage_path`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          }
        );

        if (cacheResponse.ok) {
          const cacheData = await cacheResponse.json();
          if (cacheData && cacheData.length > 0) {
            const storagePath = cacheData[0].storage_path;
            console.log('Cache hit! Using cached audio:', storagePath);

            // Get the audio from storage
            const audioUrl = `${supabaseUrl}/storage/v1/object/public/tts-audio/${storagePath}`;
            const audioResponse = await fetch(audioUrl);

            if (audioResponse.ok) {
              const audioBuffer = await audioResponse.arrayBuffer();

              // Update access count
              await fetch(
                `${supabaseUrl}/rest/v1/tts_cache?cache_key=eq.${cacheKey}`,
                {
                  method: 'PATCH',
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    last_accessed_at: new Date().toISOString(),
                    access_count: cacheData[0].access_count + 1,
                  }),
                }
              );

              return new Response(audioBuffer, {
                headers: {
                  "Content-Type": "audio/mpeg",
                  "Cache-Control": "public, max-age=31536000",
                  "X-Cache": "HIT",
                },
              });
            }
          }
        }
      } catch (cacheError) {
        console.error('Cache check error:', cacheError);
        // Continue to generate if cache fails
      }
    }

    console.log('Cache miss. Calling OpenAI TTS API...');

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

    // Store in cache asynchronously (don't wait for it)
    if (supabaseUrl && supabaseKey) {
      // Don't await - cache in background
      (async () => {
        try {
          const storagePath = `${cacheKey}.mp3`;

          // Upload to storage
          const uploadResponse = await fetch(
            `${supabaseUrl}/storage/v1/object/tts-audio/${storagePath}`,
            {
              method: 'POST',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'audio/mpeg',
              },
              body: audioBuffer,
            }
          );

          if (uploadResponse.ok) {
            // Save cache entry
            await fetch(
              `${supabaseUrl}/rest/v1/tts_cache`,
              {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                  cache_key: cacheKey,
                  storage_path: storagePath,
                  content_hash: cacheKey,
                  voice: voice,
                  audio_size: audioBuffer.byteLength,
                }),
              }
            );
            console.log('Audio cached successfully');
          }
        } catch (cacheStoreError) {
          console.error('Error storing in cache:', cacheStoreError);
        }
      })();
    }

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000",
        "X-Cache": "MISS",
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
