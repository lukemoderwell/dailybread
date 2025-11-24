/**
 * Question Regeneration Prompt Configuration
 *
 * This module contains the prompt template for regenerating a single question
 * based on user feedback.
 */

interface RegenerationContext {
  passage: string;
  reference: string;
  memberContext: string;
  previousQuestion: string;
  feedbackContext?: string;
  otherQuestionsContext?: string;
}

const AGE_GUIDELINES = `
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
- "How does this challenge..." "What would it look like to..."`;

const QUESTION_TYPES = `
- **Wonder**: "What do you think...?" "Why do you wonder...?"
- **Imagination**: "If you could ask [character]..." "Imagine you were there..."
- **Application**: "How would you..." "What would you do if..."
- **Connection**: "When have you felt..." "How is this like..."
- **Creative twist**: Unexpected angles, playful scenarios, fun what-ifs`;

const REQUIREMENTS = `
1. **AGE-APPROPRIATE** (see guidelines below) - THIS IS CRITICAL
2. **ENGAGING**: Make them WANT to answer - spark curiosity or connection
3. **DIFFERENT ANGLE**: Don't just rephrase the bad question - explore a totally different aspect of the passage
4. **VARIETY**: If other questions are listed, ensure yours explores a unique angle
5. **CONVERSATIONAL**: Questions should feel natural and invite discussion, not test knowledge`;

const OUTPUT_FORMAT = `
{"question": "New question text", "application": "Simple, age-appropriate action for this child"}`;

/**
 * Builds the complete prompt for question regeneration
 */
export function buildQuestionRegenerationPrompt(
  context: RegenerationContext
): string {
  return `You are a creative family Bible study facilitator. A question you generated received negative feedback, and you need to create a better replacement.

SCRIPTURE: ${context.reference}
${context.passage}

FAMILY MEMBER:
- ${context.memberContext}

PREVIOUS QUESTION (did not work well):
"${context.previousQuestion}"${context.feedbackContext || ''}${context.otherQuestionsContext || ''}

YOUR TASK:
Generate ONE new question that is completely different from the previous one and addresses any feedback provided.
Also craft ONE simple, age-appropriate application idea that helps this specific child live out the passage this week.
The focus of the application is to put their faith into action so that they can learn and live the scripture that they've just read.

REQUIREMENTS:
${REQUIREMENTS}

AGE-APPROPRIATE GUIDELINES:
${AGE_GUIDELINES}

QUESTION TYPES TO CONSIDER:
${QUESTION_TYPES}

Return ONLY valid JSON in this exact shape:
${OUTPUT_FORMAT}`;
}

/**
 * Formats user feedback for the prompt
 */
export function formatFeedbackContext(feedback: string): string {
  return `\n\nUSER FEEDBACK on the previous question:\n"${feedback}"\nPlease address this feedback in your new question.`;
}

/**
 * Formats other questions to ensure diversity
 */
export function formatOtherQuestionsContext(questions: string[]): string {
  if (!questions.length) return '';

  const questionList = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
  return `\n\nOTHER QUESTIONS ALREADY ASKED (ensure your question explores a DIFFERENT angle):\n${questionList}`;
}
