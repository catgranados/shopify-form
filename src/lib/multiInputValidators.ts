import { Validator } from './validators';

/**
 * Validadores específicos para FormMultiInput que maneja arrays de valores
 */

/**
 * Valida que al menos un elemento esté seleccionado
 */
export const multiInputRequired: Validator = (value: string): string | null => {
  // El valor viene como string separado por comas desde FormMultiInput
  const values = value ? value.split(',').filter(v => v.trim() !== '') : [];
  return values.length > 0 ? null : 'Debe seleccionar al menos una opción';
};

/**
 * Valida que se haya seleccionado exactamente un número específico de elementos
 */
export const multiInputExactCount = (count: number): Validator => (value: string): string | null => {
  const values = value ? value.split(',').filter(v => v.trim() !== '') : [];
  return values.length === count 
    ? null 
    : `Debe seleccionar exactamente ${count} opción${count !== 1 ? 'es' : ''}`;
};

/**
 * Valida que se haya seleccionado al menos un número mínimo de elementos
 */
export const multiInputMinCount = (min: number): Validator => (value: string): string | null => {
  const values = value ? value.split(',').filter(v => v.trim() !== '') : [];
  return values.length >= min 
    ? null 
    : `Debe seleccionar al menos ${min} opción${min !== 1 ? 'es' : ''}`;
};

/**
 * Valida que no se haya seleccionado más de un número máximo de elementos
 */
export const multiInputMaxCount = (max: number): Validator => (value: string): string | null => {
  const values = value ? value.split(',').filter(v => v.trim() !== '') : [];
  return values.length <= max 
    ? null 
    : `No puede seleccionar más de ${max} opción${max !== 1 ? 'es' : ''}`;
};

/**
 * Valida que el número de elementos seleccionados esté dentro de un rango
 */
export const multiInputCountRange = (min: number, max: number): Validator => (value: string): string | null => {
  const values = value ? value.split(',').filter(v => v.trim() !== '') : [];
  const count = values.length;
  
  if (count < min) {
    return `Debe seleccionar al menos ${min} opción${min !== 1 ? 'es' : ''}`;
  }
  
  if (count > max) {
    return `No puede seleccionar más de ${max} opción${max !== 1 ? 'es' : ''}`;
  }
  
  return null;
};

/**
 * Valida que todos los valores seleccionados estén en una lista de valores permitidos
 */
export const multiInputAllowedValues = (allowedValues: string[]): Validator => (value: string): string | null => {
  const values = value ? value.split(',').filter(v => v.trim() !== '') : [];
  const invalidValues = values.filter(v => !allowedValues.includes(v));
  
  return invalidValues.length === 0 
    ? null 
    : `Valores no permitidos: ${invalidValues.join(', ')}`;
};

/**
 * Valida que al menos uno de los valores requeridos esté seleccionado
 */
export const multiInputRequiredValues = (requiredValues: string[]): Validator => (value: string): string | null => {
  const values = value ? value.split(',').filter(v => v.trim() !== '') : [];
  const hasRequired = requiredValues.some(required => values.includes(required));
  
  return hasRequired 
    ? null 
    : `Debe seleccionar al menos una de estas opciones: ${requiredValues.join(', ')}`;
};

/**
 * Validadores compuestos comunes para FormMultiInput
 */
export const multiInputValidators = {
  // Para selección única obligatoria (radio buttons)
  singleRequired: multiInputRequired,
  
  // Para selección múltiple obligatoria (checkboxes)
  multipleRequired: multiInputRequired,
  
  // Para máximo 3 opciones
  maxThree: multiInputMaxCount(3),
  
  // Para entre 2 y 5 opciones
  twoToFive: multiInputCountRange(2, 5),
  
  // Para exactamente 2 opciones
  exactlyTwo: multiInputExactCount(2),
};

/**
 * Función helper para crear validadores personalizados de FormMultiInput
 */
export function createMultiInputValidator(
  validatorFn: (values: string[]) => string | null
): Validator {
  return (value: string): string | null => {
    const values = value ? value.split(',').filter(v => v.trim() !== '') : [];
    return validatorFn(values);
  };
}

export default {
  multiInputRequired,
  multiInputExactCount,
  multiInputMinCount,
  multiInputMaxCount,
  multiInputCountRange,
  multiInputAllowedValues,
  multiInputRequiredValues,
  multiInputValidators,
  createMultiInputValidator,
};
