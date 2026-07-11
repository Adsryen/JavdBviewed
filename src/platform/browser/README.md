# Browser Platform

Chrome / Firefox extension integration wrappers live here.

Examples:

- Runtime messaging (`sendRuntimeMessage`).
- Extension API facade (`extensionApi`, `compatBootstrap`) — normalizes `chrome`/`browser` at entry points.
- Tabs/windows helpers.
- Extension URL helpers.
- Visibility and page lifecycle helpers.

## Cross-browser compatibility

Manifest entries import `compatBootstrap` first so `globalThis.chrome` is available on Firefox
(when only `browser` is exposed). Prefer this platform layer over `if (firefox)` in features.

Do **not** add `webextension-polyfill` unless a measured API gap requires Promise-only `browser.*`.
