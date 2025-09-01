import React from 'react';
import { Textarea } from './ui/textarea';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import FormField, { FormFieldProps } from './formField';

export interface FormTextareaProps extends Omit<FormFieldProps, 'children'> {
  textareaProps?: React.ComponentPropsWithoutRef<typeof Textarea>;
  textareaClassName?: string;
}

const FormTextarea: React.FC<FormTextareaProps> = ({
  id,
  wrapperClassName,
  label,
  labelProps,
  alertVariant,
  alertTitle,
  alertDescription,
  alertProps,
  textareaProps,
  textareaClassName,
  required = false,
  validators = [],
  validateOnBlur = true,
  validateOnChange = false,
  ...formFieldProps
}) => {
  // Determinar si debe mostrar el indicador
  const textareaValue = (textareaProps?.value as string) || '';
  const shouldShowIndicator = required && (!textareaValue || textareaValue.trim() === '');

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
      <div className="relative">
        <Textarea 
          id={id} 
          required={required}
          className={cn(shouldShowIndicator ? 'pr-8' : '', textareaClassName)}
          {...(textareaProps as unknown as Record<string, unknown>)}
        />
        {shouldShowIndicator && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/20">
              <AlertCircle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
};

export default FormTextarea;
