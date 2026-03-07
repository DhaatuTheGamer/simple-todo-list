const assert = require('assert');
const { calculateNextDueDate } = require('./recurrence');

function runTests() {
    console.log("Running recurrence tests...");
    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        } catch (e) {
            console.error(`❌ FAIL: ${name}`);
            console.error(e.message);
            failed++;
        }
    }

    // --- Null / None Returns ---
    test('Returns null for missing taskDateStr', () => {
        assert.strictEqual(calculateNextDueDate(null, { type: 'daily' }), null);
    });

    test('Returns null for missing recurrenceRule', () => {
        assert.strictEqual(calculateNextDueDate('2023-10-01', null), null);
    });

    test('Returns null for missing recurrenceRule type', () => {
        assert.strictEqual(calculateNextDueDate('2023-10-01', {}), null);
    });

    test('Returns null for type "none"', () => {
        assert.strictEqual(calculateNextDueDate('2023-10-01', { type: 'none' }), null);
    });

    // --- Invalid / Malformed Date Strings ---
    test('Returns null for malformed date string (not enough parts)', () => {
        assert.strictEqual(calculateNextDueDate('2023-10', { type: 'daily' }), null);
    });

    test('Returns null for malformed date string (invalid characters)', () => {
        assert.strictEqual(calculateNextDueDate('2023-xx-01', { type: 'daily' }), null);
    });

    // --- Daily Recurrence ---
    test('Calculates next daily due date correctly', () => {
        assert.strictEqual(calculateNextDueDate('2023-10-01', { type: 'daily' }), '2023-10-02');
    });

    test('Calculates next daily due date across month boundary', () => {
        assert.strictEqual(calculateNextDueDate('2023-10-31', { type: 'daily' }), '2023-11-01');
    });

    test('Calculates next daily due date across leap year boundary', () => {
        assert.strictEqual(calculateNextDueDate('2024-02-28', { type: 'daily' }), '2024-02-29');
    });

    test('Calculates next daily due date across year boundary', () => {
        assert.strictEqual(calculateNextDueDate('2023-12-31', { type: 'daily' }), '2024-01-01');
    });

    // --- Weekly Recurrence ---
    test('Calculates next weekly due date correctly (simple +7 days)', () => {
        assert.strictEqual(calculateNextDueDate('2023-10-01', { type: 'weekly' }), '2023-10-08');
    });

    test('Calculates next weekly due date correctly (with daysOfWeek, same week)', () => {
        // 2023-10-01 is a Sunday (0). Rule says Tuesday (2) and Thursday (4). Next should be Tuesday (2023-10-03).
        assert.strictEqual(calculateNextDueDate('2023-10-01', { type: 'weekly', daysOfWeek: [2, 4] }), '2023-10-03');
    });

    test('Calculates next weekly due date correctly (with daysOfWeek, next week)', () => {
        // 2023-10-05 is a Thursday (4). Rule says Tuesday (2) and Thursday (4). Next should be Tuesday (2023-10-10).
        assert.strictEqual(calculateNextDueDate('2023-10-05', { type: 'weekly', daysOfWeek: [2, 4] }), '2023-10-10');
    });

    test('Calculates next weekly due date correctly (fallback to +7 if no days in next 7 days - though unlikely to happen if rules are valid)', () => {
        // Forcing fallback by not matching any day.
        assert.strictEqual(calculateNextDueDate('2023-10-01', { type: 'weekly', daysOfWeek: [8] }), '2023-10-08');
    });

    // --- Monthly Recurrence ---
    test('Calculates next monthly due date correctly (standard)', () => {
        assert.strictEqual(calculateNextDueDate('2023-10-15', { type: 'monthly' }), '2023-11-15');
    });

    test('Calculates next monthly due date correctly (end of month, target month has fewer days)', () => {
        // Oct 31 -> Nov 30
        assert.strictEqual(calculateNextDueDate('2023-10-31', { type: 'monthly' }), '2023-11-30');
    });

    test('Calculates next monthly due date correctly (leap year Feb)', () => {
        // Jan 31 -> Feb 29 (2024 is leap year)
        assert.strictEqual(calculateNextDueDate('2024-01-31', { type: 'monthly' }), '2024-02-29');
    });

    test('Calculates next monthly due date correctly (non-leap year Feb)', () => {
        // Jan 31 -> Feb 28 (2023 is non-leap year)
        assert.strictEqual(calculateNextDueDate('2023-01-31', { type: 'monthly' }), '2023-02-28');
    });

    // --- Specific Days Recurrence ---
    test('Calculates next specific_days due date correctly', () => {
        // 2023-10-01 is Sunday (0). Rule is Monday (1) and Wednesday (3). Next is 2023-10-02
        assert.strictEqual(calculateNextDueDate('2023-10-01', { type: 'specific_days', daysOfWeek: [1, 3] }), '2023-10-02');
    });

    test('Returns null for specific_days with missing daysOfWeek', () => {
        assert.strictEqual(calculateNextDueDate('2023-10-01', { type: 'specific_days' }), null);
    });

    test('Returns null for specific_days with empty daysOfWeek', () => {
        assert.strictEqual(calculateNextDueDate('2023-10-01', { type: 'specific_days', daysOfWeek: [] }), null);
    });

    // --- Unknown Type ---
    test('Returns null for unknown recurrence type', () => {
        assert.strictEqual(calculateNextDueDate('2023-10-01', { type: 'yearly' }), null);
    });

    console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
