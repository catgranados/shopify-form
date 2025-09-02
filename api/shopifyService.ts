import { OrderData, ProcessedOrderData } from '../src/types/index';
import backendLogger from "./lib/logger.js";

const shopifyServiceLog = (...args: unknown[]) => {
  backendLogger('SHOPIFY SERVICE', ...args);
};

interface ShopifyOrder {
  id: string;
  name: string; 
  createdAt: string;
  totalPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        originalUnitPriceSet: {
          shopMoney: {
            amount: string;
            currencyCode: string;
          };
        };
      };
    }>;
  };
}

interface ShopifyMetaobject {
  id: string;
  handle: string;
  fields: Array<{
    key: string;
    value: string;
  }>;
}

interface MetaobjectByHandleResponse {
  data: {
    metaobjectByHandle: ShopifyMetaobject | null;
  };
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
}

interface ShopifyGraphQLResponse {
  data: {
    orders?: {
      edges: Array<{
        node: ShopifyOrder;
      }>;
    };
    shop?: {
      name: string;
    };
    metaobjectByHandle?: ShopifyMetaobject;
    metaobjects?: {
      edges: Array<{
        node: ShopifyMetaobject;
      }>;
    };
    metaobjectCreate?: {
      metaobject?: {
        id: string;
        handle: string;
      };
      userErrors?: Array<{
        field: string[];
        message: string;
      }>;
    };
  };
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
}


class ShopifyService {
  private shopDomain: string;
  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor() {
    this.shopDomain = process.env.SHOPIFY_SHOP_DOMAIN!;
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN!;
    this.apiVersion = process.env.SHOPIFY_API_VERSION || "2024-07";
    this.baseUrl = `${this.shopDomain}/admin/api/${this.apiVersion}/graphql.json`;

    shopifyServiceLog("🔧 ShopifyService initialized", {
      shopDomain: this.shopDomain ? "✅" : "❌",
      accessToken: this.accessToken ? "✅" : "❌",
      apiVersion: this.apiVersion,
      baseUrl: this.baseUrl,
    });

    if (!this.shopDomain || !this.accessToken) {
      shopifyServiceLog("❌ Missing Shopify configuration");
      throw new Error("Missing Shopify configuration in environment variables");
    }
  }

  /**
   * Obtiene el nombre de la tienda desde Shopify
   */
  async getShopName(): Promise<string> {
    const query = `
      query {
        shop {
          name
        }
      }
    `;

    try {
      shopifyServiceLog("🏪 Fetching shop name...");
      const response = await this.makeGraphQLRequest(query);
      
      if (response.data?.shop?.name) {
        shopifyServiceLog("✅ Shop name retrieved:", response.data.shop.name);
        return response.data.shop.name;
      } else {
        shopifyServiceLog("⚠️ No shop name found in response");
        return "CG Asesores";
      }
    } catch (error) {
      shopifyServiceLog("❌ Error fetching shop name:", error);
      return "CG Asesores";
    }
  }

  /**
   * Método público para hacer consultas GraphQL genéricas
   */
  async executeGraphQLQuery<T = unknown>(query: string): Promise<T> {
    try {
      shopifyServiceLog("📤 Executing custom GraphQL query...");
      
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": this.accessToken,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: T = await response.json();
      shopifyServiceLog("✅ Custom GraphQL query executed successfully");
      
      return data;
    } catch (error) {
      shopifyServiceLog("❌ Error in custom GraphQL query:", error);
      throw error;
    }
  }

  /**
   * Obtiene la URL de descarga de un archivo genérico por su ID
   */
  async getGenericFileUrl(fileId: string): Promise<string | null> {
    const query = `
      query GetGenericFileUrl {
        node(id: "${fileId}") {
          ... on GenericFile {
            url
          }
        }
      }
    `;

    try {
      shopifyServiceLog("📁 Getting file URL for:", fileId);
      
      const response = await this.executeGraphQLQuery<{
        data: {
          node: {
            url?: string;
          } | null;
        };
      }>(query);

      const fileUrl = response.data?.node?.url;
      
      if (fileUrl) {
        shopifyServiceLog("✅ File URL obtained:", fileUrl);
        return fileUrl;
      } else {
        shopifyServiceLog("⚠️ No URL found for file:", fileId);
        return null;
      }
    } catch (error) {
      shopifyServiceLog("❌ Error getting file URL:", error);
      return null;
    }
  }

  /**
   * Hace una consulta GraphQL a la API de Shopify
   */
  private async makeGraphQLRequest(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<ShopifyGraphQLResponse> {
    try {
      shopifyServiceLog("📤 Making GraphQL request to:", this.baseUrl);
      shopifyServiceLog("📝 Query:", query.slice(0, 200) + "...");
      if (variables) {
        shopifyServiceLog("📝 Variables:", variables);
      }

      const body = variables 
        ? JSON.stringify({ query, variables })
        : JSON.stringify({ query });

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": this.accessToken,
        },
        body,
      });

      shopifyServiceLog("📥 Response status:", response.status, response.statusText);

