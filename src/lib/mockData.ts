// Datos de ejemplo para auto-llenado de formularios en desarrollo
import { TutelaDataType, PeticionDataType, TransitoDataType } from './useFormManager';

// Datos comunes que se usan en todos los formularios
export const mockCommonData = {
  userName: "María Elena García Rodríguez",
  typeId: "CC",
  idNumber: "52987654",
  documentCity: "Bogotá",
  documentDate: "2025-09-09",
};

// Datos específicos para Tutela
const mockTutelaSpecificData = {
  email: "soyelsxbbsx@outlook.com",
  address: "Carrera 15 #45-67, Apartamento 302",
  city: "Bogotá",
  state: "Cundinamarca",
  phone: "3012345678",
  guiltyParty: "Ministerio de Salud y Protección Social",
  facts: "El día 15 de julio de 2024, solicité autorización para un procedimiento médico urgente a través de mi EPS, pero hasta la fecha no he recibido respuesta alguna. Mi estado de salud se ha deteriorado considerablemente y requiero atención inmediata. He agotado todas las instancias administrativas sin obtener una solución efectiva.",
  expectation: "Espero que se ordene a la entidad demandada autorizar de manera inmediata el procedimiento médico requerido, garantizando así mi derecho fundamental a la salud y a la vida digna. Además, solicito que se establezcan medidas para evitar que situaciones similares vuelvan a presentarse.",
  protectedRights: "Los derechos fundamentales que se buscan proteger con esta tutela son: el derecho a la salud (artículo 49 C.P.), el derecho a la vida en condiciones dignas (artículo 11 C.P.), el derecho al debido proceso (artículo 29 C.P.), y el derecho de petición (artículo 23 C.P.). Estos derechos están siendo vulnerados por la falta de respuesta oportuna a mi solicitud de autorización médica."
};

// Datos específicos para Petición
const mockPeticionSpecificData = {
  city: "Medellín",
  date: "2025-08-28",
  targetEntity: "Alcaldía de Medellín - Secretaría de Infraestructura",
  petitionRequest: "Solicito información detallada sobre el estado actual del proyecto de construcción del puente peatonal ubicado en la Carrera 80 con Calle 65. Específicamente requiero conocer: cronograma de ejecución, presupuesto asignado, empresa contratista responsable, y fecha estimada de finalización de la obra.",
  petitionReasons: "Como residente del sector y usuario frecuente de esta vía, necesito esta información para conocer el avance del proyecto que afecta directamente la movilidad de la comunidad. Además, como ciudadano tengo derecho a acceder a información pública sobre proyectos de infraestructura financiados con recursos públicos.",
  responseAddress: "Carrera 80 #65-45, Barrio Robledo",
  responseCity: "Medellín",
  responseEmail: "soyelsxbbsx@outlook.com",
};

// Datos específicos para Tránsito  
const mockTransitoSpecificData = {
  notificationAddress: "Calle 26 #47-89, Torre B, Apartamento 1205",
  notificationCity: "Barranquilla",
  notificationEmail: "soyelsxbbsx@gmail.com",
  phoneNumber: "3155551234",
  procedureType: "", // Se llenará con prompt files
  actNumber: "MOV-2024-001234",
  actDate: "2024-08-15",
  infractionCode: "C14",
  infractionDescription: "Conducir vehículo con pico y placa",
  vehicleBrand: "Chevrolet",
  vehicleModel: "Spark GT",
  vehiclePlates: "DEF456",
  isOwner: "si",
  mobilitySecretaryName: "Secretaría de Tránsito y Transporte de Barranquilla",
  petitionDate: "2024-08-20",
  virtualAudienceReason: "Por motivos de trabajo no puedo asistir presencialmente, ya que laboro en horario que coincide con las audiencias. Solicito audiencia virtual para poder ejercer mi derecho de defensa de manera efectiva.",
};

// Datos combinados (comunes + específicos) para cada tipo de formulario
export const mockTutelaData: TutelaDataType = {
  ...mockCommonData,
  ...mockTutelaSpecificData,
};

export const mockPeticionData: PeticionDataType = {
  ...mockCommonData,
  ...mockPeticionSpecificData,
};

export const mockTransitoData: TransitoDataType = {
  ...mockCommonData,
  ...mockTransitoSpecificData,
};

// Datos adicionales para campos del footer
export const mockFooterData = {
  deliveryEmail: "soyelsxbbsx@outlook.com",
};

// Función para obtener datos mock según el tipo de formulario
export function getMockDataForFormType(formType: 'tutela' | 'peticion' | 'transito') {
  switch (formType) {
    case 'tutela':
      return mockTutelaData;
    case 'peticion':
      return mockPeticionData;
    case 'transito':
      return mockTransitoData;
    default:
      return null;
  }
}

// Función para verificar si el auto-llenado está habilitado
export function isAutoFillEnabled(): boolean {
  return import.meta.env.VITE_AUTO_FILL_FORMS === 'true';
}
