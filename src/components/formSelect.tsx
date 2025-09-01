import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import FormField, { FormFieldProps } from './formField';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export interface FormSelectProps extends Omit<FormFieldProps, 'children'> {
  selectProps?: Omit<React.ComponentPropsWithoutRef<typeof Select>, 'onValueChange' | 'value'>;
  triggerProps?: React.ComponentPropsWithoutRef<typeof SelectTrigger>;
  contentProps?: React.ComponentPropsWithoutRef<typeof SelectContent>;
  placeholder?: string;
  options?: SelectOption[];
  optionGroups?: SelectOptionGroup[];
  value?: string;
  onValueChange?: (value: string) => void;
  emptyMessage?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

const FormSelect: React.FC<FormSelectProps> = ({
  id,
  wrapperClassName,
  label,
  labelProps,
  alertVariant,
  alertTitle,
  alertDescription,
  alertProps,
  selectProps,
  triggerProps,
  contentProps,
  placeholder = "Selecciona una opción",
  options = [],
  optionGroups = [],
  value,
  onValueChange,
  emptyMessage = "No hay opciones disponibles",
  triggerClassName,
  contentClassName,
  required = false,
  validators = [],
  validateOnBlur = true,
  validateOnChange = false,
  ...formFieldProps
}) => {

  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue);
  };

  // Determinar si debe mostrar el indicador
  const shouldShowIndicator = required && (!value || value.trim() === '');

  const renderOptions = () => {
    // Si hay grupos de opciones, renderizar por grupos
    if (optionGroups.length > 0) {
      return optionGroups.map((group) => (
        <React.Fragment key={group.label}>
          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
            {group.label}
          </div>
          {group.options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="pl-6"
            >
              {option.label}
            </SelectItem>
          ))}
        </React.Fragment>
      ));
    }

    // Si hay opciones simples, renderizar directamente
    if (options.length > 0) {
      return options.map((option) => (
        <SelectItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </SelectItem>
      ));
    }

    // Si no hay opciones, mostrar mensaje
    return (
      <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
        {emptyMessage}
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
      <div className="relative">
        <Select
          value={value}
          onValueChange={handleValueChange}
          {...selectProps}
        >
          <SelectTrigger
            id={id}
            className={cn(shouldShowIndicator ? 'pr-8' : '', triggerClassName)}
            {...triggerProps}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent
            className={cn(contentClassName)}
            {...contentProps}
          >
            {renderOptions()}
          </SelectContent>
        </Select>
        {shouldShowIndicator && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/20">
              <AlertCircle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
};

export default FormSelect;
