import type { VercelRequest, VercelResponse } from '@vercel/node';
import ShopifyService from './shopifyService.js';

// Interfaces para tipado
interface OrderData {
  orderNumber: string;
  customerName: string;
  documentType: string;
  amount: number;
  date: string;
  status: string;
  email: string;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
}

interface ApiResponse {
  success: boolean;
  data?: OrderData;
  message?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ 
      success: false, 
      message: 'Método no permitido. Solo se permite POST.' 
    });
    return;
  }

  try {
    // Obtener el número de pedido del body
    const { orderNumber } = req.body;

    if (!orderNumber) {
      res.status(400).json({
        success: false,
        message: 'Número de pedido es requerido'
      });
      return;
    }

    // Validar formato del número de pedido
    if (!/^\d+$/.test(orderNumber.toString())) {
      res.status(400).json({
        success: false,
        message: 'El número de pedido debe contener solo números'
      });
      return;
    }

    // Usar Shopify Service para buscar la orden
    let orderData: OrderData | null = null;
    
    try {
      const shopifyService = new ShopifyService();
      orderData = await lookupOrderFromShopify(shopifyService, orderNumber);
    } catch (shopifyError) {
      console.error('Error al conectar con Shopify:', shopifyError);
      
      // Fallback a datos simulados si Shopify no está disponible
      console.log('Usando datos simulados como fallback...');
      orderData = await lookupOrderFallback(orderNumber);
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
        message: 'Número de pedido no encontrado en nuestros registros'
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

// Función para buscar pedidos en Shopify
async function lookupOrderFromShopify(shopifyService: ShopifyService, orderNumber: string): Promise<OrderData | null> {
  try {
    const shopifyOrder = await shopifyService.findOrderByNumber(orderNumber);
    
    if (shopifyOrder) {
      return shopifyService.transformOrderData(shopifyOrder);
    }
    
    return null;
  } catch (error) {
    console.error('Error al buscar en Shopify:', error);
    throw error;
  }
}

// Función de fallback con datos simulados (para desarrollo y testing)
async function lookupOrderFallback(orderNumber: string): Promise<OrderData | null> {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Base de datos simulada
  const mockOrders: { [key: string]: OrderData } = {
    '1001': {
      orderNumber: '1001',
      customerName: 'Juan Pérez',
      documentType: 'Factura Comercial',
      amount: 250.00,
      date: new Date().toLocaleDateString('es-ES'),
      status: 'Pagado - Enviado',
      email: 'juan.perez@email.com',
      items: [
        { title: 'Producto Demo 1', quantity: 2, price: 125.00 }
      ]
    },
    '1002': {
      orderNumber: '1002',
      customerName: 'María García',
      documentType: 'Contrato de Servicios',
      amount: 500.00,
      date: new Date().toLocaleDateString('es-ES'),
      status: 'Pagado - Pendiente de Envío',
      email: 'maria.garcia@email.com',
      items: [
        { title: 'Servicio Premium', quantity: 1, price: 500.00 }
      ]
    },
    '1003': {
      orderNumber: '1003',
      customerName: 'Carlos López',
      documentType: 'Certificado Legal',
      amount: 150.00,
      date: new Date().toLocaleDateString('es-ES'),
      status: 'Pagado - Enviado',
      email: 'carlos.lopez@email.com',
      items: [
        { title: 'Certificado Digital', quantity: 1, price: 150.00 }
      ]
    }
  };

  return mockOrders[orderNumber] || null;
}
