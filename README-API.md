# Shop### Variables de Entorno

1. Copia el archivo de ejemplo:

```bash
cp .env.example .env.local
```

2. Configura las variables en `.env.local`:

```env
# API Configuration
API_SECRET_KEY=tu_api_key_super_secreta_aqui_2024
VITE_API_BASE_URL=http://localhost:3000

# Shopify Configuration
SHOPIFY_STORE_URL=https://tu-tienda.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_tu_access_token_aqui
SHOPIFY_API_VERSION=2024-07
```

### Configuración de Shopify

Para conectar con tu tienda de Shopify:

1. **Obtener Access Token de Shopify:**
   - Ve a tu Admin de Shopify
   - Settings → Apps and sales channels
   - Develop apps → Create an app
   - Configure Admin API access tokens
   - Permisos necesarios: `read_orders`

2. **URL de tu tienda:**
   - Formato: `https://tu-tienda.myshopify.com`
   - Reemplaza `tu-tienda` con el nombre real de tu tiendaenerador de Documentos Legales

Este proyecto utiliza React + Vite + TypeScript con serverless functions de Vercel para generar documentos legales basados en números de pedido.

## 🚀 Configuración del Proyecto

### Variables de Entorno

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env.local
```

2. Configura las variables en `.env.local`:
```env
VITE_API_SECRET_KEY=tu_api_key_super_secreta_aqui_2024
VITE_API_BASE_URL=http://localhost:3000
```

### Instalación

```bash
npm install
```

### Desarrollo Local

```bash
npm run dev
```

## 🌐 Despliegue en Vercel

### 1. Configurar Variables de Entorno en Vercel

Ve al dashboard de Vercel y configura las siguientes variables de entorno:

- `VITE_API_SECRET_KEY`: Una clave secreta única y segura
- (Vercel configurará automáticamente `VITE_API_BASE_URL` con tu dominio)

### 2. Configurar la API Secret Key

En el dashboard de Vercel:
1. Ve a tu proyecto
2. Settings → Environment Variables
3. Agrega `VITE_API_SECRET_KEY` con un valor seguro

### 3. Usar Vercel Secrets (Opcional - Más Seguro)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Configurar secret
vercel secrets add api-secret-key "tu_valor_super_secreto_aqui"
```

El archivo `vercel.json` ya está configurado para usar este secret.

## 🔧 Estructura de las APIs

### `/api/orders` (POST)
Consulta información de pedidos.

**Headers requeridos:**
- `Content-Type: application/json`
- `X-Shopify-Access-Token: tu_api_key`

**Body:**
```json
{
  "orderNumber": "1001"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "1001",
    "customerName": "Juan Pérez",
    "documentType": "Factura Comercial",
    "amount": 250.00,
    "date": "25/8/2025",
    "status": "Completado"
  }
}
```

### `/api/health` (GET)
Verifica el estado de la API.

**Headers requeridos:**
- `X-Shopify-Access-Token: tu_api_key`

## 🧪 Números de Pedido de Prueba

Para desarrollo y testing, puedes usar estos números:
- `1001`: Juan Pérez - Factura Comercial
- `1002`: María García - Contrato de Servicios  
- `1003`: Carlos López - Certificado Legal

## 🔒 Seguridad

- ✅ Validación de API keys en todas las rutas
- ✅ CORS configurado correctamente
- ✅ Validación de entrada en las APIs
- ✅ Manejo de errores robusto
- ✅ Headers de seguridad

## 📁 Estructura del Proyecto

```
shopify-form/
├── api/                    # Serverless Functions (Vercel)
│   ├── orders.ts          # API para consultar pedidos
│   └── health.ts          # Health check
├── src/
│   ├── components/        # Componentes React
│   ├── services/          # Servicios API
│   ├── constants/         # Constantes y textos
│   └── lib/              # Utilidades
├── vercel.json           # Configuración de Vercel
├── .env.example          # Variables de entorno de ejemplo
└── tsconfig.api.json     # TypeScript config para APIs
```

## 🚨 Notas Importantes

1. **Nunca subas `.env.local` al repositorio**
2. **Usa valores únicos y seguros para `VITE_API_SECRET_KEY`**
3. **En producción, considera usar autenticación más robusta**
4. **Las APIs actuales usan datos simulados - conecta con tu base de datos real**

## 🛠️ Personalización

Para conectar con tu API real:
1. Modifica `/api/orders.ts` 
2. Reemplaza la función `lookupOrder` con tu lógica de base de datos
3. Actualiza las interfaces TypeScript según tu esquema de datos
