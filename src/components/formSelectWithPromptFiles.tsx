import React from 'react';
import FormSelect, { FormSelectProps } from './formSelect';
import { PromptFileWithContent } from '../types';
import { usePromptFilesInForm } from '../lib/promptFilesHelpers';

export interface FormSelectWithPromptFilesProps extends Omit<FormSelectProps, 'options'> {
  /** Prompt files a usar como opciones. Si se proporciona, se ignoran las options normales */
  promptFiles?: Record<string, PromptFileWithContent>;
  /** Opciones estáticas (se usan si no hay promptFiles) */
  staticOptions?: FormSelectProps['options'];
  /** Mensaje cuando no hay prompt files disponibles */
  noPromptFilesMessage?: string;
  /** Si true, muestra un placeholder de carga cuando no hay prompt files */
  showLoadingPlaceholder?: boolean;
}

const FormSelectWithPromptFiles: React.FC<FormSelectWithPromptFilesProps> = ({
  promptFiles,
  staticOptions = [],
  noPromptFilesMessage = "No hay opciones disponibles",
  showLoadingPlaceholder = true,
  placeholder = "Selecciona una opción",
  ...formSelectProps
}) => {
  const { selectOptions, hasFiles } = usePromptFilesInForm(promptFiles || {});

  const finalOptions = hasFiles ? selectOptions : staticOptions;
  
  const finalPlaceholder = hasFiles 
    ? placeholder 
    : showLoadingPlaceholder && (!promptFiles || Object.keys(promptFiles).length === 0)
      ? "Cargando opciones..."
      : placeholder;

  const finalEmptyMessage = hasFiles ? noPromptFilesMessage : noPromptFilesMessage;

  return (
    <FormSelect
      {...formSelectProps}
      options={finalOptions}
      placeholder={finalPlaceholder}
      emptyMessage={finalEmptyMessage}
    />
  );
};

export default FormSelectWithPromptFiles;
