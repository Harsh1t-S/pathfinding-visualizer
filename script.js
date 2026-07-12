// ---------- Grid setup ----------
const ROWS = 17;
const COLS = 31;
const WEIGHT_COST = 5;

const gridEl = document.getElementById('grid');
gridEl.style.gridTemplateColumns = `repeat(${COLS}, var(--cell))`;
gridEl.style.gridTemplateRows = `repeat(${ROWS}, var(--cell))`;

let grid = [];
let startNode = { row: 8, col: 6 };
let endNode = { row: 8, col: 24 };
let isMouseDown = false;
let mouseButton = 0;        // 0 = left, 2 = right (right-drag erases)
let currentTool = 'wall';
let isRunning = false;
let dragging = null;        // 'start' | 'end' | null — direct drag without tool switch
let lastRunAlgo = null;     // re-trace instantly when start/end moves after a run
let allowDiagonal = false;

function createGrid() {
  grid = [];
  gridEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    const rowArr = [];
    for (let c = 0; c < COLS; c++) {
      const node = {
        row: r, col: c,
        isWall: false,
        weight: 1,
        isStart: r === startNode.row && c === startNode.col,
        isEnd: r === endNode.row && c === endNode.col,
        distance: Infinity,
        f: Infinity, g: Infinity, h: Infinity,
        visited: false,
        previous: null,
      };
      const cellEl = document.createElement('div');
      cellEl.className = 'cell';
      cellEl.dataset.row = r;
      cellEl.dataset.col = c;
      if (node.isStart) cellEl.classList.add('start');
      if (node.isEnd) cellEl.classList.add('end');
      cellEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (isRunning) return;
        mouseButton = e.button;
        if (e.button === 0 && node.isStart) { dragging = 'start'; return; }
        if (e.button === 0 && node.isEnd) { dragging = 'end'; return; }
        applyTool(node, cellEl, e.button === 2 ? 'erase' : currentTool);
      });
      cellEl.addEventListener('mouseenter', () => {
        if (isRunning) return;
        if (dragging) { moveEndpoint(dragging, node); return; }
        if (isMouseDown) applyTool(node, cellEl, mouseButton === 2 ? 'erase' : currentTool);
      });
      node.el = cellEl;
      gridEl.appendChild(cellEl);
      rowArr.push(node);
    }
    grid.push(rowArr);
  }
}

gridEl.addEventListener('contextmenu', (e) => e.preventDefault());

function moveEndpoint(which, node) {
  if (node.isWall || node.isStart || node.isEnd) return;
  const ref = which === 'start' ? startNode : endNode;
  const old = grid[ref.row][ref.col];
  old[which === 'start' ? 'isStart' : 'isEnd'] = false;
  old.el.classList.remove(which);
  node[which === 'start' ? 'isStart' : 'isEnd'] = true;
  node.weight = 1;
  node.el.classList.remove('weight');
  node.el.classList.add(which);
  if (which === 'start') startNode = { row: node.row, col: node.col };
  else endNode = { row: node.row, col: node.col };
  if (lastRunAlgo) instantTrace();
}

function applyTool(node, cellEl, tool) {
  if (isRunning) return;
  if (tool === 'wall') {
    if (node.isStart || node.isEnd) return;
    node.isWall = true;
    node.weight = 1;
    cellEl.classList.add('wall');
    cellEl.classList.remove('weight');
  } else if (tool === 'weight') {
    if (node.isStart || node.isEnd || node.isWall) return;
    node.weight = node.weight === 1 ? WEIGHT_COST : 1;
    cellEl.classList.toggle('weight', node.weight > 1);
  } else if (tool === 'erase') {
    if (node.isStart || node.isEnd) return;
    node.isWall = false;
    node.weight = 1;
    cellEl.classList.remove('wall', 'weight');
  } else if (tool === 'start') {
    if (node.isEnd || node.isWall) return;
    moveEndpoint('start', node);
  } else if (tool === 'end') {
    if (node.isStart || node.isWall) return;
    moveEndpoint('end', node);
  }
}

document.addEventListener('mousedown', (e) => { isMouseDown = true; mouseButton = e.button; });
document.addEventListener('mouseup', () => { isMouseDown = false; dragging = null; });

// Touch support — map touches onto cells
gridEl.addEventListener('touchstart', handleTouch, { passive: false });
gridEl.addEventListener('touchmove', handleTouch, { passive: false });
function handleTouch(e) {
  e.preventDefault();
  if (isRunning) return;
  const t = e.touches[0];
  const el = document.elementFromPoint(t.clientX, t.clientY);
  if (el && el.classList.contains('cell')) {
    const node = grid[+el.dataset.row][+el.dataset.col];
    applyTool(node, el, currentTool);
  }
}

