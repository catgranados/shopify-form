import React from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import FormField, { FormFieldProps } from './formField';

// Tipos para los diferentes tipos de input múltiple
export type MultiInputType = 'checkbox' | 'radio' | 'text' | 'email' | 'tel' | 'number';

// Interfaz para cada opción individual
export interface MultiInputOption<T = string> {
  id: string;
  value: T;
  label: string;
  disabled?: boolean;
  checked?: boolean; // Para checkbox y radio
  placeholder?: string; // Para inputs de texto
  className?: string;
}

// Props para el componente FormMultiInput
export interface FormMultiInputProps<T = string> extends Omit<FormFieldProps, 'children'> {
  // Configuración de las opciones
  options: MultiInputOption<T>[];
  
  // Tipo de input a generar
  inputType: MultiInputType;
  
  // Valores seleccionados/ingresados
  selectedValues?: T[];
  
  // Callbacks
  onChange?: (values: T[]) => void;
  onOptionChange?: (optionId: string, value: T, checked?: boolean) => void;
  
  // Configuración de layout
  layout?: 'vertical' | 'horizontal' | 'grid';
  gridColumns?: number;
  
  // Props adicionales para cada input
  inputProps?: Omit<React.ComponentPropsWithoutRef<typeof Input>, 'type' | 'name' | 'id' | 'value' | 'checked' | 'onChange'>;
  
  // Props adicionales para cada label
  labelComponentProps?: React.ComponentPropsWithoutRef<typeof Label>;
  
  // Estilos personalizados
  optionsContainerClassName?: string;
  optionWrapperClassName?: string;
  optionLabelClassName?: string;
}

const FormMultiInput = <T extends string | number = string>({
  id,
  wrapperClassName,
  label,
  labelProps,
  alertVariant,
  alertTitle,
  alertDescription,
  alertProps,
  options,
  inputType,
  selectedValues = [],
  onChange,
  onOptionChange,
  layout = 'vertical',
  gridColumns = 2,
  inputProps,
  labelComponentProps,
  optionsContainerClassName,
  optionWrapperClassName,
  optionLabelClassName,
  required = false,
  validators = [],
  validateOnBlur = true,
  validateOnChange = false,
  ...formFieldProps
}: FormMultiInputProps<T>) => {
  
  // Convertir array a string para el sistema de validación
  const valueForValidation = selectedValues.join(',');
  
  // Determinar si debe mostrar el indicador
  const shouldShowIndicator = required && (!selectedValues || selectedValues.length === 0);
  
  // Función para manejar cambios en opciones individuales
  const handleOptionChange = (option: MultiInputOption<T>, event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target;
    
    let newValues: T[];
    
    if (inputType === 'checkbox') {
      // Para checkbox, agregar/quitar del array
      if (checked) {
        newValues = [...selectedValues, option.value];
      } else {
        newValues = selectedValues.filter(v => v !== option.value);
      }
    } else if (inputType === 'radio') {
      // Para radio, solo un valor seleccionado
      newValues = checked ? [option.value] : [];
    } else {
      // Para inputs de texto, actualizar el valor específico
      const typedValue = value as T;
      const optionIndex = options.findIndex(opt => opt.id === option.id);
      newValues = [...selectedValues];
      newValues[optionIndex] = typedValue;
    }
    
    // Llamar callbacks
    onChange?.(newValues);
    onOptionChange?.(option.id, inputType === 'checkbox' || inputType === 'radio' ? option.value : event.target.value as T, checked);
  };

  // Función para obtener el valor de un input específico
  const getInputValue = (option: MultiInputOption<T>): string => {
    if (inputType === 'checkbox' || inputType === 'radio') {
      return option.value.toString();
    }
    
    // Para inputs de texto, buscar el valor en selectedValues por índice
    const optionIndex = options.findIndex(opt => opt.id === option.id);
    return selectedValues[optionIndex]?.toString() || '';
  };

  // Función para verificar si una opción está checked
  const isOptionChecked = (option: MultiInputOption<T>): boolean => {
    if (inputType === 'checkbox' || inputType === 'radio') {
      return selectedValues.includes(option.value);
    }
    return false;
  };

  // Clases para el contenedor de opciones según el layout
  const getContainerClasses = (): string => {
    const baseClasses = 'space-y-2';
    
    switch (layout) {
      case 'horizontal':
        return cn('flex flex-wrap gap-4', optionsContainerClassName);
      case 'grid':
        return cn(`grid grid-cols-${gridColumns} gap-3`, optionsContainerClassName);
      case 'vertical':
      default:
        return cn(baseClasses, optionsContainerClassName);
    }
  };

  // Renderizar cada opción
  const renderOption = (option: MultiInputOption<T>) => {
    const isChecked = isOptionChecked(option);
    const inputValue = getInputValue(option);
    
    return (
      <div 
        key={option.id}
        className={cn(
          'flex items-center space-x-2',
          optionWrapperClassName
        )}
      >
        <Input
          id={`${id}-${option.id}`}
          type={inputType}
          name={inputType === 'radio' ? id : `${id}-${option.id}`}
          value={inputValue}
          checked={isChecked}
          disabled={option.disabled}
          placeholder={option.placeholder}
          onChange={(e) => handleOptionChange(option, e)}
          className={cn(
            inputType === 'checkbox' || inputType === 'radio' 
              ? 'w-4 h-4' 
              : 'flex-1',
            option.className
          )}
          {...inputProps}
        />
        <Label
          htmlFor={`${id}-${option.id}`}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            optionLabelClassName
          )}
          {...labelComponentProps}
        >
          {option.label}
        </Label>
      </div>
    );
  };

  return (
    <FormField
      id={id}
      wrapperClassName={wrapperClassName}
      label={label}
      labelProps={labelProps}
      alertVariant={alertVariant}
      alertTitle={alertTitle}
      alertDescription={alertDescription}
      alertProps={alertProps}
      required={required}
      validators={validators}
      validateOnBlur={validateOnBlur}
      validateOnChange={validateOnChange}
      {...formFieldProps}
    >
      {/* Input oculto para validación usando componente Input */}
      <Input
        type="hidden"
        id={id}
        value={valueForValidation}
        onChange={() => {}} // No-op, el valor se actualiza por selectedValues
        className="sr-only"
      />
      
      <div className="relative">
        <div className={getContainerClasses()}>
          {options.map(renderOption)}
        </div>
        {shouldShowIndicator && (
          <div className="absolute top-0 right-0 -mt-1 -mr-1">
            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/20">
              <AlertCircle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
};

export default FormMultiInput;
