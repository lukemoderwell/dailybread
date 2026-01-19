import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { buildQuestionGenerationPrompt } from '@/lib/ai/prompts/question-generation';
import { AI_TASKS, AI_VALIDATION } from '@/lib/ai/config';
import { handleApiError, ErrorTypes } from '@/lib/errors';

export const runtime = 'edge';
export const maxDuration = 30;

interface FamilyMember {
  id: string;
  name: string;
  age: number;
  color: string;
  notes?: string | null;
}

interface QuestionRequest {
  passage: string;
  reference: string;
  familyMembers: FamilyMember[];
  // Previous session context for "Previously on..." recap
  previousReference?: string;
  previousPassageExcerpt?: string;
}

interface GeneratedQuestion {
  name: string;
  question: string;
  application: string;
}

interface DiscussionGuide {
  summary: string;
  keyPoints: string[];
  aboutGod: string;
  aboutPeople: string;
  starterQuestion: string;
  // Legacy field for backwards compatibility
  bigIdea?: string;
}

interface Discovery {
  type: 'connection' | 'wonder' | 'challenge';
  content: string;
}

interface GeneratedResponse {
  discussionGuide: DiscussionGuide;
  previousRecap: string | null;
  questions: GeneratedQuestion[];
  discovery?: Discovery;
  tomorrowPreview?: string;
}

export async function POST(req: Request) {
  try {
    const {
      passage,
      reference,
      familyMembers,
      previousReference,
      previousPassageExcerpt,
    }: QuestionRequest = await req.json();

    console.log('Generating questions:', {
      reference,
      memberCount: familyMembers.length,
      hasPreviousSession: !!previousReference,
    });

    // Build family context for the prompt
    const familyContext = familyMembers
      .map((m) => {
        const context = `${m.name}, age ${m.age}`;
        return m.notes ? `${context}: ${m.notes}` : context;
      })
      .join('\n- ');

    // Build prompt using configuration (including previous session context)
    const prompt = buildQuestionGenerationPrompt({
      passage,
      reference,
      familyContext,
      previousReference,
      previousPassageExcerpt,
    });

    // Generate questions using configured model
    const { text } = await generateText({
      model: openai(AI_TASKS.QUESTION_GENERATION.model),
      prompt,
      temperature: AI_TASKS.QUESTION_GENERATION.temperature,
    });

    console.log('Raw AI response:', text);

    // Parse the JSON response
    const generated = parseAIResponse(text);

    const responseQuestions = Array.isArray(generated)
      ? generated
      : generated.questions;

    const discussionGuide =
      !Array.isArray(generated) && generated.discussionGuide
        ? generated.discussionGuide
        : null;

    // Extract additional fields from the response
    const previousRecap =
      !Array.isArray(generated) && generated.previousRecap
        ? generated.previousRecap
        : null;

    const discovery =
      !Array.isArray(generated) && generated.discovery
        ? generated.discovery
        : undefined;

    const tomorrowPreview =
      !Array.isArray(generated) && generated.tomorrowPreview
        ? generated.tomorrowPreview
        : undefined;

    // Validate question count
    if (
      !responseQuestions ||
      responseQuestions.length !== familyMembers.length
    ) {
      throw ErrorTypes.AI_GENERATION_FAILED(
        `Expected ${familyMembers.length} questions, got ${responseQuestions?.length || 0}`
      );
    }

    // Map generated questions back to family members
    const questions = familyMembers.map((member) => {
      const generatedQuestion = responseQuestions.find(
        (q) => q.name === member.name
      );

      if (!generatedQuestion) {
        console.warn(`No question found for ${member.name}, using fallback`);
        return createFallbackQuestion(member);
      }

      return {
        familyMemberId: member.id,
        name: member.name,
        age: member.age,
        color: member.color,
        question: generatedQuestion.question,
        application: generatedQuestion.application,
      };
    });

    // Validate question diversity
    validateQuestionDiversity(questions);

    console.log('Generated questions:', questions);

    return NextResponse.json({
      discussionGuide,
      previousRecap,
      questions,
      discovery,
      tomorrowPreview,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Parses AI response and extracts JSON
 */
function parseAIResponse(text: string): GeneratedResponse | GeneratedQuestion[] {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const objectMatch = text.match(/\{[\s\S]*\}/);
    const rawJson = objectMatch?.[0] || jsonMatch?.[0];

    if (!rawJson) {
      throw ErrorTypes.PARSING_FAILED('No JSON found in AI response');
    }

    return JSON.parse(rawJson);
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    throw ErrorTypes.PARSING_FAILED('AI did not return valid JSON format');
  }
}

/**
 * Creates a fallback question when AI doesn't generate one
 */
function createFallbackQuestion(member: FamilyMember) {
  return {
    familyMemberId: member.id,
    name: member.name,
    age: member.age,
    color: member.color,
    question: `What does this passage teach us about living wisely?`,
    application: `Pick one simple way to live this out today and try it before bedtime.`,
  };
}

/**
 * Validates question diversity and logs warnings
 */
function validateQuestionDiversity(
  questions: Array<{ question: string }>
): void {
  const questionTexts = questions.map((q) => q.question.toLowerCase());
  const firstWords = questionTexts.map((q) => q.split(' ')[0]);
  const uniqueFirstWords = new Set(firstWords).size;

  if (uniqueFirstWords < questions.length * AI_VALIDATION.MIN_DIVERSITY_THRESHOLD) {
    console.warn(
      'Questions may be too similar - low diversity in starting words'
    );
  }
}
