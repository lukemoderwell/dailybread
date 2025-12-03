import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AI_MODELS } from '@/lib/ai/config';
export const runtime = 'edge';
export const maxDuration = 10;

interface SummarizeRequest {
  sessionId: number;
  reference: string;
  scriptureText?: string;
  bigIdea?: string;
  // Legacy: questions are no longer used for summaries
  questions?: Array<{
    name: string;
    question: string;
  }>;
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, reference, scriptureText, bigIdea }: SummarizeRequest =
      await req.json();

    // Build a prompt focused on scripture content
    const prompt = `Write a 2-3 sentence "Previously on..." recap for a family Bible reading.

Scripture Reference: ${reference}
${bigIdea ? `\nMain Point: ${bigIdea}` : ''}
${scriptureText ? `\nPassage Text:\n${scriptureText.slice(0, 1500)}` : ''}

Write a brief, engaging recap that reminds the family what they read last time. Focus on:
- The key events, characters, or teachings from the passage
- The most important spiritual truth or lesson

Style: Conversational, like a narrator setting up the next episode. 2-3 sentences max.
Do NOT mention questions or discussion - just summarize what happened in the scripture.`;

    const { text } = await generateText({
      model: openai(AI_MODELS.QUICK),
      prompt,
      maxOutputTokens: 200,
    });

    const summary = text.trim();

    // Save summary to database for caching
    await supabase
      .from('reading_sessions')
      .update({ summary })
      .eq('id', sessionId)
      .eq('user_id', user.id); // Ensure user owns this session

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
