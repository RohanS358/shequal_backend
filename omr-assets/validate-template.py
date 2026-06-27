"""
Validate the OMR sheets end-to-end (school + student).

For each sheet, fill one chosen bubble per question at the template's own
coordinates, run the real OMRChecker, and assert every decoded answer matches.
Proves the generated geometry is detectable and decodes correctly.

Run:  OMRChecker/venv/Scripts/python.exe omr-assets/validate-template.py
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
CHECKER_DIR = (HERE / ".." / ".." / "OMRChecker").resolve()
PYTHON = sys.executable

SHEETS = ["school", "student"]


def run_sheet(name):
    tpl = json.loads((HERE / f"{name}-template.json").read_text())
    W, H = tpl["pageDimensions"]
    D = tpl["bubbleDimensions"][0]
    r = D // 2 - 1
    img = np.full((H, W), 255, dtype=np.uint8)

    expected = {}
    for block in tpl["fieldBlocks"].values():
        key = block["fieldLabels"][0]
        vals = block["bubbleValues"]
        ox, oy = block["origin"]
        gap = block["bubblesGap"]
        # choose option index 1 if available else 0 (deterministic)
        k = 1 if len(vals) > 1 else 0
        expected[key] = vals[k]
        cx = ox + k * gap + D / 2
        cy = oy + D / 2
        cv2.circle(img, (int(cx), int(cy)), r, 0, -1)

    tpl_no_pp = dict(tpl)
    tpl_no_pp["preProcessors"] = []

    job = Path(tempfile.mkdtemp(prefix=f"omr-{name}-"))
    indir, outdir = job / "in", job / "out"
    indir.mkdir(); outdir.mkdir()
    (indir / "template.json").write_text(json.dumps(tpl_no_pp))
    cv2.imwrite(str(indir / "sheet.png"), img)

    try:
        subprocess.run(
            [PYTHON, "main.py", "-i", str(indir), "-o", str(outdir)],
            cwd=str(CHECKER_DIR), check=True, capture_output=True, text=True,
        )
    except subprocess.CalledProcessError as e:
        print(f"[{name}] OMR run failed:\n", e.stderr[-1200:])
        return False

    results = list((outdir / "Results").glob("Results_*.csv"))
    if not results:
        print(f"[{name}] no results CSV"); return False

    import csv
    with open(results[0]) as fh:
        row = list(csv.DictReader(fh))[0]
    shutil.rmtree(job, ignore_errors=True)

    ok = True
    for key in tpl["outputColumns"]:
        want = expected[key]
        got = (row.get(key) or "").strip()
        if got != want:
            ok = False
            print(f"[{name}] {key}: expected {want!r}, got {got!r}  MISMATCH")
    print(f"[{name}] {len(tpl['outputColumns'])} questions -> {'ALL MATCH' if ok else 'MISMATCH'}")
    return ok


all_ok = all(run_sheet(s) for s in SHEETS)
print("\nRESULT:", "ALL SHEETS OK" if all_ok else "FAILED")
sys.exit(0 if all_ok else 2)
