# PATHTRACE — Pathfinding Visualizer

A retro terminal-styled grid where you draw walls, drop a start/end node, and
watch **BFS**, **DFS**, **Dijkstra**, or **A\*** race across the board to find
a route — with the shortest path lighting up like a signal trace on a circuit
board.

**Live demo:** _add your Vercel URL here after deploying_

<img width="1872" height="1170" alt="image" src="https://github.com/user-attachments/assets/0ff7258a-bbcc-42b0-833b-760d23b70157" />

## Features
- 4 pathfinding algorithms: Breadth-First Search, Depth-First Search,
  Dijkstra, A* (Manhattan heuristic)
- Draw walls by click-and-drag, move start/end nodes with dedicated tools
- Random maze generator
- Adjustable animation speed
- Live readout: nodes visited, path length, trace time
- Zero dependencies — plain HTML/CSS/JS

## Run locally
No build step needed.

```bash
git clone https://github.com/<your-username>/pathfinding-visualizer.git
cd pathfinding-visualizer
# just open index.html in a browser, or serve it:
npx serve .
```

## Deploy for free

### Vercel
1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Framework preset: **Other** (static site). No build command needed.
4. Deploy — done.

### Netlify / GitHub Pages
Works identically since it's a static site — just point either platform at
this folder with no build command.

## How it works
Each grid cell is a node with `distance`, `previous`, `visited` fields. Every
algorithm returns the order nodes were visited in; the UI replays that order
with `setTimeout`, then walks the `previous` chain backward from the end node
to animate the final path.

## Ideas to extend
- Weighted terrain (cells that cost more to cross)
- Diagonal movement
- Bidirectional search
- Save/load maze layouts to localStorage
