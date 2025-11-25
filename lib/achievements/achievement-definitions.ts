// Achievement definitions - TypeScript mirror of database seed data
// Use these for type safety and client-side logic

export type AchievementCategory = "streak" | "book" | "journey" | "special";
export type RequirementType = "streak" | "book_count" | "bible_percent" | "session_count" | "custom";

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: string;
  requirementType: RequirementType;
  requirementValue: number | null;
  isMajor: boolean;
  sortOrder: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Streak achievements
  { id: "streak_1", category: "streak", name: "First Step", description: "Complete your first reading together", icon: "footprints", requirementType: "streak", requirementValue: 1, isMajor: false, sortOrder: 1 },
  { id: "streak_7", category: "streak", name: "Week Warrior", description: "Read together for 7 days in a row", icon: "shield", requirementType: "streak", requirementValue: 7, isMajor: false, sortOrder: 2 },
  { id: "streak_14", category: "streak", name: "Fortnight Family", description: "Read together for 14 days in a row", icon: "mountain", requirementType: "streak", requirementValue: 14, isMajor: false, sortOrder: 3 },
  { id: "streak_30", category: "streak", name: "Monthly Masters", description: "Read together for 30 days in a row", icon: "moon", requirementType: "streak", requirementValue: 30, isMajor: true, sortOrder: 4 },
  { id: "streak_100", category: "streak", name: "Century Club", description: "Read together for 100 days in a row", icon: "crown", requirementType: "streak", requirementValue: 100, isMajor: true, sortOrder: 5 },
  { id: "streak_365", category: "streak", name: "Year of Faith", description: "Read together for an entire year!", icon: "sun", requirementType: "streak", requirementValue: 365, isMajor: true, sortOrder: 6 },

  // Book completion achievements
  { id: "book_first", category: "book", name: "First Finish", description: "Complete your first book of the Bible", icon: "book-open", requirementType: "book_count", requirementValue: 1, isMajor: false, sortOrder: 1 },
  { id: "book_gospel", category: "book", name: "Gospel Reader", description: "Complete any Gospel (Matthew, Mark, Luke, or John)", icon: "cross", requirementType: "custom", requirementValue: null, isMajor: true, sortOrder: 2 },
  { id: "book_nt", category: "book", name: "New Testament", description: "Complete all 27 New Testament books", icon: "bird", requirementType: "book_count", requirementValue: 27, isMajor: true, sortOrder: 3 },
  { id: "book_ot", category: "book", name: "Old Testament", description: "Complete all 39 Old Testament books", icon: "scroll", requirementType: "book_count", requirementValue: 39, isMajor: true, sortOrder: 4 },
  { id: "book_bible", category: "book", name: "The Whole Story", description: "Complete all 66 books of the Bible", icon: "book-heart", requirementType: "book_count", requirementValue: 66, isMajor: true, sortOrder: 5 },

  // Journey milestones
  { id: "journey_start", category: "journey", name: "Getting Started", description: "Begin your family Bible journey", icon: "sprout", requirementType: "session_count", requirementValue: 1, isMajor: false, sortOrder: 1 },
  { id: "journey_25", category: "journey", name: "Quarter Way", description: "Read 25% of the Bible together", icon: "circle-dot", requirementType: "bible_percent", requirementValue: 25, isMajor: false, sortOrder: 2 },
  { id: "journey_50", category: "journey", name: "Halfway There", description: "Read 50% of the Bible together", icon: "loader", requirementType: "bible_percent", requirementValue: 50, isMajor: true, sortOrder: 3 },
  { id: "journey_75", category: "journey", name: "Almost There", description: "Read 75% of the Bible together", icon: "circle-dot-dashed", requirementType: "bible_percent", requirementValue: 75, isMajor: true, sortOrder: 4 },
  { id: "journey_100", category: "journey", name: "Journey Complete", description: "Read the entire Bible as a family!", icon: "trophy", requirementType: "bible_percent", requirementValue: 100, isMajor: true, sortOrder: 5 },

  // Special achievements
  { id: "special_50_sessions", category: "special", name: "Bookworm", description: "Complete 50 reading sessions", icon: "book-open-check", requirementType: "session_count", requirementValue: 50, isMajor: false, sortOrder: 1 },
  { id: "special_100_sessions", category: "special", name: "Story Time", description: "Complete 100 reading sessions", icon: "library", requirementType: "session_count", requirementValue: 100, isMajor: true, sortOrder: 2 },
];

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  streak: "Streaks",
  book: "Books",
  journey: "Journey",
  special: "Special",
};

export const GOSPELS = ["Matthew", "Mark", "Luke", "John"];
export const OLD_TESTAMENT_COUNT = 39;
export const NEW_TESTAMENT_COUNT = 27;
export const TOTAL_BIBLE_BOOKS = 66;

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter((a) => a.category === category).sort((a, b) => a.sortOrder - b.sortOrder);
}
