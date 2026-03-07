/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

describe('addTodo edge cases in index.html', () => {

    beforeEach(() => {
        // Since we are in jsdom environment, global.document and global.window exist

        // Read index.html
        const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

        // Populate the DOM
        document.documentElement.innerHTML = html;

        // Mock localStorage
        const localStorageMock = (() => {
            let store = {};
            return {
                getItem: jest.fn(key => store[key] || null),
                setItem: jest.fn((key, value) => {
                    store[key] = value.toString();
                }),
                clear: jest.fn(() => {
                    store = {};
                })
            };
        })();
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });

        // Mock recurrence object function that is expected by index.html script
        // Normally this is in recurrence.js
        window.getRecurrenceSummary = jest.fn();

        // Find the inner script
        const scriptTags = Array.from(document.querySelectorAll('script')).filter(s => !s.src);
        if (scriptTags.length > 0) {
            const scriptContent = scriptTags[0].textContent;

            // Execute script in the global context
            window.eval(scriptContent);
        }

        // Trigger DOMContentLoaded
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    afterEach(() => {
        jest.clearAllMocks();
        document.documentElement.innerHTML = '';
    });

    test('should show error when input is empty string', () => {
        const todoInput = document.getElementById('todoInput');
        const addTodoBtn = document.getElementById('addTodoBtn');
        const inputError = document.getElementById('inputError');

        todoInput.value = '';
        addTodoBtn.click();

        expect(inputError.textContent).toBe("Task cannot be empty!");
        expect(inputError.classList.contains('hidden')).toBe(false);
        expect(todoInput.classList.contains('border-red-500')).toBe(true);
        expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });

    test('should show error when input contains only whitespace', () => {
        const todoInput = document.getElementById('todoInput');
        const addTodoBtn = document.getElementById('addTodoBtn');
        const inputError = document.getElementById('inputError');

        todoInput.value = '   \t  \n ';
        addTodoBtn.click();

        expect(inputError.textContent).toBe("Task cannot be empty!");
        expect(inputError.classList.contains('hidden')).toBe(false);
        expect(todoInput.classList.contains('border-red-500')).toBe(true);
        expect(window.localStorage.setItem).not.toHaveBeenCalled();
    });

    test('should add task and clear error when input is valid', () => {
        const todoInput = document.getElementById('todoInput');
        const addTodoBtn = document.getElementById('addTodoBtn');
        const inputError = document.getElementById('inputError');

        // Initial setup for the valid task case
        todoInput.value = 'Valid task';

        // Ensure error is showing before to check if it's cleared
        inputError.classList.remove('hidden');
        todoInput.classList.add('border-red-500');

        addTodoBtn.click();

        // Check if error is cleared
        expect(inputError.classList.contains('hidden')).toBe(true);
        expect(todoInput.classList.contains('border-red-500')).toBe(false);

        // Input should be cleared
        expect(todoInput.value).toBe('');

        // Task should be saved
        expect(window.localStorage.setItem).toHaveBeenCalledWith('todos', expect.stringContaining('Valid task'));
    });
});
