/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_BUILD_ID?: string;
  readonly VITE_APP_BUILD_NUMBER?: string;
  readonly VITE_APP_GIT_HASH?: string;
  readonly VITE_APP_VERSION_STATE?: 'clean' | 'staged' | 'dirty' | 'unknown';
  readonly VITE_APP_BUILD_TIME?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
