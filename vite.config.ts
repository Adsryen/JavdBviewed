// Root shim: extension Vite config lives under apps/extension.
// Prefer: pnpm --filter @javdb/extension build  OR  pnpm build (scripts/build.ts)
export { default } from './apps/extension/vite.config.ts';
