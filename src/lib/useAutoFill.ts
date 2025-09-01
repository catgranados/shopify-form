import { useEffect } from 'react';
import { isAutoFillEnabled, getMockDataForFormType, mockFooterData } from './mockData';
import { TutelaDataType, PeticionDataType, TransitoDataType } from './useFormManager';

interface UseAutoFillProps {
  effectiveFormType: 'tutela' | 'peticion' | 'transito' | null;
  updateTutelaField?: (fieldId: keyof TutelaDataType, value: string | string[]) => void;
  updatePeticionField?: (fieldId: keyof PeticionDataType, value: string | string[]) => void;
  updateTransitoField?: (fieldId: keyof TransitoDataType, value: string | string[]) => void;
  setDeliveryEmail?: (email: string) => void;
  orderLookupCompleted: boolean; // Nuevo parámetro para saber cuándo se completó la búsqueda
}

/**
 * Hook para auto-llenar formularios con datos de prueba en desarrollo
 */
export function useAutoFill({
  effectiveFormType,
  updateTutelaField,
  updatePeticionField,
  updateTransitoField,
  setDeliveryEmail,
  orderLookupCompleted
}: UseAutoFillProps) {

  useEffect(() => {
    // Solo ejecutar si el auto-llenado está habilitado, hay un tipo de formulario efectivo,
    // y se ha completado la búsqueda de la orden
    if (!isAutoFillEnabled() || !effectiveFormType || !orderLookupCompleted) {
      return;
    }

    // Obtener datos mock para el tipo de formulario
    const mockData = getMockDataForFormType(effectiveFormType);
    if (!mockData) {
      console.warn(`⚠️ No hay datos mock disponibles para el tipo de formulario: ${effectiveFormType}`);
      return;
    }

    console.log(`🔥 Auto-llenando formulario de ${effectiveFormType} con datos de prueba...`);

    // Auto-llenar según el tipo de formulario
    if (effectiveFormType === 'tutela' && updateTutelaField) {
      const tutelaData = mockData as TutelaDataType;
      Object.entries(tutelaData).forEach(([fieldId, value]) => {
        updateTutelaField(fieldId as keyof TutelaDataType, value);
      });
    } else if (effectiveFormType === 'peticion' && updatePeticionField) {
      const peticionData = mockData as PeticionDataType;
      Object.entries(peticionData).forEach(([fieldId, value]) => {
        updatePeticionField(fieldId as keyof PeticionDataType, value);
      });
    } else if (effectiveFormType === 'transito' && updateTransitoField) {
      const transitoData = mockData as TransitoDataType;
      Object.entries(transitoData).forEach(([fieldId, value]) => {
        updateTransitoField(fieldId as keyof TransitoDataType, value);
      });
    }

    // Auto-llenar email de entrega
    if (setDeliveryEmail) {
      setDeliveryEmail(mockFooterData.deliveryEmail);
    }

    console.log(`✅ Formulario de ${effectiveFormType} auto-llenado exitosamente`);

  }, [
    effectiveFormType, 
    updateTutelaField, 
    updatePeticionField, 
    updateTransitoField, 
    setDeliveryEmail,
    orderLookupCompleted
  ]);
}
