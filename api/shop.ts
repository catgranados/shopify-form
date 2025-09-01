import type { VercelRequest, VercelResponse } from '@vercel/node';
import ShopifyService from './shopifyService.js';

interface ApiResponse {
  success: boolean;
  shopName?: string;
  message?: string;
}

// Utilidad de logging para debug
const log = (...args: unknown[]) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [SHOP API]`, ...args);
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  log('🚀 Shop name request received:', { method: req.method, url: req.url });
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    log('✅ OPTIONS request handled');
    res.status(200).end();
    return;
  }

  // Solo permitir GET requests
  if (req.method !== 'GET') {
    log('❌ Method not allowed:', req.method);
    res.status(405).json({ 
      success: false, 
      message: 'Método no permitido. Solo se permite GET.' 
    });
    return;
  }

  try {
    log('🏪 Fetching shop name from Shopify...');
    
    const shopifyService = new ShopifyService();
    const shopName = await shopifyService.getShopName();
    
    log('✅ Shop name retrieved successfully:', shopName);
    
    const response: ApiResponse = {
      success: true,
      shopName: shopName
    };
    
    res.status(200).json(response);

  } catch (error) {
    log('❌ Error fetching shop name:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener el nombre de la tienda'
    });
  }
}
