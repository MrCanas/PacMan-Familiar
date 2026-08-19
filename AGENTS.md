# AGENTS.md

## Cursor Cloud specific instructions

Pac-Man Familiar is a single frontend web game: TypeScript + Vite, HTML5 Canvas, no backend and no external services. All standard commands live in `package.json` (`dev`, `build`, `preview`, `lint`, `test`, `format`) and are documented in `README.md`.

- Dev server: `npm run dev` serves at `http://localhost:5173/`. Vite HMR picks up `src/` changes automatically.
- Tests: `npm test` runs Vitest (jsdom, `src/**/*.test.ts`). Use `npm run test:watch` while iterating.
- Build check: `npm run build` runs `tsc --noEmit` (type-check) then `vite build`. There is no separate type-check script, so use `npm run build` to validate types.
- The `dist/` output directory is gitignored; `npm run preview` serves the production build.
