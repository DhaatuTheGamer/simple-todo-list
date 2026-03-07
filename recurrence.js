/**
 * Date Formatting Helper
 * @param {Date} date
 * @returns {string|null} YYYY-MM-DD
 */
function formatDateISO(date) { // Ensures date is valid and returns YYYY-MM-DD
    if (!(date instanceof Date) || isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Recurrence Logic
 * @param {string} taskDateStr
 * @param {Object} recurrenceRule
 * @returns {string|null} Next due date in YYYY-MM-DD format
 */
function calculateNextDueDate(taskDateStr, recurrenceRule) {
    if (!taskDateStr || !recurrenceRule || !recurrenceRule.type || recurrenceRule.type === 'none') {
        return null;
    }
    const parts = taskDateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    const currentDate = new Date(year, month, day);
    if (isNaN(currentDate.getTime()) ||
        currentDate.getFullYear() !== year ||
        currentDate.getMonth() !== month ||
        currentDate.getDate() !== day) {
        return null;
    }

    let nextDate = new Date(currentDate.getTime());

    switch (recurrenceRule.type) {
        case 'daily':
            nextDate.setDate(currentDate.getDate() + 1);
            break;
        case 'weekly':
             // If specific days are set for weekly, find the next occurrence.
            if (recurrenceRule.daysOfWeek && Array.isArray(recurrenceRule.daysOfWeek) && recurrenceRule.daysOfWeek.length > 0) {
                const sortedRuleDays = [...recurrenceRule.daysOfWeek].sort((a, b) => a - b);
                // Start checking from the day AFTER the current due date
                nextDate.setDate(currentDate.getDate() + 1);

                for (let i = 0; i < 7; i++) { // Check next 7 days
                    let dayOfWeek = nextDate.getDay(); // 0 (Sun) - 6 (Sat)
                    if (sortedRuleDays.includes(dayOfWeek)) {
                        return formatDateISO(nextDate);
                    }
                    nextDate.setDate(nextDate.getDate() + 1);
                }
                // Fallback if no day found in next 7 days (e.g. rule changed, or date is far in future)
                // This part of the logic might need refinement if a selected day is >7 days away
                // For now, it will just find the next valid day in sequence.
                console.warn("Could not find next weekly day within 7 days. Defaulting to +7 days from original date.");
                nextDate = new Date(currentDate.getTime()); // Reset to original date
                nextDate.setDate(currentDate.getDate() + 7); // Fallback to simple +7 days
            } else { // Fallback if daysOfWeek is not set for weekly (treat as simple +7)
                nextDate.setDate(currentDate.getDate() + 7);
            }
            break;
        case 'monthly':
            const originalMonthDay = currentDate.getDate();
            nextDate.setDate(1);
            nextDate.setMonth(currentDate.getMonth() + 1);
            const daysInNextMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
            nextDate.setDate(Math.min(originalMonthDay, daysInNextMonth));
            break;
        case 'specific_days':
            if (!recurrenceRule.daysOfWeek || !Array.isArray(recurrenceRule.daysOfWeek) || recurrenceRule.daysOfWeek.length === 0) {
                console.warn("Invalid or empty daysOfWeek for 'specific_days' recurrence.");
                return null;
            }
            const sortedDays = [...recurrenceRule.daysOfWeek].sort((a, b) => a - b);
            let tempNextDate = new Date(currentDate.getTime());

            for (let i = 0; i < 366 ; i++) {
                tempNextDate.setDate(tempNextDate.getDate() + 1); // Increment first
                const dayOfWeek = tempNextDate.getDay();
                if (sortedDays.includes(dayOfWeek)) {
                    return formatDateISO(tempNextDate);
                }
            }
            console.warn("Could not find next specific day within a year for 'specific_days'.");
            return null;
        default:
            console.warn("Unknown recurrence type:", recurrenceRule.type);
            return null;
    }
    return formatDateISO(nextDate);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatDateISO,
        calculateNextDueDate
    };
}
