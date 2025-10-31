import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'edge';
export const maxDuration = 30;

interface QuestionRequest {
  passage: string;
  reference: string;
  familyMembers: Array<{ id: string; name: string; age: number }>;
}

export async function POST(req: Request) {
  try {
    const { passage, reference, familyMembers }: QuestionRequest =
      await req.json();

    console.log('Generating questions for:', {
      reference,
      passageLength: passage.length,
      passagePreview: passage.substring(0, 100) + '...',
      familyMemberCount: familyMembers.length
    });

    // Generate questions for each family member
    const questionsPromises = familyMembers.map(async (member) => {
      console.log('member', member);
      const prompt = `You are creating engaging Bible study questions for a family devotional time. These questions should spark meaningful conversation and help family members connect God's Word to their daily lives.

Scripture passage: ${reference}
Text: ${passage}

Create ONE thought-provoking, age-appropriate question for ${member.name}, who is ${member.age} years old.

Age-Specific Guidelines:

For ages 3-7:
- Use simple, concrete language they can understand
- Focus on observable actions, feelings, and basic lessons
- Ask about what characters did, how they felt, or what they learned
- Connect to their everyday experiences (friends, family, school, play)
- Example: "What do you think made [character] feel brave/scared/happy? When have you felt that way?"

For ages 8-12:
- Ask "why" and "how" questions that dig deeper
- Focus on character traits, choices, and consequences
- Encourage them to put themselves in the story
- Connect biblical principles to real situations they face
- Example: "Why do you think [character] chose to do [action]? What would you have done in that situation?"

For ages 13+:
- Ask challenging theological and life application questions
- Explore motivations, cultural context, and deeper meanings
- Connect to their identity formation and real-world challenges
- Encourage critical thinking about how this applies today
- Example: "How does this passage challenge our culture's view of [topic]? What would living this out look like in your life this week?"

The question should:
1. Be specific to the passage content (reference events, people, or teachings from the text)
2. Be personally engaging and conversational (use "you" language)
3. Encourage sharing and discussion (not just yes/no)
4. Connect Scripture to real life in a natural way
5. Be appropriately challenging without being overwhelming

Return ONLY the question, nothing else.`;

      const { text } = await generateText({
        model: openai('gpt-5-nano-2025-08-07'),
        prompt,
        temperature: 0.7,
      });

      return {
        familyMemberId: member.id,
        name: member.name,
        age: member.age,
        question: text.trim(),
      };
    });

    const questions = await Promise.all(questionsPromises);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
