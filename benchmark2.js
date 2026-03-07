const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" });

// Wait for the scripts to be parsed
setTimeout(() => {
    const buildHierarchicalTaskArray = dom.window.buildHierarchicalTaskArray;

    if (!buildHierarchicalTaskArray) {
        console.error("Function buildHierarchicalTaskArray not found");
        process.exit(1);
    }

    const N = 5000;

    // Create a large flat array of tasks
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

}, 500);
