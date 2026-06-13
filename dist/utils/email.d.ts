export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare const sendEmail: ({ to, subject, html, text, }: SendEmailOptions) => Promise<void>;
export declare const sendPasswordResetEmail: (to: string, name: string, resetUrl: string) => Promise<void>;
//# sourceMappingURL=email.d.ts.map