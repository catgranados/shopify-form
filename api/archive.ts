import type { VercelRequest, VercelResponse } from '@vercel/node';
import ShopifyService from './shopifyService.js';
import { backendLogger } from '../src/lib/utils.ts';

interface ArchiveRequest {
  orderNumber: string;
  targetEmail: string;
  processedDate: string;
}

interface ArchiveResponse {
  success: boolean;
  message?: string;
  metaobjectId?: string;
}

const archiveLog = (...args: unknown[]) => {
  backendLogger('ARCHIVE API', ...args);
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  archiveLog('🚀 Archive request received:', { method: req.method, url: req.url });
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    archiveLog('✅ OPTIONS request handled');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    archiveLog('❌ Method not allowed:', req.method);
    res.status(405).json({ 
      success: false, 
      message: 'Método no permitido. Solo se permite POST.' 
    });
    return;
  }

  try {
    archiveLog('📝 Archive request body:', req.body);
    const { orderNumber, targetEmail, processedDate }: ArchiveRequest = req.body;

    // Validaciones
    if (!orderNumber) {
      res.status(400).json({
        success: false,
        message: 'Número de pedido es requerido para el archivado'
      });
      return;
    }

    if (!targetEmail) {
      res.status(400).json({
        success: false,
        message: 'Email de destino es requerido para el archivado'
      });
      return;
    }

    if (!processedDate) {
      res.status(400).json({
        success: false,
        message: 'Fecha de procesamiento es requerida para el archivado'
      });
      return;
    }

    archiveLog('📦 Archiving processed order:', {
      orderNumber,
      targetEmail,
      processedDate
    });

    try {
      const shopifyService = new ShopifyService();
      archiveLog('🛍️ Shopify service initialized for archiving...');
      
      // Crear metaobject para orden procesada
      const metaobjectResult = await shopifyService.createProcessedOrderMetaobject({
        orderNumber,
        targetEmail,
        processedDate
      });

      if (metaobjectResult.success) {
        archiveLog('✅ Order archived successfully:', metaobjectResult.metaobjectId);
        
        const response: ArchiveResponse = {
          success: true,
          message: 'Orden archivada exitosamente',
          metaobjectId: metaobjectResult.metaobjectId
        };
        
        res.status(200).json(response);
      } else {
        archiveLog('❌ Failed to archive order:', metaobjectResult.error);
        
        const response: ArchiveResponse = {
          success: false,
          message: metaobjectResult.error || 'Error desconocido al archivar la orden'
        };
        
        res.status(500).json(response);
      }

    } catch (shopifyError) {
      archiveLog('❌ Shopify archive error:', shopifyError);
      
      const response: ArchiveResponse = {
        success: false,
        message: 'Error al conectar con Shopify para el archivado'
      };
      
      res.status(500).json(response);
    }

  } catch (error) {
    console.error('Error en la API de archivado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante el archivado'
    });
  }
}
