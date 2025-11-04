import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'edge';
export const maxDuration = 30;

interface QuestionRequest {
  passage: string;
  reference: string;
  familyMembers: Array<{ id: string; name: string; age: number; color: string }>;
}

export async function POST(req: Request) {
  try {
    const { passage, reference, familyMembers }: QuestionRequest =
      await req.json();

    console.log('Generating questions for:', {
      reference,
      passageLength: passage.length,
      passagePreview: passage.substring(0, 100) + '...',
      familyMemberCount: familyMembers.length,
    });

    // Generate questions for each family member
    const questionsPromises = familyMembers.map(async (member) => {
      console.log('member', member);
      const prompt = `You are creating engaging, thoughtful Bible study questions for a family devotional time. These questions should spark meaningful conversation and help family members connect God's Word to their daily lives.

Scripture passage: ${reference}
Text: ${passage}

Create ONE thought-provoking, age-appropriate question for ${member.name}, who is ${member.age} years old. 

Age-Specific Guidelines:

For ages 2-3:
- Use very simple words and short sentences
- Focus on basic emotions, actions, or sounds from the story
- Ask about what they saw or heard in the passage
- Connect to familiar routines or feelings (family, animals, bedtime)
- Example: "Did you hear about [character]? Were they happy or sad?"

For ages 4-5:
- Use simple language, but ask about simple choices or feelings
- Focus on what characters did and why in a very basic way
- Encourage noticing or describing details from the story
- Relate to their friendships, sharing, or helping
- Example: "What did [character] do to be kind? Can you help someone like that?"

For ages 6-8:
- Use clear language but begin asking simple “why” or “how” questions
- Focus on actions, choices, and what can be learned
- Encourage them to imagine being in the story or relate it to their life
- Example: "Why do you think [character] did that? What would you do?"

For ages 9-12:
- Ask deeper “why” and “how” questions about the passage and its meaning
- Focus on character motives, consequences, or lessons learned
- Connect biblical ideas to real-life situations they face (friendships, school, problems)
- Example: "Why do you think [character] acted that way? How could this story help you with something in your life?"

For ages 13+:
- Ask challenging, open-ended questions about meaning, theology, or application
- Explore motivations, cultural context, or deeper themes in the passage
- Connect the Scripture to current challenges, identity, or worldview
- Encourage critical thinking and personal reflection
- Example: "How does this passage challenge the way most people think about [topic]? What difference could it make in your life this week?"

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
        // temperature: 0.7,
      });

      return {
        familyMemberId: member.id,
        name: member.name,
        age: member.age,
        color: member.color,
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
