// Achievement definitions with inline check functions
// This is the single source of truth - no database table needed

export type AchievementCategory = "streak" | "book" | "journey" | "special";

export interface UserMetrics {
  longestStreak: number;
  totalSessions: number;
  completedBooks: string[];
  biblePercent: number;
}

export interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: string;
  isMajor: boolean;
  check: (m: UserMetrics) => boolean;
}

const GOSPELS = ["Matthew", "Mark", "Luke", "John"];
const OT_BOOKS = 39;
const NT_BOOKS = 27;

// Helper to check if user completed all books in a range
const completedOT = (m: UserMetrics) => {
  const otBooks = new Set(m.completedBooks.filter((_, i) => i < OT_BOOKS));
  return otBooks.size >= OT_BOOKS;
};

const completedNT = (m: UserMetrics) => {
  return m.completedBooks.filter(b => !completedOT({ ...m, completedBooks: [b] })).length >= NT_BOOKS;
};

export const ACHIEVEMENTS: Achievement[] = [
  // Streaks
  { id: "streak_1", category: "streak", name: "First Step", description: "Complete your first reading together", icon: "footprints", isMajor: false, check: m => m.longestStreak >= 1 },
  { id: "streak_7", category: "streak", name: "Week Warrior", description: "Read together for 7 days in a row", icon: "shield", isMajor: false, check: m => m.longestStreak >= 7 },
  { id: "streak_14", category: "streak", name: "Fortnight Family", description: "Read together for 14 days in a row", icon: "mountain", isMajor: false, check: m => m.longestStreak >= 14 },
  { id: "streak_30", category: "streak", name: "Monthly Masters", description: "Read together for 30 days in a row", icon: "moon", isMajor: true, check: m => m.longestStreak >= 30 },
  { id: "streak_100", category: "streak", name: "Century Club", description: "Read together for 100 days in a row", icon: "crown", isMajor: true, check: m => m.longestStreak >= 100 },
  { id: "streak_365", category: "streak", name: "Year of Faith", description: "Read together for an entire year!", icon: "sun", isMajor: true, check: m => m.longestStreak >= 365 },

  // Books
  { id: "book_first", category: "book", name: "First Finish", description: "Complete your first book of the Bible", icon: "book-open", isMajor: false, check: m => m.completedBooks.length >= 1 },
  { id: "book_gospel", category: "book", name: "Gospel Reader", description: "Complete any Gospel (Matthew, Mark, Luke, or John)", icon: "cross", isMajor: true, check: m => GOSPELS.some(g => m.completedBooks.includes(g)) },
  { id: "book_nt", category: "book", name: "New Testament", description: "Complete all 27 New Testament books", icon: "bird", isMajor: true, check: completedNT },
  { id: "book_ot", category: "book", name: "Old Testament", description: "Complete all 39 Old Testament books", icon: "scroll", isMajor: true, check: completedOT },
  { id: "book_bible", category: "book", name: "The Whole Story", description: "Complete all 66 books of the Bible", icon: "book-heart", isMajor: true, check: m => m.completedBooks.length >= 66 },

  // Journey
  { id: "journey_start", category: "journey", name: "Getting Started", description: "Begin your family Bible journey", icon: "sprout", isMajor: false, check: m => m.totalSessions >= 1 },
  { id: "journey_25", category: "journey", name: "Quarter Way", description: "Read 25% of the Bible together", icon: "circle-dot", isMajor: false, check: m => m.biblePercent >= 25 },
  { id: "journey_50", category: "journey", name: "Halfway There", description: "Read 50% of the Bible together", icon: "loader", isMajor: true, check: m => m.biblePercent >= 50 },
  { id: "journey_75", category: "journey", name: "Almost There", description: "Read 75% of the Bible together", icon: "circle-dot-dashed", isMajor: true, check: m => m.biblePercent >= 75 },
  { id: "journey_100", category: "journey", name: "Journey Complete", description: "Read the entire Bible as a family!", icon: "trophy", isMajor: true, check: m => m.biblePercent >= 100 },

  // Special
  { id: "special_50_sessions", category: "special", name: "Bookworm", description: "Complete 50 reading sessions", icon: "book-open-check", isMajor: false, check: m => m.totalSessions >= 50 },
  { id: "special_100_sessions", category: "special", name: "Story Time", description: "Complete 100 reading sessions", icon: "library", isMajor: true, check: m => m.totalSessions >= 100 },
];

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  streak: "Streaks",
  book: "Books",
  journey: "Journey",
  special: "Special",
};

export function getAchievementById(id: string) {
  return ACHIEVEMENTS.find(a => a.id === id);
}
