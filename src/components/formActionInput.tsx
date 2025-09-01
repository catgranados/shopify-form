import React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import FormField, { FormFieldProps } from './formField';

export interface FormActionInputProps extends Omit<FormFieldProps, 'children'> {
  inputProps?: React.ComponentPropsWithoutRef<typeof Input>;
  buttonProps?: React.ComponentPropsWithoutRef<typeof Button>;
  buttonText?: string;
  actionContainerClassName?: string;
}

const FormActionInput: React.FC<FormActionInputProps> = ({
  id,
  wrapperClassName,
  label,
  labelProps,
  alertVariant,
  alertTitle,
  alertDescription,
  alertProps,
  inputProps,
  buttonProps,
  buttonText,
  actionContainerClassName,
  required = false,
  validators = [],
  validateOnBlur = true,
  validateOnChange = false,
  ...formFieldProps
}) => {
  // Determinar si debe mostrar el indicador
  const inputValue = (inputProps?.value as string) || '';
  const shouldShowIndicator = required && (!inputValue || inputValue.trim() === '');

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
      <div className={cn('flex gap-1', actionContainerClassName)}>
        <div className="relative flex-1">
          <Input 
            id={id} 
            required={required}
            className={cn(shouldShowIndicator ? 'pr-8' : '')}
            {...(inputProps as unknown as Record<string, unknown>)}
          />
          {shouldShowIndicator && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/20">
                <AlertCircle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          )}
        </div>
        {buttonText && buttonProps?.onClick && (
          <Button 
            variant={buttonProps.variant || "default"} 
            {...(buttonProps as unknown as Record<string, unknown>)}
          >
            {buttonText}
          </Button>
        )}
      </div>
    </FormField>
  );
};

export default FormActionInput;
