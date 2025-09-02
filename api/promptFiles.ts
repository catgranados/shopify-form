import { VercelRequest, VercelResponse } from '@vercel/node';
import { PromptFilesGraphQLResponse, PromptFilesServiceResponse, PromptFile, PromptFilesWithContentResponse, PromptFileWithContent } from '../src/types';
import ShopifyService from './shopifyService.js';

// Instancia del servicio de Shopify
const shopifyService = new ShopifyService();

/**
 * Query GraphQL para obtener metaobjects de tipo prompt_files
 */
const PROMPT_FILES_QUERY = `
  query GetPromptFiles {
    metaobjects(type: "prompt_files", first: 100) {
      edges {
        node {
          id
          handle
          displayName
          fields {
            key
            value
          }
        }
      }
    }
  }
`;

/**
 * Procesa la respuesta de GraphQL y extrae los datos de prompt files
 */
function processPromptFilesResponse(response: PromptFilesGraphQLResponse): PromptFile[] {
  return response.data.metaobjects.edges.map(edge => {
    const node = edge.node;
    
    // Extraer valores específicos de los campos
    const nameField = node.fields.find(field => field.key === 'name');
    const fileField = node.fields.find(field => field.key === 'file');
    const useCaseField = node.fields.find(field => field.key === 'use_case');
    
    return {
      id: node.id,
      handle: node.handle,
      displayName: node.displayName,
      name: nameField?.value || '',
      fileId: fileField?.value || '',
      useCase: useCaseField?.value || ''
    };
  });
}

/**
 * Obtiene todos los prompt files desde Shopify
 */
async function getPromptFiles(): Promise<PromptFilesServiceResponse> {
  try {
    console.log('🔍 Consultando prompt files desde Shopify...');
    
    const response = await shopifyService.executeGraphQLQuery<PromptFilesGraphQLResponse>(PROMPT_FILES_QUERY);
    
    console.log('✅ Respuesta de Shopify recibida:', {
      totalFiles: response.data.metaobjects.edges.length,
      cost: response.extensions?.cost
    });
    
    const promptFiles = processPromptFilesResponse(response);
    
    console.log('📁 Prompt files procesados:', promptFiles.map(file => ({
      name: file.name,
      useCase: file.useCase,
      handle: file.handle
    })));
    
    return {
      success: true,
      promptFiles,
      message: `Se encontraron ${promptFiles.length} archivos de prompt`
    };
    
  } catch (error) {
    console.error('❌ Error al obtener prompt files:', error);
    
    return {
      success: false,
      promptFiles: [],
      message: error instanceof Error ? error.message : 'Error desconocido al consultar prompt files'
    };
  }
}

/**
 * Obtiene prompt files filtrados por caso de uso
 */
async function getPromptFilesByUseCase(useCase: string): Promise<PromptFilesServiceResponse> {
  try {
    const allPromptFilesResponse = await getPromptFiles();
    
    if (!allPromptFilesResponse.success) {
      return allPromptFilesResponse;
    }
    
    const filteredFiles = allPromptFilesResponse.promptFiles.filter(
      file => file.useCase.toLowerCase() === useCase.toLowerCase()
    );
    
    console.log(`🎯 Prompt files filtrados por caso de uso "${useCase}":`, filteredFiles.length);
    
    return {
      success: true,
      promptFiles: filteredFiles,
      message: `Se encontraron ${filteredFiles.length} archivos para el caso de uso: ${useCase}`
    };
    
  } catch (error) {
    console.error('❌ Error al filtrar prompt files por caso de uso:', error);
    
    return {
      success: false,
      promptFiles: [],
      message: error instanceof Error ? error.message : 'Error desconocido al filtrar prompt files'
    };
  }
}

/**
 * Obtiene un prompt file específico por su handle
 */
async function getPromptFileByHandle(handle: string): Promise<PromptFile | null> {
  try {
    const allPromptFilesResponse = await getPromptFiles();
    
    if (!allPromptFilesResponse.success) {
      return null;
    }
    
    const promptFile = allPromptFilesResponse.promptFiles.find(
      file => file.handle === handle
    );
    
    console.log(`🔍 Buscando prompt file con handle "${handle}":`, promptFile ? 'encontrado' : 'no encontrado');
    
    return promptFile || null;
    
  } catch (error) {
    console.error('❌ Error al buscar prompt file por handle:', error);
    return null;
  }
}

/**
 * Descarga el contenido de un archivo usando su URL
 */