// ---------- Tools + toolbar ----------
function selectTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
}
document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => selectTool(btn.dataset.tool));
});

const diagToggle = document.getElementById('diagToggle');
diagToggle.addEventListener('change', () => { allowDiagonal = diagToggle.checked; if (lastRunAlgo) instantTrace(); });

// ---------- Algorithm descriptions ----------
const algoDescriptions = {
  bfs: 'Explores level by level. Guarantees shortest path on unweighted grids; ignores weights.',
  dfs: 'Dives deep before backtracking. Fast but paths are usually far from optimal.',
  dijkstra: 'Expands by lowest total cost. Guarantees the cheapest path, respects weights.',
  astar: 'Dijkstra + heuristic pull toward the target. Optimal path, far fewer nodes visited.',
  greedy: 'Chases the heuristic only. Very fast, but the path may not be optimal.',
};
const algoSelect = document.getElementById('algoSelect');
const algoDescEl = document.getElementById('algoDesc');
function updateAlgoDesc() { algoDescEl.textContent = algoDescriptions[algoSelect.value]; }
algoSelect.addEventListener('change', updateAlgoDesc);
updateAlgoDesc();

// ---------- Speed label ----------
const speedRange = document.getElementById('speedRange');
const speedLabel = document.getElementById('speedLabel');
function updateSpeedLabel() {
  const v = Number(speedRange.value);
  speedLabel.textContent = v <= 3 ? 'slow' : v <= 7 ? 'normal' : 'fast';
}
speedRange.addEventListener('input', updateSpeedLabel);
updateSpeedLabel();

// ---------- Keyboard shortcuts ----------
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
  if (isRunning) return;
  const toolKeys = { '1': 'wall', '2': 'weight', '3': 'start', '4': 'end', '5': 'erase' };
  if (toolKeys[e.key]) { selectTool(toolKeys[e.key]); return; }
  if (e.code === 'Space') { e.preventDefault(); document.getElementById('runBtn').click(); }
  else if (e.key === 'm') document.getElementById('mazeBtn').click();
  else if (e.key === 'c') document.getElementById('clearWallsBtn').click();
  else if (e.key === 'r') document.getElementById('clearAllBtn').click();
});

// ---------- Reset helpers ----------
function resetVisualState() {
  for (const row of grid) {
    for (const node of row) {
      node.distance = Infinity; node.f = Infinity; node.g = Infinity; node.h = Infinity;
      node.visited = false; node.previous = null;
      node.el.classList.remove('visited', 'path', 'visited-instant', 'path-instant');
    }
  }
}

document.getElementById('clearWallsBtn').addEventListener('click', () => {
  if (isRunning) return;
  lastRunAlgo = null;
  resetVisualState();
  for (const row of grid) for (const node of row) {
    node.isWall = false;
    node.weight = 1;
    node.el.classList.remove('wall', 'weight');
  }
  setStatus('idle', 'walls cleared');
});

document.getElementById('clearAllBtn').addEventListener('click', () => {
  if (isRunning) return;
  lastRunAlgo = null;
  startNode = { row: 8, col: 6 };
  endNode = { row: 8, col: 24 };
  createGrid();
  setStatus('idle', 'grid ready');
  updateReadout(0, 0, 0);
});

// ---------- Maze generation: animated recursive division ----------
document.getElementById('mazeBtn').addEventListener('click', async () => {
  if (isRunning) return;
  lastRunAlgo = null;
  setControlsDisabled(true);
  setStatus('running', 'carving maze…');
  resetVisualState();
  for (const row of grid) for (const node of row) {
    node.isWall = false; node.weight = 1;
    node.el.classList.remove('wall', 'weight');
  }
  const walls = [];
  // outer border
  for (let c = 0; c < COLS; c++) { walls.push([0, c]); walls.push([ROWS - 1, c]); }
  for (let r = 1; r < ROWS - 1; r++) { walls.push([r, 0]); walls.push([r, COLS - 1]); }
  recursiveDivide(1, ROWS - 2, 1, COLS - 2, walls);
  for (const [r, c] of walls) {
    const node = grid[r][c];
    if (node.isStart || node.isEnd) continue;
    node.isWall = true;
    node.el.classList.add('wall');
    await sleep(6);
  }
  setControlsDisabled(false);
  setStatus('idle', 'maze ready — hit space');
});

