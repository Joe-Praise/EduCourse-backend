"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! ❌ Shutting down...');
    console.log(err.name, err.message);
});
dotenv_1.default.config({ path: './config.env' });
const app_js_1 = __importDefault(require("./app.js"));
const DB = process.env.DATABASE?.replace('<PASSWORD>', process.env.DATABASE_PASSWORD || '') || '';
mongoose_1.default.connect(DB);
mongoose_1.default.connection.on('open', () => {
    console.log('Mongodb Connected');
});
const port = process.env.NODE_ENV === 'production' ? process.env.PORT : 3050;
app_js_1.default.listen(port, () => {
    console.log(`App running on port ${port}...`);
});
// handling all unhandled rejection
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! ❌ Shutting down...');
    console.log(err.name, err.message);
});
//# sourceMappingURL=server.js.map