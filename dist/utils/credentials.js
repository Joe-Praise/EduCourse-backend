import allowedOrigins from '../config/allowedOrigins.js';
const credentials = (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    next();
};
export default credentials;
//# sourceMappingURL=credentials.js.map