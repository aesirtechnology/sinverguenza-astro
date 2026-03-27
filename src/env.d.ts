/// <reference path="../.astro/types.d.ts" />

import type { AdminUser } from './lib/auth';

interface ImportMetaEnv {
  readonly COSMOS_ENDPOINT: string;
  readonly COSMOS_KEY: string;
  readonly ADMIN_EMAILS?: string;
  readonly AUTH_DISABLED?: string;
  readonly GH_PAT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    adminUser: AdminUser | null;
    authDisabled: boolean;
  }
}
