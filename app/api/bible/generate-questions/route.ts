import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

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
}

interface GeneratedQuestion {
  name: string;
  question: string;
}

export async function POST(req: Request) {
  try {
    const { passage, reference, familyMembers }: QuestionRequest =
      await req.json();

    console.log('Generating questions (batch mode) for:', {
      reference,
      passageLength: passage.length,
      familyMemberCount: familyMembers.length,
    });

    // Build family context for the prompt
    const familyContext = familyMembers
      .map((m) => {
        const context = `${m.name}, age ${m.age}`;
        return m.notes ? `${context}: ${m.notes}` : context;
      })
      .join('\n- ');

    const prompt = `You are a creative family Bible study facilitator designing discussion questions that work together as a coordinated set.

SCRIPTURE: ${reference}
${passage}

FAMILY MEMBERS:
- ${familyContext}

YOUR TASK:
Generate ONE unique question for each family member listed above. These questions should work together as a complementary set for a rich family discussion.

CRITICAL REQUIREMENTS:

1. **VARIETY & COORDINATION**: Each question MUST explore a completely different angle or theme from the passage. Do not repeat concepts across questions. The questions should complement each other and together cover multiple dimensions of the passage.

2. **SUBTLE PERSONALIZATION**:
   - Use each child's age appropriately (see guidelines below) - THIS IS PRIMARY
   - If notes are provided, they are OPTIONAL context to subtly inform tone, style, or occasional examples
   - DO NOT make the question explicitly about their interests unless it's a truly natural fit
   - Notes might inform: question framing, what examples resonate, conversation style
   - The passage content is the star - interests are just background flavor
   - Most questions should work even if you removed the interest/note context

3. **QUESTION TYPE DIVERSITY**: Mix different types across the family:
   - **Wonder**: "What do you think...?" "Why do you wonder...?" "What's surprising about...?"
   - **Imagination**: "If you could ask [character]..." "Imagine you were there..." "How would it feel to..."
   - **Application**: "How would you..." "What would you do if..." "When could you..."
   - **Connection**: "When have you felt..." "How is this like..." "Have you ever..."
   - **Creative twist**: Unexpected angles, playful scenarios, fun what-ifs

4. **ENGAGEMENT & FUN**:
   - Design questions to spark real conversation, not one-word answers
   - Inject creativity, surprise, or playfulness where age-appropriate
   - Make kids WANT to answer and discuss
   - Blend learning with enjoyment

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

IMPORTANT: Return your response as a valid JSON array with this exact structure:
[
  {"name": "FirstChildName", "question": "Your creative question here?"},
  {"name": "SecondChildName", "question": "Your creative question here?"}
]

Ensure questions are in the SAME ORDER as the family members list above.`;

    // Generate all questions in one batch call
    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 0.9, // High creativity for variety
    });

    console.log('Raw AI response:', text);

    // Parse the JSON response
    let generatedQuestions: GeneratedQuestion[];
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      generatedQuestions = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('AI did not return valid JSON format');
    }

    // Validate we got the right number of questions
    if (generatedQuestions.length !== familyMembers.length) {
      console.error(
        `Question count mismatch: got ${generatedQuestions.length}, expected ${familyMembers.length}`
      );
      throw new Error('AI did not generate the correct number of questions');
    }

    // Map generated questions back to family members with full metadata
    const questions = familyMembers.map((member, index) => {
      const generated = generatedQuestions.find((q) => q.name === member.name);
      if (!generated) {
        console.warn(`No question found for ${member.name}, using fallback`);
        return {
          familyMemberId: member.id,
          name: member.name,
          age: member.age,
          color: member.color,
          question: `What does this passage teach us about living wisely?`,
        };
      }

      return {
        familyMemberId: member.id,
        name: member.name,
        age: member.age,
        color: member.color,
        question: generated.question,
      };
    });

    // Basic diversity validation
    const questionTexts = questions.map((q) => q.question.toLowerCase());
    const firstWords = questionTexts.map((q) => q.split(' ')[0]);
    const uniqueFirstWords = new Set(firstWords).size;

    // Log warning if questions seem too similar
    if (uniqueFirstWords < questions.length * 0.6) {
      console.warn(
        'Questions may be too similar - low diversity in starting words'
      );
    }

    console.log('Generated questions:', questions);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate questions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
