import type { VercelRequest, VercelResponse } from '@vercel/node';
import ShopifyService from './shopifyService.js';
import { OrderData } from '../src/types/index';

interface ApiResponse {
  success: boolean;
  data?: OrderData;
  message?: string;
}

const log = (...args: unknown[]) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [ORDERS API]`, ...args);
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  log('🚀 Request received:', { method: req.method, url: req.url });
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    log('✅ OPTIONS request handled');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    log('❌ Method not allowed:', req.method);
    res.status(405).json({ 
      success: false, 
      message: 'Método no permitido. Solo se permite POST.' 
    });
    return;
  }

  try {
    log('📝 Request body:', req.body);
    const { orderNumber, confirmationCode } = req.body;

    if (!orderNumber) {
      res.status(400).json({
        success: false,
        message: 'Número de pedido es requerido'
      });
      return;
    }

    if (!confirmationCode) {
      res.status(400).json({
        success: false,
        message: 'Código de confirmación es requerido'
      });
      return;
    }

    if (!/^\d+$/.test(orderNumber.toString())) {
      log('❌ Invalid order number format:', orderNumber);
      res.status(400).json({
        success: false,
        message: 'El número de pedido debe contener solo números'
      });
      return;
    }

    log('🔍 Looking up order:', orderNumber, 'with confirmation code:', confirmationCode);

    const cheatCode = process.env.FORM_CHEATCODE;
    
    if (cheatCode && (orderNumber.toString() === cheatCode || confirmationCode === cheatCode)) {
      log('🎯 Cheat code detected in one of the fields, returning mock data');
      const mockOrderData: OrderData = {
        id: 'bypass-order-id',
        orderNumber: orderNumber.toString(),
        amount: 0,
        date: new Date().toISOString(),
        status: 'completed',
        items: [{
          title: 'Servicio de Bypass',
          quantity: 1,
          price: 0
        }]
      };
      
      const response: ApiResponse = {
        success: true,
        data: mockOrderData
      };
      res.status(200).json(response);
      return;
    }

    let orderData: OrderData | null = null;
    
    try {
      const shopifyService = new ShopifyService();
      log('🛍️ Shopify service initialized, searching for order...');
      orderData = await lookupOrderFromShopify(shopifyService, orderNumber, confirmationCode);
      log('📦 Shopify lookup result:', orderData ? 'Found' : 'Not found');
    } catch (shopifyError) {
      log('❌ Shopify error:', shopifyError);
    }

    if (orderData) {
      const response: ApiResponse = {
        success: true,
        data: orderData
      };
      res.status(200).json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        message: 'Número de pedido o código de confirmación no encontrado en nuestros registros'
      };
      res.status(404).json(response);
    }

  } catch (error) {
    console.error('Error en la API de pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function lookupOrderFromShopify(shopifyService: ShopifyService, orderNumber: string, confirmationCode: string): Promise<OrderData | null> {
  try {
    const shopifyOrder = await shopifyService.findOrderByNumber(orderNumber, confirmationCode);
    
    if (shopifyOrder) {
      return shopifyOrder; 
    }
    
    return null;
  } catch (error) {
    console.error('Error al buscar en Shopify:', error);
    throw error;
  }
}
