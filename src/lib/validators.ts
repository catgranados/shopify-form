// Validadores reutilizables para todo el sistema
export type Validator = (value: string) => string | null;

// Validadores básicos
export const validators = {
  required: (value: string): string | null => {
    if (!value || value.trim() === '') return 'Este campo es requerido';
    return null;
  },

  minLength: (min: number): Validator => (value: string): string | null => {
    if (!value) return null; // No validar si está vacío (required se encarga)
    return value.length >= min ? null : `Debe tener al menos ${min} caracteres`;
  },

  maxLength: (max: number): Validator => (value: string): string | null => {
    if (!value) return null;
    return value.length <= max ? null : `No puede tener más de ${max} caracteres`;
  },

  pattern: (regex: RegExp, message: string): Validator => (value: string): string | null => {
    if (!value) return null;
    return regex.test(value) ? null : message;
  },

  email: (value: string): string | null => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Email inválido';
  },

  numeric: (value: string): string | null => {
    if (!value) return null;
    return /^\d+$/.test(value.trim()) ? null : 'Solo se permiten números';
  },

  minNumber: (min: number): Validator => (value: string): string | null => {
    if (!value) return null;
    const num = parseInt(value);
    return num >= min ? null : `Debe ser al menos ${min}`;
  },

  maxNumber: (max: number): Validator => (value: string): string | null => {
    if (!value) return null;
    const num = parseInt(value);
    return num <= max ? null : `No puede ser mayor a ${max}`;
  },

  // Validadores específicos para arrays (para FormMultiInput)
  minSelections: (min: number): Validator => (value: string): string | null => {
    // Para FormMultiInput, el valor será un string con valores separados por coma
    if (!value) return min > 0 ? `Debe seleccionar al menos ${min} opción${min > 1 ? 'es' : ''}` : null;
    const selections = value.split(',').filter(v => v.trim() !== '');
    return selections.length >= min ? null : `Debe seleccionar al menos ${min} opción${min > 1 ? 'es' : ''}`;
  },

  maxSelections: (max: number): Validator => (value: string): string | null => {
    if (!value) return null;
    const selections = value.split(',').filter(v => v.trim() !== '');
    return selections.length <= max ? null : `No puede seleccionar más de ${max} opción${max > 1 ? 'es' : ''}`;
  },

  exactSelections: (exact: number): Validator => (value: string): string | null => {
    if (!value) return exact > 0 ? `Debe seleccionar exactamente ${exact} opción${exact > 1 ? 'es' : ''}` : null;
    const selections = value.split(',').filter(v => v.trim() !== '');
    return selections.length === exact ? null : `Debe seleccionar exactamente ${exact} opción${exact > 1 ? 'es' : ''}`;
  }
};

// Combinador de validadores
export const combineValidators = (...validatorFns: Validator[]): Validator => {
  return (value: string) => {
    for (const validator of validatorFns) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };
};

// Validadores compuestos comunes
export const commonValidators = {
  orderNumber: combineValidators(
    validators.required,
    validators.numeric,
    validators.minLength(4)
  ),

  email: combineValidators(
    validators.required,
    validators.email
  ),

  phone: combineValidators(
    validators.required,
    validators.pattern(/^\+?[\d\s-()]+$/, 'Formato de teléfono inválido')
  ),

  positiveNumber: combineValidators(
    validators.required,
    validators.numeric,
    validators.minNumber(1)
  ),

  // Validadores para FormMultiInput
  requiredMultiSelect: combineValidators(
    validators.required,
    validators.minSelections(1)
  ),

  singleSelection: combineValidators(
    validators.required,
    validators.exactSelections(1)
  ),

  limitedMultiSelect: (max: number) => combineValidators(
    validators.required,
    validators.minSelections(1),
    validators.maxSelections(max)
  )
};
