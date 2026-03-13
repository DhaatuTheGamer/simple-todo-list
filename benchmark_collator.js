const { performance } = require('perf_hooks');

const numItems = 10000;
const currentTodos = [];

for (let i = 0; i < numItems; i++) {
  const randomText = Math.random().toString(36).substring(7).toUpperCase() + " task " + i;
  currentTodos.push({
    id: i,
    text: randomText,
    dueDate: '2024-01-01',
    priority: Math.floor(Math.random() * 3) + 1,
    _lowerText: randomText.toLowerCase()
  });
}

function baseline() {
  const todos = [...currentTodos];
  const start = performance.now();
  todos.sort((a,b) => {
        return a.text.toLowerCase().localeCompare(b.text.toLowerCase());
  });
  const end = performance.now();
  return end - start;
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
function optimized() {
  const todos = [...currentTodos];
  const start = performance.now();
  todos.sort((a,b) => collator.compare(a.text, b.text));
  const end = performance.now();
  return end - start;
}

const runs = 20;

let baselineTotal = 0;
for (let i = 0; i < runs; i++) {
  baselineTotal += baseline();
}

let optimizedTotal = 0;
for (let i = 0; i < runs; i++) {
  optimizedTotal += optimized();
}

console.log(`Baseline Avg: ${baselineTotal / runs} ms`);
console.log(`Optimized Avg: ${optimizedTotal / runs} ms`);
console.log(`Improvement: ${((baselineTotal - optimizedTotal) / baselineTotal * 100).toFixed(2)}%`);
