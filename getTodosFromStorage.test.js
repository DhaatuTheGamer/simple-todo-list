const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('getTodosFromStorage error handling', () => {
    let window;

    beforeEach(() => {
        const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
        const scriptContent = fs.readFileSync(path.resolve(__dirname, './script.js'), 'utf8');

        const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/' });
        window = dom.window;

        const modifiedScript = `
        window.logMsg = null;
        window.logErr = null;
        console.error = function(msg, err) {
            window.logMsg = msg;
            window.logErr = err;
        };

        const localStorage = {
            getItem: function(key) {
                if (window.mockGetItem && key === 'todos') {
                    return window.mockGetItem(key);
                }
                return window.localStorage.getItem(key);
            },
            setItem: function(key, value) { return window.localStorage.setItem(key, value); },
            removeItem: function(key) { return window.localStorage.removeItem(key); },
            clear: function() { return window.localStorage.clear(); }
        };

        ${scriptContent}

        window.getTodosFromStorage = getTodosFromStorage;
        window.resetMemoizedTodos = () => { memoizedTodos = null; };
        `;

        const scriptElement = window.document.createElement('script');
        scriptElement.textContent = modifiedScript;
        window.document.body.appendChild(scriptElement);
    });

    test('should return an empty array and log error when localStorage.getItem throws', () => {
        window.resetMemoizedTodos();
        window.mockGetItem = () => { throw new Error('localStorage is broken'); };

        const result = window.getTodosFromStorage();

        expect(result).toEqual([]);
        expect(window.logMsg).toBe("Error reading todos from localStorage:");
        expect(window.logErr.message).toBe("localStorage is broken");
    });

    test('should return an empty array and log error when JSON.parse throws', () => {
        window.resetMemoizedTodos();
        window.mockGetItem = () => { return '{invalid json}'; };

        const result = window.getTodosFromStorage();

        expect(result).toEqual([]);
        expect(window.logMsg).toBe("Error reading todos from localStorage:");
        expect(window.logErr.name).toBe("SyntaxError");
    });
});
