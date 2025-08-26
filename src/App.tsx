import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card'
import FormTexts from './constants/texts'
import FormInput from './components/formInput'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner'
import { apiService } from './services/apiService'

function App () {
  const [formData, setFormData] = useState({
    orderNumber: ''
  });

  const [errors, setErrors] = useState({
    orderNumber: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  // Debug: Verificar configuración al cargar
  useEffect(() => {
    const config = apiService.getDebugInfo();
    console.log('🔧 Configuración API Service:', config);
    
    // Test opcional de conectividad
    apiService.testConnection().then(result => {
      console.log('🌐 Conectividad del servidor:', result.success ? '✅ OK' : '❌ FALLO');
      console.log('Detalles:', result);
    });
  }, []);

  const handleInputChange = (fieldId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    if (errors[fieldId as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }));
    }
  };

  const validateOrderNumber = (orderNumber: string): boolean => {
    if (!orderNumber.trim()) {
      setErrors(prev => ({
        ...prev,
        orderNumber: 'El número de pedido es requerido.'
      }));
      return false;
    }

    if (!/^\d+$/.test(orderNumber.trim())) {
      setErrors(prev => ({
        ...prev,
        orderNumber: 'El número de pedido debe contener solo números.'
      }));
      return false;
    }

    if (orderNumber.trim().length < 4) {
      setErrors(prev => ({
        ...prev,
        orderNumber: 'El número de pedido debe tener al menos 4 dígitos.'
      }));
      return false;
    }

    return true;
  };

  const handleOrderLookup = async () => {
    const orderNumber = formData.orderNumber;

    if (!validateOrderNumber(orderNumber)) {
      toast.error('Por favor corrige los errores antes de continuar');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.lookupOrder(orderNumber);
      
      if (response.success && response.data) {
        toast.success('¡Pedido encontrado! Generando documento...');
        console.log('Datos del pedido:', response.data);
        
        toast.success(`Pedido de ${response.data.customerName} - ${response.data.documentType}`);
      } else {
        setErrors(prev => ({
          ...prev,
          orderNumber: response.message || 'Número de pedido no encontrado.'
        }));
        toast.error(response.message || 'Número de pedido no encontrado');
      }
    } catch (error) {
      console.error('Error al consultar pedido:', error);
      toast.error('Error al consultar el pedido. Inténtalo de nuevo.');
      setErrors(prev => ({
        ...prev,
        orderNumber: 'Error de conexión. Inténtalo de nuevo.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className='fixed inset-0 flex items-center justify-center p-4'>
        <Card className="container w-full max-w-xl">
          <CardHeader>
            <CardTitle>
              <h1 className="text-2xl font-bold text-center">{FormTexts.title}</h1>
            </CardTitle>
            <CardDescription className='rounded-xl border p-4 mt-4 border-amber-700 bg-amber-100 text-amber-800'>
              <strong>Disclaimer:</strong> Para poder obtener tu documento debes tener el <strong>Número de pedido</strong> al adquirir el servicio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormInput
              id={FormTexts.orderNumber.id}
              label={FormTexts.orderNumber.label}
              wrapperClassName="space-y-3"
              labelProps={{
                className: "text-sm font-medium text-gray-900"
              }}
              inputProps={{
                type: "text",
                placeholder: FormTexts.orderNumber.inputPlaceholder,
                value: formData.orderNumber,
                onChange: handleInputChange(FormTexts.orderNumber.id),
                disabled: isLoading,
                className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              }}
              buttonProps={{
                onClick: handleOrderLookup,
                variant: 'default',
                disabled: isLoading || !formData.orderNumber.trim(),
                className: "min-w-[100px]"
              }}
              buttonText={isLoading ? "Consultando..." : FormTexts.orderNumber.buttonText}
              alertVariant="destructive"
              alertTitle={errors.orderNumber ? "Error de validación" : undefined}
              alertDescription={errors.orderNumber || undefined}
              alertProps={{
                className: "text-sm mt-2"
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default App
