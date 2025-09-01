import { useMemo } from 'react';
import { PeticionDataType } from './useFormManager';
import FormTexts from '../constants/texts';

/**
 * Hook que sobrescribe isFormComplete para formularios de petición
 * considerando que algunos campos no son requeridos
 */
export function usePeticionFormCompleteness(
  peticionData: PeticionDataType,
  standardIsFormComplete: boolean,
  formType: string | null
) {
  const isPeticionFormComplete = useMemo(() => {
    // Solo aplicar lógica especial si es formulario de petición
    if (formType !== 'peticion') {
      return standardIsFormComplete;
    }

    // Obtener configuración de campos de petición
    const fieldConfig = FormTexts.peticion;
    
    // Obtener campos requeridos
    const requiredFields = Object.entries(fieldConfig)
      .filter(([, config]) => config.required)
      .map(([fieldId]) => fieldId);

    // Verificar que todos los campos requeridos estén completos
    return requiredFields.every(fieldId => {
      const value = peticionData[fieldId as keyof PeticionDataType];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value && (value as string).trim() !== '';
    });
  }, [peticionData, formType, standardIsFormComplete]);

  return isPeticionFormComplete;
}
