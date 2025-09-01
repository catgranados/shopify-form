import { buildCompleteFieldValidators } from '../lib/validationBuilder';
import FormTexts from '../constants/texts';

/**
 * Inicializa automáticamente las validaciones para todos los campos en FormTexts
 */
export function initializeFieldValidations() {
  // Actualizar validaciones para orderNumber
  FormTexts.orderNumber.validators = buildCompleteFieldValidators(FormTexts.orderNumber);

  // Actualizar validaciones para todos los campos de tutela
  const tutelaFields = FormTexts.tutela;
  Object.keys(tutelaFields).forEach(fieldKey => {
    const field = tutelaFields[fieldKey as keyof typeof tutelaFields];
    if (field && typeof field === 'object' && 'id' in field) {
      field.validators = buildCompleteFieldValidators(field);
    }
  });

  return FormTexts;
}

/**
 * Obtiene el validador combinado para un campo específico
 */
export function getFieldValidation(fieldKey: string) {
  // Primero buscar en el nivel raíz
  if (fieldKey === 'orderNumber') {
    const validators = FormTexts.orderNumber.validators || [];
    return validators.length > 0 ? validators[0] : null;
  }

  // Luego buscar en tutela
  const tutelaField = FormTexts.tutela[fieldKey as keyof typeof FormTexts.tutela];
  if (tutelaField && typeof tutelaField === 'object' && 'validators' in tutelaField) {
    const validators = tutelaField.validators || [];
    return validators.length > 0 ? validators[0] : null;
  }

  return null;
}
