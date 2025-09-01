import {
  GenericConditionalFields,
  GenericFormConfiguration,
  GenericValidationResult,
  shouldShowGenericField,
  isGenericFieldRequired,
  getRequiredGenericFields,
  validateGenericFieldsBasedOnRenderingAndRequirement
} from './genericConditionalValidator';

/**
 * Hook genérico para manejo de renderizado condicional y validación
 * Puede ser usado con cualquier tipo de formulario
 */
export function useGenericConditionalForm<T extends Record<string, unknown>>(
  formData: T,
  formConfiguration: GenericFormConfiguration,
  conditionalFields: GenericConditionalFields = {}
) {
  
  /**
   * Determina si un campo debe renderizarse
   */
  const shouldRenderField = (fieldName: string): boolean => {
    return shouldShowGenericField(fieldName, formData, conditionalFields);
  };

  /**
   * Determina si un campo es requerido en el estado actual
   */
  const isFieldRequired = (fieldName: string): boolean => {
    return isGenericFieldRequired(fieldName, formData, conditionalFields, formConfiguration);
  };

  /**
   * Obtiene una lista de todos los campos que deben ser visibles actualmente
   */
  const getVisibleFields = (): string[] => {
    return Object.keys(formConfiguration).filter(fieldName => 
      shouldRenderField(fieldName)
    );
  };

  /**
   * Obtiene una lista de campos requeridos para el estado actual
   */
  const getRequiredFields = (): string[] => {
    return getRequiredGenericFields(formData, conditionalFields, formConfiguration);
  };

  /**
   * Obtiene una lista de campos que están visibles Y son requeridos
   */
  const getVisibleRequiredFields = (): string[] => {
    return getRequiredFields().filter(fieldName => shouldRenderField(fieldName));
  };

  /**
   * Valida el formulario considerando solo campos visibles y requeridos
   */
  const validateForm = (): GenericValidationResult => {
    return validateGenericFieldsBasedOnRenderingAndRequirement(
      formData, 
      formConfiguration, 
      conditionalFields
    );
  };

  /**
   * Obtiene la configuración filtrada solo de campos visibles
   */
  const getVisibleFieldsConfiguration = (): GenericFormConfiguration => {
    const visibleFields = getVisibleFields();
    const visibleConfig: GenericFormConfiguration = {};
    
    visibleFields.forEach(fieldName => {
      if (formConfiguration[fieldName]) {
        visibleConfig[fieldName] = formConfiguration[fieldName];
      }
    });
    
    return visibleConfig;
  };

  /**
   * Verifica si el formulario está completo (todos los campos requeridos y visibles tienen valor)
   */
  const isFormComplete = (): boolean => {
    const validation = validateForm();
    return validation.isValid;
  };

  /**
   * Obtiene estadísticas del formulario
   */
  const getFormStats = () => {
    const validation = validateForm();
    const totalFields = Object.keys(formConfiguration).length;
    const visibleFields = getVisibleFields().length;
    const requiredFields = getRequiredFields().length;
    const visibleRequiredFields = getVisibleRequiredFields().length;
    const completedRequiredFields = validation.validatedFields.length;
    
    return {
      totalFields,
      visibleFields,
      requiredFields,
      visibleRequiredFields,
      completedRequiredFields,
      skippedFields: validation.skippedFields.length,
      hasErrors: !validation.isValid,
      errorCount: Object.keys(validation.errors).length
    };
  };

  return {
    // Funciones principales
    shouldRenderField,
    isFieldRequired,
    validateForm,
    isFormComplete,
    
    // Funciones de utilidad
    getVisibleFields,
    getRequiredFields,
    getVisibleRequiredFields,
    getVisibleFieldsConfiguration,
    getFormStats
  };
}
