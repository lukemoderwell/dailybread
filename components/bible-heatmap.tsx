'use client';

import { useState } from 'react';
import { BIBLE_BOOKS } from "@/lib/bible-metadata";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChevronDown } from "lucide-react";

interface BibleHeatmapProps {
  completedBooks: Record<string, number>; // book name -> completion percentage (0-100)
  currentBook: string;
}

// Organize Bible into sections like GitHub's year view
const BIBLE_SECTIONS = {
  'Old Testament': {
    'Law': ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'],
    'History': [
      'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
      '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
      'Ezra', 'Nehemiah', 'Esther'
    ],
    'Wisdom': ['Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon'],
    'Major Prophets': ['Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel'],
    'Minor Prophets': [
      'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah',
      'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
    ]
  },
  'New Testament': {
    'Gospels': ['Matthew', 'Mark', 'Luke', 'John'],
    'History': ['Acts'],
    "Paul's Letters": [
      'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
      'Ephesians', 'Philippians', 'Colossians',
      '1 Thessalonians', '2 Thessalonians',
      '1 Timothy', '2 Timothy', 'Titus', 'Philemon'
    ],
    'General Letters': [
      'Hebrews', 'James', '1 Peter', '2 Peter',
      '1 John', '2 John', '3 John', 'Jude'
    ],
    'Prophecy': ['Revelation']
  }
};

function getSectionStats(
  books: string[],
  completedBooks: Record<string, number>
) {
  const completed = books.filter((book) => completedBooks[book] === 100).length;
  const inProgress = books.filter((book) => {
    const completion = completedBooks[book] || 0;
    return completion > 0 && completion < 100;
  }).length;

  // Calculate overall percentage based on progress of all books in section
  const totalProgress = books.reduce((sum, book) => {
    return sum + (completedBooks[book] || 0);
  }, 0);

  return {
    completed,
    inProgress,
    percent: Math.round(totalProgress / books.length),
  };
}

function getStatusText(completion: number, isCurrent: boolean) {
  if (isCurrent) {
    return "Currently reading";
  }

  if (completion === 100) {
    return "Completed";
  }

  if (completion === 0) {
    return "Not started";
  }

  return `${completion}% complete`;
}

function getCompletionColor(percentage: number, isCurrent: boolean): string {
  if (isCurrent) {
    return 'bg-blue-500 border-blue-600 border-2';
  }
  if (percentage === 0) {
    return 'bg-muted hover:bg-muted/80';
  }
  if (percentage < 25) {
    return 'bg-green-200 dark:bg-green-900/30 hover:bg-green-300 dark:hover:bg-green-900/50';
  }
  if (percentage < 50) {
    return 'bg-green-300 dark:bg-green-800/40 hover:bg-green-400 dark:hover:bg-green-800/60';
  }
  if (percentage < 75) {
    return 'bg-green-400 dark:bg-green-700/60 hover:bg-green-500 dark:hover:bg-green-700/80';
  }
  if (percentage < 100) {
    return 'bg-green-500 dark:bg-green-600/70 hover:bg-green-600 dark:hover:bg-green-600/90';
  }
  return 'bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600';
}

