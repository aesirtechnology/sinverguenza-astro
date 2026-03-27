/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly COSMOS_ENDPOINT: string;
  readonly COSMOS_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
