"""
Validate the FULL scan pipeline (registration + reading) for both sheets.

Renders a realistic scan: the sheet drawn at a different size, on a larger
white canvas with margins and a slight rotation, with corner markers + some
filled bubbles. Then runs register_sheet.py + OMRChecker and asserts the
decoded answers match.

Run:  OMRChecker/venv/Scripts/python.exe omr-assets/validate-pipeline.py
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
PY = sys.executable
INSET = 27


def render_scan(tpl, fill_idx):
    """Draw a template-sized sheet (markers + chosen filled bubbles), then place
    it scaled+rotated on a bigger margined canvas to mimic a real scan."""
    W, H = tpl["pageDimensions"]
    D = tpl["bubbleDimensions"][0]
    sheet = np.full((H, W), 255, np.uint8)
    # corner markers (match SheetSvg: 22px square at 16px inset)
    for (mx, my) in [(16, 16), (W - 38, 16), (16, H - 38), (W - 38, H - 38)]:
        cv2.rectangle(sheet, (mx, my), (mx + 22, my + 22), 0, -1)
    expected = {}
    for block in tpl["fieldBlocks"].values():
        key = block["fieldLabels"][0]
        vals = block["bubbleValues"]
        ox, oy = block["origin"]
        gap = block["bubblesGap"]
        k = fill_idx if fill_idx < len(vals) else 0
        expected[key] = vals[k]
        cx, cy = int(ox + k * gap + D / 2), int(oy + D / 2)
        cv2.circle(sheet, (cx, cy), D // 2 - 1, 0, -1)

    # place on a larger canvas, scaled down, with margin + small rotation
    scale = 1.35
    cw, ch = int(W * scale) + 160, int(H * scale) + 160
    canvas = np.full((ch, cw), 255, np.uint8)
    small = cv2.resize(sheet, (int(W * scale * 0.78), int(H * scale * 0.78)))
    sh, sw = small.shape
    ox, oy = 80, 70
    canvas[oy:oy + sh, ox:ox + sw] = small
    M = cv2.getRotationMatrix2D((cw / 2, ch / 2), 2.0, 1.0)
    canvas = cv2.warpAffine(canvas, M, (cw, ch), borderValue=255)
    return canvas, expected


def run(sheet):
    tpl = json.loads((HERE / f"{sheet}-template.json").read_text())
    img, expected = render_scan(tpl, fill_idx=1)

    job = Path(tempfile.mkdtemp(prefix=f"omr-pipe-{sheet}-"))
    indir, outdir = job / "in", job / "out"
    indir.mkdir(); outdir.mkdir()
    raw = job / "raw.png"
    cv2.imwrite(str(raw), img)
    (indir / "template.json").write_text((HERE / f"{sheet}-template.json").read_text())

    reg = subprocess.run(
        [PY, str(HERE / "register_sheet.py"), str(raw), str(indir / "sheet.png"), str(HERE / f"{sheet}-template.json")],
        capture_output=True, text=True,
    )
    if reg.returncode != 0:
        print(f"[{sheet}] register failed: {reg.stderr[-400:]}"); return False
    print(f"[{sheet}] register: {reg.stdout.strip()}")

    omr = subprocess.run(
        [PY, "main.py", "-i", str(indir), "-o", str(outdir)],
        cwd=str(CHECKER_DIR), capture_output=True, text=True,
    )
    if omr.returncode != 0:
        print(f"[{sheet}] OMR failed: {omr.stderr[-400:]}"); return False

    res = list((outdir / "Results").glob("Results_*.csv"))
    if not res:
        print(f"[{sheet}] no results"); return False
    import csv
    row = list(csv.DictReader(open(res[0])))[0]
    shutil.rmtree(job, ignore_errors=True)

    ok = True
    for key in tpl["outputColumns"]:
        got = (row.get(key) or "").strip()
        if got != expected[key]:
            ok = False
            print(f"[{sheet}] {key}: expected {expected[key]!r} got {got!r}")
    print(f"[{sheet}] {len(tpl['outputColumns'])} questions -> {'ALL MATCH' if ok else 'MISMATCH'}")
    return ok


all_ok = all(run(s) for s in ["school", "student"])
print("\nPIPELINE:", "OK" if all_ok else "FAILED")
sys.exit(0 if all_ok else 2)
