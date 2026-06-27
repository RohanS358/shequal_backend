"""
Faithful render of a PRINTED sheet (bubble outlines, section bands, labels,
markers) from the layout, fill chosen options, then run the real pipeline
(register_sheet.py + OMRChecker) and print decoded vs expected.

This mimics a real scan far better than the clean synthetic test.
Run: OMRChecker/venv/Scripts/python.exe omr-assets/diagnose-real.py school
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
CHECKER_DIR = (HERE / ".." / ".." / "OMRChecker").resolve()
PY = sys.executable
sheet = sys.argv[1] if len(sys.argv) > 1 else "school"


def render(layout, tpl, fill):
    W, H = layout["page"]
    r = int(layout["bubbleR"])
    img = np.full((H, W, 3), 255, np.uint8)
    cv2.rectangle(img, (3, 3), (W - 3, H - 3), (40, 40, 40), 2)
    for (mx, my) in [(16, 16), (W - 38, 16), (16, H - 38), (W - 38, H - 38)]:
        cv2.rectangle(img, (mx, my), (mx + 22, my + 22), (20, 30, 20), -1)
    cv2.putText(img, layout["title"], (W // 3, 44), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (30, 47, 30), 2)
    for sec in layout["sections"]:
        x, y, w = sec["x"], sec["y"], sec["w"]
        cv2.rectangle(img, (x, y), (x + w, y + sec["h"]), (228, 237, 214), 1)
        cv2.rectangle(img, (x, y), (x + w, y + 30), (30, 47, 30), -1)  # dark band
        cv2.putText(img, f"{sec['letter']} {sec['title']}", (x + 12, y + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (238, 242, 220), 1)
        for q in sec["questions"]:
            tx, ty = q["textAt"]
            cv2.putText(img, f"{q['n']}. {q['text']}"[:60], (int(tx), int(ty)), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (40, 50, 40), 1)
            for b in q["bubbles"]:
                cv2.circle(img, (int(b["cx"]), int(b["cy"])), r, (45, 74, 50), 2)  # printed ring
                cv2.putText(img, b["label"][:14], (int(b["cx"]) + r + 4, int(b["cy"]) + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (40, 40, 40), 1)
    # fills (hand-drawn-ish blobs)
    expected = {}
    for sec in layout["sections"]:
        for q in sec["questions"]:
            k = fill.get(q["key"], 1)
            if k is None or k >= len(q["bubbles"]):
                expected[q["key"]] = ""
                continue
            b = q["bubbles"][k]
            cv2.circle(img, (int(b["cx"]) + 1, int(b["cy"]) - 1), r - 1, (15, 15, 15), -1)
            expected[q["key"]] = ["A", "B", "C", "D", "E", "F"][k]
    return img, expected


def main():
    layout = json.loads((HERE / f"../../LeafNode/src/data/omr-{sheet}-layout.json").read_text(encoding="utf-8"))
    tpl = json.loads((HERE / f"{sheet}-template.json").read_text(encoding="utf-8"))
    # choose a varied set of answers
    fill = {}
    for i, sec in enumerate(layout["sections"]):
        for j, q in enumerate(sec["questions"]):
            fill[q["key"]] = (i + j) % len(q["bubbles"])
    img, expected = render(layout, tpl, fill)

    # place on margined, slightly rotated canvas (mimic scan)
    H, W = img.shape[:2]
    canvas = np.full((H + 220, W + 220, 3), 255, np.uint8)
    small = cv2.resize(img, (int(W * 0.8), int(H * 0.8)))
    sh, sw = small.shape[:2]
    canvas[90:90 + sh, 100:100 + sw] = small
    # Simulate browser print header/footer chrome near the page corners.
    ch, cw = canvas.shape[:2]
    cv2.putText(canvas, "6/19/26, 11:11 PM", (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (60, 60, 60), 1)
    cv2.putText(canvas, "School Carbon Audit", (cw - 360, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (60, 60, 60), 1)
    cv2.putText(canvas, "about:blank", (30, ch - 24), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (60, 60, 60), 1)
    cv2.putText(canvas, "1/1", (cw - 70, ch - 24), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (60, 60, 60), 1)
    M = cv2.getRotationMatrix2D((canvas.shape[1] / 2, canvas.shape[0] / 2), 1.5, 1.0)
    canvas = cv2.warpAffine(canvas, M, (canvas.shape[1], canvas.shape[0]), borderValue=(255, 255, 255))

    job = Path(tempfile.mkdtemp(prefix="omr-diag-"))
    indir, outdir = job / "in", job / "out"
    indir.mkdir(); outdir.mkdir()
    raw = job / "raw.png"
    cv2.imwrite(str(raw), canvas)
    cv2.imwrite(str(HERE / f"_debug_{sheet}_scan.png"), canvas)
    (indir / "template.json").write_text((HERE / f"{sheet}-template.json").read_text(encoding="utf-8"))

    reg = subprocess.run([PY, str(HERE / "register_sheet.py"), str(raw), str(indir / "sheet.png"), str(HERE / f"{sheet}-template.json")], capture_output=True, text=True)
    print("register:", reg.stdout.strip(), reg.stderr.strip()[-200:])
    cv2.imwrite(str(HERE / f"_debug_{sheet}_registered.png"), cv2.imread(str(indir / "sheet.png")))

    omr = subprocess.run([PY, "main.py", "-i", str(indir), "-o", str(outdir)], cwd=str(CHECKER_DIR), capture_output=True, text=True)
    res = list((outdir / "Results").glob("Results_*.csv"))
    if not res:
        print("NO RESULTS\n", omr.stdout[-800:], omr.stderr[-400:]); return
    import csv
    row = list(csv.DictReader(open(res[0])))[0]

    ok = 0
    print(f"\n{'KEY':<14}{'EXPECT':<8}{'GOT':<8}")
    for sec in layout["sections"]:
        for q in sec["questions"]:
            got = (row.get(q["key"]) or "").strip()
            exp = expected[q["key"]]
            mark = "OK" if got == exp else "  <-- WRONG"
            if got == exp:
                ok += 1
            print(f"{q['key']:<14}{exp:<8}{got:<8}{mark}")
    total = sum(len(s["questions"]) for s in layout["sections"])
    print(f"\n{ok}/{total} correct. Debug images: _debug_{sheet}_scan.png, _debug_{sheet}_registered.png")


main()
