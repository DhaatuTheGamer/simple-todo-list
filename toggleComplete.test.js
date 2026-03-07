const fs = require('fs');
const path = require('path');
const { calculateNextDueDate } = require('./recurrence.js');

const htmlPath = path.resolve(__dirname, './index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Extract the contents of the main script tag
const scriptMatch = htmlContent.match(/<script>\s*(\/\/\s*--- DOM Elements ---[\s\S]*?)<\/script>/);
const scriptContent = scriptMatch ? scriptMatch[1] : '';

if (!scriptContent) {
    throw new Error('Could not find the main script content in index.html');
}

describe('toggleComplete function', () => {
    let mockCheckbox;
    let mockLi;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = htmlContent;

        // Reset localStorage
        localStorage.clear();

        // Make calculateNextDueDate available globally as in the browser
        global.calculateNextDueDate = calculateNextDueDate;

        // Ensure globals are reset
        global.memoizedTodos = null;

        // Evaluate the script in the global context to load all functions and state
        // We use an indirect eval to run it globally
        (0, eval)(scriptContent);

        // Setup common mock elements
        mockLi = document.createElement('li');
        mockLi.dataset.id = '123';
        mockLi.dataset.level = '0';
        mockLi.classList.add('flex');

        mockCheckbox = document.createElement('div');
        mockCheckbox.setAttribute('aria-checked', 'false');

        // Mock getTodosFromStorage and saveTodosToStorage just in case, though they are loaded by eval
        // Actually, let's just use the loaded functions directly by seeding localStorage
        const initialTodos = [{
            id: 123,
            text: 'Test task',
            completed: false,
            dueDate: '2023-10-01',
            priority: 2,
            parentId: null,
            level: 0,
            recurrence: null
        }];
        localStorage.setItem('todos', JSON.stringify(initialTodos));

        // Load todos so memoizedTodos gets populated
        // The eval script runs document.addEventListener('DOMContentLoaded', initializeApp),
        // but since DOM is already loaded, it might not fire.
        // Let's call loadTodos manually if it exists.
        if (typeof loadTodos === 'function') {
            loadTodos();
        }

        // Re-assign mock elements from the freshly rendered DOM
        // because loadTodos() will clear todoList and re-render.
        const todoList = document.getElementById('todoList');
        if (todoList && todoList.firstChild) {
            mockLi = todoList.firstChild;
            mockCheckbox = mockLi.querySelector('.checkbox-icon');
        } else {
            // fallback if loadTodos didn't render it
            document.body.appendChild(mockLi);
            mockLi.appendChild(mockCheckbox);
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('completes a normal task', () => {
        expect(mockLi.classList.contains('completed')).toBe(false);
        expect(mockCheckbox.getAttribute('aria-checked')).toBe('false');

        toggleComplete(123, mockLi, mockCheckbox);

        expect(mockLi.classList.contains('completed')).toBe(true);
        expect(mockLi.dataset.completed).toBe('true');
        expect(mockCheckbox.getAttribute('aria-checked')).toBe('true');

        const todos = JSON.parse(localStorage.getItem('todos'));
        const completedTask = todos.find(t => t.id === 123);
        expect(completedTask.completed).toBe(true);
    });

    test('uncompletes a normal task', () => {
        // First complete it
        toggleComplete(123, mockLi, mockCheckbox);
        expect(mockLi.classList.contains('completed')).toBe(true);

        // Then uncomplete it
        toggleComplete(123, mockLi, mockCheckbox);

        expect(mockLi.classList.contains('completed')).toBe(false);
        expect(mockLi.dataset.completed).toBe('false');
        expect(mockCheckbox.getAttribute('aria-checked')).toBe('false');

        const todos = JSON.parse(localStorage.getItem('todos'));
        const task = todos.find(t => t.id === 123);
        expect(task.completed).toBe(false);
    });

    test('saves edit when completing a task in editing state', () => {
        mockLi.classList.add('editing');
        const textEditInput = document.createElement('input');
        textEditInput.classList.add('edit-input');
        textEditInput.value = 'Edited task text';
        mockLi.appendChild(textEditInput);

        // We can mock saveEdit to ensure it's called
        const originalSaveEdit = global.saveEdit;
        global.saveEdit = jest.fn();

        toggleComplete(123, mockLi, mockCheckbox);

        expect(global.saveEdit).toHaveBeenCalledWith(mockLi, textEditInput, 123, true);

        // Restore
        global.saveEdit = originalSaveEdit;
    });

    test('completes a recurring task and generates the next instance', () => {
        const recurringTodo = {
            id: 124,
            text: 'Daily task',
            completed: false,
            dueDate: '2023-10-01',
            priority: 2,
            parentId: null,
            level: 0,
            recurrence: { type: 'daily' }
        };
        localStorage.setItem('todos', JSON.stringify([recurringTodo]));

        // Reset memoizedTodos so it fetches from localStorage
        memoizedTodos = null;
        // In the app, saveTodosToStorage sets memoizedTodos. Better to call it.
        saveTodosToStorage([recurringTodo]);
        loadTodos();

        let li = document.querySelector('li[data-id="124"]');
        // If DOM isn't updated for some reason, create it manually to test logic
        if (!li) {
            li = document.createElement('li');
            li.dataset.id = '124';
            const cb = document.createElement('div');
            cb.classList.add('checkbox-icon');
            cb.setAttribute('aria-checked', 'false');
            li.appendChild(cb);
            document.body.appendChild(li);
        }

        const checkbox = li.querySelector('.checkbox-icon');

        // Spy on calculateNextDueDate to ensure it is called
        const calculateSpy = jest.spyOn(global, 'calculateNextDueDate');

        toggleComplete(124, li, checkbox);

        expect(calculateSpy).toHaveBeenCalledWith('2023-10-01', { type: 'daily' });

        const todos = JSON.parse(localStorage.getItem('todos'));

        // Original task should be completed and have its recurrence removed
        const completedTask = todos.find(t => t.id === 124);
        expect(completedTask.completed).toBe(true);
        expect(completedTask.recurrence).toBeNull();

        // A new task should be created with the next due date and same recurrence
        const nextTask = todos.find(t => t.id !== 124);
        expect(nextTask).toBeDefined();
        expect(nextTask.text).toBe('Daily task');
        expect(nextTask.dueDate).toBe('2023-10-02');
        expect(nextTask.completed).toBe(false);
        expect(nextTask.recurrence).toEqual({ type: 'daily' });
    });

    test('completes a recurring task but does not generate next instance if calculation fails', () => {
        const recurringTodo = {
            id: 125,
            text: 'Task with broken recurrence',
            completed: false,
            dueDate: '2023-10-01',
            priority: 2,
            parentId: null,
            level: 0,
            // specific_days without daysOfWeek will return null from calculateNextDueDate
            recurrence: { type: 'specific_days' }
        };
        localStorage.setItem('todos', JSON.stringify([recurringTodo]));
        memoizedTodos = null;
        saveTodosToStorage([recurringTodo]);
        loadTodos();

        let li = document.querySelector('li[data-id="125"]');
        if (!li) {
            li = document.createElement('li');
            li.dataset.id = '125';
            const cb = document.createElement('div');
            cb.classList.add('checkbox-icon');
            cb.setAttribute('aria-checked', 'false');
            li.appendChild(cb);
            document.body.appendChild(li);
        }
        const checkbox = li.querySelector('.checkbox-icon');

        toggleComplete(125, li, checkbox);

        const todos = JSON.parse(localStorage.getItem('todos'));

        // Original task should be completed and have its recurrence removed
        const completedTask = todos.find(t => t.id === 125);
        expect(completedTask.completed).toBe(true);
        expect(completedTask.recurrence).toBeNull();

        // No new task should have been created
        expect(todos.length).toBe(1);
    });
});
