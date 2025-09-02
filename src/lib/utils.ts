import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface logger {
  (origin: string, ...args: unknown[]): void;
}

const commonLogger : logger = (origin, ...args) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${origin}]`, ...args);
}

export const backendLogger: logger = (origin, ...args) => {
  commonLogger(origin, ...args);
};

export const frontendLogger: logger = (origin, ...args) => {
  // NOTA: Comentar si se usa vercel dev
  if (import.meta.env.MODE !== "development") {
    return;
  }

  commonLogger(origin, ...args);
};