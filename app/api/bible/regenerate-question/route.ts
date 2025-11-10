import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'edge';
export const maxDuration = 30;

interface RegenerateRequest {
  passage: string;
  reference: string;
  familyMember: {
    id: string;
    name: string;
    age: number;
    color: string;
    notes?: string | null;
  };
  previousQuestion: string;
  feedback?: string; // Optional user feedback about what was wrong
  allQuestions?: string[]; // Other questions to ensure diversity
}

export async function POST(req: Request) {
  try {
    const {
      passage,
      reference,
      familyMember,
      previousQuestion,
      feedback,
      allQuestions,
    }: RegenerateRequest = await req.json();

    console.log('Regenerating question for:', {
      reference,
      name: familyMember.name,
      hasFeedback: !!feedback,
    });

    // Build context about what to avoid
    const otherQuestionsContext = allQuestions?.length
      ? `\n\nOTHER QUESTIONS ALREADY ASKED (ensure your question explores a DIFFERENT angle):\n${allQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : '';

    const feedbackContext = feedback
      ? `\n\nUSER FEEDBACK on the previous question:\n"${feedback}"\nPlease address this feedback in your new question.`
      : '';

    const memberContext = familyMember.notes
      ? `${familyMember.name}, age ${familyMember.age}: ${familyMember.notes}`
      : `${familyMember.name}, age ${familyMember.age}`;

    const prompt = `You are a creative family Bible study facilitator. A question you generated received negative feedback, and you need to create a better replacement.

SCRIPTURE: ${reference}
${passage}

FAMILY MEMBER:
- ${memberContext}

PREVIOUS QUESTION (did not work well):
"${previousQuestion}"
${feedbackContext}
${otherQuestionsContext}

YOUR TASK:
Generate ONE new question that is completely different from the previous one and addresses any feedback provided.

REQUIREMENTS:

1. **AGE-APPROPRIATE** (see guidelines below) - THIS IS CRITICAL
2. **ENGAGING**: Make them WANT to answer - spark curiosity or connection
3. **DIFFERENT ANGLE**: Don't just rephrase the bad question - explore a totally different aspect of the passage
4. **VARIETY**: If other questions are listed, ensure yours explores a unique angle
5. **CONVERSATIONAL**: Questions should feel natural and invite discussion, not test knowledge

AGE-APPROPRIATE GUIDELINES:

**Ages 2-3**:
- Very simple words, short questions
- Basic emotions, actions, sounds
- "Did you hear about...?" "Were they happy or sad?"
- Connect to familiar things (animals, family, bedtime)

**Ages 4-5**:
- Simple language about choices and feelings
- What characters did and basic why
- "What did [character] do?" "Can you help someone like that?"
- Relate to friendships, sharing, helping

**Ages 6-8**:
- Clear language, begin simple "why" and "how"
- Imagine being in the story
- "Why do you think...?" "What would you do?"
- Connect to their daily life experiences

**Ages 9-12**:
- Deeper "why" and "how" about meaning
- Character motives, lessons, real-life application
- "How could this help you with..." "What would change if..."
- Connect to school, friendships, challenges they face

**Ages 13+**:
- Challenging, open-ended questions
- Theology, cultural context, deeper themes
- Critical thinking and worldview connections
- "How does this challenge..." "What would it look like to..."

QUESTION TYPES TO CONSIDER:
- **Wonder**: "What do you think...?" "Why do you wonder...?"
- **Imagination**: "If you could ask [character]..." "Imagine you were there..."
- **Application**: "How would you..." "What would you do if..."
- **Connection**: "When have you felt..." "How is this like..."
- **Creative twist**: Unexpected angles, playful scenarios, fun what-ifs

Return ONLY the question text, nothing else.`;

    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 1.0, // High creativity for variety
    });

    const newQuestion = text.trim().replace(/^["']|["']$/g, ''); // Remove quotes if AI added them

    console.log('Regenerated question:', newQuestion);

    return NextResponse.json({ question: newQuestion });
  } catch (error) {
    console.error('Question regeneration error:', error);
    return NextResponse.json(
      {
        error: 'Failed to regenerate question',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
