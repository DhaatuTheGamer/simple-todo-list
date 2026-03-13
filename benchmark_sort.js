const { performance } = require('perf_hooks');

const numItems = 10000;
const currentTodos = [];

for (let i = 0; i < numItems; i++) {
  // Generate random strings to prevent V8 from caching the results easily
  const randomText = Math.random().toString(36).substring(7).toUpperCase() + " task " + i;
  currentTodos.push({ id: i, text: randomText });
}

function baseline() {
  const todos = [...currentTodos];
  const start = performance.now();
  todos.sort((a, b) => a.text.toLowerCase().localeCompare(b.text.toLowerCase()));
  const end = performance.now();
  return end - start;
}

function optimized() {
  const todos = [...currentTodos];
  const start = performance.now();
  // Using Schwartzian transform or temporary map
  // Or if we pre-calculate in normalizeTodos, we can just simulate that

  // Here we'll just simulate pre-calculating inside normalizeTodos:
  const todosWithLower = todos.map(t => { t._lowerText = t.text.toLowerCase(); return t; });

  todosWithLower.sort((a, b) => a._lowerText.localeCompare(b._lowerText));
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
