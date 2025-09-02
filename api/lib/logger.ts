import { logger } from '../../src/types/index';

const backendLogger: logger = (origin, ...args) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${origin}]`, ...args);
};

export default backendLogger;