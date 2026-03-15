const fs = require('fs');
const path = require('path');

// Mock DOM elements and localStorage before requiring the script
global.document = {
    getElementById: jest.fn().mockReturnValue({
        addEventListener: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() },
        appendChild: jest.fn(),
        after: jest.fn()
    }),
    querySelectorAll: jest.fn().mockReturnValue([]),
    addEventListener: jest.fn(),
    createElement: jest.fn().mockReturnValue({
        classList: { add: jest.fn(), remove: jest.fn() },
        appendChild: jest.fn(),
        setAttribute: jest.fn(),
        dataset: {}
    }),
    documentElement: { classList: { toggle: jest.fn() } }
};

global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn()
};

const {
    normalizeTodos,
    buildHierarchicalTaskArray,
    sortTasksLogic,
    getRecurrenceSummary,
    _setCurrentSortOrder,
    _setTodos
} = require('./script.js');

describe('script.js logic functions', () => {

    describe('normalizeTodos', () => {
        it('should handle undefined or null input', () => {
            expect(normalizeTodos(null)).toEqual([]);
            expect(normalizeTodos(undefined)).toEqual([]);
        });

        it('should assign default values for missing properties', () => {
            const input = [{ id: 1, text: 'Test task' }];
            const result = normalizeTodos(input);
            expect(result[0]).toEqual(expect.objectContaining({
                id: 1,
                text: 'Test task',
                completed: false,
                starred: false,
                dueDate: null,
                priority: 2,
                parentId: null,
                level: 0,
                recurrence: null
            }));
        });

        it('should assign an id if missing', () => {
            const input = [{ text: 'Missing id' }];
            const result = normalizeTodos(input);
            expect(result.length).toBe(1);
            expect(result[0].id).toBeDefined();
        });

        it('should filter out tasks where text is not a string', () => {
            const input = [
                { id: 1, text: 'Valid task' },
                { id: 2, text: 123 }, // Text is not string
            ];
            const result = normalizeTodos(input);
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(1);
        });
    });

    describe('buildHierarchicalTaskArray', () => {
        beforeEach(() => {
            _setCurrentSortOrder('default');
        });

        it('should build hierarchy correctly for a flat list', () => {
            const tasks = [
                { id: 1, text: 'Task 1', parentId: null },
                { id: 2, text: 'Task 2', parentId: null }
            ];
            const result = buildHierarchicalTaskArray(tasks);
            expect(result.length).toBe(2);
            expect(result[0].level).toBe(0);
            expect(result[1].level).toBe(0);
        });

        it('should build nested hierarchy correctly', () => {
            const tasks = [
                { id: 1, text: 'Parent', parentId: null },
                { id: 2, text: 'Child 1', parentId: 1 },
                { id: 3, text: 'Child 2', parentId: 1 },
                { id: 4, text: 'Grandchild', parentId: 2 },
                { id: 5, text: 'Other Parent', parentId: null }
            ];
            const result = buildHierarchicalTaskArray(tasks);
            expect(result.length).toBe(5);

            // Order should be Parent, Child 1, Grandchild, Child 2, Other Parent
            expect(result[0].id).toBe(1); // Parent
            expect(result[0].level).toBe(0);

            expect(result[1].id).toBe(2); // Child 1
            expect(result[1].level).toBe(1);

            expect(result[2].id).toBe(4); // Grandchild
            expect(result[2].level).toBe(2);

            expect(result[3].id).toBe(3); // Child 2
            expect(result[3].level).toBe(1);

            expect(result[4].id).toBe(5); // Other Parent
            expect(result[4].level).toBe(0);
        });
    });

    describe('sortTasksLogic', () => {
        const taskA = { id: 1, text: 'Apple', _lowerText: 'apple', priority: 1, dueDate: '2023-10-02' };
        const taskB = { id: 2, text: 'Banana', _lowerText: 'banana', priority: 3, dueDate: '2023-10-01' };
        const taskC = { id: 3, text: 'Cherry', _lowerText: 'cherry', priority: 2, dueDate: null };
        const taskD = { id: 4, text: 'Date', _lowerText: 'date', priority: null, dueDate: '2023-10-03' };

        it('should sort by name A-Z', () => {
            _setCurrentSortOrder('nameAZ');
            const sorted = [taskB, taskA, taskC].sort(sortTasksLogic);
            expect(sorted[0].id).toBe(1); // Apple
            expect(sorted[1].id).toBe(2); // Banana
            expect(sorted[2].id).toBe(3); // Cherry
        });

        it('should sort by name Z-A', () => {
            _setCurrentSortOrder('nameZA');
            const sorted = [taskB, taskA, taskC].sort(sortTasksLogic);
            expect(sorted[0].id).toBe(3); // Cherry
            expect(sorted[1].id).toBe(2); // Banana
            expect(sorted[2].id).toBe(1); // Apple
        });

        it('should sort by priority Desc (High to Low)', () => {
            _setCurrentSortOrder('priorityDesc');
            const sorted = [taskA, taskB, taskC, taskD].sort(sortTasksLogic);
            expect(sorted[0].id).toBe(2); // Banana (3)
            expect(sorted[1].id).toBe(3); // Cherry (2)
            expect(sorted[2].id).toBe(1); // Apple (1)
            expect(sorted[3].id).toBe(4); // Date (0/null)
        });

        it('should sort by priority Asc (Low to High)', () => {
            _setCurrentSortOrder('priorityAsc');
            const sorted = [taskB, taskA, taskC, taskD].sort(sortTasksLogic);
            expect(sorted[0].id).toBe(4); // Date (0/null)
            expect(sorted[1].id).toBe(1); // Apple (1)
            expect(sorted[2].id).toBe(3); // Cherry (2)
            expect(sorted[3].id).toBe(2); // Banana (3)
        });

        it('should sort by due date Asc (Oldest first)', () => {
            _setCurrentSortOrder('dueDateAsc');
            const sorted = [taskA, taskB, taskC, taskD].sort(sortTasksLogic);
            expect(sorted[0].id).toBe(2); // Banana 10-01
            expect(sorted[1].id).toBe(1); // Apple 10-02
            expect(sorted[2].id).toBe(4); // Date 10-03
            expect(sorted[3].id).toBe(3); // Cherry (null) - nulls typically go to the end
        });

        it('should sort by due date Desc (Newest first)', () => {
            _setCurrentSortOrder('dueDateDesc');
            const sorted = [taskA, taskB, taskC, taskD].sort(sortTasksLogic);
            expect(sorted[0].id).toBe(4); // Date 10-03
            expect(sorted[1].id).toBe(1); // Apple 10-02
            expect(sorted[2].id).toBe(2); // Banana 10-01
            expect(sorted[3].id).toBe(3); // Cherry (null)
        });
    });

    describe('getRecurrenceSummary', () => {
        it('should return empty string for none or missing', () => {
            expect(getRecurrenceSummary(null)).toBe('');
            expect(getRecurrenceSummary({ type: 'none' })).toBe('');
        });

        it('should handle daily recurrence', () => {
            expect(getRecurrenceSummary({ type: 'daily' })).toBe('Recurs daily');
        });

        it('should handle monthly recurrence', () => {
            expect(getRecurrenceSummary({ type: 'monthly' })).toBe('Recurs monthly');
        });

        it('should handle weekly or specific_days with daysOfWeek', () => {
            expect(getRecurrenceSummary({ type: 'weekly', daysOfWeek: [1, 3, 5] })).toBe('Recurs weekly on Mon, Wed, Fri');
            expect(getRecurrenceSummary({ type: 'specific_days', daysOfWeek: [0, 6] })).toBe('Recurs specific_days on Sun, Sat');
        });

        it('should handle weekly or specific_days without daysOfWeek', () => {
            expect(getRecurrenceSummary({ type: 'weekly', daysOfWeek: [] })).toBe('Recurs weekly (no days selected)');
            expect(getRecurrenceSummary({ type: 'specific_days' })).toBe('Recurs specific_days (no days selected)');
        });
    });
});
