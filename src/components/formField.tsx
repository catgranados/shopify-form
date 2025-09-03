import React, { useState, useCallback, cloneElement, ReactElement, useEffect } from 'react';
import { Label } from './ui/label';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { cn } from '@/lib/utils';
import { Validator } from '@/lib/validators';

export interface FormFieldProps {
  id?: string;
  wrapperClassName?: string;
  label?: React.ReactNode;
  labelProps?: React.ComponentPropsWithoutRef<typeof Label>;
  alertVariant?: React.ComponentPropsWithoutRef<typeof Alert>['variant'];
  alertTitle?: React.ReactNode;
  alertDescription?: React.ReactNode;
  alertProps?: React.ComponentPropsWithoutRef<typeof Alert>;
  required?: boolean;
  validators?: Validator[];
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  clearError?: boolean; // Nueva prop para limpiar errores
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  wrapperClassName,
  label,
  labelProps,
  alertVariant = 'destructive',
  alertTitle,
  alertDescription,
  alertProps,
  required = false,
  validators = [],
  validateOnBlur = true,
  validateOnChange = false,
  clearError = false,
  children
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  // Efecto para limpiar errores cuando clearError es true
  useEffect(() => {
    if (clearError) {
      setInternalError(null);
      setHasBeenTouched(false);
    }
  }, [clearError]);

  // Función de validación unificada
  const validateField = useCallback((currentValue: string) => {
    // Validación required (siempre primera)
    if (required && (!currentValue || currentValue.trim() === '')) {
      return 'Este campo es requerido';
    }

    // Ejecutar validadores customizados
    for (const validator of validators) {
      const error = validator(currentValue);
      if (error) return error;
    }

    return null;
  }, [required, validators]);

  // Handler unificado de validación
  const handleValidation = useCallback((currentValue: string, trigger: 'blur' | 'change') => {
    if (trigger === 'blur') {
      setHasBeenTouched(true);
      if (validateOnBlur) {
        const error = validateField(currentValue);
        setInternalError(error);
      }
    } else if (trigger === 'change') {
      if (validateOnChange && hasBeenTouched) {
        const error = validateField(currentValue);
        setInternalError(error);
      } else if (hasBeenTouched && internalError) {
        // Limpiar error si el campo se corrige
        const error = validateField(currentValue);
        if (!error) {
          setInternalError(null);
        }
      }
    }
  }, [validateField, validateOnBlur, validateOnChange, hasBeenTouched, internalError]);

  // Clonar children para inyectar handlers de validación y estado de error
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const childElement = child as ReactElement<Record<string, unknown>>;
      
      // Determinar si hay error (externo o interno)
      const hasError = !!(alertTitle || alertDescription || internalError);
      
      // Función recursiva para inyectar propiedades en inputs anidados
      const injectInputProps = (element: ReactElement<Record<string, unknown>>): ReactElement<Record<string, unknown>> => {
        // Verificar si es un input/textarea por el elemento HTML o props comunes
        const isInputElement = (
          // Verificar por tipo de elemento HTML
          element.type === 'input' || 
          element.type === 'textarea' ||
          // Verificar por props típicos de input
          'value' in (element.props || {}) ||
          'placeholder' in (element.props || {}) ||
          'onChange' in (element.props || {}) ||
          // Verificar por className que incluya 'input' o 'textarea'
          (typeof element.props.className === 'string' && 
           (element.props.className.includes('input') || element.props.className.includes('textarea')))
        );
        
        if (isInputElement) {
          return cloneElement(element, {
            ...element.props,
            'aria-invalid': hasError,
            'aria-describedby': hasError ? `${id}-error` : undefined,
            onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
              const currentValue = e.target.value || '';
              handleValidation(currentValue, 'blur');
              
              // Llamar al onBlur original si existe
              if (element.props.onBlur) {
                (element.props.onBlur as (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void)(e);
              }
            },
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
              const currentValue = e.target.value || '';
              handleValidation(currentValue, 'change');
              
              // Llamar al onChange original si existe
              if (element.props.onChange) {
                (element.props.onChange as (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void)(e);
              }
            }
          });
        }
        
        // Si es un contenedor (como div), buscar inputs anidados
        if (element.props.children) {
          const enhancedChildren = React.Children.map(element.props.children, (nestedChild) => {
            if (React.isValidElement(nestedChild)) {
              return injectInputProps(nestedChild as ReactElement<Record<string, unknown>>);
            }
            return nestedChild;
          });
          
          return cloneElement(element, {
            ...element.props,
            children: enhancedChildren
          });
        }
        
        return element;
      };
      
      return injectInputProps(childElement);
    }
    return child;
  });

  // Determinar qué error mostrar (externo tiene prioridad)
  const errorToShow = alertTitle || alertDescription ? 
    { alertTitle, alertDescription } : 
    internalError ? 
    { alertTitle: '', alertDescription: internalError } : 
    { alertTitle: undefined, alertDescription: undefined };

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      {label && (
        <Label htmlFor={id} {...(labelProps as unknown as Record<string, unknown>)}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      {enhancedChildren}

      {(errorToShow.alertTitle || errorToShow.alertDescription) && alertVariant && (
        <Alert 
          variant={alertVariant} 
          id={`${id}-error`}
          {...(alertProps as unknown as Record<string, unknown>)} 
          className={cn('border-0 px-0 pt-0', alertProps?.className)}
        >
          {errorToShow.alertTitle && <AlertTitle>{errorToShow.alertTitle}</AlertTitle>}
          {errorToShow.alertDescription && <AlertDescription>{errorToShow.alertDescription}</AlertDescription>}
        </Alert>
      )}
    </div>
  );
};

export default FormField;