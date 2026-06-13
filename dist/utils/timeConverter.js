import { logger } from './logger.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);
/**
 * Validates if a date string/object is valid
 * @param date - Date input to validate
 * @returns boolean indicating validity
 */
const isValidDate = (date) => {
    return dayjs(date).isValid();
};
/**
 * Gets ordinal suffix for day numbers (1st, 2nd, 3rd, 4th, etc.)
 * Optimized algorithm for O(1) performance
 * @param day - Day number (1-31)
 * @returns Ordinal suffix string
 */
const getOrdinalSuffix = (day) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const value = day % 100;
    return suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
};
/**
 * Formats a date with ordinal day suffix in enterprise format
 * @param input - ISO date string, Date object, or dayjs instance
 * @param options - Formatting options
 * @returns Formatted date string or null if invalid
 * @example
 * formatCreatedAt("2023-04-18T13:22:43.115Z");
 * // returns "April 18th, 2023 1:22 PM"
 */
const formatCreatedAt = (input, options = {}) => {
    try {
        // Input validation
        if (!input)
            return null;
        const date = dayjs(input);
        if (!date.isValid())
            return null;
        // Apply timezone if specified
        const localDate = options.timezone ? date.tz(options.timezone) : date;
        // Extract components efficiently
        const day = localDate.date();
        const suffix = getOrdinalSuffix(day);
        const monthName = localDate.format('MMMM');
        const year = localDate.year();
        // Format time based on preferences
        const timeFormat = options.use24Hour ? 'HH:mm' : 'h:mm A';
        const time = localDate.format(timeFormat);
        return `${monthName} ${day}${suffix}, ${year} ${time}`;
    }
    catch (error) {
        // Enterprise error handling - log but don't throw
        logger.error('Date formatting error:', error);
        return null;
    }
};
/**
 * Advanced date formatter with multiple format options
 * @param input - Date input
 * @param options - Formatting options
 * @returns Formatted date string
 */
const formatDate = (input, options = {}) => {
    try {
        if (!input)
            return null;
        const date = dayjs(input);
        if (!date.isValid())
            return null;
        const localDate = options.timezone ? date.tz(options.timezone) : date;
        const formats = {
            short: 'MMM D, YYYY',
            medium: 'MMMM D, YYYY',
            long: 'dddd, MMMM D, YYYY',
            full: 'dddd, MMMM Do, YYYY [at] h:mm A'
        };
        return localDate.format(formats[options.format || 'medium']);
    }
    catch (error) {
        logger.error('Date formatting error:', error);
        return null;
    }
};
/**
 * Calculates relative time (e.g., "2 hours ago", "in 3 days")
 * @param input - Date input
 * @param baseDate - Base date to compare against (defaults to now)
 * @returns Relative time string
 */
const getRelativeTime = (input, baseDate) => {
    try {
        if (!input)
            return null;
        const date = dayjs(input);
        const base = baseDate ? dayjs(baseDate) : dayjs();
        if (!date.isValid() || !base.isValid())
            return null;
        return date.from(base);
    }
    catch (error) {
        logger.error('Relative time calculation error:', error);
        return null;
    }
};
/**
 * Utility for timezone conversion
 * @param input - Date input
 * @param fromTz - Source timezone
 * @param toTz - Target timezone
 * @returns Converted date or null if invalid
 */
const convertTimezone = (input, fromTz, toTz) => {
    try {
        if (!input)
            return null;
        const date = dayjs.tz(input, fromTz);
        return date.isValid() ? date.tz(toTz) : null;
    }
    catch (error) {
        logger.error('Timezone conversion error:', error);
        return null;
    }
};
// Enterprise exports with TypeScript support
export { formatCreatedAt, formatDate, getRelativeTime, convertTimezone, isValidDate, getOrdinalSuffix };
//# sourceMappingURL=timeConverter.js.map