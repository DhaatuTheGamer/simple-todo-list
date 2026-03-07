const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, './index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

describe('deleteTodo function', () => {
    beforeEach(() => {
        // Reset the document
        document.documentElement.innerHTML = html.toString();

        // Reset local storage
        localStorage.clear();

        // Evaluate all inline scripts in the global context to define the functions
        const scriptContents = Array.from(document.querySelectorAll('script'))
            .filter(script => !script.src) // Get inline scripts only
            .map(script => script.textContent)
            .join('\n');

        // We evaluate in the context of the window to attach the functions and variables
        window.eval(scriptContents);

        // Reset global state in the script
        window.memoizedTodos = null;
    });

    test('successfully deletes a single todo and removes it from DOM and storage', () => {
        const todos = [
            { id: 101, text: 'Task to delete', completed: false, level: 0 }
        ];

        // Setup initial storage and DOM
        window.saveTodosToStorage(todos);
        window.loadTodos();

        const todoList = document.getElementById('todoList');
        expect(todoList.querySelectorAll('li').length).toBe(1);

        // Find the element and call delete
        const liToDelete = todoList.querySelector(`li[data-id="101"]`);
        expect(liToDelete).not.toBeNull();

        window.deleteTodo(101);

        // It should add the deleting class immediately
        expect(liToDelete.classList.contains('deleting')).toBe(true);

        // Trigger animationend
        liToDelete.dispatchEvent(new window.Event('animationend'));

        // Assert storage is updated
        const updatedTodos = window.getTodosFromStorage();
        expect(updatedTodos.length).toBe(0);

        // Assert DOM is updated
        expect(todoList.querySelectorAll('li').length).toBe(0);
    });

    test('deletes a parent todo and recursively deletes all its nested children', () => {
        const todos = [
            { id: 1, text: 'Parent', completed: false, level: 0 },
            { id: 2, text: 'Child 1', parentId: 1, completed: false, level: 1 },
            { id: 3, text: 'Grandchild 1', parentId: 2, completed: false, level: 2 },
            { id: 4, text: 'Child 2', parentId: 1, completed: false, level: 1 },
            { id: 5, text: 'Independent Task', completed: false, level: 0 }
        ];

        window.saveTodosToStorage(todos);
        window.loadTodos();

        const todoList = document.getElementById('todoList');
        expect(todoList.querySelectorAll('li').length).toBe(5);

        const liToDelete = todoList.querySelector(`li[data-id="1"]`);
        window.deleteTodo(1);

        liToDelete.dispatchEvent(new window.Event('animationend'));

        const updatedTodos = window.getTodosFromStorage();

        // Only task 5 should remain
        expect(updatedTodos.length).toBe(1);
        expect(updatedTodos[0].id).toBe(5);

        expect(todoList.querySelectorAll('li').length).toBe(1);
        expect(todoList.querySelector(`li[data-id="5"]`)).not.toBeNull();
    });

    test('handles fallback when element is not visually found in DOM but exists in storage', () => {
        const todos = [
            { id: 999, text: 'Hidden task', completed: false, level: 0 },
            { id: 888, text: 'Another task', completed: false, level: 0 }
        ];

        window.saveTodosToStorage(todos);
        // Do NOT call loadTodos() so the DOM is empty,
        // OR clear the DOM manually.
        const todoList = document.getElementById('todoList');
        todoList.innerHTML = '';

        // Mock console.warn to verify fallback path is taken
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        window.deleteTodo(999);

        // It should log a warning
        expect(consoleSpy).toHaveBeenCalledWith("Delete failed: Element not found visually:", 999);

        // It should still remove the item from storage
        const updatedTodos = window.getTodosFromStorage();
        expect(updatedTodos.length).toBe(1);
        expect(updatedTodos[0].id).toBe(888);

        consoleSpy.mockRestore();
    });
});
