import { OrderData, OrderValidationResponse, PromptFilesWithContentResponse } from "@/types/index";
import { frontendLogger } from '@/lib/utils';

const apiLog = (...args: unknown[]) => {
  frontendLogger('API SERVICE', ...args);
}

export interface ApiResponse {
  success: boolean;
  data?: OrderData;
  message?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    
    apiLog('API Service initialized:', {
      baseUrl: this.baseUrl,
      environment: import.meta.env.MODE
    });
  }

  /**
   * Busca un pedido por su número y código de confirmación
   * @param orderNumber - Número del pedido a buscar
   * @param confirmationCode - Código de confirmación del pedido
   * @returns Promise con los datos del pedido o error
   */
  async lookupOrder(orderNumber: string, confirmationCode: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderNumber, confirmationCode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error buscando pedido:', error);
      return {
        success: false,
        message: error instanceof Error 
          ? error.message 
          : 'Error desconocido al buscar el pedido'
      };
    }
  }

  /**
   * Verifica la conexión con la API
   * @returns Promise con el estado de la conexión
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Conexión exitosa con la API',
        data
      };

    } catch (error) {
      console.error('Error probando conexión:', error);
      return {
        success: false,
        message: error instanceof Error 
          ? `Error de conexión: ${error.message}` 
          : 'Error desconocido de conexión'
      };
    }
  }

  /**
   * Verifica si una orden ya fue procesada
   * @param orderNumber - Número del pedido a verificar
   * @param confirmationCode - Código de confirmación del pedido
   * @returns Promise con el resultado de la verificación
   */
  async checkOrderProcessed(orderNumber: string, confirmationCode: string): Promise<OrderValidationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/validation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderNumber, confirmationCode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error verificando orden procesada:', error);
      return {
        success: false,
        isProcessed: null,
        message: error instanceof Error 
          ? error.message 
          : 'Error desconocido al verificar la orden'
      };
    }
  }

  /**
   * Obtiene el nombre de la tienda desde Shopify
   * @returns Promise con el nombre de la tienda
   */
  async getShopName(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shop`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Error obteniendo nombre de tienda:', response.status);
        return 'CG Asesores'; // Fallback
      }

      const data = await response.json();
      
      if (data.success && data.shopName) {
        return data.shopName;
      } else {
        console.warn('Respuesta inesperada del API de tienda:', data);
        return 'CG Asesores'; // Fallback
      }

    } catch (error) {
      console.error('Error obteniendo nombre de tienda:', error);
      return 'CG Asesores'; // Fallback
    }
  }

  /**
   * Obtiene información de debug sobre el servicio
   * @returns Información de configuración del servicio
   */
  getDebugInfo() {
    return {
      baseUrl: this.baseUrl,
      environment: import.meta.env.MODE
    };
  }

  /**
   * Obtiene prompt files con contenido para un caso de uso específico
   * @param useCase - Caso de uso para filtrar los prompt files
   * @returns Promise con los prompt files y su contenido
   */
  async getPromptFilesWithContent(useCase: string): Promise<PromptFilesWithContentResponse> {
    try {
      apiLog(`🔍 [ApiService] Obteniendo prompt files para caso de uso: ${useCase}`);
      
      const response = await fetch(`${this.baseUrl}/api/promptFiles?useCase=${encodeURIComponent(useCase)}&withContent=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      apiLog(`✅ [ApiService] Prompt files obtenidos:`, {
        success: data.success,
        count: Object.keys(data.promptFiles || {}).length,
        useCase
      });
      
      return data;

    } catch (error) {
      console.error('❌ [ApiService] Error obteniendo prompt files:', error);
      
      return {
        success: false,
        promptFiles: {},
        message: error instanceof Error 
          ? error.message 
          : 'Error desconocido al obtener prompt files'
      };
    }
  }

  /**
   * Archiva una orden procesada usando GraphQL mutation
   * @param orderNumber - Número del pedido procesado
   * @param targetEmail - Email de destino del pedido
   * @returns Promise con el resultado del archivado
   */
  async archiveProcessedOrder(orderNumber: string, targetEmail: string): Promise<{ success: boolean; message?: string }> {
    try {
      apiLog(`📦 [ApiService] Archivando orden procesada: ${orderNumber}`);
      
      const response = await fetch(`${this.baseUrl}/api/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderNumber, 
          targetEmail,
          processedDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      apiLog(`✅ [ApiService] Orden archivada exitosamente:`, {
        success: data.success,
        orderNumber
      });
      
      return data;

    } catch (error) {
      console.error('❌ [ApiService] Error archivando orden:', error);
      
      return {
        success: false,
        message: error instanceof Error 
          ? error.message 
          : 'Error desconocido al archivar la orden'
      };
    }
  }
}

export const apiService = new ApiService();
export default ApiService;
