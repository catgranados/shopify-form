import { 
  Validator, 
  validators,
  combineValidators 
} from './validators';

interface FieldConfig {
  id: string;
  typeComponent: "input" | "textarea" | "select" | "multiInput";
  typeField?: React.HTMLInputTypeAttribute;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

/**
 * Construye automáticamente las validaciones apropiadas para un campo
 * basándose en sus propiedades de configuración
 */
export function buildFieldValidators(config: FieldConfig): Validator[] {
  const validatorFns: Validator[] = [];

  // Validación de campo requerido
  if (config.required) {
    validatorFns.push(validators.required);
  }

  // Validaciones específicas por tipo de campo
  if (config.typeField === 'email') {
    validatorFns.push(validators.email);
  }

  // Validación de longitud mínima
  if (config.minLength !== undefined) {
    validatorFns.push(validators.minLength(config.minLength));
  }

  // Validación de longitud máxima
  if (config.maxLength !== undefined) {
    validatorFns.push(validators.maxLength(config.maxLength));
  }

  // Validación de patrón
  if (config.pattern) {
    validatorFns.push(validators.pattern(config.pattern, 'Formato inválido'));
  }

  return validatorFns;
}

/**
 * Combina las validaciones de un campo en una sola función validadora
 */
export function getFieldValidator(config: FieldConfig): Validator | null {
  const validators = buildFieldValidators(config);
  
  if (validators.length === 0) {
    return null;
  }

  if (validators.length === 1) {
    return validators[0];
  }

  return combineValidators(...validators);
}

/**
 * Mapeo de tipos de campo a validaciones específicas adicionales
 */
const typeFieldValidators: Record<string, Validator[]> = {
  'tel': [validators.pattern(/^[+]?[1-9]\d{1,14}$/, 'Formato de teléfono inválido')], // Teléfono internacional
  'url': [validators.pattern(/^https?:\/\/.+/, 'URL inválida')], // URLs básicas
  'number': [validators.pattern(/^\d+$/, 'Solo se permiten números')], // Solo números
};

/**
 * Obtiene validaciones adicionales basadas en el tipo de campo
 */
export function getTypeFieldValidators(typeField?: React.HTMLInputTypeAttribute): Validator[] {
  if (!typeField || !typeFieldValidators[typeField]) {
    return [];
  }
  
  return typeFieldValidators[typeField];
}

/**
 * Construye validaciones completas incluyendo validaciones por tipo
 */
export function buildCompleteFieldValidators(config: FieldConfig): Validator[] {
  const baseValidators = buildFieldValidators(config);
  const typeValidators = getTypeFieldValidators(config.typeField);
  
  return [...baseValidators, ...typeValidators];
}
