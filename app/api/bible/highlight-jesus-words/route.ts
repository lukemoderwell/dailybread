import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const runtime = 'edge';
export const maxDuration = 30;

interface HighlightRequest {
  htmlContent: string;
  reference: string;
  book: string;
}

/**
 * Identifies Jesus' words in a Bible passage and returns the HTML content
 * with those words wrapped in spans with class "jesus-words"
 */
export async function POST(req: Request) {
  try {
    const { htmlContent, reference, book }: HighlightRequest = await req.json();

    // Extract plain text for analysis (remove HTML tags)
    const plainText = htmlContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Only process Gospels and Acts (where Jesus speaks)
    const gospelsAndActs = ['Matthew', 'Mark', 'Luke', 'John', 'Acts'];
    if (!gospelsAndActs.includes(book)) {
      // Return original content unchanged for non-Gospel books
      return NextResponse.json({ highlightedContent: htmlContent });
    }

    // Use AI to identify which parts are Jesus' words
    const prompt = `You are analyzing a Bible passage to identify the words spoken by Jesus.

PASSAGE REFERENCE: ${reference}
BOOK: ${book}

PASSAGE TEXT:
${plainText}

Your task: Identify the exact text that Jesus spoke in this passage. Look for direct quotes introduced by phrases like "Jesus said", "he answered", "Jesus replied", "Jesus answered", "Jesus told them", etc.

Return ONLY a JSON array of strings. Each string should be an exact quote from Jesus as it appears in the passage text above. Extract complete phrases or sentences.

Example format:
[
  "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life",
  "I am the way and the truth and the life. No one comes to the Father except through me"
]

If there are no words of Jesus in this passage, return an empty array: []

IMPORTANT: 
- Extract quotes EXACTLY as they appear in the passage text (word-for-word)
- Only include direct speech from Jesus, not narrator descriptions
- Include punctuation and capitalization exactly as shown`;

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
      temperature: 0.2, // Very low temperature for consistent extraction
    });

    // Parse the JSON response
    let jesusQuotes: string[] = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jesusQuotes = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response for Jesus words:', parseError);
      // Return original content if parsing fails
      return NextResponse.json({ highlightedContent: htmlContent });
    }

    if (!Array.isArray(jesusQuotes) || jesusQuotes.length === 0) {
      // No Jesus words identified, return original
      return NextResponse.json({ highlightedContent: htmlContent });
    }

    // Process HTML to wrap Jesus' words
    // We'll use a simple approach: find the text in the HTML and wrap it
    let highlightedContent = htmlContent;

    // Sort by length (longest first) to avoid partial matches
    const sortedQuotes = jesusQuotes
      .map((q) => q.trim())
      .filter((text) => text.length > 10) // Only process substantial quotes
      .sort((a, b) => b.length - a.length);

    for (const quote of sortedQuotes) {
      // Remove HTML tags from the quote for matching
      const quoteTextOnly = quote.replace(/[^\w\s.,;:!?'"()-]/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (quoteTextOnly.length < 10) continue;

      // Find the quote in the HTML by matching the text content
      // We need to match text that might be split by HTML tags
      const words = quoteTextOnly.split(/\s+/).filter((w) => w.length > 0);
      if (words.length < 3) continue; // Need at least 3 words for reliable matching

      // Create a pattern that matches these words in sequence, allowing HTML between them
      const escapedWords = words.map((w) => escapeRegex(w));
      // Match words with possible HTML tags and whitespace between them
      const pattern = escapedWords.join('(?:<[^>]*>)*\\s*(?:<[^>]*>)*');

      // Use a more sophisticated replacement that preserves HTML structure
      const regex = new RegExp(`(${pattern})`, 'gi');
      
      highlightedContent = highlightedContent.replace(regex, (match, p1) => {
        // Skip if already wrapped
        if (match.includes('jesus-words') || match.includes('class=')) {
          return match;
        }
        // Don't wrap HTML tags themselves
        if (match.trim().startsWith('<') && match.trim().endsWith('>')) {
          return match;
        }
        // Wrap the matched text
        return `<span class="jesus-words">${match}</span>`;
      });
    }

    return NextResponse.json({ highlightedContent });
  } catch (error) {
    console.error('Error highlighting Jesus words:', error);
    // Return original content on error
    return NextResponse.json({ highlightedContent: htmlContent });
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

