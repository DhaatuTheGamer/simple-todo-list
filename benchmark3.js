const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" });

setTimeout(() => {
    const buildHierarchicalTaskArrayOriginal = dom.window.buildHierarchicalTaskArray;

    // New optimized implementation
    function buildHierarchicalTaskArrayOptimized(allTasks, rootParentId = null, startLevel = 0) {
        // Group all tasks by parentId once
        const childrenMap = new Map();
        for (const task of allTasks) {
            const parentId = task.parentId;
            if (!childrenMap.has(parentId)) {
                childrenMap.set(parentId, []);
            }
            childrenMap.get(parentId).push(task);
        }

        const result = [];

        function traverse(parentId, level) {
            let children = childrenMap.get(parentId);
            if (!children) return;

            if (dom.window.currentSortOrder !== 'default') {
                children.sort(dom.window.sortTasksLogic);
            }

            for (const task of children) {
                task.level = level;
                result.push(task);
                traverse(task.id, level + 1);
            }
        }

        traverse(rootParentId, startLevel);
        return result;
    }

    const N = 10000;

    const allTasks = [];
    for (let i = 0; i < N; i++) {
        allTasks.push({ id: i, parentId: null, text: `Task ${i}` });
    }

    console.log(`Benchmarking original with ${N} tasks...`);
    const start1 = process.hrtime.bigint();
    const result1 = buildHierarchicalTaskArrayOriginal(allTasks);
    const end1 = process.hrtime.bigint();
    const timeMs1 = Number(end1 - start1) / 1000000;
    console.log(`Original Time taken: ${timeMs1.toFixed(2)} ms`);

    console.log(`Benchmarking optimized with ${N} tasks...`);
    const start2 = process.hrtime.bigint();
    const result2 = buildHierarchicalTaskArrayOptimized(allTasks);
    const end2 = process.hrtime.bigint();
    const timeMs2 = Number(end2 - start2) / 1000000;
    console.log(`Optimized Time taken: ${timeMs2.toFixed(2)} ms`);

    console.log(`Improvement factor: ${(timeMs1/timeMs2).toFixed(2)}x`);

}, 500);
