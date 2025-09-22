import type { CorsOptions } from 'cors';
import allowedOrigins from './allowedOrigins.js';

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (allowedOrigins.indexOf(origin!) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200, // Fixed typo: was "optionSuccessStatus"
};

export default corsOptions;
