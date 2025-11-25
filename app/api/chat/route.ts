import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { AI_MODELS } from '@/lib/ai/config';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai(AI_MODELS.QUICK),
    messages,
    system: 'You are a helpful AI assistant.',
  });

  return result.toTextStreamResponse();
}
