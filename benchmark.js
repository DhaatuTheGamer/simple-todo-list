const numItems = 10000;
const numTopLevelItems = 5000;

const currentTodos = [];
for (let i = 0; i < numItems; i++) {
  currentTodos.push({ id: i, text: `Task ${i}`, completed: false });
}

const topLevelItemIds = [];
for (let i = 0; i < numTopLevelItems; i++) {
  // Randomly select IDs to act as top-level items
  topLevelItemIds.push(Math.floor(Math.random() * numItems));
}

function baseline() {
  const start = process.hrtime.bigint();
  let orderedStorageTodos = [];
  const processedIds = new Set();

  topLevelItemIds.forEach(id => {
      const task = currentTodos.find(t => t.id === id);
      if (task) {
          orderedStorageTodos.push(task);
          processedIds.add(id);
      }
  });
  const end = process.hrtime.bigint();
  return Number(end - start) / 1e6; // in ms
}

function optimized() {
  const start = process.hrtime.bigint();
  let orderedStorageTodos = [];
  const processedIds = new Set();

  const currentTodosMap = new Map(currentTodos.map(t => [t.id, t]));

  topLevelItemIds.forEach(id => {
      const task = currentTodosMap.get(id);
      if (task) {
          orderedStorageTodos.push(task);
          processedIds.add(id);
      }
  });
  const end = process.hrtime.bigint();
  return Number(end - start) / 1e6; // in ms
}

const runs = 100;

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
