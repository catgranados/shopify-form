import { useMemo } from 'react';
import { TransitoDataType } from './useFormManager';
import { useTransitoConditionalRendering } from './useConditionalRendering';

/**
 * Hook que sobrescribe isFormComplete para formularios de tránsito
 * considerando las reglas de renderizado condicional
 */
export function useTransitoFormCompleteness(
  transitoData: TransitoDataType,
  standardIsFormComplete: boolean,
  formType: string | null
) {
  const {
    getRequiredFieldsForTransito,
    shouldRenderTransitoField
  } = useTransitoConditionalRendering(transitoData);

  const isTransitoFormComplete = useMemo(() => {
    // Solo aplicar lógica especial si es formulario de tránsito
    if (formType !== 'transito') {
      return standardIsFormComplete;
    }

    // Obtener campos requeridos considerando renderizado condicional
    const requiredFields = getRequiredFieldsForTransito();
    
    // Verificar que todos los campos requeridos y visibles estén completos
    return requiredFields.every(fieldId => {
      // Solo verificar campos que deben renderizarse
      if (!shouldRenderTransitoField(fieldId)) {
        return true; // Si no se renderiza, no es requerido
      }

      const value = transitoData[fieldId as keyof TransitoDataType];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value && (value as string).trim() !== '';
    });
  }, [transitoData, formType, standardIsFormComplete, getRequiredFieldsForTransito, shouldRenderTransitoField]);

  return isTransitoFormComplete;
}
