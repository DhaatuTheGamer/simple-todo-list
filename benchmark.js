const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

// Wait for the scripts to be parsed
setTimeout(() => {
    const buildHierarchicalTaskArray = dom.window.buildHierarchicalTaskArray;

    if (!buildHierarchicalTaskArray) {
        console.error("Function buildHierarchicalTaskArray not found");
        process.exit(1);
    }

    // Create a large flat array of tasks (worst case O(N^2) for current implementation)
    // 5000 tasks, all top level (parentId = null)
    const N = 5000;
    const allTasks = [];
    for (let i = 0; i < N; i++) {
        allTasks.push({ id: i, parentId: null, text: `Task ${i}` });
    }

    console.log(`Benchmarking with ${N} top-level tasks...`);

    const start = process.hrtime.bigint();
    const result = buildHierarchicalTaskArray(allTasks);
    const end = process.hrtime.bigint();

    const timeMs = Number(end - start) / 1000000;
    console.log(`Time taken: ${timeMs.toFixed(2)} ms`);
    console.log(`Result length: ${result.length}`);

    // Create a deep tree (N tasks, each parent of the next)
    const deepTasks = [];
    for (let i = 0; i < N; i++) {
        deepTasks.push({ id: i, parentId: i === 0 ? null : i - 1, text: `Deep Task ${i}` });
    }

    console.log(`Benchmarking with ${N} deep tasks...`);

    const startDeep = process.hrtime.bigint();
    const resultDeep = buildHierarchicalTaskArray(deepTasks);
    const endDeep = process.hrtime.bigint();

    const timeMsDeep = Number(endDeep - startDeep) / 1000000;
    console.log(`Time taken deep: ${timeMsDeep.toFixed(2)} ms`);
    console.log(`Result length deep: ${resultDeep.length}`);

}, 500);
