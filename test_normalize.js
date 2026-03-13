const fs = require('fs');

const content = fs.readFileSync('script.js', 'utf8');

const updated = content.replace(
/        function normalizeTodos\(todos\) \{[\s\S]*?\}\)\.filter\(todo => todo\.id && typeof todo\.text === 'string'\);\n        \}/,
`        function normalizeTodos(todos) {
            return (Array.isArray(todos) ? todos : []).map(todo => {
                const text = todo.text ?? 'Untitled Task';
                return {
                    text: text,
                    _lowerText: typeof text === 'string' ? text.toLowerCase() : '',
                    completed: todo.completed ?? false,
                    id: todo.id ?? Date.now(),
                    starred: todo.starred ?? false,
                    dueDate: todo.dueDate ?? null,
                    priority: todo.priority ?? 2,
                    parentId: todo.parentId ?? null,
                    level: todo.level ?? 0,
                    recurrence: todo.recurrence ?? null
                };
            }).filter(todo => todo.id && typeof todo.text === 'string');
        }`
);

fs.writeFileSync('script.js', updated);
