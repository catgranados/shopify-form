import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  console.log("Health check requested - Method:", req.method);
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ 
      success: false, 
      message: 'Método no permitido. Solo se permite GET.' 
    });
    return;
  }

  try {
    // Verificar que las variables de entorno estén configuradas
    const shopifyUrl = process.env.SHOPIFY_SHOP_DOMAIN;
    const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;

    console.log("Environment check:", {
      shopifyUrl: !!shopifyUrl,
      shopifyToken: !!shopifyToken
    });

    const checks = {
      shopifyUrl: !!shopifyUrl,
      shopifyToken: !!shopifyToken,
    };

    const isHealthy = checks.shopifyUrl && checks.shopifyToken;

    const response = {
      status: isHealthy ? 'ok' : 'warning',
      message: isHealthy 
        ? 'API funcionando correctamente con configuración completa' 
        : 'Configuración incompleta - revisa variables de entorno',
      timestamp: new Date().toISOString(),
      version: '1.0.0-vercel',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        environment: {
          shopifyUrl: checks.shopifyUrl ? 'configured' : 'missing',
          shopifyToken: checks.shopifyToken ? 'configured' : 'missing'
        }
      }
    };

    console.log("Health check response:", response);
    res.status(isHealthy ? 200 : 503).json(response);

  } catch (error) {
    console.error('Error en health check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
