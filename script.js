// ---------- Grid setup ----------
const ROWS = 17;
const COLS = 31;

const gridEl = document.getElementById('grid');
gridEl.style.gridTemplateColumns = `repeat(${COLS}, 26px)`;
gridEl.style.gridTemplateRows = `repeat(${ROWS}, 26px)`;

let grid = [];
let startNode = { row: 8, col: 6 };
let endNode = { row: 8, col: 24 };
let isMouseDown = false;
let currentTool = 'wall';
let isRunning = false;

function createGrid() {
  grid = [];
  gridEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    const rowArr = [];
    for (let c = 0; c < COLS; c++) {
      const node = {
        row: r, col: c,
        isWall: false,
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
      cellEl.addEventListener('mousedown', () => handleCellAction(node, cellEl));
      cellEl.addEventListener('mouseenter', () => { if (isMouseDown) handleCellAction(node, cellEl); });
      node.el = cellEl;
      gridEl.appendChild(cellEl);
      rowArr.push(node);
    }
    grid.push(rowArr);
  }
}

function handleCellAction(node, cellEl) {
  if (isRunning) return;
  if (currentTool === 'wall') {
    if (node.isStart || node.isEnd) return;
    node.isWall = true;
    cellEl.classList.add('wall');
  } else if (currentTool === 'erase') {
    node.isWall = false;
    cellEl.classList.remove('wall');
  } else if (currentTool === 'start') {
    if (node.isEnd) return;
    grid[startNode.row][startNode.col].isStart = false;
    grid[startNode.row][startNode.col].el.classList.remove('start');
    node.isWall = false;
    node.isStart = true;
    cellEl.classList.remove('wall');
    cellEl.classList.add('start');
    startNode = { row: node.row, col: node.col };
  } else if (currentTool === 'end') {
    if (node.isStart) return;
    grid[endNode.row][endNode.col].isEnd = false;
    grid[endNode.row][endNode.col].el.classList.remove('end');
    node.isWall = false;
    node.isEnd = true;
    cellEl.classList.remove('wall');
    cellEl.classList.add('end');
    endNode = { row: node.row, col: node.col };
  }
}

document.addEventListener('mousedown', () => isMouseDown = true);
document.addEventListener('mouseup', () => isMouseDown = false);

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.dataset.tool;
  });
});

// ---------- Reset helpers ----------
function resetVisualState() {
  for (const row of grid) {
    for (const node of row) {
      node.distance = Infinity; node.f = Infinity; node.g = Infinity; node.h = Infinity;
      node.visited = false; node.previous = null;
      node.el.classList.remove('visited', 'path');
    }
  }
}

document.getElementById('clearWallsBtn').addEventListener('click', () => {
  if (isRunning) return;
  for (const row of grid) for (const node of row) {
    node.isWall = false;
    node.el.classList.remove('wall');
  }
});

document.getElementById('clearAllBtn').addEventListener('click', () => {
  if (isRunning) return;
  startNode = { row: 8, col: 6 };
  endNode = { row: 8, col: 24 };
  createGrid();
  setStatus('idle', 'grid ready');
  updateReadout(0, 0, 0);
});

document.getElementById('mazeBtn').addEventListener('click', () => {
  if (isRunning) return;
  for (const row of grid) {
    for (const node of row) {
      if (node.isStart || node.isEnd) continue;
      const wall = Math.random() < 0.28;
      node.isWall = wall;
      node.el.classList.toggle('wall', wall);
    }
  }
});

// ---------- Neighbors ----------
function getNeighbors(node) {
  const { row, col } = node;
  const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
  const result = [];
  for (const [dr, dc] of deltas) {
    const r = row + dr, c = col + dc;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && !grid[r][c].isWall) {
      result.push(grid[r][c]);
    }
  }
  return result;
}

function manhattan(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// ---------- Algorithms: each returns {visitedOrder, path} ----------
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
  const unvisited = [];
  for (const row of grid) for (const n of row) unvisited.push(n);

  while (unvisited.length) {
    unvisited.sort((a, b) => a.distance - b.distance);
    const current = unvisited.shift();
    if (current.distance === Infinity) break;
    current.visited = true;
    visitedOrder.push(current);
    if (current === end) break;
    for (const n of getNeighbors(current)) {
      const alt = current.distance + 1;
      if (alt < n.distance) {
        n.distance = alt;
        n.previous = current;
      }
    }
  }
  return { visitedOrder };
}

function astar(start, end) {
  const visitedOrder = [];
  start.g = 0;
  start.f = manhattan(start, end);
  const open = [start];

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    if (current.visited) continue;
    current.visited = true;
    visitedOrder.push(current);
    if (current === end) break;
    for (const n of getNeighbors(current)) {
      const tentativeG = current.g + 1;
      if (tentativeG < n.g) {
        n.g = tentativeG;
        n.h = manhattan(n, end);
        n.f = n.g + n.h;
        n.previous = current;
        if (!open.includes(n)) open.push(n);
      }
    }
  }
  return { visitedOrder };
}

// Walks back via `previous` links from the end node to reconstruct the path.
// Returns [] if the end node was never reached by the search.
function getPath(end) {
  if (!end.visited) return [];
  const path = [];
  let cur = end;
  while (cur) { path.unshift(cur); cur = cur.previous; }
  return path;
}

// ---------- Run + animate ----------
const algoMap = { bfs, dfs, dijkstra, astar };

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
  document.querySelectorAll('.btn, .tool-btn, .select').forEach(el => el.disabled = disabled);
  isRunning = disabled;
}

document.getElementById('runBtn').addEventListener('click', () => {
  if (isRunning) return;
  resetVisualState();
  setControlsDisabled(true);
  setStatus('running', 'tracing…');

  const start = grid[startNode.row][startNode.col];
  const end = grid[endNode.row][endNode.col];
  const algoName = document.getElementById('algoSelect').value;
  const t0 = performance.now();
  const { visitedOrder } = algoMap[algoName](start, end);
  const path = getPath(end);
  const t1 = performance.now();

  const speed = 11 - Number(document.getElementById('speedRange').value);
  const stepDelay = Math.max(2, speed * 4);

  visitedOrder.forEach((node, i) => {
    setTimeout(() => {
      if (!node.isStart && !node.isEnd) node.el.classList.add('visited');
      if (i === visitedOrder.length - 1) {
        setTimeout(() => animatePath(path, () => {
          setStatus('done', path.length > 1 ? 'trace complete — path found' : 'trace complete — no path found');
          updateReadout(visitedOrder.length, path.length > 1 ? path.length : 0, Math.round(t1 - t0));
          setControlsDisabled(false);
        }), 100);
      }
    }, i * stepDelay);
  });

  if (visitedOrder.length === 0) {
    setControlsDisabled(false);
    setStatus('idle', 'nothing to trace');
  }
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
