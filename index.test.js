const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('index.html DOM functions', () => {
    let dom;
    let window;
    let document;

    beforeEach((done) => {
        // Load the HTML file
        let html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');

        // Remove external CDN links to avoid timeout/network issues during tests
        html = html.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/, '');
        html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, '');

        dom = new JSDOM(html, {
            runScripts: 'outside-only', // Don't run immediately on load
            resources: 'usable',
            url: "http://localhost/", // Important for localStorage to work natively in JSDOM sometimes, but we'll mock it
            beforeParse(window) {
                // Mock localStorage before parsing
                const localStorageMock = (function() {
                  let store = {};
                  return {
                    getItem: function(key) {
                      return store[key] || null;
                    },
                    setItem: function(key, value) {
                      store[key] = value.toString();
                    },
                    clear: function() {
                      store = {};
                    },
                    removeItem: function(key) {
                      delete store[key];
                    }
                  };
                })();

                Object.defineProperty(window, 'localStorage', {
                     value: localStorageMock,
                });
            }
        });

        window = dom.window;
        document = window.document;

        // Run scripts now that mock is injected
        dom.window.eval(`
            // Polyfill or ignore any recurrence errors for tests
            window.calculateNextDueDate = window.calculateNextDueDate || function() { return null; };
            window.formatDateISO = window.formatDateISO || function() { return null; };
        `);

        // Load recurrence.js content
        const recurrenceScript = fs.readFileSync(path.resolve(__dirname, 'recurrence.js'), 'utf8');
        dom.window.eval(recurrenceScript);

        // Load the inline script content from index.html manually
        const scriptMatches = html.match(/<script>([\s\S]*?)<\/script>/g);
        if (scriptMatches) {
            scriptMatches.forEach(scriptTag => {
                const scriptContent = scriptTag.replace(/<script>/, '').replace(/<\/script>/, '');
                dom.window.eval(scriptContent);
            });
        }

        jest.spyOn(Date, 'now').mockImplementation(() => 1000);

        // Initialize the app state
        dom.window.eval('initializeApp()');
        done();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('addTodo should add a new task when input is valid', () => {
        const todoInput = document.getElementById('todoInput');
        const addTodoBtn = document.getElementById('addTodoBtn');
        const todoList = document.getElementById('todoList');

        const addTodo = window.addTodo;
        expect(typeof addTodo).toBe('function');

        todoInput.value = 'New Test Task';

        addTodo();

        const listItems = todoList.querySelectorAll('li');
        expect(listItems.length).toBe(1);

        const firstItem = listItems[0];
        const textSpan = firstItem.querySelector('.todo-text');

        expect(textSpan).not.toBeNull();
        expect(textSpan.textContent).toBe('New Test Task');

        const savedTodosStr = window.localStorage.getItem('todos');
        const savedTodos = JSON.parse(savedTodosStr);
        expect(savedTodos).toHaveLength(1);
        expect(savedTodos[0].text).toBe('New Test Task');

        expect(todoInput.value).toBe('');
    });

    test('addTodo should not add a task and show error when input is empty', () => {
        const todoInput = document.getElementById('todoInput');
        const todoList = document.getElementById('todoList');
        const inputError = document.getElementById('inputError');

        const addTodo = window.addTodo;

        todoInput.value = '   ';

        addTodo();

        const listItems = todoList.querySelectorAll('li');
        expect(listItems.length).toBe(0);

        expect(inputError.classList.contains('hidden')).toBe(false);
        expect(inputError.textContent).toBe('Task cannot be empty!');
    });
});