async function downloadFileContent(fileUrl: string): Promise<string> {
  try {
    console.log('📥 Descargando contenido del archivo:', fileUrl);
    
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Error HTTP al descargar archivo: ${response.status}`);
    }
    
    const content = await response.text();
    console.log('✅ Contenido descargado, tamaño:', content.length, 'caracteres');
    
    return content;
  } catch (error) {
    console.error('❌ Error al descargar contenido del archivo:', error);
    throw error;
  }
}

/**
 * Obtiene prompt files con su contenido descargado para un caso de uso específico
 */
async function getPromptFilesWithContent(useCase: string): Promise<PromptFilesWithContentResponse> {
  try {
    console.log(`🔍 Obteniendo prompt files con contenido para caso de uso: ${useCase}`);
    
    // Obtener la lista de prompt files filtrada por caso de uso
    const promptFilesResponse = await getPromptFilesByUseCase(useCase);
    
    if (!promptFilesResponse.success) {
      return {
        success: false,
        promptFiles: {},
        message: promptFilesResponse.message
      };
    }
    
    const promptFilesWithContent: Record<string, PromptFileWithContent> = {};
    
    // Procesar cada archivo
    for (const promptFile of promptFilesResponse.promptFiles) {
      try {
        console.log(`📁 Procesando archivo: ${promptFile.handle}`);
        
        // Obtener URL del archivo
        const fileUrl = await shopifyService.getGenericFileUrl(promptFile.fileId);
        
        if (!fileUrl) {
          console.warn(`⚠️ No se pudo obtener URL para archivo: ${promptFile.handle}`);
          continue;
        }
        
        // Descargar contenido
        const content = await downloadFileContent(fileUrl);
        
        // Construir objeto final con handle como key
        promptFilesWithContent[promptFile.handle] = {
          key: promptFile.handle,
          label: promptFile.displayName,
          content: content
        };
        
        console.log(`✅ Archivo procesado: ${promptFile.handle}`);
        
      } catch (error) {
        console.error(`❌ Error procesando archivo ${promptFile.handle}:`, error);
        // Continuar con el siguiente archivo en caso de error
      }
    }
    
    const processedCount = Object.keys(promptFilesWithContent).length;
    console.log(`🎯 Archivos procesados: ${processedCount}/${promptFilesResponse.promptFiles.length}`);
    
    return {
      success: true,
      promptFiles: promptFilesWithContent,
      message: `Se procesaron ${processedCount} archivos para el caso de uso: ${useCase}`
    };
    
  } catch (error) {
    console.error('❌ Error al obtener prompt files con contenido:', error);
    
    return {
      success: false,
      promptFiles: {},
      message: error instanceof Error ? error.message : 'Error desconocido al procesar prompt files'
    };
  }
}

/**
 * API endpoint unificado para manejar prompt files de Shopify
 * 
 * GET /api/promptFiles - Obtiene todos los prompt files
 * GET /api/promptFiles?useCase=transito - Filtra por caso de uso
 * GET /api/promptFiles?useCase=transito&withContent=true - Filtra por caso de uso y descarga contenido
 * GET /api/promptFiles?handle=revocatoria-por-indebida-notificacion - Obtiene un prompt file específico
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir métodos GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido. Solo se permite GET.'
    });
  }

  try {
    const { useCase, handle, withContent } = req.query;

    console.log('📄 Procesando solicitud de prompt files:', {
      useCase: useCase || 'todos',
      handle: handle || 'ninguno',
      withContent: withContent || 'false',
      timestamp: new Date().toISOString()
    });

    // Si se especifica un handle, buscar ese archivo específico
    if (handle && typeof handle === 'string') {
      console.log(`🔍 Buscando prompt file con handle: ${handle}`);
      
      const promptFile = await getPromptFileByHandle(handle);
      
      if (promptFile) {
        return res.status(200).json({
          success: true,
          promptFile,
          message: `Prompt file encontrado: ${handle}`
        });
      } else {
        return res.status(404).json({
          success: false,
          message: `No se encontró el prompt file con handle: ${handle}`
        });
      }
    }

    // Si se especifica un caso de uso con contenido
    if (useCase && typeof useCase === 'string' && withContent === 'true') {
      console.log(`🎯 Obteniendo prompt files con contenido para caso de uso: ${useCase}`);
      
      const result = await getPromptFilesWithContent(useCase);
      
      return res.status(200).json(result);
    }

    // Si se especifica un caso de uso sin contenido
    if (useCase && typeof useCase === 'string') {
      console.log(`🎯 Filtrando prompt files por caso de uso: ${useCase}`);
      
      const result = await getPromptFilesByUseCase(useCase);
      
      return res.status(200).json(result);
    }

    // Obtener todos los prompt files
    console.log('📁 Obteniendo todos los prompt files...');
    
    const result = await getPromptFiles();
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error en endpoint de prompt files:', error);
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error interno del servidor',
      promptFiles: []
    });
  }
}
