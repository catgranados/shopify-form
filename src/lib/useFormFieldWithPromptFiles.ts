import { useState, useEffect } from 'react';
import { PromptFileWithContent } from '../types';

/**
 * Hook para gestionar campos de formulario que usan prompt files
 * @param promptFiles - Prompt files disponibles
 * @param fieldValue - Valor actual del campo (handle seleccionado)
 * @param onFieldChange - Callback cuando cambia el valor del campo
 * @returns Utilidades para el campo con prompt files
 */
export const useFormFieldWithPromptFiles = (
  promptFiles: Record<string, PromptFileWithContent>,
  fieldValue: string,
  onFieldChange: (value: string) => void
) => {
  const [selectedPromptFileContent, setSelectedPromptFileContent] = useState<string | null>(null);
  const [selectedPromptFileName, setSelectedPromptFileName] = useState<string | null>(null);

  useEffect(() => {
    if (fieldValue && promptFiles[fieldValue]) {
      setSelectedPromptFileContent(promptFiles[fieldValue].content);
      setSelectedPromptFileName(promptFiles[fieldValue].label);
    } else {
      setSelectedPromptFileContent(null);
      setSelectedPromptFileName(null);
    }
  }, [fieldValue, promptFiles]);

  const handleSelectChange = (value: string) => {
    onFieldChange(value);
  };

  const hasSelection = Boolean(fieldValue && promptFiles[fieldValue]);
  const hasPromptFiles = Object.keys(promptFiles).length > 0;

  return {
    selectedPromptFileContent,
    selectedPromptFileName,
    hasSelection,
    hasPromptFiles,
    handleSelectChange,
    getPromptFileData: () => ({
      handle: fieldValue,
      name: selectedPromptFileName,
      content: selectedPromptFileContent
    })
  };
};

/**
 * Tipo para datos de prompt file seleccionado que se pueden incluir en envíos de formulario
 */
export interface SelectedPromptFileData {
  handle: string;
  name: string | null;
  content: string | null;
}

/**
 * Obtiene el prompt file único disponible si solo hay uno
 * @param promptFiles - Prompt files disponibles
 * @returns El único prompt file disponible o null si hay 0 o más de 1
 */
export const getSinglePromptFile = (
  promptFiles: Record<string, PromptFileWithContent>
): SelectedPromptFileData | null => {
  const promptFileKeys = Object.keys(promptFiles);
  
  if (promptFileKeys.length === 1) {
    const handle = promptFileKeys[0];
    const promptFile = promptFiles[handle];
    return {
      handle,
      name: promptFile.label,
      content: promptFile.content
    };
  }
  
  return null;
};

/**
 * Prepara datos de prompt files para envío de formulario
 * @param formData - Datos del formulario
 * @param promptFiles - Prompt files disponibles
 * @param promptFileFields - Lista de campos que contienen handles de prompt files
 * @param autoAttachSingleFile - Si es true, adjunta automáticamente el único prompt file disponible
 * @returns Datos enriquecidos con información de prompt files
 */
export const preparePromptFilesForSubmission = <T extends Record<string, unknown>>(
  formData: T,
  promptFiles: Record<string, PromptFileWithContent>,
  promptFileFields: (keyof T)[],
  autoAttachSingleFile: boolean = true
): T & { promptFilesData: Record<"procedureType", SelectedPromptFileData> } => {
  const promptFilesData: Record<string, SelectedPromptFileData> = {};

  // Procesar campos específicos que contienen handles de prompt files
  promptFileFields.forEach((fieldKey) => {
    const handle = formData[fieldKey] as string;
    if (handle && promptFiles[handle]) {
      promptFilesData[fieldKey as string] = {
        handle,
        name: promptFiles[handle].label,
        content: promptFiles[handle].content,
      };
    }
  });

  // Si está habilitado el auto-attach y hay un solo prompt file disponible,
  // y no se ha seleccionado ningún archivo específicamente, adjuntarlo automáticamente
  if (autoAttachSingleFile && Object.keys(promptFilesData).length === 0) {
    const singlePromptFile = getSinglePromptFile(promptFiles);
    if (singlePromptFile) {
      promptFilesData["procedureType"] = singlePromptFile;
    }
  }

  return {
    ...formData,
    promptFilesData,
  };
};
