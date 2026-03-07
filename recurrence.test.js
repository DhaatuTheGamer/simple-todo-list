const { calculateNextDueDate, formatDateISO } = require('./recurrence');

describe('formatDateISO', () => {
    test('returns null for non-Date objects', () => {
        expect(formatDateISO(null)).toBeNull();
        expect(formatDateISO(undefined)).toBeNull();
        expect(formatDateISO('2023-10-01')).toBeNull();
        expect(formatDateISO(1696118400000)).toBeNull();
        expect(formatDateISO({})).toBeNull();
    });

    test('returns null for invalid Date objects', () => {
        expect(formatDateISO(new Date('invalid'))).toBeNull();
    });

    test('formats valid Date objects correctly', () => {
        expect(formatDateISO(new Date(2023, 9, 1))).toBe('2023-10-01'); // Note: month is 0-indexed in Date constructor
        expect(formatDateISO(new Date(2024, 11, 31))).toBe('2024-12-31');
        expect(formatDateISO(new Date(2000, 0, 5))).toBe('2000-01-05');
        expect(formatDateISO(new Date(1999, 10, 15))).toBe('1999-11-15');
    });
});

describe('calculateNextDueDate', () => {
    test('returns null for missing or "none" recurrence type', () => {
        expect(calculateNextDueDate('2023-10-01', null)).toBeNull();
        expect(calculateNextDueDate('2023-10-01', {})).toBeNull();
        expect(calculateNextDueDate('2023-10-01', { type: 'none' })).toBeNull();
    });

    test('returns null for invalid date string', () => {
        const rule = { type: 'daily' };
        expect(calculateNextDueDate('', rule)).toBeNull();
        expect(calculateNextDueDate('invalid-date', rule)).toBeNull();
        expect(calculateNextDueDate('2023-13-01', rule)).toBeNull(); // Invalid month
    });

    test('calculates daily recurrence correctly', () => {
        const rule = { type: 'daily' };
        expect(calculateNextDueDate('2023-10-01', rule)).toBe('2023-10-02');
        expect(calculateNextDueDate('2023-12-31', rule)).toBe('2024-01-01');
    });

    test('calculates weekly recurrence correctly (no days specified)', () => {
        const rule = { type: 'weekly' };
        expect(calculateNextDueDate('2023-10-01', rule)).toBe('2023-10-08');
    });

    test('calculates weekly recurrence correctly (with days specified)', () => {
        // 2023-10-01 is a Sunday (0)
        const rule = { type: 'weekly', daysOfWeek: [1, 3] }; // Monday (1), Wednesday (3)
        expect(calculateNextDueDate('2023-10-01', rule)).toBe('2023-10-02');

        // From Monday 2023-10-02, next is Wednesday 2023-10-04
        expect(calculateNextDueDate('2023-10-02', rule)).toBe('2023-10-04');

        // From Wednesday 2023-10-04, next is Monday 2023-10-09
        expect(calculateNextDueDate('2023-10-04', rule)).toBe('2023-10-09');
    });

    test('calculates monthly recurrence correctly', () => {
        const rule = { type: 'monthly' };
        expect(calculateNextDueDate('2023-10-01', rule)).toBe('2023-11-01');
        expect(calculateNextDueDate('2023-10-31', rule)).toBe('2023-11-30'); // Nov has only 30 days
        expect(calculateNextDueDate('2024-01-31', rule)).toBe('2024-02-29'); // Leap year
        expect(calculateNextDueDate('2023-01-31', rule)).toBe('2023-02-28'); // Non-leap year
    });

    test('calculates specific_days recurrence correctly', () => {
        // 2023-10-01 is a Sunday (0)
        const rule = { type: 'specific_days', daysOfWeek: [2, 4] }; // Tuesday (2), Thursday (4)
        expect(calculateNextDueDate('2023-10-01', rule)).toBe('2023-10-03');
        expect(calculateNextDueDate('2023-10-03', rule)).toBe('2023-10-05');
        expect(calculateNextDueDate('2023-10-05', rule)).toBe('2023-10-10');
    });

    test('returns null for specific_days without daysOfWeek', () => {
        expect(calculateNextDueDate('2023-10-01', { type: 'specific_days' })).toBeNull();
        expect(calculateNextDueDate('2023-10-01', { type: 'specific_days', daysOfWeek: [] })).toBeNull();
    });

    test('handles year rollover for daily recurrence', () => {
        const rule = { type: 'daily' };
        expect(calculateNextDueDate('2023-12-31', rule)).toBe('2024-01-01');
    });
});
