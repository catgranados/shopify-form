import React, { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/card'
import { Button } from './components/ui/button';
import FormTexts from './constants/texts'
import FormActionInput from './components/formActionInput'
import FormTextarea from './components/formTextarea';
import FormMultiInput, { MultiInputOption } from './components/formMultiInput';
import FormSelect from './components/formSelect';
import FormSelectWithPromptFiles from './components/formSelectWithPromptFiles';
import { preparePromptFilesForSubmission } from './lib/useFormFieldWithPromptFiles';
import { Info } from 'lucide-react';
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner'
import { apiService } from './services/apiService'
import { OrderData, ProcessedOrderData, PromptFileWithContent } from './types/index'
import { initializeFieldValidations } from './lib/fieldValidationInitializer'
import { useFormManager, TutelaDataType, PeticionDataType, TransitoDataType } from './lib/useFormManager'
import { getFormType } from './lib/formValidator'
import { formSubmissionService } from './services/formSubmissionService'
import { Separator } from './components/ui/separator';
import { useTransitoConditionalRendering } from './lib/useConditionalRendering';
import { useFooterValidation } from './lib/useFooterValidation';
import { useAutoFill } from './lib/useAutoFill';
import { useTransitoFormCompleteness } from './lib/useTransitoFormCompleteness';
import { usePeticionFormCompleteness } from './lib/usePeticionFormCompleteness';


initializeFieldValidations();

function App () {
  const [orderNumberField, setOrderNumberField] = useState('');
  const [confirmationCodeField, setConfirmationCodeField] = useState('');
  const [shopName, setShopName] = useState('CG Asesores'); // Estado para el nombre de la tienda
  const [order, setOrder] = useState<OrderData>({
    id: '',
    orderNumber: '',
    amount: 0,
    date: '',
    status: '',
    items: [{
      title: '',
      quantity: 0,
      price: 0
    }]
  });

  // Estado para prompt files con contenido
  const [promptFiles, setPromptFiles] = useState<Record<string, PromptFileWithContent>>({});

  // Estados para campos del footer
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [usePreviousEmail, setUsePreviousEmail] = useState(false);

  // Estado para rastrear cuando se completó la búsqueda de orden (para auto-llenado)
  const [orderLookupCompleted, setOrderLookupCompleted] = useState(false);

  const initialTutelaData: TutelaDataType = {
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
  };

  const {
    formData: tutelaData,
    updateField: updateTutelaField,
    validateAllFields: validateTutelaForm,
    isFormComplete: isTutelaFormComplete,
    resetForm: resetTutelaForm
  } = useFormManager(initialTutelaData, order.items[0].title);


  const initialPeticionData: PeticionDataType = {
    userName: '',
    typeId: '',
    idNumber: '',
    cityDate: '',
    targetEntity: '',
    petitionRequest: '',
    petitionReasons: '',
    responseAddress: '',
    responseEmail: ''
  };

  const {
    formData: peticionData,
    updateField: updatePeticionField,
    validateAllFields: validatePeticionForm,
    isFormComplete: isPeticionFormComplete,
    resetForm: resetPeticionForm
  } = useFormManager(initialPeticionData, order.items[0].title);

  // Estado inicial para el formulario de tránsito
  const initialTransitoData: TransitoDataType = {
    userName: '',
    typeId: '',
    idNumber: '',
    notificationAddress: '',
    notificationCity: '',
    notificationEmail: '',
    phoneNumber: '',
    procedureType: '',
    actNumber: '',
    actDate: '',
    infractionCode: '',
    infractionDescription: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehiclePlates: '',
    isOwner: '',
    mobilitySecretaryName: '',
    petitionDate: '',
    virtualAudienceReason: ''
  };

  const {
    formData: transitoData,
    updateField: updateTransitoField,
    isFormComplete: isTransitoFormComplete
  } = useFormManager(initialTransitoData, order.items[0].title);

  // Hook para renderizado condicional de tránsito
  const {
    shouldRenderTransitoField,
    validateTransitoFieldsBasedOnRendering
  } = useTransitoConditionalRendering(transitoData);

  // Hook para validación del footer
  const {
    validateFooterFields,
    isFooterComplete,
  } = useFooterValidation(deliveryEmail, usePreviousEmail);

  // Función específica para iterar campos de tránsito con renderizado condicional
  const iterateTransitoFields = () => Object.entries(FormTexts.transito)
    .filter(([key]) => shouldRenderTransitoField(key)) // Aplicar filtro condicional
    .map(([key, value]) => {
      const fieldKey = key as keyof typeof transitoData;

      if (value.typeComponent === "textarea") {
        return (
          <FormTextarea
            key={value.id}
            id={value.id}
            label={value.label}
            labelProps={{ className: commonFormFieldsClassnames.labelClassname }}
            wrapperClassName={commonFormFieldsClassnames.wrapper}
            textareaProps={{
              placeholder: value.fieldPlaceholder,
              value: transitoData[fieldKey] as string,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateTransitoField(fieldKey, e.target.value),
              disabled: isLoading,
            }}
            required={value.required}
            validators={value.validators || []}
            alertVariant="destructive"
          />
        )
      } else if (value.typeComponent === "select") {
        // Usar FormSelectWithPromptFiles para el campo procedureType
        if (fieldKey === 'procedureType') {
          return (
            <FormSelectWithPromptFiles
              key={value.id}
              id={value.id}
              label={value.label}
              promptFiles={promptFiles}
              staticOptions={value.selectOptions}
              placeholder={value.selectPlaceholder || "Selecciona el tipo de trámite"}
              noPromptFilesMessage={value.selectEmptyMessage || "No hay trámites disponibles"}
              showLoadingPlaceholder={true}
              value={transitoData[fieldKey] as string}
              onValueChange={(newValue) => updateTransitoField(fieldKey, newValue)}
              required={value.required}
              validators={value.validators || []}
              alertVariant="destructive"
              selectProps={{ disabled: isLoading }}
              labelProps={{ className: commonFormFieldsClassnames.labelClassname }}
              wrapperClassName={commonFormFieldsClassnames.wrapper}
            />
          )
        } else {
          // FormSelect normal para otros campos select
          return (
            <FormSelect
              key={value.id}
              id={value.id}
              label={value.label}
              options={value.selectOptions}
              optionGroups={value.selectOptionGroups}
              placeholder={value.selectPlaceholder}
              emptyMessage={value.selectEmptyMessage}
              value={transitoData[fieldKey] as string}
              onValueChange={(newValue) => updateTransitoField(fieldKey, newValue)}
              required={value.required}
              validators={value.validators || []}
              alertVariant="destructive"
              selectProps={{ disabled: isLoading }}
              labelProps={{ className: commonFormFieldsClassnames.labelClassname }}
              wrapperClassName={commonFormFieldsClassnames.wrapper}
            />
          )
        }
      } else {
        return (
          <FormActionInput
            key={value.id}
            id={value.id}
            label={value.label}
            labelProps={{ className: commonFormFieldsClassnames.labelClassname }}
            wrapperClassName={commonFormFieldsClassnames.wrapper}
            inputProps={{
              type: value.typeField || "text",
              placeholder: value.fieldPlaceholder,
              value: transitoData[fieldKey] as string,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateTransitoField(fieldKey, e.target.value),
              disabled: isLoading,
            }}
            required={value.required}
            validators={value.validators || []}
            alertVariant="destructive"
          />
        )
      }
    });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderValidation, setOrderValidation] = useState<{
    isProcessed: boolean;
    processedData: ProcessedOrderData | null;
    message: string;
    allowBypass: boolean;
  } | null>(null);
  const [bypassFormType, setBypassFormType] = useState<'tutela' | 'peticion' | 'transito' | ''>('');

  const commonFormFieldsClassnames = {
    wrapper: "space-y-3",
    labelClassname: "text-muted-foreground"
  }


  useEffect(() => {

    apiService.getShopName().then(name => {
      setShopName(name);
    }).catch(error => {
      console.error('❌ Error cargando nombre de tienda:', error);
    });

    apiService.testConnection();
  }, []);

  const handleTutelaFieldChange = (fieldId: keyof TutelaDataType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateTutelaField(fieldId, value);
  };

  const handleTutelaTextareaChange = (fieldId: keyof TutelaDataType) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    updateTutelaField(fieldId, value);
  };

  const handleTutelaMultiInputChange = (fieldId: keyof TutelaDataType) => (value: string | string[]) => {
    updateTutelaField(fieldId, value);
  };

  const handleTutelaSelectChange = (fieldId: keyof TutelaDataType) => (value: string) => {
    updateTutelaField(fieldId, value);
  };

  // Handlers para formulario de petición
  const handlePeticionFieldChange = (fieldId: keyof PeticionDataType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updatePeticionField(fieldId, value);
  };

  const handlePeticionTextareaChange = (fieldId: keyof PeticionDataType) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    updatePeticionField(fieldId, value);
  };

  const handlePeticionMultiInputChange = (fieldId: keyof PeticionDataType) => (value: string | string[]) => {
    updatePeticionField(fieldId, value);
  };

  const handlePeticionSelectChange = (fieldId: keyof PeticionDataType) => (value: string) => {
    updatePeticionField(fieldId, value);
  };

  const handleFormSubmit = async () => {
    console.log('🚀 Iniciando envío de formulario...');

    const effectiveFormType = getEffectiveFormType();

    if (!effectiveFormType) {
      toast.error('No se ha seleccionado un tipo de formulario válido');
      return;
    }

    let validationResult;
    let isFormComplete;
    let formData;

    if (effectiveFormType === 'tutela') {
      validationResult = validateTutelaForm();
      isFormComplete = isTutelaFormComplete;
      formData = tutelaData;
    } else if (effectiveFormType === 'peticion') {
      validationResult = validatePeticionForm();
      isFormComplete = effectiveIsPeticionFormComplete;
      formData = peticionData;
    } else if (effectiveFormType === 'transito') {
      // Usar la validación unificada que respeta el renderizado condicional
      const unifiedValidation = validateTransitoFieldsBasedOnRendering();
      // Convertir al formato esperado
      validationResult = {
        isValid: unifiedValidation.isValid,
        errors: Object.entries(unifiedValidation.errors).map(([fieldId, message]) => ({
          fieldId,
          message
        })),
        validFields: unifiedValidation.validatedFields,
        invalidFields: Object.keys(unifiedValidation.errors)
      };
      isFormComplete = effectiveIsTransitoFormComplete;
      formData = transitoData;
    } else {
      toast.error('Tipo de formulario no soportado');
      return;
    }

    // Validar campos del footer
    const footerValidation = validateFooterFields();
    
    // Combinar validaciones del formulario principal y del footer
    const combinedValidation = {
      isValid: validationResult.isValid && footerValidation.isValid,
      errors: [...validationResult.errors, ...footerValidation.errors],
      validFields: [...validationResult.validFields, ...footerValidation.validFields],
      invalidFields: [...validationResult.invalidFields, ...footerValidation.invalidFields]
    };

    if (!combinedValidation.isValid) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    if (!isFormComplete || !isFooterComplete) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar datos de prompt files para envío
      let promptFilesData = {};

      if (effectiveFormType === 'transito') {
        // Para tránsito, el campo procedureType puede contener un handle de prompt file
        const transitoDataWithPromptFiles = preparePromptFilesForSubmission(
          transitoData,
          promptFiles,
          ['procedureType'], // Lista de campos que contienen handles de prompt files
          true // Habilitar auto-attach para prompt file único
        );
        promptFilesData = transitoDataWithPromptFiles.promptFilesData;
      } else if (effectiveFormType === 'tutela') {
        // Para tutela, preparar con auto-attach habilitado (sin campos específicos por ahora)
        const tutelaDataWithPromptFiles = preparePromptFilesForSubmission(
          tutelaData,
          promptFiles,
          [], // No hay campos específicos de prompt files por ahora
          true // Habilitar auto-attach para prompt file único
        );
        promptFilesData = tutelaDataWithPromptFiles.promptFilesData;
      } else if (effectiveFormType === 'peticion') {
        // Para petición, preparar con auto-attach habilitado (sin campos específicos por ahora)
        const peticionDataWithPromptFiles = preparePromptFilesForSubmission(
          peticionData,
          promptFiles,
          [], // No hay campos específicos de prompt files por ahora
          true // Habilitar auto-attach para prompt file único
        );
        promptFilesData = peticionDataWithPromptFiles.promptFilesData;
      }

      // Log para debugging
      if (Object.keys(promptFilesData).length > 0) {
        console.log('📎 Prompt files adjuntos:', promptFilesData);
      }
        
      // Validar que se haya proporcionado un email de entrega (ya validado en footerValidation)
      // Esta validación redundante se elimina ya que footerValidation se encarga de esto

      const result = await formSubmissionService.submitForm({
        formType: effectiveFormType,
        formData,
        orderData: order,
        promptContent: promptFilesData,
        deliveryEmail: deliveryEmail.trim(),
        shopName: shopName
      });

      if (result.success) {
        toast.success(result.message);
        if (result.documentUrl) {
          console.log('📄 Documento generado:', result.documentUrl);
        }
      } else {
        toast.error(result.message);
      }

    } catch (error) {
      console.error('❌ Error enviando formulario:', error);
      toast.error('Error inesperado al enviar el formulario');
    } finally {
      setIsSubmitting(false);
    }
  }; const handleOrderLookup = async () => {
    const orderNumber = orderNumberField;
    const confirmationCode = confirmationCodeField;


    if (!orderNumber.trim()) {
      toast.error('Por favor completa el número de pedido');
      return;
    }

    if (!confirmationCode.trim()) {
      toast.error('Por favor completa el código de confirmación');
      return;
    }


    setIsLoading(true);
    setOrderValidation(null);
    setBypassFormType('');
    setOrderLookupCompleted(false); // Resetear estado de búsqueda completada

    // Resetear prompt files al hacer nueva consulta
    resetPromptFiles();

    resetTutelaForm();
    resetPeticionForm();


    setOrder({
      id: '',
      orderNumber: '',
      amount: 0,
      date: '',
      status: '',
      items: [{
        title: '',
        quantity: 0,
        price: 0
      }]
    });

    try {

      const validationResponse = await apiService.checkOrderProcessed(orderNumber, confirmationCode);

      if (validationResponse.allowBypass) {
        setOrderValidation({
          isProcessed: false,
          processedData: null,
          message: 'Código de bypass detectado - Modo de desarrollo activado',
          allowBypass: true
        });


        setOrder({
          id: 'bypass-mode',
          orderNumber: orderNumber,
          amount: 0,
          date: new Date().toLocaleDateString('es-CO'),
          status: 'Modo de desarrollo',
          items: [{
            title: 'Bypass Mode - Selecciona el tipo de formulario',
            quantity: 1,
            price: 0
          }]
        });

        toast.info('Modo de desarrollo activado - Selecciona el tipo de formulario');
        setOrderLookupCompleted(true); // Marcamos como completado para bypass mode
        setIsLoading(false);
        return;
      }

      if (validationResponse.success && validationResponse.isProcessed !== null) {
        setOrderValidation({
          isProcessed: true,
          processedData: validationResponse.isProcessed,
          message: validationResponse.message || 'Esta orden ya fue procesada anteriormente',
          allowBypass: false
        });
        toast.warning('Esta orden ya fue procesada anteriormente');
        setIsLoading(false);
        return;
      }


      setOrderValidation({
        isProcessed: false,
        processedData: null,
        message: 'Orden disponible para procesar',
        allowBypass: false
      });


      const response = await apiService.lookupOrder(orderNumber, confirmationCode);

      if (!response.success && !response.data) {
        toast.error(response.message || 'Número de pedido no encontrado');
        return;
      }

      setOrder(response.data!)
      toast.success('Orden encontrada y lista para procesar');
      setOrderLookupCompleted(true); // Marcamos como completado para orden válida

    } catch (error) {
      console.error('Error al consultar pedido:', error);
      toast.error('Error al consultar el pedido. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const iterateFormFields = (formFields: typeof FormTexts.tutela | typeof FormTexts.peticion | typeof FormTexts.transito) => Object.entries(formFields).map(([key, value]) => {
    const fieldKey = key as keyof TutelaDataType;

    if (value.typeComponent === "textarea") {
      return (
        <FormTextarea
          key={value.id}
          id={value.id}
          label={value.label}
          labelProps={{ className: commonFormFieldsClassnames.labelClassname }}
          wrapperClassName={commonFormFieldsClassnames.wrapper}
          textareaProps={{
            placeholder: value.fieldPlaceholder,
            value: tutelaData[fieldKey] as string,
            onChange: handleTutelaTextareaChange(fieldKey),
            disabled: isLoading,
          }}
          required={value.required}
          validators={value.validators || []}
          alertVariant="destructive"
        />
      )
    } else if (value.typeComponent === "multiInput") {
      return (
        <FormMultiInput
          key={value.id}
          id={value.id}
          label={value.label}
          inputType={value.multiInputType!}
          options={value.multiInputOptions! as MultiInputOption<string>[]}
          selectedValues={Array.isArray(tutelaData[fieldKey]) ? tutelaData[fieldKey] as string[] : [tutelaData[fieldKey] as string].filter(Boolean)}
          onChange={(values: string[]) => handleTutelaMultiInputChange(fieldKey)(values)}
          layout={value.multiInputLayout || 'vertical'}
          gridColumns={value.multiInputGridColumns}
          required={value.required}
          validators={value.validators || []}
          alertVariant="destructive"
          inputProps={{ disabled: isLoading }}
          labelComponentProps={{ className: commonFormFieldsClassnames.labelClassname }}
          wrapperClassName={commonFormFieldsClassnames.wrapper}
        />
      )
    } else if (value.typeComponent === "select") {
      return (
        <FormSelect
          key={value.id}
          id={value.id}
          label={value.label}
          options={value.selectOptions}
          optionGroups={value.selectOptionGroups}
          placeholder={value.selectPlaceholder}
          emptyMessage={value.selectEmptyMessage}
          value={tutelaData[fieldKey] as string}
          onValueChange={handleTutelaSelectChange(fieldKey)}
          required={value.required}
          validators={value.validators || []}
          alertVariant="destructive"
          selectProps={{ disabled: isLoading }}
          labelProps={{ className: commonFormFieldsClassnames.labelClassname }}
          wrapperClassName={commonFormFieldsClassnames.wrapper}
        />
      )
    } else {
      return (
        <FormActionInput
          key={value.id}
          id={value.id}
          label={value.label}
          labelProps={{ className: commonFormFieldsClassnames.labelClassname }}
          wrapperClassName={commonFormFieldsClassnames.wrapper}
          inputProps={{
            type: value.typeField || "text",
            placeholder: value.fieldPlaceholder,
            value: tutelaData[fieldKey] as string,
            onChange: handleTutelaFieldChange(fieldKey),
            disabled: isLoading,
          }}
          required={value.required}
          validators={value.validators || []}
          alertVariant="destructive"
        />
      )
    }
  });

  // Función específica para iterar campos de petición
  const iteratePeticionFields = () => Object.entries(FormTexts.peticion)
    .map(([key, value]) => {
      const fieldKey = key as keyof PeticionDataType;

      if (value.typeComponent === "textarea") {
        return (
          <FormTextarea
            key={value.id}
            id={value.id}
            label={value.label}
            labelProps={{ className: commonFormFieldsClassnames.labelClassname }}
            wrapperClassName={commonFormFieldsClassnames.wrapper}
            textareaProps={{
              placeholder: value.fieldPlaceholder,
              value: peticionData[fieldKey] as string,
              onChange: handlePeticionTextareaChange(fieldKey),
              disabled: isLoading,
            }}
            required={value.required}
            validators={value.validators || []}
            alertVariant="destructive"
          />
        )
      } else if (value.typeComponent === "multiInput") {
        return (
          <FormMultiInput
            key={value.id}
            id={value.id}
            label={value.label}
            inputType={value.multiInputType!}
            options={value.multiInputOptions! as MultiInputOption<string>[]}
            selectedValues={Array.isArray(peticionData[fieldKey]) ? peticionData[fieldKey] as string[] : [peticionData[fieldKey] as string].filter(Boolean)}
            onChange={(values: string[]) => handlePeticionMultiInputChange(fieldKey)(values)}
            layout={value.multiInputLayout || 'vertical'}
            gridColumns={value.multiInputGridColumns}
            required={value.required}
            validators={value.validators || []}
            alertVariant="destructive"
            inputProps={{ disabled: isLoading }}
            labelComponentProps={{ className: commonFormFieldsClassnames.labelClassname }}
            wrapperClassName={commonFormFieldsClassnames.wrapper}
          />
        )
      } else if (value.typeComponent === "select") {
        return (
          <FormSelect
            key={value.id}
            id={value.id}
            label={value.label}
            options={value.selectOptions}
            optionGroups={value.selectOptionGroups}
            placeholder={value.selectPlaceholder}
            emptyMessage={value.selectEmptyMessage}
            value={peticionData[fieldKey] as string}
            onValueChange={handlePeticionSelectChange(fieldKey)}
            required={value.required}
            validators={value.validators || []}
            alertVariant="destructive"
            selectProps={{ disabled: isLoading }}
            labelProps={{ className: commonFormFieldsClassnames.labelClassname }}
            wrapperClassName={commonFormFieldsClassnames.wrapper}
          />
        )
      } else {
        return (
          <FormActionInput
            key={value.id}
            id={value.id}
            label={value.label}
            labelProps={{ className: commonFormFieldsClassnames.labelClassname }}
            wrapperClassName={commonFormFieldsClassnames.wrapper}
            inputProps={{
              type: value.typeField || "text",
              placeholder: value.fieldPlaceholder,
              value: peticionData[fieldKey] as string,
              onChange: handlePeticionFieldChange(fieldKey),
              disabled: isLoading,
            }}
            required={value.required}
            validators={value.validators || []}
            alertVariant="destructive"
          />
        )
      }
    });

  const getEffectiveFormType = (): 'tutela' | 'peticion' | 'transito' | null => {

    if (orderValidation?.allowBypass && bypassFormType) {
      return bypassFormType;
    }


    if (order.id && order.id !== 'bypass-mode') {
      return getFormType(order.items[0].title);
    }

    return null;
  };

  // Hook para sobrescribir isFormComplete para tránsito con lógica condicional
  const effectiveIsTransitoFormComplete = useTransitoFormCompleteness(
    transitoData,
    isTransitoFormComplete,
    getEffectiveFormType()
  );

  // Hook para sobrescribir isFormComplete para petición
  const effectiveIsPeticionFormComplete = usePeticionFormCompleteness(
    peticionData,
    isPeticionFormComplete,
    getEffectiveFormType()
  );

  // Hook para auto-llenado de formularios en desarrollo
  useAutoFill({
    effectiveFormType: getEffectiveFormType(),
    updateTutelaField,
    updatePeticionField,
    updateTransitoField,
    setDeliveryEmail,
    orderLookupCompleted
  });

  // Función para cargar prompt files según el tipo de formulario
  const loadPromptFilesForForm = async (formType: 'tutela' | 'peticion' | 'transito') => {
    try {
      const response = await apiService.getPromptFilesWithContent(formType);
      
      if (response.success) {
        setPromptFiles(response.promptFiles);
      } else {
        console.error('❌ Error al cargar prompt files:', response.message);
        toast.error(`Error al cargar archivos: ${response.message}`);
        setPromptFiles({});
      }
    } catch (error) {
      console.error('❌ Error inesperado al cargar prompt files:', error);
      toast.error('Error inesperado al cargar archivos de plantilla');
      setPromptFiles({});
    } 
  };

  // Efecto para cargar prompt files cuando cambie el effectiveFormType
  useEffect(() => {
    const effectiveFormType = getEffectiveFormType();
    
    if (effectiveFormType) {
      loadPromptFilesForForm(effectiveFormType);
    } else {
      setPromptFiles({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderValidation, bypassFormType, order.id, order.items]);

  // Función para resetear prompt files (cuando se hace una nueva consulta)
  const resetPromptFiles = () => {
    setPromptFiles({});
  };

  // Función para obtener el email del formulario actual
  const getCurrentFormEmail = (): string => {
    const effectiveFormType = getEffectiveFormType();
    
    if (effectiveFormType === 'tutela') {
      return tutelaData.email;
    } else if (effectiveFormType === 'peticion') {
      return peticionData.responseEmail;
    } else if (effectiveFormType === 'transito') {
      return transitoData.notificationEmail;
    }
    
    return '';
  };

  // Efecto para manejar el checkbox de usar email anterior
  useEffect(() => {
    if (usePreviousEmail) {
      const effectiveFormType = getEffectiveFormType();
      let currentEmail = '';
      
      if (effectiveFormType === 'tutela') {
        currentEmail = tutelaData.email;
      } else if (effectiveFormType === 'peticion') {
        currentEmail = peticionData.responseEmail;
      } else if (effectiveFormType === 'transito') {
        currentEmail = transitoData.notificationEmail;
      }
      
      setDeliveryEmail(currentEmail);
    } else {
      setDeliveryEmail('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usePreviousEmail, tutelaData.email, peticionData.responseEmail, transitoData.notificationEmail]);

  // Función para verificar si el pedido está pagado
  const isOrderPaid = (): boolean => {
    if (!order.id || order.id === 'bypass-mode') {
      return true; // Para bypass mode, consideramos como pagado
    }
    
    // El status viene en formato "Estado Financiero - Estado de Envío"
    // Necesitamos verificar que el estado financiero sea "Pagado"
    const status = order.status.toLowerCase();
    
    // Extraer solo la parte del estado financiero (antes del guión)
    const financialStatus = status.split(' - ')[0];
    
    // Log para debugging
    console.log('🔍 Estado del pedido:', {
      fullStatus: order.status,
      financialStatus: financialStatus,
      isPaid: financialStatus === 'pagado'
    });
    
    // Verificar si el estado financiero indica que está pagado
    return financialStatus === 'pagado';
  };

  const renderHeader = () => {
    // Primero verificar si la orden fue procesada
    if (orderValidation?.isProcessed) {
      return (
        <CardDescription>
          <Alert variant={orderValidation.isProcessed ? "destructive" : orderValidation.allowBypass ? "warning" : "default"} className="mt-2">
            <Info />
            <AlertTitle>
              {orderValidation.isProcessed ? orderValidation.message : orderValidation.allowBypass ? "Modo de desarrollo" : orderValidation.message}
            </AlertTitle>
            {orderValidation.isProcessed && orderValidation.processedData && (
              <AlertDescription>
                <ul>
                  <li dangerouslySetInnerHTML={{ __html: FormTexts.formDescription.processedDate(orderValidation.processedData.processedDate) }}></li>
                  <li dangerouslySetInnerHTML={{ __html: FormTexts.formDescription.emailAddress(orderValidation.processedData.emailAddress) }}></li>
                </ul>
                <div>{FormTexts.formDescription.disagreementSuggestion}{" "}<a href={FormTexts.formDescription.disagreementLinkText} target="_blank" className='text-red-800 underline' rel="noopener noreferrer">{FormTexts.formDescription.disagreementLinkText}</a></div>
              </AlertDescription>
            )}
          </Alert>
        </CardDescription>
      )
    } 
    
    // Luego verificar si es modo bypass
    else if (orderValidation?.allowBypass) {
      return (
        <CardDescription className='flex flex-col gap-2'>
          <Alert variant="warning" className="mt-2">
            <Info />
            <AlertTitle>Modo de desarrollo activado</AlertTitle>
            <AlertDescription>
              Selecciona el tipo de formulario que deseas generar
            </AlertDescription>
          </Alert>
        </CardDescription>
      )
    } 
    
    // Verificar si tenemos una orden válida y luego verificar estado de pago
    else if (order.id && order.id !== 'bypass-mode') {
      const isPaid = isOrderPaid();
      
      return (
        <CardDescription className='flex flex-col gap-2'>
          <div><strong>{FormTexts.formDescription.orderNumber}</strong>{" "}{order.orderNumber}</div>
          <div><strong>{FormTexts.formDescription.orderDate}</strong>{" "}{order.date}</div>
          
          {!isPaid && (
            <Alert variant="destructive" className="mt-2">
              <Info />
              <AlertTitle>Pedido pendiente de pago</AlertTitle>
              <AlertDescription>
                <div>{FormTexts.formDescription.unpaidOrderMsg}</div>
                <div className="mt-2">{FormTexts.formDescription.unpaidOrderSuggestion}{" "}<a href={FormTexts.formDescription.disagreementLinkText} target="_blank" className='text-red-800 underline' rel="noopener noreferrer">{FormTexts.formDescription.disagreementLinkText}</a></div>
              </AlertDescription>
            </Alert>
          )}
        </CardDescription>
      )
    } 
    
    // Si no hay orden cargada
    else {
      return (
        <CardDescription >
          <Alert variant={"warning"}>
            <Info />
            <AlertTitle>
              <span><div dangerouslySetInnerHTML={{ __html: FormTexts.formDescription.unloadedDataMsg }}></div></span>
            </AlertTitle>
          </Alert>
        </CardDescription>
      )
    }
  }

  const renderMainForm = () => {
    const effectiveFormType = getEffectiveFormType();
    const mainContent = [<Separator key="separator" />];

    // Si la orden no está pagada y no estamos en modo bypass, no mostrar el formulario
    if (order.id && order.id !== 'bypass-mode' && !orderValidation?.allowBypass && !isOrderPaid()) {
      return mainContent; // Solo devolver el separador, sin contenido del formulario
    }

    if (orderValidation?.allowBypass) {
      mainContent.push(
        <FormSelect
          key="form-type-selector"
          id="form-type-selector"
          label="Tipo de formulario"
          options={[
            { value: 'tutela', label: 'Tutela' },
            { value: 'peticion', label: 'Petición' },
            { value: 'transito', label: 'Tránsito' }
          ]}
          placeholder="Selecciona el tipo de formulario..."
          value={bypassFormType}
          onValueChange={(value) => setBypassFormType(value as 'tutela' | 'peticion' | 'transito')}
          required={true}
          validators={[]}
          alertVariant="destructive"
          selectProps={{ disabled: isLoading }}
          labelProps={{ className: commonFormFieldsClassnames.labelClassname }}
          wrapperClassName={commonFormFieldsClassnames.wrapper}
        />
      );
    }


    if (effectiveFormType) {

      if (effectiveFormType === "tutela") {
        mainContent.push(
          <>
            {iterateFormFields(FormTexts.tutela)}
          </>
        );
      } else if (effectiveFormType === "peticion") {
        mainContent.push(
          <>
            {iteratePeticionFields()}
          </>
        );
      } else if (effectiveFormType === "transito") {
        mainContent.push(
          <>
            {iterateTransitoFields()}
          </>
        );
      }
    }

    return mainContent;
  };

  return (
    <>
      <Toaster position="top-center" richColors  />
      
      {/* Overlay de carga durante el envío */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-foreground bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-8 max-w-sm mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Procesando formulario...</h3>
            <p className="text-gray-600 text-sm">
              Por favor espera mientras procesamos tu solicitud
            </p>
          </div>
        </div>
      )}
      
      <div className='fixed inset-0 bg-foreground flex items-center justify-center p-4'>
        <Card className="container bg-background scrollbar-balanced max-h-full overflow-auto w-full max-w-xl">
          <CardHeader className="space-y-2">
            <CardTitle>
              <h1 className="text-2xl font-bold text-center"
                style={{ wordBreak: "break-word" }}
              >{shopName}</h1>
              <h2 className="text-2xl font-bold text-center"
                style={{ wordBreak: "break-word" }}
              >{FormTexts.subTitle(
                orderValidation?.allowBypass && bypassFormType
                  ? `Formulario de ${bypassFormType.charAt(0).toUpperCase() + bypassFormType.slice(1)}`
                  : order.items[0].title
              )}</h2>
            </CardTitle>
            {renderHeader()}
          </CardHeader>
          <CardContent className="space-y-4">
            <FormActionInput
              id={FormTexts.orderNumber.id}
              label={FormTexts.orderNumber.label}
              wrapperClassName={commonFormFieldsClassnames.wrapper}
              inputProps={{
                type: FormTexts.orderNumber.typeField,
                placeholder: FormTexts.orderNumber.fieldPlaceholder,
                value: orderNumberField,
                onChange: (e) => setOrderNumberField(e.target.value),
                disabled: isLoading,
              }}
              required={FormTexts.orderNumber.required}
              validators={FormTexts.orderNumber.validators || []}
              alertVariant="destructive"
            />
            <FormActionInput
              id={FormTexts.confirmationCode.id}
              label={FormTexts.confirmationCode.label}
              wrapperClassName={commonFormFieldsClassnames.wrapper}
              inputProps={{
                type: FormTexts.confirmationCode.typeField,
                placeholder: FormTexts.confirmationCode.fieldPlaceholder,
                value: confirmationCodeField,
                onChange: (e) => setConfirmationCodeField(e.target.value),
                disabled: isLoading,
              }}
              buttonProps={{
                onClick: () => {
                  handleOrderLookup();
                },
                variant: 'default',
                disabled: isLoading || !orderNumberField.trim() || !confirmationCodeField.trim(),
              }}
              required={FormTexts.confirmationCode.required}
              validators={FormTexts.confirmationCode.validators || []}
              buttonText={FormTexts.orderNumber.buttonText!(isLoading)}
              alertVariant="destructive"
            />
            {renderMainForm()}
          </CardContent>

          <CardFooter>
            {(() => {
              const effectiveFormType = getEffectiveFormType();


              if (!effectiveFormType) return null;
              
              // Si la orden no está pagada y no estamos en modo bypass, no mostrar el footer
              if (order.id && order.id !== 'bypass-mode' && !orderValidation?.allowBypass && !isOrderPaid()) {
                return null;
              }


              let validationResult, isFormComplete;

              if (effectiveFormType === 'tutela') {
                validationResult = validateTutelaForm();
                isFormComplete = isTutelaFormComplete;
              } else if (effectiveFormType === 'peticion') {
                validationResult = validatePeticionForm();
                isFormComplete = effectiveIsPeticionFormComplete;
              } else if (effectiveFormType === 'transito') {
                const unifiedValidation = validateTransitoFieldsBasedOnRendering();
                // Convertir al formato esperado por la UI
                validationResult = {
                  isValid: unifiedValidation.isValid,
                  errors: Object.entries(unifiedValidation.errors).map(([fieldId, message]) => ({
                    fieldId,
                    message
                  })),
                  validFields: unifiedValidation.validatedFields,
                  invalidFields: Object.keys(unifiedValidation.errors)
                };
                isFormComplete = effectiveIsTransitoFormComplete;
              } else {
                validationResult = { isValid: false, errors: [], validFields: [], invalidFields: [] };
                isFormComplete = false;
              }

              // Validación combinada del formulario principal + footer
              const footerValidation = validateFooterFields();
              const combinedValidation = {
                isValid: validationResult.isValid && footerValidation.isValid,
                errors: [...validationResult.errors, ...footerValidation.errors],
                validFields: [...validationResult.validFields, ...footerValidation.validFields],
                invalidFields: [...validationResult.invalidFields, ...footerValidation.invalidFields]
              };

              const isButtonEnabled = combinedValidation.isValid && isFormComplete && isFooterComplete && !isSubmitting && !(orderValidation?.isProcessed && !orderValidation?.allowBypass);

              const getButtonVariant = (): "default" | "destructive" | "secondary" => {
                if (!isFormComplete || !isFooterComplete || !combinedValidation.isValid) return "secondary";
                return "default";
              };

              return (
                <div className="space-y-4 w-full">
                  {/* Campos para email de entrega */}
                  <div className="space-y-3 border-t pt-4">

                    {/* Campo de email de entrega */}
                    <FormActionInput
                      id={FormTexts.footer.deliveryEmail.id}
                      label={FormTexts.footer.deliveryEmail.label}
                      labelProps={{ className: "text-sm text-gray-700" }}
                      wrapperClassName="space-y-2"
                      inputProps={{
                        type: FormTexts.footer.deliveryEmail.typeField,
                        placeholder: FormTexts.footer.deliveryEmail.fieldPlaceholder,
                        value: deliveryEmail,
                        onChange: (e) => setDeliveryEmail(e.target.value),
                        disabled: isSubmitting || usePreviousEmail,
                      }}
                      required={FormTexts.footer.deliveryEmail.required}
                      validators={usePreviousEmail ? [] : (FormTexts.footer.deliveryEmail.validators || [])} // Limpiar validaciones cuando checkbox esté activo
                      clearError={usePreviousEmail} // Limpiar errores cuando se active el checkbox
                      alertVariant="destructive"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={FormTexts.footer.usePreviousEmail.id}
                        checked={usePreviousEmail}
                        onChange={(e) => setUsePreviousEmail(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isSubmitting || !getCurrentFormEmail()}
                      />
                      <label
                        htmlFor={FormTexts.footer.usePreviousEmail.id}
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        {FormTexts.footer.usePreviousEmail.label}
                      </label>
                    </div>
                  </div>

                  {/* Botón de envío */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleFormSubmit}
                      disabled={!isButtonEnabled}
                      variant={getButtonVariant()}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      {FormTexts.footer.buttonText(isSubmitting)}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </CardFooter>
        </Card>
      </div>
    </>
  )
}

export default App
