import { addDays, isWeekend, isSameDay, parseISO } from "date-fns";
import type { Holiday } from "@/services/holidays.service";

/**
 * Calculates the delivery date by adding business days to a start date.
 * Skips weekends (Saturday, Sunday) and provided holidays.
 * 
 * @param startDate The starting date (typically OC date)
 * @param daysToAdd Number of business days to add (plazo de entrega)
 * @param holidays List of holidays to skip
 * @returns The calculated delivery date
 */
export function calculateBusinessDate(startDate: Date, daysToAdd: number, holidays: Holiday[]): Date {
    let currentDate = startDate;
    let daysAdded = 0;

    // Safety break to prevent infinite loops (e.g., if daysToAdd is huge)
    // 365 days is a reasonable upper bound for a "plazo delivery" check
    const MAX_ITERATIONS = daysToAdd * 5 + 365;
    let iterations = 0;

    while (daysAdded < daysToAdd) {
        iterations++;
        if (iterations > MAX_ITERATIONS) {
            console.warn("calculateBusinessDate exceeded max iterations");
            break;
        }

        // Move to next day
        currentDate = addDays(currentDate, 1);

        // Check if it's a weekend
        if (isWeekend(currentDate)) {
            continue;
        }

        // Check if it's a holiday
        // Formatting to YYYY-MM-DD for comparison with API format
        const dateString = currentDate.toISOString().split('T')[0];
        const isHoliday = holidays.some(h => h.date === dateString);

        if (isHoliday) {
            continue;
        }

        // If it's a business day, increment counter
        daysAdded++;
    }

    return currentDate;
}