function recursiveDivide(rMin, rMax, cMin, cMax, walls) {
  const height = rMax - rMin, width = cMax - cMin;
  if (height < 2 || width < 2) return;
  const horizontal = height > width ? true : height < width ? false : Math.random() < 0.5;
  if (horizontal) {
    const candidates = [];
    for (let r = rMin + 1; r < rMax; r += 2) candidates.push(r);
    if (!candidates.length) return;
    const wallRow = candidates[Math.floor(Math.random() * candidates.length)];
    const holes = [];
    for (let c = cMin; c <= cMax; c += 2) holes.push(c);
    const hole = holes[Math.floor(Math.random() * holes.length)];
    for (let c = cMin; c <= cMax; c++) if (c !== hole) walls.push([wallRow, c]);
    recursiveDivide(rMin, wallRow - 1, cMin, cMax, walls);
    recursiveDivide(wallRow + 1, rMax, cMin, cMax, walls);
  } else {
    const candidates = [];
    for (let c = cMin + 1; c < cMax; c += 2) candidates.push(c);
    if (!candidates.length) return;
    const wallCol = candidates[Math.floor(Math.random() * candidates.length)];
    const holes = [];
    for (let r = rMin; r <= rMax; r += 2) holes.push(r);
    const hole = holes[Math.floor(Math.random() * holes.length)];
    for (let r = rMin; r <= rMax; r++) if (r !== hole) walls.push([r, wallCol]);
    recursiveDivide(rMin, rMax, cMin, wallCol - 1, walls);
    recursiveDivide(rMin, rMax, wallCol + 1, cMax, walls);
  }
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

// ---------- Binary min-heap priority queue ----------
class MinHeap {
  constructor(scoreFn) { this.items = []; this.score = scoreFn; }
  push(item) {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.score(this.items[i]) < this.score(this.items[p])) {
        [this.items[i], this.items[p]] = [this.items[p], this.items[i]];
        i = p;
      } else break;
    }
  }
  pop() {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length) {
      this.items[0] = last;
      let i = 0;
      while (true) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let smallest = i;
        if (l < this.items.length && this.score(this.items[l]) < this.score(this.items[smallest])) smallest = l;
        if (r < this.items.length && this.score(this.items[r]) < this.score(this.items[smallest])) smallest = r;
        if (smallest === i) break;
        [this.items[i], this.items[smallest]] = [this.items[smallest], this.items[i]];
        i = smallest;
      }
    }
    return top;
  }
  get size() { return this.items.length; }
}

// ---------- Neighbors ----------
function getNeighbors(node) {
  const { row, col } = node;
  const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
  if (allowDiagonal) deltas.push([-1,-1],[-1,1],[1,-1],[1,1]);
  const result = [];
  for (const [dr, dc] of deltas) {
    const r = row + dr, c = col + dc;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && !grid[r][c].isWall) {
      result.push(grid[r][c]);
    }
  }
  return result;
}

function heuristic(a, b) {
  const dr = Math.abs(a.row - b.row), dc = Math.abs(a.col - b.col);
  // Octile distance when diagonals allowed, Manhattan otherwise
  return allowDiagonal ? Math.max(dr, dc) + 0.414 * Math.min(dr, dc) : dr + dc;
}

function stepCost(from, to) {
  const diag = from.row !== to.row && from.col !== to.col;
  return (diag ? 1.414 : 1) * to.weight;
}

// ---------- Algorithms: each returns {visitedOrder} ----------
function bfs(start, end) {
  const visitedOrder = [];
  const queue = [start];
  start.visited = true;
  while (queue.length) {
    const current = queue.shift();
    visitedOrder.push(current);
    if (current === end) break;
    for (const n of getNeighbors(current)) {
      if (!n.visited) {
        n.visited = true;
        n.previous = current;
        queue.push(n);
      }
    }
  }
  return { visitedOrder };
}

function dfs(start, end) {
  const visitedOrder = [];
  const stack = [start];
  while (stack.length) {
    const current = stack.pop();
    if (current.visited) continue;
    current.visited = true;
    visitedOrder.push(current);
    if (current === end) break;
    for (const n of getNeighbors(current)) {
      if (!n.visited) {
        n.previous = current;
        stack.push(n);
      }
    }
  }
  return { visitedOrder };
}

function dijkstra(start, end) {
  const visitedOrder = [];
  start.distance = 0;
  const heap = new MinHeap(n => n.distance);
  heap.push(start);
  while (heap.size) {
    const current = heap.pop();
    if (current.visited) continue;
    current.visited = true;
    visitedOrder.push(current);
    if (current === end) break;
    for (const n of getNeighbors(current)) {
      const alt = current.distance + stepCost(current, n);
      if (alt < n.distance) {
        n.distance = alt;
        n.previous = current;
        heap.push(n);
      }
    }
  }
  return { visitedOrder };
}

