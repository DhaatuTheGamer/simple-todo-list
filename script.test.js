const fs = require('fs');
const path = require('path');

describe('updateTodoInStorage', () => {
    let updateTodoInStorage;
    let getTodosFromStorageMock;
    let saveTodosToStorageMock;
    let originalConsoleWarn;

    beforeEach(() => {
        jest.resetModules();

        global.document = {
            addEventListener: jest.fn(),
            getElementById: jest.fn(() => ({
                addEventListener: jest.fn(),
                classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn() },
                value: '',
                innerHTML: '',
                appendChild: jest.fn(),
                querySelector: jest.fn(),
                querySelectorAll: jest.fn(() => []),
                style: {}
            })),
            querySelectorAll: jest.fn(() => []),
            createElement: jest.fn(() => ({
                classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn(), contains: jest.fn() },
                setAttribute: jest.fn(),
                appendChild: jest.fn(),
                style: {},
                querySelector: jest.fn()
            }))
        };
        global.window = {
            matchMedia: jest.fn(() => ({ matches: false, addEventListener: jest.fn() }))
        };
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn()
        };

        getTodosFromStorageMock = jest.fn();
        saveTodosToStorageMock = jest.fn();

        originalConsoleWarn = console.warn;
        console.warn = jest.fn();

        const scriptCode = fs.readFileSync(path.resolve(__dirname, 'script.js'), 'utf8');

        const wrapper = `
            let window = global.window;
            let document = global.document;
            let localStorage = global.localStorage;

            ${scriptCode}

            getTodosFromStorage = __getTodosMock;
            saveTodosToStorage = __saveTodosMock;

            return {
                updateTodoInStorage: updateTodoInStorage
            };
        `;

        const extracted = new Function('__getTodosMock', '__saveTodosMock', wrapper)(
            getTodosFromStorageMock,
            saveTodosToStorageMock
        );
        updateTodoInStorage = extracted.updateTodoInStorage;
    });

    afterEach(() => {
        console.warn = originalConsoleWarn;
        delete global.document;
        delete global.window;
        delete global.localStorage;
    });

    it('updates a property of an existing todo and saves it', () => {
        const todos = [
            { id: 1, text: 'Task 1', completed: false },
            { id: 2, text: 'Task 2', completed: false }
        ];
        getTodosFromStorageMock.mockReturnValue(todos);

        updateTodoInStorage(1, { completed: true });

        expect(getTodosFromStorageMock).toHaveBeenCalledTimes(1);
        expect(saveTodosToStorageMock).toHaveBeenCalledTimes(1);
        expect(saveTodosToStorageMock).toHaveBeenCalledWith([
            { id: 1, text: 'Task 1', completed: true },
            { id: 2, text: 'Task 2', completed: false }
        ]);
        expect(console.warn).not.toHaveBeenCalled();
    });

    it('logs a warning when the todo is not found in storage', () => {
        const todos = [
            { id: 2, text: 'Task 2', completed: false }
        ];
        getTodosFromStorageMock.mockReturnValue(todos);

        updateTodoInStorage(1, { completed: true });

        expect(getTodosFromStorageMock).toHaveBeenCalledTimes(1);
        expect(saveTodosToStorageMock).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith("Update failed: Todo not found in storage:", 1);
    });

    it('updates multiple properties of an existing todo', () => {
        const todos = [
            { id: 1, text: 'Task 1', completed: false, priority: 2 }
        ];
        getTodosFromStorageMock.mockReturnValue(todos);

        updateTodoInStorage(1, { text: 'Updated Task', priority: 1 });

        expect(getTodosFromStorageMock).toHaveBeenCalledTimes(1);
        expect(saveTodosToStorageMock).toHaveBeenCalledTimes(1);
        expect(saveTodosToStorageMock).toHaveBeenCalledWith([
            { id: 1, text: 'Updated Task', completed: false, priority: 1 }
        ]);
        expect(console.warn).not.toHaveBeenCalled();
    });

    it('does not mutate the original todos array elements that are unchanged', () => {
        const todo1 = { id: 1, text: 'Task 1', completed: false };
        const todo2 = { id: 2, text: 'Task 2', completed: false };
        const todos = [todo1, todo2];

        getTodosFromStorageMock.mockReturnValue(todos);

        updateTodoInStorage(1, { completed: true });

        expect(saveTodosToStorageMock).toHaveBeenCalledTimes(1);
        const updatedTodos = saveTodosToStorageMock.mock.calls[0][0];

        // Ensure the second todo object reference is identical
        expect(updatedTodos[1]).toBe(todo2);

        // Ensure the first todo object reference is different (new object)
        expect(updatedTodos[0]).not.toBe(todo1);
    });
});
