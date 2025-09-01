/**
 * Sistema genérico de validación condicional
 * Puede ser usado con cualquier tipo de formulario
 */

// Tipos genéricos para reglas condicionales
interface GenericConditionalRule {
  // Campo del cual depende la condición
  dependsOn: string;
  // Valores que hacen que la condición sea verdadera
  when: string | string[];
  // Tipo de validación
  type: 'show' | 'require';
}

interface GenericFormField {
  id: string;
  label: string;
  required?: boolean;
  typeComponent?: string;
}

export interface GenericFormConfiguration {
  [fieldName: string]: GenericFormField;
}

export interface GenericConditionalFields {
  [fieldName: string]: GenericConditionalRule | GenericConditionalRule[];
}

export interface GenericValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  validatedFields: string[];
  skippedFields: string[];
}

/**
 * Evalúa si una regla condicional se cumple
 */
export function evaluateGenericCondition<T extends Record<string, unknown>>(
  rule: GenericConditionalRule,
  formData: T
): boolean {
  const dependentValue = formData[rule.dependsOn];
  const whenValues = Array.isArray(rule.when) ? rule.when : [rule.when];
  return whenValues.includes(String(dependentValue));
}

/**
 * Determina si un campo debe mostrarse basado en reglas condicionales
 */
export function shouldShowGenericField<T extends Record<string, unknown>>(
  fieldName: string,
  formData: T,
  conditionalFields: GenericConditionalFields
): boolean {
  const rules = conditionalFields[fieldName];
  if (!rules) return true; // Si no hay reglas, se muestra por defecto
  
  const ruleArray = Array.isArray(rules) ? rules : [rules];
  
  // Filtrar solo las reglas de tipo 'show'
  const showRules = ruleArray.filter(rule => rule.type === 'show');
  if (showRules.length === 0) return true; // Si no hay reglas de 'show', se muestra por defecto
  
  // Si hay múltiples reglas de 'show', todas deben ser verdaderas (AND lógico)
  return showRules.every(rule => evaluateGenericCondition(rule, formData));
}

/**
 * Determina si un campo es requerido basado en reglas condicionales
 */
export function isGenericFieldRequired<T extends Record<string, unknown>>(
  fieldName: string,
  formData: T,
  conditionalFields: GenericConditionalFields,
  formConfiguration: GenericFormConfiguration
): boolean {
  // Verificar si el campo está marcado como requerido en la configuración base
  const fieldConfig = formConfiguration[fieldName];
  const isBaseRequired = fieldConfig?.required === true;
  
  // Verificar reglas condicionales de tipo 'require'
  const rules = conditionalFields[fieldName];
  if (rules) {
    const ruleArray = Array.isArray(rules) ? rules : [rules];
    const requireRules = ruleArray.filter(rule => rule.type === 'require');
    
    // Si hay reglas de 'require' y alguna se cumple, el campo es requerido
    if (requireRules.length > 0) {
      const isConditionallyRequired = requireRules.some(rule => 
        evaluateGenericCondition(rule, formData)
      );
      return isBaseRequired || isConditionallyRequired;
    }
  }
  
  return isBaseRequired;
}

/**
 * Obtiene todos los campos requeridos para el estado actual del formulario
 */
export function getRequiredGenericFields<T extends Record<string, unknown>>(
  formData: T,
  conditionalFields: GenericConditionalFields,
  formConfiguration: GenericFormConfiguration
): string[] {
  return Object.keys(formConfiguration).filter(fieldName =>
    isGenericFieldRequired(fieldName, formData, conditionalFields, formConfiguration)
  );
}

/**
 * Valida campos basándose en reglas de renderizado y requerimientos
 * Solo valida campos que están actualmente renderizados Y son requeridos
 */
export function validateGenericFieldsBasedOnRenderingAndRequirement<T extends Record<string, unknown>>(
  formData: T,
  formConfiguration: GenericFormConfiguration,
  conditionalFields: GenericConditionalFields = {}
): GenericValidationResult {
  const errors: Record<string, string> = {};
  const validatedFields: string[] = [];
  const skippedFields: string[] = [];

  Object.keys(formConfiguration).forEach(fieldName => {
    const fieldConfig = formConfiguration[fieldName];
    const fieldValue = formData[fieldName];
    
    // Verificar si el campo debe mostrarse
    const isFieldRendered = shouldShowGenericField(fieldName, formData, conditionalFields);
    
    // Verificar si el campo es requerido
    const isFieldRequired = isGenericFieldRequired(fieldName, formData, conditionalFields, formConfiguration);
    
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
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    validatedFields,
    skippedFields
  };
}
