import { useState, useCallback, useMemo } from 'react';
import { validateForm, FormValidationResult, FormType, getFormType } from './formValidator';
import FormTexts from '../constants/texts';
import { Validator } from './validators';

// Tipos para los diferentes formularios
export type TutelaDataType = {
  userName: string;
  typeId: string;
  idNumber: string;
  email: string;
  address: string;
  city_state: string;
  phone: string;
  guiltyParty: string;
  facts: string;
  expectation: string;
  protectedRights: string; // Nuevo campo para derechos fundamentales protegidos
};

export type PeticionDataType = {
  userName: string;
  typeId: string;
  idNumber: string;
  cityDate: string;
  targetEntity: string;
  petitionRequest: string;
  petitionReasons: string;
  responseAddress: string;
  responseEmail: string;
};

export type TransitoDataType = {
  // Datos del Solicitante
  userName: string;
  typeId: string;
  idNumber: string;
  notificationAddress: string;
  notificationCity: string;
  notificationEmail: string;
  phoneNumber: string;

  // Datos del Trámite y el Vehículo
  procedureType: string;
  actNumber: string;
  actDate: string;
  infractionCode: string;
  infractionDescription: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlates: string;
  isOwner: string;

  // Datos Adicionales/Contextuales
  mobilitySecretaryName: string;
  petitionDate: string;
  virtualAudienceReason: string;
};

// Union type para todos los tipos de formulario
export type FormDataUnion = TutelaDataType | PeticionDataType | TransitoDataType;

interface FieldConfig {
  validators?: Validator[];
  required?: boolean;
  label: string;
}

interface UseFormManagerReturn<T extends Record<string, string | string[]>> {
  formData: T;
  updateField: (fieldId: keyof T, value: string | string[]) => void;
  validateAllFields: () => FormValidationResult;
  isFormValid: boolean;
  isFormComplete: boolean;
  resetForm: () => void;
  getFieldConfig: () => Record<keyof T, FieldConfig>;
}

/**
 * Hook personalizado para manejar estado y validación de formularios dinámicos
 */
export function useFormManager<T extends Record<string, string | string[]>>(
  initialData: T,
  orderTitle: string
): UseFormManagerReturn<T> {
  const [formData, setFormData] = useState<T>(initialData);
  
  // Determinar tipo de formulario automáticamente
  const formType = useMemo(() => getFormType(orderTitle), [orderTitle]);
  
  // Obtener configuración de campos según el tipo de formulario
  const getFieldConfig = useCallback((): Record<keyof T, FieldConfig> => {
    switch (formType) {
      case 'tutela':
        return FormTexts.tutela as Record<keyof T, FieldConfig>;
      case 'peticion':
        // Retornar configuración de petición
        return FormTexts.peticion as Record<keyof T, FieldConfig>;
      case 'transito':
        // Retornar configuración de tránsito cuando se implemente
        return {} as Record<keyof T, FieldConfig>;
      default:
        return FormTexts.tutela as Record<keyof T, FieldConfig>;
    }
  }, [formType]);

  // Actualizar un campo específico
  const updateField = useCallback((fieldId: keyof T, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  }, []);

  // Validar todos los campos del formulario
  const validateAllFields = useCallback((): FormValidationResult => {
    const fieldConfig = getFieldConfig();
    return validateForm(formData, fieldConfig);
  }, [formData, getFieldConfig]);

  // Verificar si el formulario es válido
  const isFormValid = useMemo(() => {
    const validation = validateAllFields();
    return validation.isValid;
  }, [validateAllFields]);

  // Verificar si el formulario está completo (campos requeridos)
  const isFormComplete = useMemo(() => {
    const fieldConfig = getFieldConfig();
    const requiredFields = Object.entries(fieldConfig)
      .filter(([, config]) => config.required)
      .map(([fieldId]) => fieldId);

    return requiredFields.every(fieldId => {
      const value = formData[fieldId as keyof T];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value && (value as string).trim() !== '';
    });
  }, [formData, getFieldConfig]);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setFormData(initialData);
  }, [initialData]);

  return {
    formData,
    updateField,
    validateAllFields,
    isFormValid,
    isFormComplete,
    resetForm,
    getFieldConfig
  };
}

/**
 * Función helper para crear datos iniciales de formulario
 */
export function createInitialFormData(formType: FormType): FormDataUnion {
  switch (formType) {
    case 'tutela':
      return {
        userName: '',
        typeId: '',
        idNumber: '',
        email: '',
        address: '',
        city_state: '',
        phone: '',
        guiltyParty: '',
        facts: '',
        expectation: '',
        protectedRights: '',
      } as TutelaDataType;
    
    case 'peticion':
      return {
        userName: '',
        typeId: '',
        idNumber: '',
        cityDate: '',
        targetEntity: '',
        petitionRequest: '',
        petitionReasons: '',
        responseAddress: '',
        responseEmail: ''
      } as PeticionDataType;
    
    case 'transito':
      return {
        // Datos del Solicitante
        userName: '',
        typeId: '',
        idNumber: '',
        notificationAddress: '',
        notificationCity: '',
        notificationEmail: '',
        phoneNumber: '',
        
        // Datos del Trámite y el Vehículo
        procedureType: '',
        actNumber: '',
        actDate: '',
        infractionCode: '',
        infractionDescription: '',
        vehicleBrand: '',
        vehicleModel: '',
        vehiclePlates: '',
        isOwner: '',
        
        // Datos Adicionales/Contextuales
        mobilitySecretaryName: '',
        petitionDate: '',
        virtualAudienceReason: '',
      } as TransitoDataType;
    
    default:
      return createInitialFormData('tutela');
  }
}
