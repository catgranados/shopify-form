import { TransitoDataType } from './useFormManager';



// Definición de reglas condicionales para el formulario de tránsito
export interface ConditionalRule {
  // Campo que debe ser evaluado
  dependsOn: keyof TransitoDataType;
  // Valores que hacen que la condición sea verdadera
  when: string | string[];
  // Tipo de validación
  type: 'show' | 'require';
}

// Configuración de campos condicionales para tránsito
export const transitoConditionalFields = {
  // Campo de fecha de captura del SIMIT
  
  // Razón para audiencia virtual - DEBE MOSTRARSE Y SER REQUERIDA
  virtualAudienceReason: {
    dependsOn: 'procedureType' as keyof TransitoDataType,
    when: 'audiencia-virtual',
    type: 'show' as const // Cambiar a 'show' para controlar visibilidad
  }
} as const;

// Función para evaluar si una condición se cumple
export function evaluateCondition(
  rule: ConditionalRule,
  formData: TransitoDataType
): boolean {
  const fieldValue = formData[rule.dependsOn];
  
  if (Array.isArray(rule.when)) {
    return rule.when.includes(fieldValue);
  }
  
  return fieldValue === rule.when;
}

// Función para determinar si un campo debe mostrarse
export function shouldShowField(
  fieldName: keyof typeof transitoConditionalFields,
  formData: TransitoDataType
): boolean {
  const rule = transitoConditionalFields[fieldName];
  if (!rule) return true;
  
  return evaluateCondition(rule, formData);
}

// Función para determinar si un campo es requerido
export function isFieldRequired(
  fieldName: keyof typeof transitoConditionalFields,
  formData: TransitoDataType
): boolean {
  const rule = transitoConditionalFields[fieldName];
  if (!rule) return false;
  
  // Para campos que se muestran condicionalmente, también son requeridos cuando se muestran
  if (rule.type === 'show') {
    return evaluateCondition(rule, formData);
  }
  
  return false;
}

// Función nueva: determinar si un campo es requerido independientemente de su visibilidad
export function isFieldAlwaysRequired(fieldName: string): boolean {
  // Campos básicos que siempre son requeridos
  const alwaysRequired = [
    'userName',
    'typeId',
    'idNumber', 
    'notificationAddress',
    'notificationCity',
    'notificationEmail',
    'phoneNumber',
    'procedureType',
    'actNumber',
    'actDate',
    'vehicleBrand',
    'vehicleModel',
    'vehiclePlates',
    'isOwner',
    'mobilitySecretaryName',
    'petitionDate',
  ];
  
  return alwaysRequired.includes(fieldName);
}

// Función para obtener el label dinámico basado en el tipo de trámite
export function getDynamicLabel(
  fieldName: string,
  procedureType: string
): string {
  switch (fieldName) {
    case 'actNumber':
      switch (procedureType) {
        case 'revocatoria-notificacion':
        case 'revocatoria-identificacion':
        case 'revocatoria-sast':
        case 'caducidad-comparendo':
          return 'Número de Comparendo';
        case 'prescripcion-multa':
        case 'prescripcion-coactivo':
          return 'Número de Resolución';
        case 'audiencia-virtual':
          return 'Número de Comparendo o Resolución';
        default:
          return 'Número de Identificación del Acto';
      }
    
    case 'actDate':
      switch (procedureType) {
        case 'revocatoria-notificacion':
        case 'revocatoria-identificacion':
        case 'revocatoria-sast':
        case 'caducidad-comparendo':
          return 'Fecha de la Infracción';
        case 'prescripcion-multa':
        case 'prescripcion-coactivo':
          return 'Fecha de la Resolución';
        case 'audiencia-virtual':
          return 'Fecha del Acto';
        default:
          return 'Fecha del Acto';
      }
    
    default:
      return '';
  }
}

