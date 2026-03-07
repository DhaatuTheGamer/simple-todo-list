const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" });

setTimeout(() => {
    const buildHierarchicalTaskArray = dom.window.buildHierarchicalTaskArray;

    // Test 1: Empty array
    console.assert(buildHierarchicalTaskArray([]).length === 0, "Empty array failed");

    // Test 2: Flat list
    const flatList = [
        { id: 1, parentId: null, text: "A" },
        { id: 2, parentId: null, text: "B" }
    ];
    let res = buildHierarchicalTaskArray(flatList);
    console.assert(res.length === 2, "Flat list length failed");
    console.assert(res[0].id === 1 && res[0].level === 0, "Flat list item 1 failed");
    console.assert(res[1].id === 2 && res[1].level === 0, "Flat list item 2 failed");

    // Test 3: Hierarchy
    const hierarchy = [
        { id: 1, parentId: null, text: "Parent" },
        { id: 2, parentId: 1, text: "Child 1" },
        { id: 3, parentId: 2, text: "Grandchild 1" },
        { id: 4, parentId: 1, text: "Child 2" }
    ];
    res = buildHierarchicalTaskArray(hierarchy);
    console.assert(res.length === 4, "Hierarchy length failed");
    console.assert(res[0].id === 1 && res[0].level === 0, "Hierarchy parent failed");
    console.assert(res[1].id === 2 && res[1].level === 1, "Hierarchy child 1 failed");
    console.assert(res[2].id === 3 && res[2].level === 2, "Hierarchy grandchild 1 failed");
    console.assert(res[3].id === 4 && res[3].level === 1, "Hierarchy child 2 failed");

    console.log("All tests passed!");
}, 500);
