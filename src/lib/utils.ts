import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { logger } from '@/types/index';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const frontendLogger: logger = (origin, ...args) => {
  // NOTA: Comentar si se usa vercel dev
  // if (import.meta.env.MODE !== "development") {
  //   return;
  // }

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${origin}]`, ...args);
};