export default function BibleHeatmap({ completedBooks, currentBook }: BibleHeatmapProps) {
  const totalBooks = BIBLE_BOOKS.length;
  const completedCount = Object.values(completedBooks).filter(p => p === 100).length;
  const inProgressCount = Object.values(completedBooks).filter(p => p > 0 && p < 100).length;
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleBookClick = (book: string) => {
    setSelectedBook(book);
    setIsSheetOpen(true);
  };

  const selectedBookCompletion = selectedBook ? (completedBooks[selectedBook] || 0) : 0;
  const isSelectedCurrent = selectedBook === currentBook;

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="space-y-4 text-sm md:flex md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col gap-2 text-muted-foreground md:flex-row md:items-center md:gap-4">
          <span>
            <span className="font-semibold text-foreground">{completedCount}</span> / {totalBooks} books completed
          </span>
          {inProgressCount > 0 && (
            <span>
              <span className="font-semibold text-foreground">{inProgressCount}</span> in progress
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded-sm bg-muted" />
            <div className="h-3 w-3 rounded-sm bg-green-200 dark:bg-green-900/30" />
            <div className="h-3 w-3 rounded-sm bg-green-400 dark:bg-green-700/60" />
            <div className="h-3 w-3 rounded-sm bg-green-600 dark:bg-green-500" />
          </div>
          <span>More</span>
          <div className="h-3 w-3 rounded-sm border-2 border-blue-600 bg-blue-500" />
          <span>Current</span>
        </div>
      </div>

      {/* Mobile friendly layout */}
      <div className="md:hidden">
        <p className="text-xs text-muted-foreground">
          Tap a section below to see detailed progress for every book.
        </p>
      </div>

      <div className="md:hidden">
        <MobileBibleSections
          completedBooks={completedBooks}
          currentBook={currentBook}
        />
      </div>

      {/* Heatmap Grid */}
      <TooltipProvider>
        <div className="hidden space-y-6 md:block">
          {Object.entries(BIBLE_SECTIONS).map(([testament, sections]) => (
            <div key={testament} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">{testament}</h3>

              {Object.entries(sections).map(([sectionName, books]) => (
                <div key={sectionName} className="space-y-2">
                  <h4 className="pl-2 text-xs text-muted-foreground">{sectionName}</h4>
                  <div className="flex flex-wrap gap-1">
                    {books.map((book) => {
                      const completion = completedBooks[book] || 0;
                      const isCurrent = book === currentBook;

                      return (
                        <Tooltip key={book}>
                          <TooltipTrigger asChild>
                            <div
                              onClick={() => handleBookClick(book)}
                              className={`
                                h-8 w-8 cursor-pointer rounded-sm transition-all
                                ${getCompletionColor(completion, isCurrent)}
                              `}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-center">
                              <p className="font-semibold">{book}</p>
                              {isCurrent && <p className="text-xs text-blue-400">Currently reading</p>}
                              {!isCurrent && (
                                <p className="text-xs text-muted-foreground">
                                  {getStatusText(completion, isCurrent)}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </TooltipProvider>

      {/* Mobile: Bottom Sheet for book details */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent 
          side="bottom" 
          className="h-auto max-h-[80vh] rounded-t-2xl border-t-2"
        >
          {/* Drag handle indicator */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          
          <SheetHeader className="pt-4">
            <SheetTitle className="text-center">
              {selectedBook}
            </SheetTitle>
            <SheetDescription className="text-center">
              {isSelectedCurrent && (
                <span className="text-blue-500 font-medium">Currently reading</span>
              )}
              {selectedBookCompletion > 0 && !isSelectedCurrent && (
                <span className="text-muted-foreground">
                  {selectedBookCompletion === 100 ? 'Completed' : `${selectedBookCompletion}% complete`}
                </span>
              )}
              {selectedBookCompletion === 0 && !isSelectedCurrent && (
                <span className="text-muted-foreground">Not started</span>
              )}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 pb-6">
            {/* Visual indicator */}
            <div className="flex items-center justify-center gap-4">
              <div
                className={`
                  w-16 h-16 rounded-lg transition-all duration-300
                  ${getCompletionColor(selectedBookCompletion, isSelectedCurrent)}
                `}
              />
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">
                  {selectedBookCompletion}%
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`
                  h-full transition-all duration-700 ease-out
                  ${isSelectedCurrent 
                    ? 'bg-blue-500' 
                    : selectedBookCompletion === 100
                    ? 'bg-green-600'
                    : 'bg-green-500'
                  }
                `}
                style={{ width: `${selectedBookCompletion}%` }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MobileBibleSections({
  completedBooks,
  currentBook,
}: BibleHeatmapProps) {
  return (
    <div className="space-y-6">
      {Object.entries(BIBLE_SECTIONS).map(([testament, sections]) => (
        <div key={testament} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {testament}
          </p>

          {Object.entries(sections).map(([sectionName, books], index) => {
            const stats = getSectionStats(books, completedBooks);

            return (
              <details
                key={sectionName}
                className="group rounded-2xl border bg-card text-card-foreground shadow-sm transition"
                open={index === 0}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{sectionName}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.completed} / {books.length} completed
                      {stats.inProgress > 0 && ` · ${stats.inProgress} in progress`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-sm font-semibold text-foreground">{stats.percent}%</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
                  </div>
                </summary>

                <div className="space-y-3 border-t px-4 py-4">
                  {books.map((book) => {
                    const completion = completedBooks[book] || 0;
                    const isCurrent = book === currentBook;
                    const progressWidth = Math.min(
                      100,
                      completion === 0 ? (isCurrent ? 18 : 8) : completion
                    );

                    return (
                      <div
                        key={book}
                        className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-foreground">{book}</p>
                          <span
                            className={`text-xs font-medium ${
                              isCurrent ? "text-blue-500" : "text-muted-foreground"
                            }`}
                          >
                            {getStatusText(completion, isCurrent)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative h-2 flex-1 rounded-full bg-muted">
                            <span
                              className={`absolute inset-y-0 left-0 rounded-full ${
                                isCurrent ? "bg-blue-500" : "bg-green-500"
                              }`}
                              style={{ width: `${progressWidth}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs font-semibold text-muted-foreground">
                            {completion}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      ))}
    </div>
  );
}
