import { SelectOption } from '../components/formSelect';
import { PromptFileWithContent } from '../types';

/**
 * Convierte prompt files en opciones para componentes select
 * @param promptFiles - Objeto con prompt files cargados
 * @returns Array de opciones para select con value=handle y label=name
 */
export const promptFilesToSelectOptions = (
  promptFiles: Record<string, PromptFileWithContent>
): SelectOption[] => {
  return Object.values(promptFiles).map(file => ({
    value: file.key,
    label: file.label
  }));
};

/**
 * Obtiene el contenido de un prompt file por su handle
 * @param promptFiles - Objeto con prompt files cargados
 * @param handle - Handle del prompt file a buscar
 * @returns Contenido del prompt file o null si no se encuentra
 */
export const getPromptFileContent = (
  promptFiles: Record<string, PromptFileWithContent>,
  handle: string
): string | null => {
  const file = promptFiles[handle];
  return file ? file.content : null;
};

/**
 * Obtiene el nombre de un prompt file por su handle
 * @param promptFiles - Objeto con prompt files cargados
 * @param handle - Handle del prompt file a buscar
 * @returns Nombre del prompt file o null si no se encuentra
 */
export const getPromptFileName = (
  promptFiles: Record<string, PromptFileWithContent>,
  handle: string
): string | null => {
  const file = promptFiles[handle];
  return file ? file.label : null;
};

/**
 * Verifica si hay prompt files disponibles
 * @param promptFiles - Objeto con prompt files cargados
 * @returns true si hay al menos un prompt file cargado
 */
export const hasPromptFiles = (
  promptFiles: Record<string, PromptFileWithContent>
): boolean => {
  return Object.keys(promptFiles).length > 0;
};

/**
 * Hook personalizado para gestionar prompt files en formularios
 * @param promptFiles - Objeto con prompt files cargados
 * @param selectedHandle - Handle del prompt file seleccionado
 * @returns Utilidades para trabajar con prompt files en formularios
 */
export const usePromptFilesInForm = (
  promptFiles: Record<string, PromptFileWithContent>,
  selectedHandle?: string
) => {
  const selectOptions = promptFilesToSelectOptions(promptFiles);
  const selectedContent = selectedHandle ? getPromptFileContent(promptFiles, selectedHandle) : null;
  const selectedName = selectedHandle ? getPromptFileName(promptFiles, selectedHandle) : null;
  const hasFiles = hasPromptFiles(promptFiles);

  return {
    selectOptions,
    selectedContent,
    selectedName,
    hasFiles,
    getContent: (handle: string) => getPromptFileContent(promptFiles, handle),
    getName: (handle: string) => getPromptFileName(promptFiles, handle)
  };
};
