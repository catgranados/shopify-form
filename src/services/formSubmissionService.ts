import { FormDataUnion } from '../lib/useFormManager';
import { FormType } from '../lib/formValidator';
import { OrderData } from '../types';
import { SelectedPromptFileData } from '../lib/useFormFieldWithPromptFiles';

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
    this.webhookUrl = import.meta.env.MAKE_WEBHOOK || import.meta.env.VITE_MAKE_WEBHOOK;
    
    if (!this.webhookUrl) {
      console.warn('⚠️ MAKE_WEBHOOK no está configurado en las variables de entorno');
    }
  }

  /**
   * Envía un formulario completo al webhook de Make.com
   */
  async submitForm(request: SubmitFormRequest): Promise<SubmitFormResponse> {
    try {
      if (!this.webhookUrl) {
        throw new Error('Webhook URL no configurado. Verifica la variable MAKE_WEBHOOK en .env');
      }

      console.log('🚀 Enviando formulario al webhook:', {
        type: request.formType,
        orderNumber: request.orderData.orderNumber,
        fieldsCount: Object.keys(request.formData).length,
        webhookUrl: this.webhookUrl
      });

      const payload = {
        formType: request.formType,
        formData: request.formData,
        orderData: request.orderData,
        promptContent: request.promptContent!.procedureType.content || {},
        deliveryEmail: request.deliveryEmail,
        shopName: request.shopName,
      };

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
      const webhookStatus: number = response.status;
      
      try {
        // Verificar si el response tiene contenido y si el body no ha sido usado
        const contentType = response.headers.get('content-type');
        
        if (response.bodyUsed) {
          console.warn('⚠️ Response body ya fue consumido, usando respuesta por defecto');
          result = {
            success: true,
            message: 'Formulario enviado exitosamente (body already used)',
            documentId: `WEBHOOK-${Date.now()}`
          };
        } else if (contentType && contentType.includes('application/json')) {
          // Solo intentar parsear JSON si el content-type lo indica
          const responseData = await response.json();

          // Si el webhook devuelve un formato conocido, lo usamos
          if (responseData.success !== undefined) {
            result = responseData as SubmitFormResponse;
          } else {
            // Si no, creamos una respuesta exitosa basada en el status HTTP
            result = {
              success: true,
              message: `Formulario enviado exitosamente. Respuesta: ${JSON.stringify(
                responseData
              )}`,
              documentId: responseData.documentId || `WEBHOOK-${Date.now()}`,
            };
          }
        } else {
          // Si no es JSON o no hay content-type, usar respuesta por defecto
          const responseText = await response.text();
          result = {
            success: true,
            message: `Formulario enviado exitosamente. Respuesta: ${responseText || 'Sin contenido'}`,
            documentId: `WEBHOOK-${Date.now()}`
          };
        }
      } catch (error) {
        console.warn('⚠️ Error parseando respuesta del webhook:', error);
        // Si no podemos parsear la respuesta, pero el status es OK
        result = {
          success: true,
          message: 'Formulario enviado exitosamente (error parsing response)',
          documentId: `WEBHOOK-${Date.now()}`
        };
      }

      // Si el status es 200 y NO es un caso de bypass, proceder con el archivado de la orden
      const isBypassMode = request.orderData.id === 'bypass-mode';
      debugger
      
      if (webhookStatus === 200 && !isBypassMode) {
        console.log('✅ Status 200 recibido y no es bypass, procediendo con archivado de orden...');
        
        try {
          // Importar dinámicamente apiService para evitar dependencias circulares
          const { apiService } = await import('./apiService');
          
          const archiveResult = await apiService.archiveProcessedOrder(
            request.orderData.orderNumber,
            request.deliveryEmail
          );
          
          if (archiveResult.success) {
            console.log('✅ Orden archivada exitosamente');
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
        console.log('🔓 Modo bypass detectado, saltando archivado de orden');
      } else {
        console.log('ℹ️ Status diferente a 200, saltando archivado de orden');
      }

      console.log('✅ Formulario enviado exitosamente:', result);
      return result;

    } catch (error) {
      console.error('❌ Error enviando formulario:', error);
      
      return {
        success: false,
        message: error instanceof Error 
          ? `Error al enviar formulario: ${error.message}`
          : 'Error desconocido al enviar formulario'
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

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Simula el envío del formulario (para testing)
   */
  async simulateSubmission(request: SubmitFormRequest): Promise<SubmitFormResponse> {
    console.log('🧪 Simulando envío de formulario...');
    console.log('📧 Email de entrega:', request.deliveryEmail);
    console.log('📋 Tipo de formulario:', request.formType);
    console.log('📄 Datos de prompt files:', Object.keys(request.promptContent || {}));
    
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
