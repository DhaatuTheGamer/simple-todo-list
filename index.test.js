const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
const recurrenceJs = fs.readFileSync(path.resolve(__dirname, './recurrence.js'), 'utf8');

describe('index.html addTodo()', () => {
    let dom;
    let document;
    let window;

    beforeEach(() => {
        // Mock localStorage
        const localStorageMock = (function () {
            let store = {};
            return {
                getItem: function (key) {
                    return store[key] || null;
                },
                setItem: function (key, value) {
                    store[key] = value.toString();
                },
                removeItem: function (key) {
                    delete store[key];
                },
                clear: function () {
                    store = {};
                }
            };
        })();

        // Set up JSDOM
        dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost' });
        window = dom.window;
        document = window.document;

        // Make localStorage available to the window
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
        });

        // Insert recurrence.js into the DOM so its functions are available
        const scriptEl = document.createElement('script');
        scriptEl.textContent = recurrenceJs;
        document.head.appendChild(scriptEl);

        // Run the initialization if needed or let the DOM content loaded event fire
        window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

        // Mock date on the window object used in JSDOM, since Date.now() happens in that context
        dom.window.Date.now = jest.fn(() => 1696118400000); // 2023-10-01T00:00:00.000Z
    });

    test('shows error when todo text is empty', () => {
        const todoInput = document.getElementById('todoInput');
        todoInput.value = '   ';

        window.addTodo();

        const errorElement = document.getElementById('inputError');
        expect(errorElement.textContent).toBe('Task cannot be empty!');
        expect(errorElement.classList.contains('hidden')).toBe(false);

        // Ensure no todo was added
        const todos = JSON.parse(window.localStorage.getItem('todos') || '[]');
        expect(todos.length).toBe(0);
    });

    test('adds a basic task with no special options', () => {
        const todoInput = document.getElementById('todoInput');
        todoInput.value = 'Basic Task';

        window.addTodo();

        const todos = JSON.parse(window.localStorage.getItem('todos'));
        expect(todos.length).toBe(1);
        expect(todos[0]).toMatchObject({
            text: 'Basic Task',
            completed: false,
            id: 1696118400000,
            starred: false,
            dueDate: null,
            priority: 2,
            parentId: null,
            level: 0,
            recurrence: null
        });

        // Input should be cleared
        expect(todoInput.value).toBe('');
    });

    test('adds a task with due date and priority', () => {
        const todoInput = document.getElementById('todoInput');
        todoInput.value = 'Important Task';

        const dueDateInput = document.getElementById('todoDueDateInput');
        dueDateInput.value = '2023-10-15';

        const priorityInput = document.getElementById('todoPriorityInput');
        priorityInput.value = '3';

        window.addTodo();

        const todos = JSON.parse(window.localStorage.getItem('todos'));
        expect(todos.length).toBe(1);
        expect(todos[0]).toMatchObject({
            text: 'Important Task',
            dueDate: '2023-10-15',
            priority: 3
        });
    });

    test('adds a sub-task correctly', () => {
        // First add a parent task via window's load mechanism
        const parentTask = {
            text: 'Parent Task',
            completed: false,
            id: 100,
            starred: false,
            dueDate: null,
            priority: 2,
            parentId: null,
            level: 0,
            recurrence: null
        };
        window.localStorage.setItem('todos', JSON.stringify([parentTask]));

        // Ensure the cache is updated in the app logic
        window.saveTodosToStorage([parentTask]);

        // Set the parent ID variable to simulate "Add sub-task" button click
        // Note: the `window.currentParentIdForNewTask` cannot simply be set on `window`
        // if it's declared with `let` inside the script block. We need to evaluate it in the context of the script.
        dom.window.eval('currentParentIdForNewTask = 100;');

        const todoInput = document.getElementById('todoInput');
        todoInput.value = 'Sub Task';

        window.addTodo();

        const todos = JSON.parse(window.localStorage.getItem('todos'));
        expect(todos.length).toBe(2);

        // The new task is prepended (unshift), so it's at index 0
        expect(todos[0]).toMatchObject({
            text: 'Sub Task',
            parentId: 100,
            level: 1
        });

        // Ensure currentParentIdForNewTask is reset
        expect(dom.window.eval('currentParentIdForNewTask')).toBeNull();
    });

    test('adds a task with recurrence', () => {
        // Mock the collectRecurrenceData function to return a specific rule
        // since we are not simulating all the complex UI interactions for recurrence
        const originalCollectRecurrenceData = window.collectRecurrenceData;
        window.collectRecurrenceData = jest.fn(() => ({ type: 'daily' }));

        const todoInput = document.getElementById('todoInput');
        todoInput.value = 'Recurring Task';

        window.addTodo();

        const todos = JSON.parse(window.localStorage.getItem('todos'));
        expect(todos.length).toBe(1);
        expect(todos[0]).toMatchObject({
            text: 'Recurring Task',
            recurrence: { type: 'daily' }
        });

        // Restore
        window.collectRecurrenceData = originalCollectRecurrenceData;
    });
});
