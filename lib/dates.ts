/**
 * Date utilities for Daily Bread
 *
 * These functions handle date formatting and timezone conversions
 * to ensure consistent date handling across client and server.
 */

/**
 * Get the user's local date in ISO 8601 format (YYYY-MM-DD)
 *
 * We use the 'en-CA' (Canadian English) locale with toLocaleDateString
 * because it is one of the few locales that formats dates as YYYY-MM-DD—
 * the ISO 8601 format. This lets us get a consistent string we can safely
 * store and query in PostgreSQL, matching its DATE type.
 * Importantly, by not specifying the time or timezone and relying on the
 * user's device, we truly get the user's perception of "today" for things
 * like streak and progress tracking, regardless of where our server runs.
 *
 * @returns Date string in YYYY-MM-DD format (e.g., "2024-01-15")
 *
 * @example
 * const today = getLocalDateISO();
 * // Returns: "2024-01-15" (user's local date)
 */
export function getLocalDateISO(): string {
  // 'en-CA' outputs YYYY-MM-DD (ISO 8601); e.g., "2024-01-15"
  // This avoids accidental U.S./EU order like MM/DD/YYYY or DD/MM/YYYY.
  return new Date().toLocaleDateString('en-CA');
}
