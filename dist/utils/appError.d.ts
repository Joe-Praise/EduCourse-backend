declare class ApplicationError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;
    constructor(message: string, statusCode: number);
}
declare const AppError: typeof ApplicationError;
export default AppError;
//# sourceMappingURL=appError.d.ts.map