function astar(start, end) {
  const visitedOrder = [];
  start.g = 0;
  start.f = heuristic(start, end);
  const heap = new MinHeap(n => n.f);
  heap.push(start);
  while (heap.size) {
    const current = heap.pop();
    if (current.visited) continue;
    current.visited = true;
    visitedOrder.push(current);
    if (current === end) break;
    for (const n of getNeighbors(current)) {
      const tentativeG = current.g + stepCost(current, n);
      if (tentativeG < n.g) {
        n.g = tentativeG;
        n.h = heuristic(n, end);
        n.f = n.g + n.h;
        n.previous = current;
        heap.push(n);
      }
    }
  }
  return { visitedOrder };
}

function greedy(start, end) {
  const visitedOrder = [];
  start.h = heuristic(start, end);
  const heap = new MinHeap(n => n.h);
  heap.push(start);
  while (heap.size) {
    const current = heap.pop();
    if (current.visited) continue;
    current.visited = true;
    visitedOrder.push(current);
    if (current === end) break;
    for (const n of getNeighbors(current)) {
      if (!n.visited && n.h === Infinity) {
        n.h = heuristic(n, end);
        n.previous = current;
        heap.push(n);
      }
    }
  }
  return { visitedOrder };
}

// Walks back via `previous` links from the end node to reconstruct the path.
function getPath(end) {
  if (!end.visited) return [];
  const path = [];
  let cur = end;
  while (cur) { path.unshift(cur); cur = cur.previous; }
  return path;
}

// ---------- Run + animate ----------
const algoMap = { bfs, dfs, dijkstra, astar, greedy };

function setStatus(state, text) {
  const dot = document.getElementById('statusDot');
  dot.classList.remove('running', 'done');
  if (state === 'running') dot.classList.add('running');
  if (state === 'done') dot.classList.add('done');
  document.getElementById('statusText').textContent = text;
}

function updateReadout(visited, pathLen, ms) {
  document.getElementById('visitedCount').textContent = visited;
  document.getElementById('pathCount').textContent = pathLen;
  document.getElementById('traceTime').textContent = `${ms}ms`;
}

function setControlsDisabled(disabled) {
  document.querySelectorAll('.btn, .tool-btn, .select, .slider, .toggle-row input').forEach(el => el.disabled = disabled);
  isRunning = disabled;
}

function runAlgorithm(algoName) {
  const start = grid[startNode.row][startNode.col];
  const end = grid[endNode.row][endNode.col];
  const t0 = performance.now();
  const { visitedOrder } = algoMap[algoName](start, end);
  const path = getPath(end);
  const t1 = performance.now();
  return { visitedOrder, path, ms: Math.round((t1 - t0) * 100) / 100 };
}

// Instant (no animation) re-trace — used while dragging start/end after a run
function instantTrace() {
  resetVisualState();
  const { visitedOrder, path, ms } = runAlgorithm(lastRunAlgo);
  for (const node of visitedOrder) {
    if (!node.isStart && !node.isEnd) node.el.classList.add('visited-instant');
  }
  for (const node of path) {
    if (!node.isStart && !node.isEnd) node.el.classList.add('path-instant');
  }
  updateReadout(visitedOrder.length, path.length > 1 ? path.length : 0, ms);
  setStatus('done', path.length > 1 ? 'live re-trace' : 'no path');
}

document.getElementById('runBtn').addEventListener('click', () => {
  if (isRunning) return;
  resetVisualState();
  setControlsDisabled(true);
  setStatus('running', 'tracing…');

  const algoName = algoSelect.value;
  const { visitedOrder, path, ms } = runAlgorithm(algoName);

  const speed = 11 - Number(speedRange.value);
  const stepDelay = Math.max(2, speed * 4);

  visitedOrder.forEach((node, i) => {
    setTimeout(() => {
      if (!node.isStart && !node.isEnd) node.el.classList.add('visited');
      if (i === visitedOrder.length - 1) {
        setTimeout(() => animatePath(path, () => {
          const label = algoSelect.options[algoSelect.selectedIndex].text;
          setStatus('done', path.length > 1 ? `${label} — path found` : `${label} — no path`);
          updateReadout(visitedOrder.length, path.length > 1 ? path.length : 0, ms);
          setControlsDisabled(false);
          lastRunAlgo = algoName;
        }), 100);
      }
    }, i * stepDelay);
  });
});

function animatePath(path, done) {
  if (path.length <= 1) { done(); return; }
  path.forEach((node, i) => {
    setTimeout(() => {
      if (!node.isStart && !node.isEnd) node.el.classList.add('path');
      if (i === path.length - 1) setTimeout(done, 120);
    }, i * 35);
  });
}

createGrid();
