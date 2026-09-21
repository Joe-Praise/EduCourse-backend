import dotenv from 'dotenv';
// Load env BEFORE Sentry init so SENTRY_DSN is available.
dotenv.config({ path: './config.env' });
import { logger } from './utils/logger.js';
import { initSentry, captureException } from './utils/sentry.js';
import mongoose from 'mongoose';
// Initialise Sentry as early as possible — must precede `app.js` import so
// any module-init errors get captured.
initSentry();
process.on('uncaughtException', (err) => {
    captureException(err, { source: 'uncaughtException' });
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', err.name, err.message);
});
import app from './app.js';
const DB = process.env.DATABASE?.replace('<PASSWORD>', process.env.DATABASE_PASSWORD || '') || '';
mongoose.connect(DB);
mongoose.connection.on('open', () => {
    logger.info('Mongodb connected');
});
const port = process.env.NODE_ENV === 'production' ? process.env.PORT : 3050;
app.listen(port, () => {
    logger.info(`App running on port ${port}...`);
});
// handling all unhandled rejection
process.on('unhandledRejection', (err) => {
    captureException(err, { source: 'unhandledRejection' });
    logger.error('UNHANDLED REJECTION! Shutting down...', err.name, err.message);
});
//# sourceMappingURL=server.js.map