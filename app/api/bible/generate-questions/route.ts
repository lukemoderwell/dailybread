import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const runtime = "edge";
export const maxDuration = 30;

interface QuestionRequest {
  passage: string;
  reference: string;
  familyMembers: Array<{ id: string; name: string; age: number }>;
}

export async function POST(req: Request) {
  try {
    const { passage, reference, familyMembers }: QuestionRequest = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Generate questions for each family member
    const questionsPromises = familyMembers.map(async (member) => {
      const prompt = `You are creating engaging Bible study questions for a family devotional time.

Scripture passage: ${reference}
Text: ${passage}

Create ONE thought-provoking, age-appropriate question for ${member.name}, who is ${member.age} years old.

Guidelines:
- For ages 3-7: Use simple language, focus on concrete concepts, stories, and feelings
- For ages 8-12: Ask about application, character traits, and simple "why" questions
- For ages 13+: Deeper theological questions, life application, challenging thoughts

The question should:
1. Be engaging and conversational
2. Help them connect the passage to their own life
3. Encourage discussion (not just yes/no)
4. Be appropriate for their age and maturity

Return ONLY the question, nothing else.`;

      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
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
    console.error("Question generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
