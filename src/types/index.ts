export interface OrderData {
  id: string;
  orderNumber: string;
  amount: number;
  date: string;
  status: string;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
}

type ISODateString = string;

export interface ProcessedOrderData {
  orderNumber: string;
  processedDate: ISODateString;
  emailAddress: string;
}

export interface OrderValidationResponse {
  success: boolean;
  isProcessed: ProcessedOrderData | null;
  message?: string;
  allowBypass?: boolean;
}

// Interfaces para Metaobjects de Shopify (Prompt Files)
export interface MetaobjectField {
  key: string;
  value: string;
}

export interface PromptFileMetaobject {
  id: string;
  handle: string;
  displayName: string;
  fields: MetaobjectField[];
}

export interface MetaobjectNode {
  node: PromptFileMetaobject;
}

export interface MetaobjectsResponse {
  edges: MetaobjectNode[];
}

export interface PromptFilesGraphQLResponse {
  data: {
    metaobjects: MetaobjectsResponse;
  };
  extensions?: {
    cost: {
      requestedQueryCost: number;
      actualQueryCost: number;
      throttleStatus: {
        maximumAvailable: number;
        currentlyAvailable: number;
        restoreRate: number;
      };
    };
  };
}

// Interface procesada para uso en la aplicación
export interface PromptFile {
  id: string;
  handle: string;
  displayName: string;
  name: string;
  fileId: string;
  useCase: string;
}

// Interface para prompt file con contenido descargado
export interface PromptFileWithContent {
  key: string;
  label: string;
  content: string;
}

export interface PromptFilesServiceResponse {
  success: boolean;
  promptFiles: PromptFile[];
  message?: string;
}

// Interface para respuesta con contenido descargado
export interface PromptFilesWithContentResponse {
  success: boolean;
  promptFiles: Record<string, PromptFileWithContent>;
  message?: string;
}

export interface logger {
  (origin: string, ...args: unknown[]): void;
}