// Función para validar campos condicionales antes del envío
export function validateConditionalFields(formData: TransitoDataType): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  
  // Validar razón para audiencia virtual
  if (isFieldRequired('virtualAudienceReason', formData)) {
    if (!formData.virtualAudienceReason || formData.virtualAudienceReason.trim() === '') {
      errors.virtualAudienceReason = 'La razón para no asistir presencialmente es requerida para solicitudes de audiencia virtual.';
    } else if (formData.virtualAudienceReason.length < 10) {
      errors.virtualAudienceReason = 'La razón debe tener al menos 10 caracteres.';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Función para obtener todos los campos que deben ser validados según las condiciones actuales
export function getRequiredFieldsForCurrentState(formData: TransitoDataType): string[] {
  const requiredFields: string[] = [];
  
  // Campos básicos que siempre son requeridos (según FormTexts)
  const alwaysRequiredFields = [
    'userName',
    'typeId',
    'idNumber', 
    'notificationAddress',
    'notificationCity',
    'notificationEmail',
    'phoneNumber',
    'procedureType',
    'actNumber',
    'actDate',
    'vehicleBrand',
    'vehicleModel',
    'vehiclePlates',
    'isOwner',
    'mobilitySecretaryName',
    'petitionDate',
  ];
  
  // Agregar campos siempre requeridos
  requiredFields.push(...alwaysRequiredFields);
  
  // Evaluar campos condicionales: solo son requeridos si están renderizados
  Object.keys(transitoConditionalFields).forEach(fieldName => {
    const typedFieldName = fieldName as keyof typeof transitoConditionalFields;
    
    // Un campo condicional es requerido si:
    // 1. Debe mostrarse (shouldShowField)
    // 2. Y está marcado como required en FormTexts O es de tipo 'show' (que implica required cuando visible)
    if (shouldShowField(typedFieldName, formData)) {
      requiredFields.push(fieldName);
    }
  });
  
  return requiredFields;
}

/**
 * Función unificada para validar campos según su estado de renderizado y requerimiento
 * Esta función implementa la lógica: requerido + estaRenderizado
 */
export function validateFieldsBasedOnRenderingAndRequirement(
  formData: TransitoDataType,
  fieldConfigs: Record<string, { required?: boolean; label: string }>
): {
  isValid: boolean;
  errors: Record<string, string>;
  validatedFields: string[];
  skippedFields: string[];
} {
  const errors: Record<string, string> = {};
  const validatedFields: string[] = [];
  const skippedFields: string[] = [];
  
  // Obtener campos que deben ser validados en el estado actual
  const fieldsToValidate = getRequiredFieldsForCurrentState(formData);
  
  // Validar cada campo del formulario
  Object.keys(formData).forEach(fieldName => {
    const fieldValue = (formData as Record<string, unknown>)[fieldName];
    const fieldConfig = fieldConfigs[fieldName];
    const isFieldRequired = fieldsToValidate.includes(fieldName);
    const isFieldRendered = shouldShowFieldByName(fieldName, formData);
    
    if (!fieldConfig) {
      // Si no hay configuración, omitir
      skippedFields.push(fieldName);
      return;
    }
    
    // Lógica de validación: requerido + estaRenderizado
    if (isFieldRequired && isFieldRendered) {
      // El campo debe validarse
      if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
        errors[fieldName] = `${fieldConfig.label} es requerido.`;
      } else {
        validatedFields.push(fieldName);
      }
    } else if (!isFieldRendered) {
      // El campo no está renderizado, se omite de la validación
      skippedFields.push(fieldName);
    } else {
      // El campo está renderizado pero no es requerido
      validatedFields.push(fieldName);
    }
  });
  
  // Validar reglas específicas condicionales (ej. longitud mínima para campos de texto)
  const conditionalValidation = validateConditionalFields(formData);
  Object.entries(conditionalValidation.errors).forEach(([fieldName, message]) => {
    // Solo agregar errores si el campo está renderizado
    if (shouldShowFieldByName(fieldName, formData)) {
      errors[fieldName] = message;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    validatedFields,
    skippedFields
  };
}

/**
 * Función auxiliar para verificar si un campo debe mostrarse por su nombre
 */
function shouldShowFieldByName(fieldName: string, formData: TransitoDataType): boolean {
  // Si el campo está en las reglas condicionales, usar la lógica condicional
  if (fieldName in transitoConditionalFields) {
    return shouldShowField(fieldName as keyof typeof transitoConditionalFields, formData);
  }
  
  // Si no está en las reglas condicionales, siempre se muestra
  return true;
}
