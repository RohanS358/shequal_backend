"""
Register a scanned/photographed OMR sheet to the template's exact size.

Two stages, robust to margins / browser print chrome / perspective:
  1. Lock onto the sheet's outer BORDER rectangle (the dominant 4-gon) and
     warp it to pageDimensions — this alone removes margins + surrounding text.
  2. Refine using the 4 solid corner MARKER squares for sub-pixel alignment.
Then VERIFY the markers actually landed at their expected positions; if not,
report failure so the caller can ask for a better photo (instead of returning
confidently-wrong data).

Usage:  python register_sheet.py <input_img> <output_png> <template_json>
Prints JSON: {"registered": bool, "verified": bool}
"""
import json
import sys

import cv2
import numpy as np

INSET = 27  # marker centre inset — must match the SVG sheet (16px box + 11px)


def order_corners(pts):
    pts = np.array(pts, dtype=np.float32)
    s = pts.sum(axis=1)
    d = np.diff(pts, axis=1).ravel()
    return np.array([
        pts[np.argmin(s)], pts[np.argmin(d)],
        pts[np.argmax(s)], pts[np.argmax(d)],
    ], dtype=np.float32)


def find_sheet_quad(gray):
    h, w = gray.shape
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, th = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    th = cv2.dilate(th, np.ones((3, 3), np.uint8), iterations=1)
    cnts, _ = cv2.findContours(th, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    best, ba = None, 0.2 * w * h
    for c in cnts:
        a = cv2.contourArea(c)
        if a < ba:
            continue
        peri = cv2.arcLength(c, True)
        ap = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(ap) == 4:
            ba, best = a, ap.reshape(4, 2)
    return best


def find_markers(gray):
    iw = gray.shape[1]
    _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    n, _, stats, centroids = cv2.connectedComponentsWithStats(th, 8)
    lo, hi = 0.008 * iw, 0.07 * iw
    out = []
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if not (lo <= w <= hi and lo <= h <= hi):
            continue
        if not (0.6 <= w / float(h) <= 1.6):
            continue
        if area / float(w * h) < 0.6:
            continue
        out.append((centroids[i][0], centroids[i][1]))
    return out


def pick_corner_markers(cands, iw, ih):
    if len(cands) < 4:
        return None
    corners = [(0, 0), (iw, 0), (iw, ih), (0, ih)]
    chosen = []
    for cxr, cyr in corners:
        best, bd = None, 1e18
        for c in cands:
            dd = (c[0] - cxr) ** 2 + (c[1] - cyr) ** 2
            if dd < bd:
                bd, best = dd, c
        chosen.append(best)
    if len({(round(c[0]), round(c[1])) for c in chosen}) < 4:
        return None
    return chosen


def warp(color, src_quad, W, H, dst):
    M = cv2.getPerspectiveTransform(order_corners(src_quad), dst)
    return cv2.warpPerspective(color, M, (W, H), borderValue=(255, 255, 255))


def main():
    img_path, out_path, tpl_path = sys.argv[1], sys.argv[2], sys.argv[3]
    tpl = json.load(open(tpl_path))
    W, H = tpl["pageDimensions"]
    full_dst = np.array([[0, 0], [W, 0], [W, H], [0, H]], dtype=np.float32)
    mark_dst = np.array([[INSET, INSET], [W - INSET, INSET],
                         [W - INSET, H - INSET], [INSET, H - INSET]], dtype=np.float32)

    color = cv2.imread(img_path, cv2.IMREAD_COLOR)
    if color is None:
        print(json.dumps({"registered": False, "verified": False, "error": "unreadable"}))
        sys.exit(1)
    gray = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)
    ih, iw = gray.shape
    registered = False

    # Stage 1 — coarse crop to the sheet border.
    quad = find_sheet_quad(gray)
    if quad is not None:
        color = warp(color, quad, W, H, full_dst)
        gray = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)
        registered = True

    # Stage 2 — refine with the corner markers.
    markers = pick_corner_markers(find_markers(gray), gray.shape[1], gray.shape[0])
    if markers is not None:
        color = warp(color, np.array(markers, dtype=np.float32), W, H, mark_dst)
        gray = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)
        registered = True
    elif not registered:
        color = cv2.resize(color, (W, H))
        gray = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)

    # Verify: markers should now sit at mark_dst (within tolerance).
    verified = False
    final = pick_corner_markers(find_markers(gray), W, H)
    if final is not None:
        fin = order_corners(final)
        err = float(np.max(np.linalg.norm(fin - mark_dst, axis=1)))
        verified = err <= 18.0

    cv2.imwrite(out_path, color)
    print(json.dumps({"registered": bool(registered), "verified": bool(verified)}))


if __name__ == "__main__":
    main()
