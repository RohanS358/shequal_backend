// ============================================================
// OMR ASSET GENERATOR — single source of geometry, two sheets.
// Reads the canonical questions (LeafNode/src/data/omr-questions.json)
// and emits, for the SCHOOL and STUDENT sheets:
//   backend/omr-assets/<sheet>-template.json   (OMRChecker reads this)
//   LeafNode/src/data/omr-<sheet>-layout.json  (frontend SVG renders this)
//
// Each question is one horizontal multiple-choice row (A,B,C…), so the
// printed sheet and the reader share identical bubble coordinates.
//
// Run:  node omr-assets/build-omr-assets.mjs   (from the backend dir)
// ============================================================
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const QUESTIONS_PATH = resolve(__dirname, '../../LeafNode/src/data/omr-questions.json')
const questions = JSON.parse(readFileSync(QUESTIONS_PATH, 'utf8'))

// ---- geometry constants ----
const W = 1000
const MARGIN = 40
const BUBBLE = 18
const R = BUBBLE / 2
const HEADER_H = 118
const SEC_HEADER_H = 30
const Q_STEP = 64 // vertical pitch per question (text + options row)
const CHAR_W = 6.6 // approx width of label chars at 12.5px
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

const SEC_X = MARGIN
const SEC_W = W - 2 * MARGIN
const OPT_X = SEC_X + 26 // left edge of the first option bubble
const OPT_AVAIL = SEC_W - 26 - 18 // usable width for option row

function buildSheet(key, def) {
  const fieldBlocks = {}
  const outputColumns = []
  const layoutSections = []

  let y = HEADER_H
  let n = 0

  for (const sec of def.sections) {
    const sectionTop = y
    const qy0 = sectionTop + SEC_HEADER_H + 16
    const layoutQuestions = []

    sec.questions.forEach((q, qi) => {
      n += 1
      const qy = qy0 + qi * Q_STEP
      const optCy = qy + 20
      const count = q.options.length

      // size the gap to the widest label so labels never collide
      const maxLabel = Math.max(...q.options.map((o) => o.label.length))
      const needed = BUBBLE + 8 + maxLabel * CHAR_W + 16
      const gap = Math.min(needed, OPT_AVAIL / count)

      const cx0 = OPT_X + R
      const bubbles = q.options.map((o, k) => ({
        cx: Math.round(cx0 + k * gap),
        cy: optCy,
        letter: LETTERS[k],
        label: o.label,
      }))

      // template field block (horizontal MCQ with N letters)
      fieldBlocks[`${q.key}_Block`] = {
        bubbleValues: q.options.map((_, k) => LETTERS[k]),
        direction: 'horizontal',
        fieldLabels: [q.key],
        origin: [Math.round(cx0 - R), Math.round(optCy - R)],
        bubblesGap: Math.round(gap),
        labelsGap: Math.round(gap),
      }
      outputColumns.push(q.key)

      layoutQuestions.push({ n, key: q.key, text: q.q, textAt: [SEC_X + 16, qy], bubbles })
    })

    const h = SEC_HEADER_H + 16 + sec.questions.length * Q_STEP
    layoutSections.push({ letter: sec.letter, title: sec.title, x: SEC_X, y: sectionTop, w: SEC_W, h, questions: layoutQuestions })
    y = sectionTop + h + 16
  }

  const H = Math.round(y + 46)

  const template = {
    pageDimensions: [W, H],
    bubbleDimensions: [BUBBLE, BUBBLE],
    emptyValue: '',
    outputColumns,
    fieldBlocks,
    // No CropPage: the backend pre-registers the scan to exact pageDimensions
    // using the corner markers (register_sheet.py), so the reader needs no crop.
    preProcessors: [],
  }

  const layout = {
    _generated: 'build-omr-assets.mjs',
    sheet: key,
    page: [W, H],
    bubbleR: R,
    title: def.title,
    hint: def.hint,
    sections: layoutSections,
  }

  // Backend decode map (self-contained — no dependency on frontend source).
  const mapping = {
    sheet: key,
    submit: !!def.submit,
    questions: def.sections.flatMap((s) =>
      s.questions.map((q) => ({
        key: q.key,
        q: q.q,
        options: q.options.map((o) => ({ label: o.label, set: o.set || {} })),
      })),
    ),
  }

  return { template, layout, mapping }
}

for (const [key, def] of Object.entries(questions)) {
  if (key.startsWith('_')) continue
  const { template, layout, mapping } = buildSheet(key, def)
  const tplPath = resolve(__dirname, `${key}-template.json`)
  const mapPath = resolve(__dirname, `${key}-mapping.json`)
  const layoutPath = resolve(__dirname, `../../LeafNode/src/data/omr-${key}-layout.json`)
  writeFileSync(tplPath, JSON.stringify(template, null, 2))
  writeFileSync(mapPath, JSON.stringify(mapping, null, 2))
  writeFileSync(layoutPath, JSON.stringify(layout, null, 2))
  console.log(`[${key}] page ${template.pageDimensions.join('x')}, ${template.outputColumns.length} questions`)
  console.log('  ->', tplPath)
  console.log('  ->', mapPath)
  console.log('  ->', layoutPath)
}
