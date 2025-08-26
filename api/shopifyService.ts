// Servicio para interactuar con Shopify API
// Este archivo se ejecuta en el servidor (Vercel Functions)

export interface ShopifyOrder {
  id: string;
  order_number: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  line_items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: string;
  }>;
}

export interface ShopifyApiResponse {
  orders?: ShopifyOrder[];
  order?: ShopifyOrder;
  errors?: string[];
}

class ShopifyService {
  private shopifyUrl: string;
  private accessToken: string;
  private apiVersion: string;

  constructor() {
    this.shopifyUrl = process.env.SHOPIFY_STORE_URL || '';
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN || '';
    this.apiVersion = process.env.SHOPIFY_API_VERSION || '2024-07';

    if (!this.shopifyUrl || !this.accessToken) {
      throw new Error('SHOPIFY_STORE_URL y SHOPIFY_ACCESS_TOKEN son requeridos');
    }
  }

  /**
   * Construye la URL completa de la API de Shopify
   */
  private getApiUrl(endpoint: string): string {
    return `${this.shopifyUrl}/admin/api/${this.apiVersion}/${endpoint}`;
  }

  /**
   * Realiza una petición GET a la API de Shopify
   */
  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = this.getApiUrl(endpoint);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al comunicarse con Shopify:', error);
      throw error;
    }
  }

  /**
   * Busca una orden por su número
   * @param orderNumber - Número de la orden en Shopify
   */
  async findOrderByNumber(orderNumber: string): Promise<ShopifyOrder | null> {
    try {
      // Buscar por nombre de orden (incluye el número)
      const response = await this.makeRequest<ShopifyApiResponse>(
        `orders.json?name=${encodeURIComponent('#' + orderNumber)}&status=any`
      );

      if (response.orders && response.orders.length > 0) {
        return response.orders[0];
      }

      // Si no encuentra por nombre, buscar por order_number
      const responseByNumber = await this.makeRequest<ShopifyApiResponse>(
        `orders.json?status=any&limit=250`
      );

      if (responseByNumber.orders) {
        const order = responseByNumber.orders.find(
          order => order.order_number === orderNumber
        );
        return order || null;
      }

      return null;
    } catch (error) {
      console.error(`Error buscando orden ${orderNumber}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene una orden por su ID
   * @param orderId - ID de la orden en Shopify
   */
  async getOrderById(orderId: string): Promise<ShopifyOrder | null> {
    try {
      const response = await this.makeRequest<{ order: ShopifyOrder }>(
        `orders/${orderId}.json`
      );
      return response.order || null;
    } catch (error) {
      console.error(`Error obteniendo orden ${orderId}:`, error);
      return null;
    }
  }

  /**
   * Verifica el estado de la conexión con Shopify
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
    try {
      // Intentar obtener la información de la tienda
      await this.makeRequest<{ shop: { name: string } }>('shop.json');
      return {
        status: 'ok',
        message: 'Conexión con Shopify exitosa'
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Error de conexión con Shopify: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Transforma una orden de Shopify al formato de nuestra aplicación
   */
  transformOrderData(shopifyOrder: ShopifyOrder): {
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
  } {
    return {
      orderNumber: shopifyOrder.order_number,
      customerName: `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`.trim(),
      documentType: 'Factura de Compra', // Puedes personalizar esto según tu lógica
      amount: parseFloat(shopifyOrder.total_price),
      date: new Date(shopifyOrder.created_at).toLocaleDateString('es-ES'),
      status: this.getStatusInSpanish(shopifyOrder.financial_status, shopifyOrder.fulfillment_status),
      email: shopifyOrder.email,
      items: shopifyOrder.line_items.map(item => ({
        title: item.title,
        quantity: item.quantity,
        price: parseFloat(item.price)
      }))
    };
  }

  /**
   * Convierte los estados de Shopify al español
   */
  private getStatusInSpanish(financialStatus: string, fulfillmentStatus: string | null): string {
    const financialStatusMap: { [key: string]: string } = {
      'pending': 'Pago Pendiente',
      'authorized': 'Autorizado',
      'partially_paid': 'Parcialmente Pagado',
      'paid': 'Pagado',
      'partially_refunded': 'Parcialmente Reembolsado',
      'refunded': 'Reembolsado',
      'voided': 'Anulado'
    };

    const fulfillmentStatusMap: { [key: string]: string } = {
      'fulfilled': 'Enviado',
      'partial': 'Envío Parcial',
      'restocked': 'Restock'
    };

    const financial = financialStatusMap[financialStatus] || financialStatus;
    const fulfillment = fulfillmentStatus ? fulfillmentStatusMap[fulfillmentStatus] || fulfillmentStatus : 'Pendiente de Envío';

    return `${financial} - ${fulfillment}`;
  }
}

export default ShopifyService;
