import { NextResponse } from "next/server";
import {
  getChapterVerseCount,
  calculateEndingPosition,
  getTotalChapters,
  BOOK_ID_MAP,
  type VersePosition
} from "@/lib/bible-metadata";

export const runtime = "edge";

interface BiblePassageRequest {
  book: string;
  chapter: number;
  verse?: number; // Starting verse (default: 1)
  translation?: string; // Default to KJV if not specified
  verses_per_session?: number; // Number of verses to fetch (default: fetch whole chapter)
}

async function fetchPassageSegment(
  bookId: string,
  chapter: number,
  startVerse: number,
  endVerse: number,
  translation: string,
  apiKey: string
): Promise<{ content: string; reference: string } | null> {
  const passageId = `${bookId}.${chapter}.${startVerse}-${bookId}.${chapter}.${endVerse}`;
  const apiUrl = `https://rest.api.bible/v1/bibles/${translation}/passages/${passageId}`;

  console.log('Fetching segment:', passageId);

  const response = await fetch(apiUrl, {
    headers: { "api-key": apiKey },
  });

  if (!response.ok) {
    console.error('Failed to fetch segment:', passageId, response.status);
    return null;
  }

  const data = await response.json();
  const content = data.data.content;

  return {
    content,
    reference: data.data.reference,
  };
}

export async function POST(req: Request) {
  try {
    const {
      book,
      chapter,
      verse = 1,
      translation = "555fef9a6cb31151-01", // CEV (Contemporary English Version)
      verses_per_session
    }: BiblePassageRequest = await req.json();

    console.log('Bible API request:', { book, chapter, verse, translation, verses_per_session });

    const API_KEY = process.env.API_BIBLE_KEY;
    if (!API_KEY) {
      return NextResponse.json(
        { error: "API.Bible key not configured" },
        { status: 500 }
      );
    }

    // Convert book name to book ID
    const bookId = BOOK_ID_MAP[book];
    if (!bookId) {
      return NextResponse.json(
        { error: `Unknown book: ${book}` },
        { status: 400 }
      );
    }

    // If no verses_per_session, fetch whole chapter from starting verse
    if (!verses_per_session || verses_per_session <= 0) {
      const chapterVerseCount = getChapterVerseCount(book, chapter);
      if (!chapterVerseCount) {
        return NextResponse.json(
          { error: `Invalid chapter for ${book}` },
          { status: 400 }
        );
      }

      const segment = await fetchPassageSegment(bookId, chapter, verse, chapterVerseCount, translation, API_KEY);
      if (!segment) {
        return NextResponse.json(
          { error: "Failed to fetch passage" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        book,
        chapter,
        verse,
        ending_book: book,
        ending_chapter: chapter,
        ending_verse: chapterVerseCount,
        verses_read: chapterVerseCount - verse + 1,
        translation,
        content: segment.content,
        reference: segment.reference,
      });
    }

    // Calculate ending position
    const startPos: VersePosition = { book, chapter, verse };
    const endPos = calculateEndingPosition(startPos, verses_per_session);

    if (!endPos) {
      return NextResponse.json(
        { error: "Failed to calculate ending position" },
        { status: 500 }
      );
    }

    console.log('Calculated ending position:', endPos);

    // Fetch passage segments
    const segments: string[] = [];
    const currentBook = book;
    let currentChapter = chapter;
    let currentVerse = verse;

    while (
      currentBook !== endPos.book ||
      currentChapter !== endPos.chapter ||
      currentVerse <= endPos.verse
    ) {
      const currentBookId = BOOK_ID_MAP[currentBook];
      const chapterVerseCount = getChapterVerseCount(currentBook, currentChapter);

      if (!chapterVerseCount) break;

      // Determine end verse for this segment
      let segmentEndVerse: number;
      if (currentBook === endPos.book && currentChapter === endPos.chapter) {
        // Last segment
        segmentEndVerse = endPos.verse;
      } else {
        // Read to end of chapter
        segmentEndVerse = chapterVerseCount;
      }

      // Fetch this segment
      const segment = await fetchPassageSegment(
        currentBookId,
        currentChapter,
        currentVerse,
        segmentEndVerse,
        translation,
        API_KEY
      );

      if (segment) {
        segments.push(segment.content);
      }

      // Check if we're done
      if (currentBook === endPos.book && currentChapter === endPos.chapter) {
        break;
      }

      // Move to next chapter
      const totalChapters = getTotalChapters(currentBook);
      if (totalChapters && currentChapter < totalChapters) {
        currentChapter++;
        currentVerse = 1;
      } else {
        // Move to next book (for now, just break - book transitions handled elsewhere)
        break;
      }
    }

    // Concatenate all segments
    const combinedContent = segments.join('\n\n');
    const reference = `${book} ${chapter}:${verse}-${endPos.chapter}:${endPos.verse}`;

    return NextResponse.json({
      book,
      chapter,
      verse,
      ending_book: endPos.book,
      ending_chapter: endPos.chapter,
      ending_verse: endPos.verse,
      verses_read: verses_per_session,
      translation,
      content: combinedContent,
      reference,
    });
  } catch (error) {
    console.error("Bible passage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Bible passage" },
      { status: 500 }
    );
  }
}
