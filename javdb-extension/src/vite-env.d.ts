/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_VERSION_STATE?: 'clean' | 'dev' | 'dirty' | 'unknown';
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}