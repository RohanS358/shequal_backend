"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    draftTtlHours: parseInt(process.env.DRAFT_TTL_HOURS, 10) || 24,
    database: {
        url: process.env.DATABASE_URL,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-prod',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    omr: {
        pythonPath: process.env.OMR_PYTHON || '',
        checkerDir: process.env.OMR_CHECKER_DIR || '',
        templatePath: process.env.OMR_TEMPLATE || '',
        tmpDir: process.env.OMR_TMP_DIR || '',
        timeoutMs: parseInt(process.env.OMR_TIMEOUT_MS, 10) || 60000,
    },
});
//# sourceMappingURL=configuration.js.map