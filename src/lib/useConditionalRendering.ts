import { TransitoDataType } from './useFormManager';
import { 
  transitoConditionalFields
} from './transitoConditionalValidator';
import FormTexts from '../constants/texts';
import { useGenericConditionalForm } from './useGenericConditionalForm';
import { 
  GenericFormConfiguration
} from './genericConditionalValidator';

/**
 * Convierte la configuración de campos de tránsito al formato genérico
 */
function convertTransitoConfigToGeneric(): GenericFormConfiguration {
  const genericConfig: GenericFormConfiguration = {};
  
  Object.entries(FormTexts.transito).forEach(([fieldName, fieldConfig]) => {
    genericConfig[fieldName] = {
      id: fieldConfig.id,
      label: fieldConfig.label,
      required: fieldConfig.required,
      typeComponent: fieldConfig.typeComponent
    };
  });
  
  return genericConfig;
}

/**
 * Hook específico para el formulario de tránsito
 * Usa el sistema genérico como base pero mantiene compatibilidad con la API existente
 */
export function useTransitoConditionalRendering(data: TransitoDataType) {
  // Usar directamente las reglas de tránsito (ya están en formato genérico)
  const genericConfig = convertTransitoConfigToGeneric();
  
  const genericHook = useGenericConditionalForm(data, genericConfig, transitoConditionalFields);
  
  // Funciones específicas de tránsito para mantener compatibilidad
  const shouldRenderTransitoField = (fieldName: string): boolean => {
    return genericHook.shouldRenderField(fieldName);
  };

  const getFilteredTransitoFields = (): string[] => {
    return genericHook.getVisibleFields();
  };

  const getRequiredFieldsForTransito = (): string[] => {
    return genericHook.getRequiredFields();
  };

  const validateTransitoFieldsBasedOnRendering = () => {
    return genericHook.validateForm();
  };

  // También exponer las funciones genéricas para mayor flexibilidad
  return {
    // API específica de tránsito (para compatibilidad)
    shouldRenderTransitoField,
    getFilteredTransitoFields,
    getRequiredFieldsForTransito,
    validateTransitoFieldsBasedOnRendering,
    
    // API genérica (para casos avanzados)
    ...genericHook
  };
}
