declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  
  interface XssCleanOptions {
    body?: boolean;
    loggerFunction?: (message: string) => void;
  }
  
  function xssClean(options?: XssCleanOptions): RequestHandler;
  
  export = xssClean;
}