import { FormDataUnion } from '../lib/useFormManager';
import { FormType } from '../lib/formValidator';
import { OrderData } from '../types';
import { SelectedPromptFileData } from '../lib/useFormFieldWithPromptFiles';
import { frontendLogger } from '@/lib/utils';

const formSubmitLog = (...args: unknown[]) => {
  frontendLogger('FORM SUBMISSION SERVICE', ...args);
}

export interface SubmitFormRequest {
  formType: FormType;
  formData: FormDataUnion;
  orderData: OrderData;
  promptContent?: Record<string, SelectedPromptFileData>;
  deliveryEmail: string;
  shopName: string;
}

export interface SubmitFormResponse {
  success: boolean;
  message: string;
  documentUrl?: string;
  documentId?: string;
}

/**
 * Servicio para manejar el envío de formularios
 */
class FormSubmissionService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK || '';
    
    if (!this.webhookUrl) {
      console.warn('⚠️ VITE_MAKE_WEBHOOK no está configurado en las variables de entorno');
    }
  }

  /**
   * Envía un formulario completo al webhook de Make.com
   */
  async submitForm(request: SubmitFormRequest): Promise<SubmitFormResponse> {
    try {
      if (!this.webhookUrl) {
        throw new Error('Webhook URL no configurado. Verifica la variable VITE_MAKE_WEBHOOK en .env');
      }

      // Validar estructura básica del formulario
      const structureValidation = this.validateFormStructure(request);
      if (!structureValidation.isValid) {
        throw new Error(`Validación de estructura falló: ${structureValidation.errors.join(', ')}`);
      }

      // Validar payload completo antes del envío
      const payloadValidation = this.validatePayloadCompleteness(request);
      if (!payloadValidation.isValid) {
        throw new Error(`Validación de payload falló: ${payloadValidation.errors.join(', ')}`);
      }

      formSubmitLog('🚀 Enviando formulario al webhook:', {
        type: request.formType,
        orderNumber: request.orderData.orderNumber,
        fieldsCount: Object.keys(request.formData).length,
        hasPromptContent: !!(request.promptContent && Object.keys(request.promptContent).length > 0),
        webhookUrl: this.webhookUrl
      });

      // Preparar contenido de prompt files de manera más robusta
      let promptContentForPayload = {};
      if (request.promptContent && Object.keys(request.promptContent).length > 0) {
        // Construir un objeto con todos los prompt files disponibles
        promptContentForPayload = Object.fromEntries(
          Object.entries(request.promptContent).map(([key, promptData]) => [
            key,
            {
              handle: promptData.handle,
              name: promptData.name,
              content: promptData.content
            }
          ])
        );
      }

      const payload = {
        formType: request.formType,
        formData: request.formData,
        orderData: request.orderData,
        promptContent: promptContentForPayload,
        deliveryEmail: request.deliveryEmail.trim(),
        shopName: request.shopName.trim(),
      };

      // Log del payload final para debugging
      formSubmitLog('📦 Payload final para webhook:', {
        formType: payload.formType,
        dataFieldsCount: Object.keys(payload.formData).length,
        promptContentKeys: Object.keys(payload.promptContent),
        hasDeliveryEmail: !!payload.deliveryEmail,
        orderNumber: payload.orderData.orderNumber
      });

      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error del webhook: ${response.status} - ${response.statusText}`);
      }

      // Make.com webhooks pueden devolver diferentes formatos de respuesta
      let result: SubmitFormResponse;
      let webhookStatus: number | null = null;
      
      try {
        // Verificar si el response tiene contenido y si el body no ha sido usado
        const contentType = response.headers.get('content-type');
        
        if (response.bodyUsed) {
          console.warn('⚠️ Response body ya fue consumido, usando respuesta por defecto');
          result = {
            success: true,
            message: 'Formulario enviado exitosamente al webhook (body already used)',
            documentId: `WEBHOOK-${Date.now()}`
          };
        } else if (contentType && contentType.includes('application/json')) {
          // Solo intentar parsear JSON si el content-type lo indica
          const responseData = await response.json();
          
          // Capturar el status del webhook si existe
          if (responseData.status && typeof responseData.status === 'number') {
            webhookStatus = responseData.status;
            formSubmitLog('📊 Status del webhook:', webhookStatus);
          }
          
          // Si el webhook devuelve un formato conocido, lo usamos
          if (responseData.success !== undefined) {
            result = responseData as SubmitFormResponse;
          } else {
            // Si no, creamos una respuesta exitosa basada en el status HTTP
            result = {
              success: true,
              message: `Formulario enviado exitosamente al webhook. Respuesta: ${JSON.stringify(responseData)}`,
              documentId: responseData.documentId || `WEBHOOK-${Date.now()}`
            };
          }
        } else {
          // Si no es JSON o no hay content-type, usar respuesta por defecto
          const responseText = await response.text();
          result = {
            success: true,
            message: `Formulario enviado exitosamente al webhook. Respuesta: ${responseText || 'Sin contenido'}`,
            documentId: `WEBHOOK-${Date.now()}`
          };
        }
      } catch (error) {
        console.warn('⚠️ Error parseando respuesta del webhook:', error);
        // Si no podemos parsear la respuesta, pero el status es OK
        result = {
          success: true,
          message: 'Formulario enviado exitosamente al webhook (error parsing response)',
          documentId: `WEBHOOK-${Date.now()}`
        };
      }

      // Si el status es 200 y NO es un caso de bypass, proceder con el archivado de la orden
      const isBypassMode = request.orderData.id === 'bypass-mode';
      
      if (webhookStatus === 200 && !isBypassMode) {
        formSubmitLog('✅ Status 200 recibido y no es bypass, procediendo con archivado de orden...');
        
        try {
          // Importar dinámicamente apiService para evitar dependencias circulares
          const { apiService } = await import('./apiService');
          
          const archiveResult = await apiService.archiveProcessedOrder(
            request.orderData.orderNumber,
            request.deliveryEmail
          );
          
          if (archiveResult.success) {
            formSubmitLog('✅ Orden archivada exitosamente');
            result.message += ' - Orden archivada correctamente.';
          } else {
            console.warn('⚠️ Error archivando orden:', archiveResult.message);
            result.message += ` - Advertencia: ${archiveResult.message}`;
          }
        } catch (archiveError) {
          console.error('❌ Error en proceso de archivado:', archiveError);
          result.message += ' - Error al archivar la orden.';
        }
      } else if (isBypassMode) {
        formSubmitLog('🔓 Modo bypass detectado, saltando archivado de orden');
      } else {
        formSubmitLog('ℹ️ Status diferente a 200, saltando archivado de orden');
      }

      formSubmitLog('✅ Formulario enviado exitosamente:', result);
      return result;

    } catch (error) {
      console.error('❌ Error enviando formulario:', error);
      
      return {
        success: false,
        message: error instanceof Error 
          ? `Error al enviar formulario: ${error.message}`
          : 'Error desconocido al enviar formulario al webhook'
      };
    }
  }

  /**
   * Verifica la configuración del webhook
   */
  isConfigured(): boolean {
    return !!this.webhookUrl;
  }

  /**
   * Obtiene la URL del webhook configurado
   */
  getWebhookUrl(): string {
    return this.webhookUrl;
  }

  /**
   * Valida la completitud del payload antes del envío al webhook
   */
  validatePayloadCompleteness(request: SubmitFormRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar email de entrega
    if (!request.deliveryEmail || request.deliveryEmail.trim() === '') {
      errors.push('Email de entrega requerido');
    }

    // Validar nombre de la tienda
    if (!request.shopName || request.shopName.trim() === '') {
      errors.push('Nombre de la tienda requerido');
    }

    // Validaciones específicas por tipo de formulario
    if (request.formType === 'transito') {
      // Para tránsito, es crítico tener prompt content para el tipo de procedimiento
      if (!request.promptContent || Object.keys(request.promptContent).length === 0) {
        errors.push('Contenido de prompt files requerido para formularios de tránsito');
      } else {
        // Verificar que al menos tenga procedureType con contenido válido
        const procedureType = request.promptContent.procedureType;
        if (!procedureType || !procedureType.content || procedureType.content.trim() === '') {
          errors.push('Contenido del tipo de procedimiento requerido para tránsito');
        }
      }
    }

    // Para otros tipos de formulario, los prompt files son opcionales pero si existen deben ser válidos
    if (request.promptContent && Object.keys(request.promptContent).length > 0) {
      Object.entries(request.promptContent).forEach(([key, promptData]) => {
        if (!promptData.content || promptData.content.trim() === '') {
          errors.push(`Contenido del prompt file '${key}' está vacío`);
        }
        if (!promptData.handle || promptData.handle.trim() === '') {
          errors.push(`Handle del prompt file '${key}' está vacío`);
        }
        if (!promptData.name || promptData.name.trim() === '') {
          errors.push(`Nombre del prompt file '${key}' está vacío`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida la estructura del formulario antes del envío
   */
  validateFormStructure(request: SubmitFormRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar que existe el tipo de formulario
    if (!request.formType) {
      errors.push('Tipo de formulario requerido');
    }

    // Validar que existen datos del formulario
    if (!request.formData || Object.keys(request.formData).length === 0) {
      errors.push('Datos del formulario requeridos');
    }

    // Validar que existe información del pedido
    if (!request.orderData || !request.orderData.orderNumber) {
      errors.push('Información del pedido requerida');
    }

    // Validaciones específicas por tipo de formulario
    if (request.formType === 'tutela') {
      const tutelaData = request.formData as Record<string, string>;
      const requiredFields = ['userName', 'email', 'facts', 'expectation'];
      
      requiredFields.forEach(field => {
        if (!tutelaData[field] || tutelaData[field].trim() === '') {
          errors.push(`Campo requerido: ${field}`);
        }
      });
    }

    if (request.formType === 'peticion') {
      const peticionData = request.formData as Record<string, string>;
      const requiredFields = ['userName', 'idNumber', 'cityDate', 'targetEntity', 'petitionRequest', 'petitionReasons', 'responseEmail'];
      
      requiredFields.forEach(field => {
        if (!peticionData[field] || peticionData[field].trim() === '') {
          errors.push(`Campo requerido: ${field}`);
        }
      });
    }

    if (request.formType === 'transito') {
      const transitoData = request.formData as Record<string, string>;
      const requiredFields = ['typeId', 'idNumber']; // Campos base requeridos para tránsito
      
      requiredFields.forEach(field => {
        if (!transitoData[field] || transitoData[field].trim() === '') {
          errors.push(`Campo requerido: ${field}`);
        }
      });

      // Validar que al menos tenga algunos campos dinámicos completados
      const dynamicFields = Object.keys(transitoData).filter(key => 
        !['typeId', 'idNumber'].includes(key) && transitoData[key] && transitoData[key].trim() !== ''
      );
      
      if (dynamicFields.length === 0) {
        errors.push('Al menos un campo específico del formulario de tránsito debe estar completado');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Simula el envío del formulario (para testing)
   */
  async simulateSubmission(request: SubmitFormRequest): Promise<SubmitFormResponse> {
    formSubmitLog('🧪 Simulando envío de formulario...');
    formSubmitLog('📧 Email de entrega:', request.deliveryEmail);
    formSubmitLog('📋 Tipo de formulario:', request.formType);
    formSubmitLog('📄 Datos de prompt files:', Object.keys(request.promptContent || {}));
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simular respuesta exitosa
    return {
      success: true,
      message: `Formulario enviado exitosamente. El documento será enviado a: ${request.deliveryEmail}`,
      documentUrl: 'https://example.com/document.pdf',
      documentId: `DOC-${Date.now()}`
    };
  }
}

// Instancia singleton
export const formSubmissionService = new FormSubmissionService();

export default formSubmissionService;
