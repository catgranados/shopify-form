import { Validator } from './validators';

// Tipos para manejar diferentes tipos de formularios
export type FormType = 'tutela' | 'peticion' | 'transito';

export interface ValidationError {
  fieldId: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  validFields: string[];
  invalidFields: string[];
}

/**
 * Valida todos los campos de un formulario específico
 */
export function validateForm<T extends Record<string, string | string[]>>(
  formData: T,
  fieldConfigs: Record<keyof T, { validators?: Validator[]; required?: boolean; label: string }>
): FormValidationResult {
  const errors: ValidationError[] = [];
  const validFields: string[] = [];
  const invalidFields: string[] = [];

  // Iterar sobre cada campo del formulario
  Object.entries(formData).forEach(([fieldId, value]) => {
    const config = fieldConfigs[fieldId as keyof T];
    
    if (!config) {
      return;
    }

    const validators = config.validators || [];
    // Convertir valor a string para validación
    const stringValue = Array.isArray(value) ? value.join(',') : String(value || '');

    // Ejecutar todas las validaciones para este campo
    for (const validator of validators) {
      const error = validator(stringValue);
      if (error) {
        errors.push({
          fieldId,
          message: error
        });
        invalidFields.push(fieldId);
        return; // Parar en el primer error
      }
    }

    // Si llegamos aquí, el campo es válido
    validFields.push(fieldId);
  });

  return {
    isValid: errors.length === 0,
    errors,
    validFields,
    invalidFields
  };
}

/**
 * Determina el tipo de formulario basado en el título del pedido
 */
export function getFormType(orderTitle: string): FormType {
  const title = orderTitle.toLowerCase();
  
  if (title.includes('tutela')) {
    return 'tutela';
  } else if (title.includes('petición')) {
    return 'peticion';
  } else if (title.includes('tránsito')) {
    return 'transito';
  }
  
  // Fallback por defecto
  return 'tutela';
}

/**
 * Obtiene los campos requeridos para un tipo de formulario específico
 */
export function getRequiredFields(
  fieldConfigs: Record<string, { required?: boolean; label: string }>
): string[] {
  return Object.entries(fieldConfigs)
    .filter(([, config]) => config.required)
    .map(([fieldId]) => fieldId);
}
