import React from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { cn } from '@/lib/utils';

export interface FormInputProps {
  id?: string;
  wrapperClassName?: string;
  label?: React.ReactNode;
  labelProps?: React.ComponentPropsWithoutRef<typeof Label>;
  inputProps?: React.ComponentPropsWithoutRef<typeof Input>;
  buttonProps?: React.ComponentPropsWithoutRef<typeof Button>;
  alertVariant?: React.ComponentPropsWithoutRef<typeof Alert>['variant'];
  alertTitle?: React.ReactNode;
  alertDescription?: React.ReactNode;
  alertProps?: React.ComponentPropsWithoutRef<typeof Alert>;
  buttonText?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  id,
  wrapperClassName,
  label,
  labelProps,
  inputProps,
  buttonProps,
  alertVariant = 'destructive',
  alertTitle,
  alertDescription,
  alertProps,
  buttonText
}) => {

  return (
    <div className={cn("space-y-2 space-x-2", wrapperClassName)}>
      {label && (
        <Label htmlFor={id} {...(labelProps as unknown as Record<string, unknown>)}>
          {label}
        </Label>
      )}

      <div className='flex gap-2'>
        <Input id={id} {...(inputProps as unknown as Record<string, unknown>)} />
        {buttonText && buttonProps?.onClick && (
          <Button variant={buttonProps.variant || "default"} {...(buttonProps as unknown as Record<string, unknown>)}>{buttonText}</Button>
        )}
      </div>


      {alertTitle && alertVariant && (
        <Alert variant={alertVariant} {...(alertProps as unknown as Record<string, unknown>)} className={cn('mt-4', alertProps?.className)}>
          {alertTitle && <AlertTitle>{alertTitle}</AlertTitle>}
          {alertDescription && <AlertDescription>{alertDescription}</AlertDescription>}
        </Alert>
      )}
    </div>
  );
};

export default FormInput;