const fs = require('fs');
const assert = require('assert');
const { JSDOM } = require('jsdom');

// Read index.html
const html = fs.readFileSync('index.html', 'utf8');

// Load HTML using jsdom to evaluate scripts properly in a browser-like environment
const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "dangerously" });
const getRecurrenceSummary = dom.window.getRecurrenceSummary;

if (typeof getRecurrenceSummary !== 'function') {
    console.error("Could not find getRecurrenceSummary function on window object");
    process.exit(1);
}

// Test Suite
console.log("Running tests for getRecurrenceSummary...");

let passed = 0;
let failed = 0;

function runTest(name, input, expected) {
    try {
        const result = getRecurrenceSummary(input);
        assert.strictEqual(result, expected);
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } catch (error) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Expected: "${expected}"`);
        console.error(`   Actual:   "${getRecurrenceSummary(input)}"`);
        failed++;
    }
}

// 1. Null/undefined input
runTest("Null input", null, "");
runTest("Undefined input", undefined, "");

// 2. { type: 'none' }
runTest("Type 'none'", { type: 'none' }, "");

// 3. { type: 'daily' }
runTest("Type 'daily'", { type: 'daily' }, "Recurs daily");

// 4. { type: 'monthly' }
runTest("Type 'monthly'", { type: 'monthly' }, "Recurs monthly");

// 5. { type: 'weekly' } without days selected
runTest("Type 'weekly' without days selected", { type: 'weekly' }, "Recurs weekly (no days selected)");

// 6. { type: 'specific_days' } without days selected
runTest("Type 'specific_days' without days selected", { type: 'specific_days' }, "Recurs specific_days (no days selected)");

// 7. { type: 'weekly', daysOfWeek: [] }
runTest("Type 'weekly' with empty days array", { type: 'weekly', daysOfWeek: [] }, "Recurs weekly (no days selected)");

// 8. { type: 'weekly', daysOfWeek: [1] }
runTest("Type 'weekly' on Mon", { type: 'weekly', daysOfWeek: [1] }, "Recurs weekly on Mon");

// 9. { type: 'specific_days', daysOfWeek: [0, 6] }
runTest("Type 'specific_days' on Sun, Sat", { type: 'specific_days', daysOfWeek: [0, 6] }, "Recurs specific_days on Sun, Sat");

// 10. { type: 'weekly', daysOfWeek: [1, 3, 5] }
runTest("Type 'weekly' on Mon, Wed, Fri", { type: 'weekly', daysOfWeek: [1, 3, 5] }, "Recurs weekly on Mon, Wed, Fri");

// Summary
console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    process.exit(1);
}
