const { sortTasksLogic } = require('./sort');

describe('sortTasksLogic', () => {
    describe('dueDateAsc', () => {
        test('sorts by dueDate ascending', () => {
            const a = { dueDate: '2023-10-01' };
            const b = { dueDate: '2023-10-02' };
            expect(sortTasksLogic(a, b, 'dueDateAsc')).toBeLessThan(0);
            expect(sortTasksLogic(b, a, 'dueDateAsc')).toBeGreaterThan(0);
        });

        test('returns 0 for equal dueDates', () => {
            const a = { dueDate: '2023-10-01' };
            const b = { dueDate: '2023-10-01' };
            expect(sortTasksLogic(a, b, 'dueDateAsc')).toBe(0);
        });

        test('places tasks without dueDate at the end', () => {
            const a = { dueDate: '2023-10-01' };
            const b = { dueDate: null };
            expect(sortTasksLogic(a, b, 'dueDateAsc')).toBeLessThan(0);
            expect(sortTasksLogic(b, a, 'dueDateAsc')).toBeGreaterThan(0);
        });

        test('returns 0 if both lack dueDate', () => {
            const a = { dueDate: null };
            const b = { dueDate: undefined };
            expect(sortTasksLogic(a, b, 'dueDateAsc')).toBe(0);
        });
    });

    describe('dueDateDesc', () => {
        test('sorts by dueDate descending', () => {
            const a = { dueDate: '2023-10-01' };
            const b = { dueDate: '2023-10-02' };
            expect(sortTasksLogic(a, b, 'dueDateDesc')).toBeGreaterThan(0);
            expect(sortTasksLogic(b, a, 'dueDateDesc')).toBeLessThan(0);
        });

        test('returns 0 for equal dueDates', () => {
            const a = { dueDate: '2023-10-01' };
            const b = { dueDate: '2023-10-01' };
            expect(sortTasksLogic(a, b, 'dueDateDesc')).toBe(0);
        });

        test('places tasks without dueDate at the end', () => {
            const a = { dueDate: '2023-10-01' };
            const b = { dueDate: null };
            expect(sortTasksLogic(a, b, 'dueDateDesc')).toBeLessThan(0);
            expect(sortTasksLogic(b, a, 'dueDateDesc')).toBeGreaterThan(0);
        });

        test('returns 0 if both lack dueDate', () => {
            const a = { dueDate: null };
            const b = { dueDate: undefined };
            expect(sortTasksLogic(a, b, 'dueDateDesc')).toBe(0);
        });
    });
    describe('priorityDesc', () => {
        test('sorts by priority descending (high to low)', () => {
            const a = { priority: 3 }; // High
            const b = { priority: 1 }; // Low
            expect(sortTasksLogic(a, b, 'priorityDesc')).toBeLessThan(0);
            expect(sortTasksLogic(b, a, 'priorityDesc')).toBeGreaterThan(0);
        });

        test('returns 0 for equal priority', () => {
            const a = { priority: 2 };
            const b = { priority: 2 };
            expect(sortTasksLogic(a, b, 'priorityDesc')).toBe(0);
        });

        test('handles missing priority gracefully (treats as 0)', () => {
            const a = { priority: 1 };
            const b = {};
            expect(sortTasksLogic(a, b, 'priorityDesc')).toBeLessThan(0);
            expect(sortTasksLogic(b, a, 'priorityDesc')).toBeGreaterThan(0);
        });
    });

    describe('priorityAsc', () => {
        test('sorts by priority ascending (low to high)', () => {
            const a = { priority: 3 }; // High
            const b = { priority: 1 }; // Low
            expect(sortTasksLogic(a, b, 'priorityAsc')).toBeGreaterThan(0);
            expect(sortTasksLogic(b, a, 'priorityAsc')).toBeLessThan(0);
        });

        test('returns 0 for equal priority', () => {
            const a = { priority: 2 };
            const b = { priority: 2 };
            expect(sortTasksLogic(a, b, 'priorityAsc')).toBe(0);
        });

        test('handles missing priority gracefully (treats as 0)', () => {
            const a = { priority: 1 };
            const b = {};
            expect(sortTasksLogic(a, b, 'priorityAsc')).toBeGreaterThan(0);
            expect(sortTasksLogic(b, a, 'priorityAsc')).toBeLessThan(0);
        });
    });

    describe('nameAZ', () => {
        test('sorts by text A-Z, ignoring case', () => {
            const a = { text: 'Apple' };
            const b = { text: 'banana' };
            expect(sortTasksLogic(a, b, 'nameAZ')).toBeLessThan(0);
            expect(sortTasksLogic(b, a, 'nameAZ')).toBeGreaterThan(0);
        });

        test('returns 0 for identical text', () => {
            const a = { text: 'Apple' };
            const b = { text: 'apple' };
            expect(sortTasksLogic(a, b, 'nameAZ')).toBe(0);
        });

        test('handles missing text gracefully', () => {
            const a = { text: 'Apple' };
            const b = {};
            expect(sortTasksLogic(a, b, 'nameAZ')).toBeGreaterThan(0);
            expect(sortTasksLogic(b, a, 'nameAZ')).toBeLessThan(0);
        });
    });

    describe('nameZA', () => {
        test('sorts by text Z-A, ignoring case', () => {
            const a = { text: 'Apple' };
            const b = { text: 'banana' };
            expect(sortTasksLogic(a, b, 'nameZA')).toBeGreaterThan(0);
            expect(sortTasksLogic(b, a, 'nameZA')).toBeLessThan(0);
        });

        test('returns 0 for identical text', () => {
            const a = { text: 'Apple' };
            const b = { text: 'apple' };
            expect(sortTasksLogic(a, b, 'nameZA')).toBe(0);
        });

        test('handles missing text gracefully', () => {
            const a = { text: 'Apple' };
            const b = {};
            expect(sortTasksLogic(a, b, 'nameZA')).toBeLessThan(0);
            expect(sortTasksLogic(b, a, 'nameZA')).toBeGreaterThan(0);
        });
    });

    describe('default', () => {
        test('returns 0 for unknown sort order', () => {
            const a = { text: 'A', priority: 1, dueDate: '2023-01-01' };
            const b = { text: 'B', priority: 2, dueDate: '2023-01-02' };
            expect(sortTasksLogic(a, b, 'default')).toBe(0);
            expect(sortTasksLogic(a, b, 'unknownOrder')).toBe(0);
        });
    });
});
