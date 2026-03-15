
const { performance } = require('perf_hooks');

// Mocking necessary parts of script.js
let currentSortOrder = 'default';

function sortTasksLogic(a, b) {
    switch (currentSortOrder) {
        case 'dueDateAsc':
        case 'dueDateDesc':
            if (a.dueDate === b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return currentSortOrder === 'dueDateAsc'
                ? new Date(a.dueDate) - new Date(b.dueDate)
                : new Date(b.dueDate) - new Date(a.dueDate);
        case 'priorityDesc':
            return (b.priority || 0) - (a.priority || 0);
        case 'priorityAsc':
            return (a.priority || 0) - (b.priority || 0);
        case 'nameAZ':
            return a._lowerText.localeCompare(b._lowerText);
        case 'nameZA':
            return b._lowerText.localeCompare(a._lowerText);
        default: return 0;
    }
}

function buildHierarchicalTaskArrayBaseline(allTasks, parentId = null, level = 0) {
    let result = [];
    const children = allTasks.filter(task => task.parentId === parentId);

    if (currentSortOrder !== 'default') {
         children.sort(sortTasksLogic);
    }

    children.forEach(task => {
        task.level = level;
        result.push(task);
        result = result.concat(buildHierarchicalTaskArrayBaseline(allTasks, task.id, level + 1));
    });
    return result;
}

function buildHierarchicalTaskArrayOptimized(allTasks, parentId = null, level = 0, tasksByParent = null) {
    if (!tasksByParent) {
        tasksByParent = new Map();
        for (const task of allTasks) {
            const pId = task.parentId || null;
            if (!tasksByParent.has(pId)) {
                tasksByParent.set(pId, []);
            }
            tasksByParent.get(pId).push(task);
        }
    }

    let result = [];
    const children = tasksByParent.get(parentId) || [];

    if (currentSortOrder !== 'default') {
         children.sort(sortTasksLogic);
    }

    for (const task of children) {
        task.level = level;
        result.push(task);
        const nested = buildHierarchicalTaskArrayOptimized(allTasks, task.id, level + 1, tasksByParent);
        for (const childTask of nested) {
            result.push(childTask);
        }
    }
    return result;
}

// Generate test data
function generateTasks(numTasks, depth) {
    const tasks = [];
    for (let i = 0; i < numTasks; i++) {
        const parentId = i < numTasks / 10 ? null : Math.floor(Math.random() * (i));
        tasks.push({
            id: i,
            text: `Task ${i}`,
            _lowerText: `task ${i}`,
            parentId: parentId,
            priority: Math.floor(Math.random() * 3),
            dueDate: '2023-10-01'
        });
    }
    return tasks;
}

const numTasks = 2000;
const tasks = generateTasks(numTasks);

console.log(`Benchmarking with ${numTasks} tasks...`);

function runBenchmark(fn, name) {
    // Warmup
    for (let i = 0; i < 5; i++) fn([...tasks]);

    const start = performance.now();
    for (let i = 0; i < 20; i++) {
        fn([...tasks]);
    }
    const end = performance.now();
    console.log(`${name} average time: ${((end - start) / 20).toFixed(4)}ms`);
    return (end - start) / 20;
}

currentSortOrder = 'default';
console.log('\nSort Order: default');
const baselineDefault = runBenchmark(buildHierarchicalTaskArrayBaseline, 'Baseline');
const optimizedDefault = runBenchmark(buildHierarchicalTaskArrayOptimized, 'Optimized');

currentSortOrder = 'nameAZ';
console.log('\nSort Order: nameAZ');
const baselineSorted = runBenchmark(buildHierarchicalTaskArrayBaseline, 'Baseline');
const optimizedSorted = runBenchmark(buildHierarchicalTaskArrayOptimized, 'Optimized');
