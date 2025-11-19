'use client';

import { useState } from 'react';
import { BIBLE_BOOKS } from '@/lib/bible-metadata';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{completedCount}</span> / {totalBooks} books completed
          </span>
          {inProgressCount > 0 && (
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{inProgressCount}</span> in progress
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/30" />
            <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700/60" />
            <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
          </div>
          <span className="hidden sm:inline">More</span>
          <div className="w-3 h-3 rounded-sm bg-blue-500 border-2 border-blue-600" />
          <span>Current</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <TooltipProvider>
        <div className="space-y-6">
          {Object.entries(BIBLE_SECTIONS).map(([testament, sections]) => (
            <div key={testament} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">{testament}</h3>

              {Object.entries(sections).map(([sectionName, books]) => (
                <div key={sectionName} className="space-y-2">
                  <h4 className="text-xs text-muted-foreground pl-2">{sectionName}</h4>
                  <div className="flex flex-wrap gap-1.5 md:gap-1">
                    {books.map((book) => {
                      const completion = completedBooks[book] || 0;
                      const isCurrent = book === currentBook;

                      return (
                        <div key={book}>
                          {/* Desktop: Tooltip on hover */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleBookClick(book)}
                                className={`
                                  w-10 h-10 md:w-8 md:h-8 rounded-sm transition-all
                                  active:scale-95 touch-manipulation
                                  ${getCompletionColor(completion, isCurrent)}
                                `}
                                aria-label={`${book} - ${completion}% complete`}
                              />
                            </TooltipTrigger>
                            <TooltipContent className="hidden md:block">
                              <div className="text-center">
                                <p className="font-semibold">{book}</p>
                                {isCurrent && <p className="text-xs text-blue-400">Currently reading</p>}
                                {completion > 0 && !isCurrent && (
                                  <p className="text-xs text-muted-foreground">
                                    {completion === 100 ? 'Completed' : `${completion}% complete`}
                                  </p>
                                )}
                                {completion === 0 && !isCurrent && (
                                  <p className="text-xs text-muted-foreground">Not started</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
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
