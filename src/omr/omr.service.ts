import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import { existsSync, readFileSync } from 'fs'
import * as os from 'os'
import * as path from 'path'
import { randomUUID } from 'crypto'

// Minimal upload shape — avoids a hard dependency on @types/multer.
export interface UploadedImage {
  buffer: Buffer
  originalname?: string
  mimetype?: string
}

export type SheetType = 'school' | 'student'

interface QuestionOption {
  label: string
  set: Record<string, unknown>
}
interface SheetMapping {
  sheet: SheetType
  submit: boolean
  questions: { key: string; q: string; options: QuestionOption[] }[]
}

interface ResolvedPaths {
  pythonPath: string
  checkerDir: string
  assetsDir: string
  registerScript: string
  tmpRoot: string
}

@Injectable()
export class OmrService implements OnModuleInit {
  private readonly logger = new Logger(OmrService.name)
  private paths: ResolvedPaths
  private mappings: Partial<Record<SheetType, SheetMapping>> = {}

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.paths = this.resolvePaths()
    if (!this.paths.checkerDir) {
      this.logger.warn(
        'OMRChecker directory not found — OMR scanning will be unavailable. Set OMR_CHECKER_DIR.',
      )
    } else {
      this.logger.log(`OMR child-service ready (checker: ${this.paths.checkerDir})`)
    }
    // Preload the decode maps for each sheet.
    for (const sheet of ['school', 'student'] as SheetType[]) {
      const p = path.join(this.paths.assetsDir, `${sheet}-mapping.json`)
      if (existsSync(p)) {
        try {
          this.mappings[sheet] = JSON.parse(readFileSync(p, 'utf8'))
        } catch (e) {
          this.logger.error(`Failed to load ${sheet}-mapping.json: ${(e as Error).message}`)
        }
      }
    }
  }

  // ---------------------------------------------------------------
  // PUBLIC: scan one filled sheet → decoded answers + audit payload.
  // ---------------------------------------------------------------
  async scan(image: UploadedImage, sheet: SheetType = 'school') {
    if (!image?.buffer?.length) throw new BadRequestException('No image uploaded')
    if (sheet !== 'school' && sheet !== 'student') {
      throw new BadRequestException('Unknown sheet type')
    }
    if (!this.paths?.checkerDir) {
      throw new InternalServerErrorException(
        'OMR engine is not configured on this server (Python OMRChecker not found).',
      )
    }
    const templatePath = path.join(this.paths.assetsDir, `${sheet}-template.json`)
    const mapping = this.mappings[sheet]
    if (!existsSync(templatePath) || !mapping) {
      throw new InternalServerErrorException(`OMR assets for "${sheet}" sheet are missing.`)
    }

    const jobDir = path.join(this.paths.tmpRoot, randomUUID())
    const inputDir = path.join(jobDir, 'input')
    const outputDir = path.join(jobDir, 'output')

    try {
      await fs.mkdir(inputDir, { recursive: true })
      await fs.mkdir(outputDir, { recursive: true })

      // OMRChecker reads template.json + the registered image from inputDir.
      await fs.copyFile(templatePath, path.join(inputDir, 'template.json'))

      // Step 1 — register the scan to exact pageDimensions via corner markers.
      const ext = this.pickExt(image)
      const rawPath = path.join(jobDir, `raw${ext}`)
      await fs.writeFile(rawPath, image.buffer)
      await this.runRegister(rawPath, path.join(inputDir, 'sheet.png'), templatePath)

      // Step 2 — read the bubbles (no cropping needed, image is registered).
      await this.runChecker(inputDir, outputDir)

      const record = await this.readResults(outputDir)
      return this.decode(record, mapping)
    } finally {
      // Best-effort cleanup; never fail the request on cleanup error.
      fs.rm(jobDir, { recursive: true, force: true }).catch(() => undefined)
    }
  }

  // ---------------------------------------------------------------
  // Register the scan to exact pageDimensions via its corner markers.
  // ---------------------------------------------------------------
  private runRegister(rawPath: string, outPath: string, templatePath: string): Promise<void> {
    const { pythonPath, registerScript, assetsDir } = this.paths
    const timeoutMs = this.config.get<number>('omr.timeoutMs') ?? 60000

    return new Promise((resolve, reject) => {
      const child = spawn(pythonPath, [registerScript, rawPath, outPath, templatePath], {
        cwd: assetsDir,
        windowsHide: true,
      })
      let stderr = ''
      let stdout = ''
      child.stdout.on('data', (d) => (stdout += d.toString()))
      child.stderr.on('data', (d) => (stderr += d.toString()))

      const timer = setTimeout(() => {
        child.kill('SIGKILL')
        reject(new InternalServerErrorException('OMR registration timed out'))
      }, timeoutMs)

      child.on('error', (err) => {
        clearTimeout(timer)
        reject(new InternalServerErrorException(`Failed to start image registration: ${err.message}`))
      })

      child.on('close', (code) => {
        clearTimeout(timer)
        this.logger.debug(`[register] ${stdout.trim()}`)
        const retake = new BadRequestException(
          'Could not read the form clearly. Retake the photo with all four corner squares visible, the sheet flat and filling the frame, in good light.',
        )
        if (code !== 0) {
          this.logger.error(`Registration exited ${code}: ${stderr.slice(0, 600)}`)
          return reject(retake)
        }
        // Only proceed when the sheet registered AND the markers verified.
        let status: { registered?: boolean; verified?: boolean } = {}
        try {
          status = JSON.parse(stdout.trim().split(/\r?\n/).pop() || '{}')
        } catch {
          /* ignore */
        }
        if (!status.verified) {
          this.logger.warn(`Registration not verified: ${stdout.trim()}`)
          return reject(retake)
        }
        resolve()
      })
    })
  }

  // ---------------------------------------------------------------
  // Spawn the Python OMRChecker as a child process (no HTTP server).
  // ---------------------------------------------------------------
  private runChecker(inputDir: string, outputDir: string): Promise<void> {
    const { pythonPath, checkerDir } = this.paths
    const timeoutMs = this.config.get<number>('omr.timeoutMs') ?? 60000

    return new Promise((resolve, reject) => {
      const child = spawn(pythonPath, ['main.py', '-i', inputDir, '-o', outputDir], {
        cwd: checkerDir,
        windowsHide: true,
      })

      let stderr = ''
      child.stdout.on('data', (d) => this.logger.debug(`[omr] ${d.toString().trim()}`))
      child.stderr.on('data', (d) => {
        stderr += d.toString()
      })

      const timer = setTimeout(() => {
        child.kill('SIGKILL')
        reject(new InternalServerErrorException('OMR processing timed out'))
      }, timeoutMs)

      child.on('error', (err) => {
        clearTimeout(timer)
        reject(
          new InternalServerErrorException(`Failed to start OMR engine: ${err.message}`),
        )
      })

      child.on('close', (code) => {
        clearTimeout(timer)
        if (code === 0) return resolve()
        this.logger.error(`OMR exited with code ${code}: ${stderr.slice(0, 800)}`)
        reject(
          new BadRequestException(
            'Could not read the form. Ensure the whole sheet is visible, flat and well-lit, then try again.',
          ),
        )
      })
    })
  }

  // ---------------------------------------------------------------
  // Read the Results_*.csv the checker writes and return the one row.
  // ---------------------------------------------------------------
  private async readResults(outputDir: string): Promise<Record<string, string>> {
    const resultsDir = path.join(outputDir, 'Results')
    let files: string[] = []
    try {
      files = (await fs.readdir(resultsDir)).filter(
        (f) => f.startsWith('Results_') && f.endsWith('.csv'),
      )
    } catch {
      files = []
    }
    if (!files.length) {
      throw new BadRequestException('No response detected on the scanned sheet.')
    }

    const csv = await fs.readFile(path.join(resultsDir, files[0]), 'utf8')
    const rows = csv.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (rows.length < 2) {
      throw new BadRequestException('Scanned sheet produced no data row.')
    }

    const header = this.parseCsvLine(rows[0])
    const values = this.parseCsvLine(rows[1])
    const record: Record<string, string> = {}
    header.forEach((h, i) => (record[h] = values[i] ?? ''))
    return record
  }

  // ---------------------------------------------------------------
  // Decode the response row using the sheet mapping:
  //   each marked letter → option index → option.label + option.set,
  //   and deep-merge all `set` fragments into the audit payload.
  // ---------------------------------------------------------------
  private decode(record: Record<string, string>, mapping: SheetMapping) {
    const answers: { key: string; question: string; answer: string | null }[] = []
    let audit: Record<string, unknown> = {}

    for (const q of mapping.questions) {
      const letter = (record[q.key] ?? '').trim().toUpperCase()
      const idx = letter ? letter.charCodeAt(0) - 65 : -1
      const opt = idx >= 0 && idx < q.options.length ? q.options[idx] : null
      answers.push({ key: q.key, question: q.q, answer: opt ? opt.label : null })
      if (opt?.set && Object.keys(opt.set).length) audit = deepMerge(audit, opt.set)
    }

    return { sheet: mapping.sheet, submit: mapping.submit, answers, audit }
  }

  // ---------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------
  private pickExt(image: UploadedImage): string {
    const name = image.originalname ?? ''
    const m = name.match(/\.(png|jpe?g)$/i)
    if (m) return m[0].toLowerCase()
    if ((image.mimetype ?? '').includes('png')) return '.png'
    return '.jpg'
  }

  // Handles the QUOTE_NONNUMERIC output (string fields wrapped in ").
  private parseCsvLine(line: string): string[] {
    const out: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"'
            i++
          } else inQuotes = false
        } else cur += ch
      } else if (ch === '"') inQuotes = true
      else if (ch === ',') {
        out.push(cur)
        cur = ''
      } else cur += ch
    }
    out.push(cur)
    return out.map((s) => s.trim())
  }

  private resolvePaths(): ResolvedPaths {
    const cwd = process.cwd()

    const checkerCandidates = [
      this.config.get<string>('omr.checkerDir'),
      path.resolve(cwd, '../OMRChecker'),
      path.resolve(cwd, 'OMRChecker'),
      path.resolve(cwd, '../../OMRChecker'),
    ].filter(Boolean) as string[]
    const checkerDir =
      checkerCandidates.find((p) => existsSync(path.join(p, 'main.py'))) ?? ''

    const isWin = process.platform === 'win32'
    const venvPython = checkerDir
      ? isWin
        ? path.join(checkerDir, 'venv', 'Scripts', 'python.exe')
        : path.join(checkerDir, 'venv', 'bin', 'python')
      : ''
    const pythonCandidates = [
      this.config.get<string>('omr.pythonPath'),
      venvPython,
      isWin ? 'python.exe' : 'python3',
      'python',
    ].filter(Boolean) as string[]
    const pythonPath =
      pythonCandidates.find((p) => p && (existsSync(p) || !p.includes(path.sep))) ?? 'python'

    // omr-assets dir (templates + mappings live here, deployed with backend).
    const assetsCandidates = [
      this.config.get<string>('omr.templatePath'),
      path.resolve(cwd, 'omr-assets'),
      path.resolve(__dirname, '../../omr-assets'),
      path.resolve(__dirname, '../../../omr-assets'),
    ].filter(Boolean) as string[]
    const assetsDir =
      assetsCandidates.find((p) => existsSync(path.join(p, 'school-template.json'))) ??
      path.resolve(cwd, 'omr-assets')

    const tmpRoot =
      this.config.get<string>('omr.tmpDir') || path.join(os.tmpdir(), 'copaila-omr')

    const registerScript = path.join(assetsDir, 'register_sheet.py')

    return { pythonPath, checkerDir, assetsDir, registerScript, tmpRoot }
  }
}

// Deep-merge plain objects (option `set` fragments into the payload).
function deepMerge(
  base: Record<string, unknown>,
  add: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const [k, v] of Object.entries(add)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object' && out[k]) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v as Record<string, unknown>)
    } else {
      out[k] = v
    }
  }
  return out
}
