// Interfaces para tipado
export interface OrderData {
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

export interface ApiResponse {
  success: boolean;
  data?: OrderData;
  message?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // URL base de las serverless functions de Vercel
    // En producción, usa el mismo origen donde está desplegada la app
    // En desarrollo, usa la URL configurada en .env
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    
    console.log('API Service initialized:', {
      baseUrl: this.baseUrl,
      environment: import.meta.env.MODE
    });
  }

  /**
   * Busca un pedido por su número
   * @param orderNumber - Número del pedido a buscar
   * @returns Promise con los datos del pedido o error
   */
  async lookupOrder(orderNumber: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderNumber }),
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
   * Obtiene información de debug sobre el servicio
   * @returns Información de configuración del servicio
   */
  getDebugInfo() {
    return {
      baseUrl: this.baseUrl,
      environment: import.meta.env.MODE
    };
  }
}

// Exportar una instancia singleton
export const apiService = new ApiService();
export default ApiService;
