# OMR Integration & Carbon Calculator — Implementation Notes

This documents the three changes made to align the platform with the
**CoPaila Carbon Calculator Backend Logic Spec**:

1. The OMR checker now runs **inside the NestJS backend as a child service** (not a separate server).
2. The carbon calculator was **rebuilt** around the spec's Activity_Data + 3‑tier proxy / confidence model.
3. Emission factors are now **configurable in one file**.

---

## 1. OMR as an in‑process child service

The Python **OMRChecker** (`../OMRChecker`) is spawned per request by the
NestJS backend — there is no second server to run or deploy.

```
POST /api/v1/omr/scan              (multipart: file=<sheet image>)
  → writes the image + template.json to a temp dir
  → spawns:  python main.py -i <tmp/input> -o <tmp/output>   (cwd = OMRChecker)
  → reads    <tmp/output>/Results/Results_*.csv
  → maps the bubble responses → tier-aware audit payload
  → returns  { raw, audit }        (for the user to review, then submit)

POST /api/v1/omr/scan-and-submit   (multipart: file, academicYear, month)
  → scan + submit/calculate in one step
```

Code: [`src/omr/`](src/omr) — `omr.service.ts` (spawn + CSV parse + mapping),
`omr.controller.ts` (upload endpoints), `omr.module.ts`.

### The OMR sheet (form) — single source of geometry
The bubble layout is **generated**, not hand-authored, so the printed sheet and
the reader can never drift apart:

```
omr-assets/build-omr-assets.mjs   ← the ONE geometry source
        │  node omr-assets/build-omr-assets.mjs   (from backend/)
        ├─► omr-assets/carbon-audit-template.json        (OMRChecker reads this)
        └─► ../LeafNode/src/data/omr-layout.json          (frontend SVG renders this)
```

The frontend prints the sheet as a single SVG straight from `omr-layout.json`,
so every printed bubble sits at the exact pixel the template looks at. To change
the form (add a field, move a block, resize bubbles) edit the generator and
re-run it — both artifacts update together.

**Validated end-to-end:** `omr-assets/validate-template.py` draws a synthetic
filled sheet at the template's own coordinates, runs it through the real
OMRChecker, and asserts every decoded value. Current status: **all 17 fields
round-trip correctly** (digits, MCQ, Yes/No, and blanks).

```
OMRChecker/venv/Scripts/python.exe omr-assets/validate-template.py
```

It captures, by GHG scope:

| Field (output column) | Type | Maps to |
|---|---|---|
| `Enrollment` | 4‑digit | `enrollment` |
| `Electricity_kWh` | 6‑digit | `electricity.measuredKwh` (Scope 2) |
| `Generator_L` / `Has_generator` | 5‑digit / Y‑N | `generator.*` (Scope 1) |
| `Vehicle_L` | 5‑digit | `vehicle.measuredLitres` (Scope 1) |
| `LPG_kg` | 4‑digit | `cooking.lpgKg` (Scope 1) |
| `AC_units` | 2‑digit | `refrigerant.acUnits` (Scope 1) |
| `Commute_km` / `Commute_mode` | 3‑digit / MCQ4 | `commute.*` (Scope 3) |
| `Paper_reams` | 3‑digit | `paper.reamsPerMonth` (Scope 3) |
| `Waste_kg_week` / `Segregation` / `Composting` / `Recycling` | digit / MCQ4 / Y‑N | `waste.*` (Scope 3) |
| `Meals_day` / `Has_canteen` | 4‑digit / Y‑N | `food.*` (Scope 3) |

> **Digital scans vs camera photos.** Because the print and the template share
> geometry, a clean digital capture (uploaded screenshot/PDF render, or a flat,
> square-on scan) reads reliably today. For phone *photos* taken at an angle,
> the `CropPage` pre-processor corrects perspective using the sheet's outer
> border + corner markers; if you see misreads on skewed photos, switch the
> pre-processor to `CropOnMarkers` (add a small marker image) for stronger
> registration. You can always sanity-check a real scan with
> `python main.py --setLayout -i <dir>`.

### Environment variables (all optional — auto‑detected)
| Var | Default | Purpose |
|---|---|---|
| `OMR_CHECKER_DIR` | `../OMRChecker` | OMRChecker folder |
| `OMR_PYTHON` | venv python, else `python3` | interpreter with OpenCV |
| `OMR_TEMPLATE` | `omr-assets/carbon-audit-template.json` | bubble layout |
| `OMR_TMP_DIR` | OS temp | scratch dir for jobs |
| `OMR_TIMEOUT_MS` | `60000` | per‑scan timeout |

### Local dev
The repo already has a working venv at `OMRChecker/venv` (OpenCV 4.x). No extra
setup needed — just run the backend and the scanner works.

### Production (Render)
The current `render.yaml` uses the **Node** runtime, which has no Python —
`/omr/scan` returns a clear "OMR engine not configured" error there while every
other endpoint works. To enable OMR in production, deploy the **Docker** image
that bundles Node + Python + OpenCV + OMRChecker:

- Dockerfile: [`../Dockerfile`](../Dockerfile) (build context = repo root).
- On Render: set runtime `docker`, `dockerfilePath ./Dockerfile`, `dockerContext .`.
- Ensure `OMRChecker/` is committed to the repo (it is currently an untracked
  embedded folder — `git add` it, or vendor it without its inner `.git`).

---

## 2. Carbon calculator — tier-aware rebuild

The flat `CarbonAudit` row was replaced (Prisma migration
`carbon_activity_tiers`) by the spec's structure:

- **`CarbonAudit`** — header per school per reporting period.
- **`ActivityData`** — one row per category, storing `tier` (MEASURED /
  ESTIMATED / DEFAULT), resolved `activityValue`, `unit`, cached `emissions`,
  and the raw `inputs` (for transparency & recalculation).
- **`CarbonResult`** — scope 1/2/3 totals, per‑student intensity, **confidence
  breakdown** (`tier1Pct/tier2Pct/tier3Pct`, `confidenceScore`),
  `partiallyDefault` flag, and grade.

Engine ([`src/carbon-calculator/engine/`](src/carbon-calculator/engine)):
- `category-processors.ts` — one processor per spec category, each doing the
  3‑tier branching (measured → proxy → national default).
- `calculation-engine.ts` — sums scopes, computes per‑student intensity,
  confidence (emissions‑weighted by tier), `partiallyDefault`, and a grade that
  combines **intensity *and* data quality** (a mostly‑default school can't score
  top marks — spec step 8).

Skipped core categories (electricity, commute, paper, waste) fall back to a
flagged Tier‑3 default rather than silently zeroing (spec section 9). Optional
categories (generator, vehicle, cooking, refrigerant, food) are treated as a
genuine zero when absent.

---

## 3. Configurable emission factors

All factors, derivation constants and national defaults live in one file:
[`src/carbon-calculator/config/emission-factors.config.ts`](src/carbon-calculator/config/emission-factors.config.ts).
Each factor stores `value`, `unit`, `scope`, `source`, `year` (spec section 5).

**To change a factor:** edit that file and redeploy, then recalculate existing
audits: `POST /api/v1/carbon-audits/:id/recalculate` (super‑admin). Recalc
re‑runs the engine from the stored `ActivityData.inputs`, so updated factors
flow through without re‑entering data.

> The Tier‑3 national defaults are placeholders — calibrate against the
> HiJASE 2025 baseline / NEA data before production use.
