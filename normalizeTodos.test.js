// Mock global browser APIs before requiring the module
global.document = {
    getElementById: () => ({
        addEventListener: () => {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        querySelectorAll: () => [],
        querySelector: () => null
    }),
    querySelectorAll: () => [],
    addEventListener: () => {}
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};

const { normalizeTodos } = require('./script.js');

describe('normalizeTodos', () => {
    test('handles empty and null inputs', () => {
        expect(normalizeTodos([])).toEqual([]);
        expect(normalizeTodos(null)).toEqual([]);
        expect(normalizeTodos(undefined)).toEqual([]);
        expect(normalizeTodos({})).toEqual([]);
    });

    test('adds default values for missing fields', () => {
        const input = [{ text: 'My Task', id: 123 }];
        const output = normalizeTodos(input);

        expect(output.length).toBe(1);
        expect(output[0]).toEqual({
            text: 'My Task',
            completed: false,
            id: 123,
            starred: false,
            dueDate: null,
            priority: 2,
            parentId: null,
            level: 0,
            recurrence: null
        });
    });

    test('generates an ID if missing', () => {
        const input = [{ text: 'Task without ID' }];
        const output = normalizeTodos(input);

        expect(output.length).toBe(1);
        expect(output[0].id).toBeDefined();
        expect(typeof output[0].id).toBe('number');
    });

    test('replaces null/undefined text with "Untitled Task"', () => {
        const input = [
            { id: 1 }, // text is undefined
            { text: null, id: 2 } // text is null
        ];
        const output = normalizeTodos(input);

        expect(output.length).toBe(2);
        expect(output[0].text).toBe('Untitled Task');
        expect(output[1].text).toBe('Untitled Task');
    });

    test('filters out items with invalid text type', () => {
        const input = [
            { text: 'Valid task', id: 1 },
            { text: 123, id: 2 }, // text is a number
            { text: {}, id: 3 }, // text is an object
            { text: [], id: 4 } // text is an array
        ];
        const output = normalizeTodos(input);

        expect(output.length).toBe(1);
        expect(output[0].id).toBe(1);
    });

    test('retains valid existing fields', () => {
        const input = [{
            text: 'Existing Task',
            completed: true,
            id: 456,
            starred: true,
            dueDate: '2023-12-31',
            priority: 3,
            parentId: 123,
            level: 1,
            recurrence: { type: 'daily' },
            extraField: 'should be removed' // Should not be in output
        }];
        const output = normalizeTodos(input);

        expect(output.length).toBe(1);
        expect(output[0]).toEqual({
            text: 'Existing Task',
            completed: true,
            id: 456,
            starred: true,
            dueDate: '2023-12-31',
            priority: 3,
            parentId: 123,
            level: 1,
            recurrence: { type: 'daily' }
        });
        expect(output[0].extraField).toBeUndefined(); // Verifies exact structural matching
    });

    test('filters out items missing an id after normalization', () => {
        // Because id ?? Date.now() falls back to Date.now() when id is null/undefined
        // The .filter(todo => todo.id) filters out falsy values like 0 or empty string.
        const input = [
            { text: 'Task with id 0', id: 0 },
            { text: 'Task with empty string id', id: '' }
        ];
        const output = normalizeTodos(input);

        // They evaluate to falsy ids after mapping, so they get filtered out.
        expect(output.length).toBe(0);
    });
});