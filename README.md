# PATHTRACE — Pathfinding Visualizer

A retro-terminal styled, interactive pathfinding visualizer built with **vanilla JavaScript** — no frameworks, no dependencies.

**Live demo:** https://pathfinding-visualizer-gilt.vercel.app/

## Algorithms

| Algorithm | Weighted | Shortest path guaranteed |
|---|---|---|
| Breadth-First Search | ✕ | ✓ (unweighted) |
| Depth-First Search | ✕ | ✕ |
| Dijkstra | ✓ | ✓ |
| A* Search | ✓ | ✓ |
| Greedy Best-First | ✓ | ✕ |

Dijkstra, A*, and Greedy use a custom **binary min-heap** priority queue.

## Features

- **Weighted terrain** — paint cost-5 cells and watch Dijkstra/A* route around them while BFS plows straight through
- **Animated maze generation** — recursive division algorithm carves a proper maze
- **Drag start/end nodes directly** — after a run, the trace re-computes live as you drag (no re-running needed)
- **Diagonal movement toggle** with octile-distance heuristic
- Wall drawing, erasing, adjustable animation speed, touch support
- Live readout: nodes visited, path length, trace time

## Run locally

Just open `index.html` in a browser — it's fully static.
