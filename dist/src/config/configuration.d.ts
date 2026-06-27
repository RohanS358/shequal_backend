declare const _default: () => {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
    draftTtlHours: number;
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    omr: {
        pythonPath: string;
        checkerDir: string;
        templatePath: string;
        tmpDir: string;
        timeoutMs: number;
    };
};
export default _default;
