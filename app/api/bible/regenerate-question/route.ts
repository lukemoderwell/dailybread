import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import {
  buildQuestionRegenerationPrompt,
  formatFeedbackContext,
  formatOtherQuestionsContext,
} from '@/lib/ai/prompts/question-regeneration';
import { AI_TASKS } from '@/lib/ai/config';
import { handleApiError, ErrorTypes } from '@/lib/errors';

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
  feedback?: string;
  allQuestions?: string[];
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

    // Build member context
    const memberContext = familyMember.notes
      ? `${familyMember.name}, age ${familyMember.age}: ${familyMember.notes}`
      : `${familyMember.name}, age ${familyMember.age}`;

    // Build prompt using configuration
    const prompt = buildQuestionRegenerationPrompt({
      passage,
      reference,
      memberContext,
      previousQuestion,
      feedbackContext: feedback ? formatFeedbackContext(feedback) : undefined,
      otherQuestionsContext: allQuestions?.length
        ? formatOtherQuestionsContext(allQuestions)
        : undefined,
    });

    // Generate new question using configured model
    const { text } = await generateText({
      model: openai(AI_TASKS.QUESTION_REGENERATION.model),
      prompt,
      temperature: AI_TASKS.QUESTION_REGENERATION.temperature,
    });

    // Parse response
    const { question, application } = parseRegenerationResponse(text);

    console.log('Regenerated question:', question);

    return NextResponse.json({
      question,
      application,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Parses the regeneration response from AI
 */
function parseRegenerationResponse(text: string): {
  question: string;
  application?: string;
} {
  let question = text.trim().replace(/^["']|["']$/g, '');
  let application: string | undefined;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      question = (parsed.question as string)?.trim() || question;
      application = (parsed.application as string)?.trim();
    }
  } catch (parseError) {
    console.warn('Falling back to plain text parsing:', parseError);
  }

  if (!question) {
    throw ErrorTypes.PARSING_FAILED('No question found in AI response');
  }

  return { question, application };
}
