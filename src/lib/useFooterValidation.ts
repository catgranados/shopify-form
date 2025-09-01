import { useCallback, useMemo } from 'react';
import { validateForm, FormValidationResult } from './formValidator';
import FormTexts from '../constants/texts';
import { Validator } from './validators';

interface FooterFieldConfig {
  validators?: Validator[];
  required?: boolean;
  label: string;
}

interface FooterFormData extends Record<string, string> {
  deliveryEmail: string;
}

interface UseFooterValidationReturn {
  validateFooterFields: () => FormValidationResult;
  isFooterValid: boolean;
  isFooterComplete: boolean;
  getFooterFieldConfig: () => Record<keyof FooterFormData, FooterFieldConfig>;
}

/**
 * Hook para manejar la validación de campos del footer (email de entrega)
 */
export function useFooterValidation(
  deliveryEmail: string,
  usePreviousEmail: boolean
): UseFooterValidationReturn {
  
  // Configuración de campos del footer
  const getFooterFieldConfig = useCallback((): Record<keyof FooterFormData, FooterFieldConfig> => {
    return {
      deliveryEmail: {
        validators: FormTexts.footer.deliveryEmail.validators,
        required: FormTexts.footer.deliveryEmail.required,
        label: FormTexts.footer.deliveryEmail.label
      }
    };
  }, []);

  // Datos del formulario footer
  const footerFormData = useMemo((): FooterFormData => ({
    deliveryEmail: deliveryEmail.trim()
  }), [deliveryEmail]);

  // Función de validación
  const validateFooterFields = useCallback((): FormValidationResult => {
    const fieldConfig = getFooterFieldConfig();
    
    // Si usePreviousEmail está activado, considerar el campo como válido sin errores
    if (usePreviousEmail) {
      return {
        isValid: true,
        errors: [],
        validFields: ['deliveryEmail'],
        invalidFields: []
      };
    }
    
    return validateForm(footerFormData, fieldConfig);
  }, [footerFormData, getFooterFieldConfig, usePreviousEmail]);

  // Calcular si el footer es válido
  const isFooterValid = useMemo(() => {
    const validation = validateFooterFields();
    return validation.isValid;
  }, [validateFooterFields]);

  // Calcular si el footer está completo
  const isFooterComplete = useMemo(() => {
    // Si usePreviousEmail está activado, considerar como completo
    if (usePreviousEmail) {
      return true;
    }
    
    // De lo contrario, verificar que el email esté presente
    return deliveryEmail.trim() !== '';
  }, [deliveryEmail, usePreviousEmail]);

  return {
    validateFooterFields,
    isFooterValid,
    isFooterComplete,
    getFooterFieldConfig
  };
}
