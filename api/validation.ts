import type { VercelRequest, VercelResponse } from '@vercel/node';
import ShopifyService from './shopifyService.js';
import {
  OrderValidationResponse
} from "../src/types/index";
import backendLogger from "./lib/logger.js";

const validationLog = (...args: unknown[]) => {
  backendLogger('VALIDATION API', ...args);
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  validationLog('🚀 Validation request received:', { method: req.method, url: req.url });
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    validationLog('✅ OPTIONS request handled');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    validationLog('❌ Method not allowed:', req.method);
    res.status(405).json({ 
      success: false, 
      isProcessed: null,
      message: 'Método no permitido. Solo se permite POST.' 
    });
    return;
  }

  try {
    validationLog('📝 Request body:', req.body);
    const { orderNumber, confirmationCode } = req.body;

    if (!orderNumber) {
      res.status(400).json({
        success: false,
        isProcessed: null,
        message: 'Número de pedido es requerido'
      });
      return;
    }

    if (!confirmationCode) {
      res.status(400).json({
        success: false,
        isProcessed: null,
        message: 'Código de confirmación es requerido'
      });
      return;
    }

    if (!/^\d+$/.test(orderNumber.toString())) {
      validationLog('❌ Invalid order number format:', orderNumber);
      res.status(400).json({
        success: false,
        isProcessed: null,
        message: 'El número de pedido debe contener solo números'
      });
      return;
    }

    validationLog('🔍 Validating order:', orderNumber);

    const cheatCode = process.env.FORM_CHEATCODE;
    
    if (cheatCode && (orderNumber.toString() === cheatCode || confirmationCode === cheatCode)) {
      validationLog('🎯 Cheat code detected in one of the fields, allowing bypass');
      const response: OrderValidationResponse = {
        success: true,
        isProcessed: null,
        allowBypass: true,
        message: 'Código de bypass detectado'
      };
      res.status(200).json(response);
      return;
    }

    try {
      const shopifyService = new ShopifyService();
      validationLog('🛍️ Shopify service initialized, checking if order processed...');
      
      const isProcessed = await shopifyService.checkIfOrderProcessed(orderNumber);
      validationLog('📦 Order processed data result:', isProcessed);

      const response: OrderValidationResponse = {
        success: true,
        isProcessed: isProcessed,
        message: isProcessed 
          ? 'Esta orden ya fue procesada anteriormente'
          : 'Orden disponible para procesar'
      };

      res.status(200).json(response);

    } catch (shopifyError) {
      validationLog('❌ Shopify validation error:', shopifyError);
      
      const response: OrderValidationResponse = {
        success: true,
        isProcessed: null,
        message: 'No se pudo verificar el estado de la orden, pero puedes continuar'
      };
      res.status(200).json(response);
    }

  } catch (error) {
    console.error('Error en la API de validación:', error);
    res.status(500).json({
      success: false,
      isProcessed: null,
      message: 'Error interno del servidor'
    });
  }
}
