/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_BASE_URL: string
  
  // Webhook Configuration  
  readonly VITE_MAKE_WEBHOOK: string
  
  // Shopify Configuration
  readonly VITE_SHOPIFY_SHOP_DOMAIN: string
  
  // Development Configuration
  readonly VITE_AUTO_FILL_FORMS: string
  
  // Built-in Vite variables
  readonly MODE: string
  readonly BASE_URL: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
