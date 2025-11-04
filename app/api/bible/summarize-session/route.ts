import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const maxDuration = 10;

interface SummarizeRequest {
  sessionId: number;
  reference: string;
  questions: Array<{
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

    const { sessionId, reference, questions }: SummarizeRequest =
      await req.json();

    // Build a simple prompt for summarization
    const questionsText = questions
      .map((q) => `${q.name}: ${q.question}`)
      .join('\n');

    const prompt = `Create a 2-3 sentence summary of this family Bible reading session.

Scripture: ${reference}

Questions asked:
${questionsText}

Format:
First sentence: What scripture passage was read (just the reference and a 5-word description if helpful).
Remaining sentences: Briefly mention what each child was asked about (name + topic in 5-10 words each).

Keep it very concise and conversational.`;

    const { text } = await generateText({
      model: openai('gpt-4.1-nano'),
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
