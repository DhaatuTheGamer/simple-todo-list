const { calculateNextDueDate } = require('./recurrence');

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        console.error(`FAILED: ${message}`);
        console.error(`  Expected: ${expected}`);
        console.error(`  Actual:   ${actual}`);
        process.exit(1);
    } else {
        console.log(`PASSED: ${message}`);
    }
}

console.log('Running tests for calculateNextDueDate...');

// --- 1. Basic / Input Validation ---
assertEqual(calculateNextDueDate(null, { type: 'daily' }), null, 'null for null date string');
assertEqual(calculateNextDueDate('2023-10-01', null), null, 'null for null recurrenceRule');
assertEqual(calculateNextDueDate('2023-10-01', {}), null, 'null for empty recurrenceRule');
assertEqual(calculateNextDueDate('2023-10-01', { type: 'none' }), null, 'null for "none" recurrence type');
assertEqual(calculateNextDueDate('', { type: 'daily' }), null, 'null for empty date string');
assertEqual(calculateNextDueDate('invalid-date', { type: 'daily' }), null, 'null for invalid date string format');
assertEqual(calculateNextDueDate('2023-13-01', { type: 'daily' }), null, 'null for invalid month (13)');
assertEqual(calculateNextDueDate('2023-10-32', { type: 'daily' }), null, 'null for invalid day (32)');
assertEqual(calculateNextDueDate('abc-10-01', { type: 'daily' }), null, 'null for invalid year string');

// --- 2. Daily Recurrence ---
assertEqual(calculateNextDueDate('2023-10-01', { type: 'daily' }), '2023-10-02', 'Daily: next day');
assertEqual(calculateNextDueDate('2023-10-31', { type: 'daily' }), '2023-11-01', 'Daily: month rollover');
assertEqual(calculateNextDueDate('2023-12-31', { type: 'daily' }), '2024-01-01', 'Daily: year rollover');
assertEqual(calculateNextDueDate('2024-02-28', { type: 'daily' }), '2024-02-29', 'Daily: leap year Feb 28 to 29');
assertEqual(calculateNextDueDate('2023-02-28', { type: 'daily' }), '2023-03-01', 'Daily: non-leap year Feb 28 to Mar 1');

// --- 3. Weekly Recurrence (Simple - no days specified) ---
assertEqual(calculateNextDueDate('2023-10-01', { type: 'weekly' }), '2023-10-08', 'Weekly (simple): +7 days');
assertEqual(calculateNextDueDate('2023-12-28', { type: 'weekly' }), '2024-01-04', 'Weekly (simple): year rollover');

// --- 4. Weekly Recurrence (With days specified) ---
// 2023-10-01 is Sunday (0)
const weeklyRule = { type: 'weekly', daysOfWeek: [1, 3] }; // Mon, Wed
assertEqual(calculateNextDueDate('2023-10-01', weeklyRule), '2023-10-02', 'Weekly (Mon,Wed): From Sun to Mon');
assertEqual(calculateNextDueDate('2023-10-02', weeklyRule), '2023-10-04', 'Weekly (Mon,Wed): From Mon to Wed');
assertEqual(calculateNextDueDate('2023-10-04', weeklyRule), '2023-10-09', 'Weekly (Mon,Wed): From Wed to next Mon');

const weekendRule = { type: 'weekly', daysOfWeek: [0, 6] }; // Sun, Sat
assertEqual(calculateNextDueDate('2023-10-01', weekendRule), '2023-10-07', 'Weekly (Sun,Sat): From Sun to Sat');
assertEqual(calculateNextDueDate('2023-10-07', weekendRule), '2023-10-08', 'Weekly (Sun,Sat): From Sat to Sun');

// --- 5. Monthly Recurrence ---
assertEqual(calculateNextDueDate('2023-10-01', { type: 'monthly' }), '2023-11-01', 'Monthly: normal case');
assertEqual(calculateNextDueDate('2023-10-31', { type: 'monthly' }), '2023-11-30', 'Monthly: end of month adjustment (31 to 30)');
assertEqual(calculateNextDueDate('2024-01-31', { type: 'monthly' }), '2024-02-29', 'Monthly: leap year adjustment');
assertEqual(calculateNextDueDate('2023-01-31', { type: 'monthly' }), '2023-02-28', 'Monthly: non-leap year adjustment');
assertEqual(calculateNextDueDate('2023-12-15', { type: 'monthly' }), '2024-01-15', 'Monthly: year rollover');

// --- 6. Specific Days Recurrence ---
// 2023-10-01 is Sunday (0)
const specificDaysRule = { type: 'specific_days', daysOfWeek: [2, 4] }; // Tue, Thu
assertEqual(calculateNextDueDate('2023-10-01', specificDaysRule), '2023-10-03', 'SpecificDays (Tue,Thu): From Sun to Tue');
assertEqual(calculateNextDueDate('2023-10-03', specificDaysRule), '2023-10-05', 'SpecificDays (Tue,Thu): From Tue to Thu');
assertEqual(calculateNextDueDate('2023-10-05', specificDaysRule), '2023-10-10', 'SpecificDays (Tue,Thu): From Thu to next Tue');

assertEqual(calculateNextDueDate('2023-10-01', { type: 'specific_days', daysOfWeek: [] }), null, 'SpecificDays: null for empty daysOfWeek');
assertEqual(calculateNextDueDate('2023-10-01', { type: 'specific_days' }), null, 'SpecificDays: null for missing daysOfWeek');

// --- 7. Edge Cases & Purity ---
assertEqual(calculateNextDueDate('2023-10-01', { type: 'yearly' }), null, 'Unknown recurrence type: yearly');
assertEqual(calculateNextDueDate('2023-10-01', { type: 'weekly', daysOfWeek: [9] }), '2023-10-08', 'Weekly fallback when day is not found within 7 days');
assertEqual(calculateNextDueDate('2023-10-01', { type: 'specific_days', daysOfWeek: [9] }), null, 'Specific days fallback when day is not found within a year');

const originalRule = { type: 'daily' };
const originalRuleStr = JSON.stringify(originalRule);
calculateNextDueDate('2023-10-01', originalRule);
assertEqual(JSON.stringify(originalRule), originalRuleStr, 'Function should not mutate the recurrenceRule object');

console.log('\nAll tests passed successfully!');
