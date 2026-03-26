import dayjs from 'dayjs';
/**
 * Enterprise-grade date formatting utilities using Day.js
 * Optimized for performance, type safety, and internationalization
 */
interface TimeFormatOptions {
    timezone?: string;
    locale?: string;
    includeSeconds?: boolean;
    use24Hour?: boolean;
}
interface DateFormatOptions {
    format?: 'short' | 'medium' | 'long' | 'full';
    timezone?: string;
    locale?: string;
}
/**
 * Validates if a date string/object is valid
 * @param date - Date input to validate
 * @returns boolean indicating validity
 */
declare const isValidDate: (date: string | Date | dayjs.Dayjs) => boolean;
/**
 * Gets ordinal suffix for day numbers (1st, 2nd, 3rd, 4th, etc.)
 * Optimized algorithm for O(1) performance
 * @param day - Day number (1-31)
 * @returns Ordinal suffix string
 */
declare const getOrdinalSuffix: (day: number) => string;
/**
 * Formats a date with ordinal day suffix in enterprise format
 * @param input - ISO date string, Date object, or dayjs instance
 * @param options - Formatting options
 * @returns Formatted date string or null if invalid
 * @example
 * formatCreatedAt("2023-04-18T13:22:43.115Z");
 * // returns "April 18th, 2023 1:22 PM"
 */
declare const formatCreatedAt: (input: string | Date | dayjs.Dayjs, options?: TimeFormatOptions) => string | null;
/**
 * Advanced date formatter with multiple format options
 * @param input - Date input
 * @param options - Formatting options
 * @returns Formatted date string
 */
declare const formatDate: (input: string | Date | dayjs.Dayjs, options?: DateFormatOptions) => string | null;
/**
 * Calculates relative time (e.g., "2 hours ago", "in 3 days")
 * @param input - Date input
 * @param baseDate - Base date to compare against (defaults to now)
 * @returns Relative time string
 */
declare const getRelativeTime: (input: string | Date | dayjs.Dayjs, baseDate?: string | Date | dayjs.Dayjs) => string | null;
/**
 * Utility for timezone conversion
 * @param input - Date input
 * @param fromTz - Source timezone
 * @param toTz - Target timezone
 * @returns Converted date or null if invalid
 */
declare const convertTimezone: (input: string | Date | dayjs.Dayjs, fromTz: string, toTz: string) => dayjs.Dayjs | null;
export { formatCreatedAt, formatDate, getRelativeTime, convertTimezone, isValidDate, getOrdinalSuffix };
export type { TimeFormatOptions, DateFormatOptions };
//# sourceMappingURL=timeConverter.d.ts.map