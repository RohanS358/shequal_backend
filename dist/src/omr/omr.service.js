"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OmrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmrService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const fs_2 = require("fs");
const os = require("os");
const path = require("path");
const crypto_1 = require("crypto");
let OmrService = OmrService_1 = class OmrService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(OmrService_1.name);
        this.mappings = {};
    }
    onModuleInit() {
        this.paths = this.resolvePaths();
        if (!this.paths.checkerDir) {
            this.logger.warn('OMRChecker directory not found — OMR scanning will be unavailable. Set OMR_CHECKER_DIR.');
        }
        else {
            this.logger.log(`OMR child-service ready (checker: ${this.paths.checkerDir})`);
        }
        for (const sheet of ['school', 'student']) {
            const p = path.join(this.paths.assetsDir, `${sheet}-mapping.json`);
            if ((0, fs_2.existsSync)(p)) {
                try {
                    this.mappings[sheet] = JSON.parse((0, fs_2.readFileSync)(p, 'utf8'));
                }
                catch (e) {
                    this.logger.error(`Failed to load ${sheet}-mapping.json: ${e.message}`);
                }
            }
        }
    }
    async scan(image, sheet = 'school') {
        if (!image?.buffer?.length)
            throw new common_1.BadRequestException('No image uploaded');
        if (sheet !== 'school' && sheet !== 'student') {
            throw new common_1.BadRequestException('Unknown sheet type');
        }
        if (!this.paths?.checkerDir) {
            throw new common_1.InternalServerErrorException('OMR engine is not configured on this server (Python OMRChecker not found).');
        }
        const templatePath = path.join(this.paths.assetsDir, `${sheet}-template.json`);
        const mapping = this.mappings[sheet];
        if (!(0, fs_2.existsSync)(templatePath) || !mapping) {
            throw new common_1.InternalServerErrorException(`OMR assets for "${sheet}" sheet are missing.`);
        }
        const jobDir = path.join(this.paths.tmpRoot, (0, crypto_1.randomUUID)());
        const inputDir = path.join(jobDir, 'input');
        const outputDir = path.join(jobDir, 'output');
        try {
            await fs_1.promises.mkdir(inputDir, { recursive: true });
            await fs_1.promises.mkdir(outputDir, { recursive: true });
            await fs_1.promises.copyFile(templatePath, path.join(inputDir, 'template.json'));
            const ext = this.pickExt(image);
            const rawPath = path.join(jobDir, `raw${ext}`);
            await fs_1.promises.writeFile(rawPath, image.buffer);
            await this.runRegister(rawPath, path.join(inputDir, 'sheet.png'), templatePath);
            await this.runChecker(inputDir, outputDir);
            const record = await this.readResults(outputDir);
            return this.decode(record, mapping);
        }
        finally {
            fs_1.promises.rm(jobDir, { recursive: true, force: true }).catch(() => undefined);
        }
    }
    runRegister(rawPath, outPath, templatePath) {
        const { pythonPath, registerScript, assetsDir } = this.paths;
        const timeoutMs = this.config.get('omr.timeoutMs') ?? 60000;
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)(pythonPath, [registerScript, rawPath, outPath, templatePath], {
                cwd: assetsDir,
                windowsHide: true,
            });
            let stderr = '';
            let stdout = '';
            child.stdout.on('data', (d) => (stdout += d.toString()));
            child.stderr.on('data', (d) => (stderr += d.toString()));
            const timer = setTimeout(() => {
                child.kill('SIGKILL');
                reject(new common_1.InternalServerErrorException('OMR registration timed out'));
            }, timeoutMs);
            child.on('error', (err) => {
                clearTimeout(timer);
                reject(new common_1.InternalServerErrorException(`Failed to start image registration: ${err.message}`));
            });
            child.on('close', (code) => {
                clearTimeout(timer);
                this.logger.debug(`[register] ${stdout.trim()}`);
                const retake = new common_1.BadRequestException('Could not read the form clearly. Retake the photo with all four corner squares visible, the sheet flat and filling the frame, in good light.');
                if (code !== 0) {
                    this.logger.error(`Registration exited ${code}: ${stderr.slice(0, 600)}`);
                    return reject(retake);
                }
                let status = {};
                try {
                    status = JSON.parse(stdout.trim().split(/\r?\n/).pop() || '{}');
                }
                catch {
                }
                if (!status.verified) {
                    this.logger.warn(`Registration not verified: ${stdout.trim()}`);
                    return reject(retake);
                }
                resolve();
            });
        });
    }
    runChecker(inputDir, outputDir) {
        const { pythonPath, checkerDir } = this.paths;
        const timeoutMs = this.config.get('omr.timeoutMs') ?? 60000;
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)(pythonPath, ['main.py', '-i', inputDir, '-o', outputDir], {
                cwd: checkerDir,
                windowsHide: true,
            });
            let stderr = '';
            child.stdout.on('data', (d) => this.logger.debug(`[omr] ${d.toString().trim()}`));
            child.stderr.on('data', (d) => {
                stderr += d.toString();
            });
            const timer = setTimeout(() => {
                child.kill('SIGKILL');
                reject(new common_1.InternalServerErrorException('OMR processing timed out'));
            }, timeoutMs);
            child.on('error', (err) => {
                clearTimeout(timer);
                reject(new common_1.InternalServerErrorException(`Failed to start OMR engine: ${err.message}`));
            });
            child.on('close', (code) => {
                clearTimeout(timer);
                if (code === 0)
                    return resolve();
                this.logger.error(`OMR exited with code ${code}: ${stderr.slice(0, 800)}`);
                reject(new common_1.BadRequestException('Could not read the form. Ensure the whole sheet is visible, flat and well-lit, then try again.'));
            });
        });
    }
    async readResults(outputDir) {
        const resultsDir = path.join(outputDir, 'Results');
        let files = [];
        try {
            files = (await fs_1.promises.readdir(resultsDir)).filter((f) => f.startsWith('Results_') && f.endsWith('.csv'));
        }
        catch {
            files = [];
        }
        if (!files.length) {
            throw new common_1.BadRequestException('No response detected on the scanned sheet.');
        }
        const csv = await fs_1.promises.readFile(path.join(resultsDir, files[0]), 'utf8');
        const rows = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (rows.length < 2) {
            throw new common_1.BadRequestException('Scanned sheet produced no data row.');
        }
        const header = this.parseCsvLine(rows[0]);
        const values = this.parseCsvLine(rows[1]);
        const record = {};
        header.forEach((h, i) => (record[h] = values[i] ?? ''));
        return record;
    }
    decode(record, mapping) {
        const answers = [];
        let audit = {};
        for (const q of mapping.questions) {
            const letter = (record[q.key] ?? '').trim().toUpperCase();
            const idx = letter ? letter.charCodeAt(0) - 65 : -1;
            const opt = idx >= 0 && idx < q.options.length ? q.options[idx] : null;
            answers.push({ key: q.key, question: q.q, answer: opt ? opt.label : null });
            if (opt?.set && Object.keys(opt.set).length)
                audit = deepMerge(audit, opt.set);
        }
        return { sheet: mapping.sheet, submit: mapping.submit, answers, audit };
    }
    pickExt(image) {
        const name = image.originalname ?? '';
        const m = name.match(/\.(png|jpe?g)$/i);
        if (m)
            return m[0].toLowerCase();
        if ((image.mimetype ?? '').includes('png'))
            return '.png';
        return '.jpg';
    }
    parseCsvLine(line) {
        const out = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (line[i + 1] === '"') {
                        cur += '"';
                        i++;
                    }
                    else
                        inQuotes = false;
                }
                else
                    cur += ch;
            }
            else if (ch === '"')
                inQuotes = true;
            else if (ch === ',') {
                out.push(cur);
                cur = '';
            }
            else
                cur += ch;
        }
        out.push(cur);
        return out.map((s) => s.trim());
    }
    resolvePaths() {
        const cwd = process.cwd();
        const checkerCandidates = [
            this.config.get('omr.checkerDir'),
            path.resolve(cwd, '../OMRChecker'),
            path.resolve(cwd, 'OMRChecker'),
            path.resolve(cwd, '../../OMRChecker'),
        ].filter(Boolean);
        const checkerDir = checkerCandidates.find((p) => (0, fs_2.existsSync)(path.join(p, 'main.py'))) ?? '';
        const isWin = process.platform === 'win32';
        const venvPython = checkerDir
            ? isWin
                ? path.join(checkerDir, 'venv', 'Scripts', 'python.exe')
                : path.join(checkerDir, 'venv', 'bin', 'python')
            : '';
        const pythonCandidates = [
            this.config.get('omr.pythonPath'),
            venvPython,
            isWin ? 'python.exe' : 'python3',
            'python',
        ].filter(Boolean);
        const pythonPath = pythonCandidates.find((p) => p && ((0, fs_2.existsSync)(p) || !p.includes(path.sep))) ?? 'python';
        const assetsCandidates = [
            this.config.get('omr.templatePath'),
            path.resolve(cwd, 'omr-assets'),
            path.resolve(__dirname, '../../omr-assets'),
            path.resolve(__dirname, '../../../omr-assets'),
        ].filter(Boolean);
        const assetsDir = assetsCandidates.find((p) => (0, fs_2.existsSync)(path.join(p, 'school-template.json'))) ??
            path.resolve(cwd, 'omr-assets');
        const tmpRoot = this.config.get('omr.tmpDir') || path.join(os.tmpdir(), 'copaila-omr');
        const registerScript = path.join(assetsDir, 'register_sheet.py');
        return { pythonPath, checkerDir, assetsDir, registerScript, tmpRoot };
    }
};
exports.OmrService = OmrService;
exports.OmrService = OmrService = OmrService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OmrService);
function deepMerge(base, add) {
    const out = { ...base };
    for (const [k, v] of Object.entries(add)) {
        if (v && typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object' && out[k]) {
            out[k] = deepMerge(out[k], v);
        }
        else {
            out[k] = v;
        }
    }
    return out;
}
//# sourceMappingURL=omr.service.js.map