      if (!response.ok) {
        shopifyServiceLog("❌ HTTP error:", response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ShopifyGraphQLResponse = await response.json();
      shopifyServiceLog("📦 Response data:", {
        hasData: !!data.data,
        ordersCount: data.data?.orders?.edges?.length || 0,
        hasErrors: !!(data.errors && data.errors.length > 0),
      });

      if (data.errors && data.errors.length > 0) {
        shopifyServiceLog("❌ GraphQL errors:", data.errors);
        throw new Error(
          `GraphQL Error: ${data.errors.map((e) => e.message).join(", ")}`
        );
      }

      return data;
    } catch (error) {
      shopifyServiceLog("❌ Error in GraphQL request:", error);
      throw error;
    }
  }

  /**
   * Hace una consulta GraphQL específica para metaobjects
   */
  private async makeMetaobjectGraphQLRequest(
    query: string
  ): Promise<MetaobjectByHandleResponse> {
    try {
      shopifyServiceLog("📤 Making Metaobject GraphQL request to:", this.baseUrl);
      shopifyServiceLog("📝 Query:", query.slice(0, 200) + "...");

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": this.accessToken,
        },
        body: JSON.stringify({ query }),
      });

      shopifyServiceLog("📥 Response status:", response.status, response.statusText);

      if (!response.ok) {
        shopifyServiceLog("❌ HTTP error:", response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MetaobjectByHandleResponse = await response.json();
      shopifyServiceLog("📦 Metaobject response data:", {
        hasData: !!data.data,
        hasMetaobject: !!data.data?.metaobjectByHandle,
        hasErrors: !!(data.errors && data.errors.length > 0),
      });

      if (data.errors && data.errors.length > 0) {
        shopifyServiceLog("❌ GraphQL errors:", data.errors);
        throw new Error(
          `GraphQL Error: ${data.errors.map((e) => e.message).join(", ")}`
        );
      }

      return data;
    } catch (error) {
      shopifyServiceLog("❌ Error in Metaobject GraphQL request:", error);
      throw error;
    }
  }

  /**
   * Verifica si una orden ya fue procesada consultando el metaobject processed_orders
   */
  async checkIfOrderProcessed(
    orderNumber: string
  ): Promise<ProcessedOrderData | null> {
    try {
      shopifyServiceLog("🔍 Checking if order is already processed:", orderNumber);
      
      const handle = orderNumber.replace("#", "");
      shopifyServiceLog("📝 Using handle:", handle);

      const query = `
        query {
          metaobjectByHandle(handle: {handle: "${handle}", type: "processed_orders"}) {
            id
            handle
            fields {
              key
              value
            }
          }
        }
      `;

      const response = await this.makeMetaobjectGraphQLRequest(query);
      shopifyServiceLog("📥 GraphQL response:", JSON.stringify(response, null, 2));

      const metaobject = response.data.metaobjectByHandle;
      if (metaobject) {
        shopifyServiceLog("✅ Order already processed");
        const formattedData = this.formatProcessedOrderForApp(response);
        shopifyServiceLog("📋 Formatted data:", formattedData);
        return formattedData;
      } else {
        shopifyServiceLog("❌ Order not yet processed");
        return null;
      }
    } catch (error) {
      shopifyServiceLog("❌ Error checking if order processed:", error);
      
      return null;
    }
  }

  /**
   * Busca una orden por su número y código de confirmación usando GraphQL
   */
  async findOrderByNumber(orderNumber: string, confirmationCode: string): Promise<OrderData | null> {
    try {
      shopifyServiceLog("🔍 Searching for order:", orderNumber, "with confirmation code:", confirmationCode);

      const query = `
        query {
          orders(first: 1, query: "name:${orderNumber} confirmation_number:${confirmationCode}") {
            edges {
              node {
                id
                name
                createdAt
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                displayFinancialStatus
                displayFulfillmentStatus
                lineItems(first: 20) {
                  edges {
                    node {
                      title
                      quantity
                      originalUnitPriceSet {
                        shopMoney {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await this.makeGraphQLRequest(query);

      if (response.data.orders.edges.length === 0) {
        shopifyServiceLog("❌ Order not found:", orderNumber);
        return null; 
      }

      const shopifyOrder = response.data.orders.edges[0].node;
      shopifyServiceLog("✅ Order found:", {
        id: shopifyOrder.id,
        name: shopifyOrder.name,
      });

      return this.formatOrderForApp(shopifyOrder);
    } catch (error) {
      shopifyServiceLog("❌ Error finding order:", error);
      console.error("Error buscando orden:", error);
      throw error;
    }
  }

  /**
   * Busca órdenes por email del cliente
   */
  async findOrdersByEmail(email: string): Promise<OrderData[]> {
    try {
      const query = `
        query {
          orders(first: 10, query: "email:${email}") {
            edges {
              node {
                id
                name
                email
                createdAt
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                displayFinancialStatus
                displayFulfillmentStatus
                customer {
                  firstName
                  lastName
                }
                lineItems(first: 20) {
                  edges {
                    node {
                      title
                      quantity
                      originalUnitPriceSet {
                        shopMoney {
                          amount
                          currencyCode
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await this.makeGraphQLRequest(query);

      return response.data.orders.edges.map((edge) =>
        this.formatOrderForApp(edge.node)
      );
    } catch (error) {
      console.error("Error buscando órdenes por email:", error);
      throw error;
    }
  }

  formatProcessedOrderForApp(
    ProcessedOrder: MetaobjectByHandleResponse
  ): ProcessedOrderData {
    const fields = ProcessedOrder.data.metaobjectByHandle!.fields;
    shopifyServiceLog("📋 Metaobject fields:", fields);

    const fieldMap = Object.fromEntries(fields.map((f) => [f.key, f.value]));
    shopifyServiceLog("🗺️ Field map:", fieldMap);

    const result = {
      orderNumber: fieldMap["order_number"] || fieldMap["orderNumber"],
      processedDate: fieldMap["processed_date"] || fieldMap["processedDate"],
      emailAddress: fieldMap["target_email"] || fieldMap["emailAddress"] || fieldMap["email"],
    };

    shopifyServiceLog("📄 Formatted processed order:", result);
    return result;
  }

  /**
   * Formatea una orden de Shopify para el formato esperado por la aplicación
   */
  formatOrderForApp(shopifyOrder: ShopifyOrder): OrderData {
    return {
      id: shopifyOrder.id,
      orderNumber: shopifyOrder.name, 
      amount: parseFloat(shopifyOrder.totalPriceSet.shopMoney.amount),
      date: new Date(shopifyOrder.createdAt).toLocaleDateString("es-CO"),
      status: this.getStatusInSpanish(
        shopifyOrder.displayFinancialStatus,
        shopifyOrder.displayFulfillmentStatus
      ),
      items: shopifyOrder.lineItems.edges.map((edge) => ({
        title: edge.node.title,
        quantity: edge.node.quantity,
        price: parseFloat(edge.node.originalUnitPriceSet.shopMoney.amount),
      })),
    };
  }

  /**
   * Convierte los estados de Shopify al español
   */
  private getStatusInSpanish(
    financialStatus: string,
    fulfillmentStatus: string
  ): string {
    const financialStatusMap: { [key: string]: string } = {
      PENDING: "Pago Pendiente",
      AUTHORIZED: "Autorizado",
      PARTIALLY_PAID: "Parcialmente Pagado",
      PAID: "Pagado",
      PARTIALLY_REFUNDED: "Parcialmente Reembolsado",
      REFUNDED: "Reembolsado",
      VOIDED: "Anulado",
    };

    const fulfillmentStatusMap: { [key: string]: string } = {
      FULFILLED: "Enviado",
      PARTIAL: "Envío Parcial",
      RESTOCKED: "Restock",
      UNFULFILLED: "Pendiente de Envío",
    };

    const financial = financialStatusMap[financialStatus] || financialStatus;
    const fulfillment =
      fulfillmentStatusMap[fulfillmentStatus] || fulfillmentStatus;

    return `${financial} - ${fulfillment}`;
  }

  /**
   * Crea un metaobject para archivar una orden procesada
   */
  async createProcessedOrderMetaobject(data: {
    orderNumber: string;
    targetEmail: string;
    processedDate: string;
  }): Promise<{ success: boolean; metaobjectId?: string; error?: string }> {
    const mutation = `
      mutation CreateProcessedOrderMetaobject($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject {
            id
            handle
            displayName
            capabilities {
              publishable { 
                status 
              }
            }
            fields {
              key
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Crear un handle único basado en el número de orden y timestamp
    const orderNumberClean = data.orderNumber.replace('#', '');

    const variables = {
      metaobject: {
        type: "processed_orders",
        handle: orderNumberClean,
        capabilities: {
          publishable: {
            status: "ACTIVE",
          },
        },
        fields: [
          {
            key: "order_number",
            value: data.orderNumber,
          },
          {
            key: "target_email",
            value: data.targetEmail,
          },
          {
            key: "processed_date",
            value: data.processedDate,
          },
        ],
      },
    };

    try {
      shopifyServiceLog("📦 Creating processed order metaobject:", {
        orderNumber: data.orderNumber,
        targetEmail: data.targetEmail,
        processedDate: data.processedDate,
        handle: orderNumberClean
      });
      

      const response = await this.makeGraphQLRequest(mutation, variables);

      if (response.data?.metaobjectCreate?.userErrors?.length > 0) {
        const errors = response.data.metaobjectCreate.userErrors;
        shopifyServiceLog("❌ GraphQL errors creating metaobject:", errors);
        return {
          success: false,
          error: errors.map((e: { message: string }) => e.message).join(', ')
        };
      }

      if (response.data?.metaobjectCreate?.metaobject?.id) {
        const metaobjectId = response.data.metaobjectCreate.metaobject.id;
        shopifyServiceLog("✅ Processed order metaobject created successfully:", metaobjectId);
        
        return {
          success: true,
          metaobjectId
        };
      } else {
        shopifyServiceLog("❌ No metaobject ID returned from creation");
        return {
          success: false,
          error: "No se pudo crear el metaobject"
        };
      }

    } catch (error) {
      shopifyServiceLog("❌ Error creating processed order metaobject:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      };
    }
  }
}

export default ShopifyService;
