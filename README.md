# Sudoku

Desktop Sudoku game with single-player and online two-player race modes.
Built with React, TypeScript and Vite; deployed to GitHub Pages.

## Development

```bash
npm install
npm run dev     # start dev server
npm test        # run unit tests
npm run build   # production build into dist/
```

Pushing to `main` builds and deploys the site via `.github/workflows/deploy.yml`.

## Puzzles

Puzzles come from the [Sudoku Exchange puzzle bank](https://github.com/grantm/sudoku-exchange-puzzle-bank)
(public domain). They were generated with [QQWing](https://github.com/stephenostermiller/qqwing) and
rated with [Sukaku Explainer](https://github.com/SudokuMonster/SukakuExplainer):

| App difficulty | Bank file        | Sukaku Explainer rating |
| -------------- | ---------------- | ----------------------- |
| Easy           | `easy.txt`       | < 1.5                   |
| Medium         | `medium.txt`     | 1.5 – 2.4               |
| Hard           | `hard.txt`       | 2.5 – 4.9               |
| Extreme        | `diabolical.txt` | ≥ 5.0                   |

`scripts/import-puzzles.ts` takes a sample from each file, checks that every puzzle has exactly
one solution, computes the solutions, and writes `public/puzzles/<difficulty>.json`. The unit
tests re-check every bundled puzzle. To re-import:

```bash
git clone https://github.com/grantm/sudoku-exchange-puzzle-bank /tmp/bank
node --experimental-strip-types scripts/import-puzzles.ts /tmp/bank 1000
```
