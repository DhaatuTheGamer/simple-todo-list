const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
const scriptContent = fs.readFileSync(path.resolve(__dirname, './script.js'), 'utf8');

describe('Storage Error Handling', () => {
    let dom;
    let window;

    beforeEach(() => {
        dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" });
        window = dom.window;

        // Create a mock for localStorage
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            clear: jest.fn()
        };
        Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

        // Evaluate the script within the JSDOM context
        const scriptElement = window.document.createElement('script');
        scriptElement.textContent = scriptContent + `
            window.saveTodosToStorage = saveTodosToStorage;
            window.getTodosFromStorage = getTodosFromStorage;
            window.updateTodoInStorage = updateTodoInStorage;
            window.getMemoizedTodos = () => memoizedTodos;
            window.setMemoizedTodos = (val) => { memoizedTodos = val; };
        `;
        window.document.body.appendChild(scriptElement);
    });

    describe('saveTodosToStorage', () => {
        test('should log error when localStorage.setItem throws', () => {
            const consoleErrorSpy = jest.spyOn(window.console, 'error').mockImplementation(() => {});

            window.localStorage.setItem.mockImplementation(() => {
                throw new Error("QuotaExceededError");
            });

            const todos = [{ id: 1, text: "Test Todo" }];

            window.saveTodosToStorage(todos);

            expect(consoleErrorSpy).toHaveBeenCalledWith("Error saving todos to localStorage:", expect.any(Error));

            consoleErrorSpy.mockRestore();
        });
    });

    describe('getTodosFromStorage', () => {
        test('should log error when localStorage.getItem throws and return empty array', () => {
            const consoleErrorSpy = jest.spyOn(window.console, 'error').mockImplementation(() => {});

            // Ensure memoizedTodos is null so it falls back to localStorage
            window.setMemoizedTodos(null);

            window.localStorage.getItem.mockImplementation(() => {
                throw new Error("StorageError");
            });

            const todos = window.getTodosFromStorage();

            expect(consoleErrorSpy).toHaveBeenCalledWith("Error reading todos from localStorage:", expect.any(Error));
            expect(todos).toEqual([]);

            consoleErrorSpy.mockRestore();
        });
    });

    describe('updateTodoInStorage', () => {
        test('should log warning when todo is not found in storage', () => {
            const consoleWarnSpy = jest.spyOn(window.console, 'warn').mockImplementation(() => {});

            window.setMemoizedTodos([{ id: 1, text: "Existing Todo", completed: false, starred: false, dueDate: null, priority: 2, parentId: null, level: 0, recurrence: null }]);

            window.updateTodoInStorage(999, { text: "Updated Todo" });

            expect(consoleWarnSpy).toHaveBeenCalledWith("Update failed: Todo not found in storage:", 999);

            consoleWarnSpy.mockRestore();
        });
    });
});
