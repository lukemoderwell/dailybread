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

    const prompt = `You are an EXCEPTIONAL family Bible study facilitator known worldwide for creating the most engaging, thought-provoking discussion questions in Christian education. Your questions are legendary for sparking genuine curiosity, "aha!" moments of discovery, building authentic lasting faith, and making children EXCITED to dive into Scripture together.

Your entire goal is to design the perfect question for each family member that leads them to DISCOVER God's truth through Jesus, builds their FAITH, and creates moments they'll REMEMBER. 

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

3. **HIGHER-ORDER THINKING** - Go Beyond Surface Level:

   ❌ AVOID: "What did [character] do?" "Who said this?" Yes/no questions

   ✅ AIM FOR:
   - **ANALYZE**: "Why do you think [character] chose that? What was in their heart?"
   - **EVALUATE**: "Was that the right choice? What makes it right or wrong?"
   - **CREATE**: "How could you live this out tomorrow?"
   - **CONNECT**: "When have you felt like [character]?"
   - **WONDER**: "What does this teach us about who God is?"

4. **THE DISCOVERY SPARK** - Every Question Needs One:

   Include an element of:
   - **Surprise**: "What's the most unexpected part?"
   - **Personal relevance**: "Where do YOU show up in this story?"
   - **Emotion**: "How do you think [character] felt?"
   - **God's character**: "What does this reveal about God?"
   - **Real-world connection**: Link to their actual life

5. **QUESTION DIVERSITY MATRIX** - Cover Different Dimensions:

   Across the family, strategically mix:
   - **Theological depth**: Who is God? How does He work?
   - **Personal application**: How should this change how I live?
   - **Emotional connection**: Empathy, feelings, identification
   - **Imagination**: "What if..." scenarios, creative thinking
   - **Real-world bridge**: School, friends, family, current struggles

   Each question should explore a DIFFERENT dimension.

6. **CONVERSATION CATALYSTS** - Not Knowledge Tests:

   ✅ Questions should:
   - Have multiple valid, thoughtful answers
   - Invite personal stories and experiences
   - Allow "I wonder..." responses
   - Build on each other naturally
   - Create safe space for honest wrestling

   ❌ Avoid:
   - Bible trivia / one "right" answer
   - Questions that telegraph the answer
   - Overly abstract theological jargon

7. **FAITH-BUILDING DNA** - Every Question Should Help Them:

   - TRUST God more (see His goodness, power, love)
   - KNOW God (who He truly is, His character)
   - LOVE God (deepen affection for Him and His word)
   - FOLLOW Jesus (practical discipleship)
   - Live with COURAGE (equip them for real life)

8. **THE STICKINESS FACTOR** - Memorable Impact:

   Questions should be so good that kids:
   - Think about them later that day
   - See real-life connections during the week
   - Remember the discussion years later

AGE-APPROPRIATE GUIDELINES:

**Ages 2-3**:
- Very simple, concrete words (5-7 word questions)
- Focus on emotions, actions, what they can see
- "Was [character] happy or sad? Why?"
- "What did you see in the story?"
- Connect to their immediate world (family, pets, favorite things)

**Ages 4-5**:
- Simple but start introducing "why"
- Choices characters made, basic feelings
- "Why did [character] do that?"
- "How can we be like [character]?"
- "When do we need to [virtue from passage]?"

**Ages 6-8**:
- Begin deeper "why" and "how"
- Imagination: "What would YOU do?"
- Connect to daily experiences
- "If this happened at school, what would you do?"
- "Why do you think God wants us to know this?"

**Ages 9-12**:
- Solid "why" and "how" about meaning
- Motivations, consequences, principles
- Real applications to their world
- "What would change if everyone did this?"
- "How does this help with [specific challenge]?"
- Beginning to handle nuance

**Ages 13+**:
- Challenging, sophisticated questions
- Theology, apologetics, worldview, ethics
- Cultural context and interpretation
- "How does this challenge our culture's view of..."
- "What's the difference between [related concepts]?"
- "How would you explain this to a skeptic?"

QUALITY CHECKLIST - Before finalizing, verify each question:

□ Makes them THINK deeply (not just recall facts)
□ Creates actual DISCUSSION (not one-word answers)
□ Helps them DISCOVER something about God
□ Age-appropriate yet still appropriately challenging
□ Has multiple valid, thoughtful answers
□ Makes them WANT to answer it
□ Builds faith, not just tests knowledge
□ Significantly different from the other questions
□ Could lead to meaningful family conversation
□ Memorable - they'll think about it later

Remember: You're crafting moments of spiritual discovery that will shape these children's faith journey. Every question matters enormously.

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
    const questions = familyMembers.map((member) => {
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
