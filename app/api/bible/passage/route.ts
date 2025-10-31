import { NextResponse } from "next/server";

export const runtime = "edge";

interface BiblePassageRequest {
  book: string;
  chapter: number;
  translation?: string; // Default to KJV if not specified
}

// Map book names to API.Bible book IDs
const BOOK_ID_MAP: Record<string, string> = {
  "Genesis": "GEN",
  "Proverbs": "PRO",
  "Psalms": "PSA",
  "John": "JHN",
  "James": "JAS",
  "Philippians": "PHP",
  "1 Peter": "1PE",
  "Mark": "MRK",
  "Ephesians": "EPH",
  "Colossians": "COL",
};

export async function POST(req: Request) {
  try {
    const { book, chapter, translation = "de4e12af7f28f599-02" }: BiblePassageRequest = await req.json();

    console.log('Bible API request:', { book, chapter, translation });

    const API_KEY = process.env.API_BIBLE_KEY;
    if (!API_KEY) {
      return NextResponse.json(
        { error: "API.Bible key not configured" },
        { status: 500 }
      );
    }

    // Convert book name to book ID
    const bookId = BOOK_ID_MAP[book] || book;
    const passageId = `${bookId}.${chapter}`;

    console.log('Fetching passage:', passageId);

    // Fetch passage from API.Bible
    const apiUrl = `https://rest.api.bible/v1/bibles/${translation}/passages/${passageId}`;
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        "api-key": API_KEY,
      },
    });

    console.log('API.Bible response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API.Bible error:', errorData);
      return NextResponse.json(
        { error: "Failed to fetch Bible passage", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      book,
      chapter,
      translation,
      content: data.data.content,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("Bible passage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Bible passage" },
      { status: 500 }
    );
  }
}
