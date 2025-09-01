/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_AUTO_FILL_FORMS: string
  readonly VITE_MAKE_WEBHOOK: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
