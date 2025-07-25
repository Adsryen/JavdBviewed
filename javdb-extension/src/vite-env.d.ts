/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_VERSION_STATE: 'clean' | 'dev' | 'dirty' | 'unknown';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 