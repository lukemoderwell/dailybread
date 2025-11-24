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
  application: string;
}

interface GeneratedResponse {
  discussionGuide: string;
  questions: GeneratedQuestion[];
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
1) Create a concise **discussion guide** written for the parent/leader facilitating the Bible study. This is NOT questions for the kids - focus on identifying the key themes, theological concepts, and spiritual principles in this passage. Write 1-2 brief paragraphs maximum (aim for brevity and impact). Use Markdown formatting: use **bold** to highlight key themes or concepts the leader should focus on, and *italic* for emphasis on important points. This should be quick to scan and help the leader understand what to watch for as they read together. Address the leader directly using "you". Be concise - every word should count.

2) Generate ONE unique question **and** ONE practical, age-appropriate **application idea** for each family member listed above. These questions should work together as a complementary set for a rich family discussion.

CRITICAL REQUIREMENTS:

1. **VARIETY & COORDINATION**: Each question MUST explore a completely different angle or theme from the passage. Do not repeat concepts across questions. The questions should complement each other and together cover multiple dimensions of the passage.

2. **SUBTLE PERSONALIZATION**:
   - **Age is PRIMARY**: Always match question complexity to the child's developmental stage
   - **Notes as INVISIBLE GUIDE** (primary approach - use most of the time):

     When a passage has multiple themes (obedience, courage, faith, kindness, etc.), use notes
     to choose which theme to explore with that child - WITHOUT explicitly mentioning the note.

     ✅ EXCELLENT - Theme selection (use this ~70% of the time):
     - Passage covers obedience + courage + prayer
     - Child's notes: "struggling with listening to parents"
     - Question: "Why do you think obeying God is hard sometimes? What helps?"
     - (Note guided topic choice, but question never mentions parents)

     - Passage covers creation + God's power + human responsibility
     - Child's notes: "loves nature, curious about animals"
     - Question: "What does this tell us about how God designed the world?"
     - (Note guided focus on creation, but question stands alone)

   - **Notes as VISIBLE CONNECTION** (secondary approach - use occasionally ~30% of the time):

     Sometimes making the connection explicit is natural and powerful - but use sparingly.

     ✅ GOOD - Explicit but natural (occasional use when it genuinely fits):
     - Passage mentions shepherds → child loves animals → "If you were caring for sheep like in this passage..."
     - Passage about courage → child plays sports → "When you face a tough moment in a game, what helps you be brave? How might that connect here?"
     - Passage about creativity → child draws → "If you drew this scene, what would stand out most?"

     ❌ DON'T force it or make it corny:
     - "Since you like soccer, how is faith like scoring a goal?" (TOO FORCED)
     - "You mentioned loving art - paint me a picture of this verse" (TOO LITERAL)
     - Making EVERY question explicitly reference their interests (TOO PREDICTABLE)

   - **Best practice**: Default to invisible theme selection. Make visible connections only when
     it genuinely enhances the question and feels natural, not forced.

   - **Test**: If you removed the child's name and notes, would the question still be excellent?
     If NO, it's too personalized. If YES, you nailed it.

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

   Applications should be actionable, simple to do THIS WEEK (or preferably the next day), and match the child's age.

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

IMPORTANT: Return your response as valid JSON with this exact structure:
{
  "discussionGuide": "A concise thematic discussion guide (1-2 paragraphs max) written for the parent/leader in Markdown format. Use **bold** for key themes/concepts and *italic* for emphasis. Focus on identifying the main themes and what to watch for - be brief and impactful. Write directly to the leader using 'you'.",
  "questions": [
    {"name": "FirstChildName", "question": "Your creative question here?", "application": "Simple, age-appropriate action for this child"},
    {"name": "SecondChildName", "question": "Your creative question here?", "application": "Simple, age-appropriate action for this child"}
  ]
}

Ensure questions are in the SAME ORDER as the family members list above.`;

    // Generate all questions in one batch call
    const { text } = await generateText({
      model: openai('gpt-4.1-mini'),
      prompt,
      temperature: 0.9, // High creativity for variety
    });

    console.log('Raw AI response:', text);

    // Parse the JSON response
    let generated: GeneratedResponse | GeneratedQuestion[];
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const objectMatch = text.match(/\{[\s\S]*\}/);
      const rawJson = objectMatch?.[0] || jsonMatch?.[0];

      if (!rawJson) {
        throw new Error('No JSON object or array found in response');
      }
      generated = JSON.parse(rawJson);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('AI did not return valid JSON format');
    }

    const responseQuestions = Array.isArray(generated)
      ? generated
      : generated.questions;

    const discussionGuide =
      !Array.isArray(generated) && typeof generated.discussionGuide === 'string'
        ? generated.discussionGuide
        : '';

    if (
      !responseQuestions ||
      responseQuestions.length !== familyMembers.length
    ) {
      console.error(
        `Question count mismatch: got ${
          responseQuestions?.length || 0
        }, expected ${familyMembers.length}`
      );
      throw new Error('AI did not generate the correct number of questions');
    }

    // Map generated questions back to family members with full metadata
    const questions = familyMembers.map((member) => {
      const generatedQuestion = responseQuestions.find(
        (q) => q.name === member.name
      );
      if (!generatedQuestion) {
        console.warn(`No question found for ${member.name}, using fallback`);
        return {
          familyMemberId: member.id,
          name: member.name,
          age: member.age,
          color: member.color,
          question: `What does this passage teach us about living wisely?`,
          application: `Pick one simple way to live this out today and try it before bedtime.`,
        };
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

    return NextResponse.json({
      discussionGuide,
      questions,
    });
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
