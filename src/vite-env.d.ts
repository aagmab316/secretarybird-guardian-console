/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_MSW?: string;
  readonly VITE_GUARDIAN_API_TOKEN?: string;
  readonly VITE_TENANT_ID?: string;
  readonly VITE_OPERATOR_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
