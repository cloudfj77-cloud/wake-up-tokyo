#!/usr/bin/env python3
"""把漫画页按描边切成一格一格的独立 PNG（带 alpha，斜边也能切）。

流程
 1. 提分格线：单列/单行「长连续暗段」+ Hough 长直线（限近水平/近竖直）
 2. 递归切分：用这些线把页面多边形一分为二（Sutherland–Hodgman 半平面裁剪）
 3. 每格沿多边形裁出带 alpha 的 PNG，并生成 panels.js 供网页定位
 4. 打印版式图与每格尺寸，便于人工核对

用法: python3 slice-panels.py [输入图] [输出目录]
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

INK_MAX = 95
MARGIN = 8             # 页面外白边
EXPAND = 7             # 每格向外找回描边的像素
MIN_SIDE = 55          # 成格的最小边长
MIN_AREA_RATIO = 0.006 # 成格的最小面积占比
SPAN_RATIO = 0.55      # 一条线要切穿区域的覆盖比例

# 自动检测漏掉的分格线时，在这里手工补刀（像素坐标），例如：
# MANUAL_CUTS = [((0, 560), (1080, 620)), ((820, 300), (820, 700))]
MANUAL_CUTS = []


# ---------- 基本几何 ----------
def poly_area(p):
    s = 0.0
    for i in range(len(p)):
        x0, y0 = p[i]
        x1, y1 = p[(i + 1) % len(p)]
        s += x0 * y1 - x1 * y0
    return abs(s) / 2


def poly_bbox(p):
    xs = [v[0] for v in p]
    ys = [v[1] for v in p]
    return min(xs), min(ys), max(xs), max(ys)


def point_in_poly(pt, poly):
    x, y = pt
    inside = False
    n = len(poly)
    for i in range(n):
        x0, y0 = poly[i]
        x1, y1 = poly[(i + 1) % n]
        if (y0 > y) != (y1 > y):
            xt = x0 + (y - y0) * (x1 - x0) / (y1 - y0)
            if x < xt:
                inside = not inside
    return inside


def clip_half_plane(poly, a, b, c):
    """保留 a*x + b*y + c >= 0 的部分。"""
    out = []
    n = len(poly)
    for i in range(n):
        cur, nxt = poly[i], poly[(i + 1) % n]
        dc = a * cur[0] + b * cur[1] + c
        dn = a * nxt[0] + b * nxt[1] + c
        if dc >= 0:
            out.append(cur)
        if (dc >= 0) != (dn >= 0):
            t = dc / (dc - dn)
            out.append((cur[0] + t * (nxt[0] - cur[0]), cur[1] + t * (nxt[1] - cur[1])))
    return out


def line_from_points(p0, p1):
    """返回 a,b,c 使 a*x + b*y + c = 0。"""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    a, b = -dy, dx
    n = math.hypot(a, b) or 1
    return a / n, b / n, -(a * p0[0] + b * p0[1]) / n


def chord_in_poly(poly, p0, p1, samples=400):
    """线段（向两端延长）落在多边形内的弦长。"""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dy)
    if L < 1:
        return 0.0, None, None
    ux, uy = dx / L, dy / L
    ex, ey = L * 0.6, L * 0.6
    a0 = (p0[0] - ux * ex, p0[1] - uy * ex)
    a1 = (p1[0] + ux * ex, p1[1] + uy * ey)
    span = math.hypot(a1[0] - a0[0], a1[1] - a0[1])
    t_hit = []
    for i in range(samples + 1):
        t = i / samples
        pt = (a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t)
        t_hit.append(point_in_poly(pt, poly))
    best, cur_start = 0.0, None
    for i, hit in enumerate(t_hit):
        if hit and cur_start is None:
            cur_start = i
        elif not hit and cur_start is not None:
            best = max(best, (i - cur_start) / samples * span)
            cur_start = None
    if cur_start is not None:
        best = max(best, (samples - cur_start) / samples * span)
    return best, a0, a1


def extent_along(poly, p0, p1):
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dy) or 1
    ux, uy = dx / L, dy / L
    vals = [v[0] * ux + v[1] * uy for v in poly]
    return max(vals) - min(vals)


def convex_hull(points):
    pts = sorted(set((round(x, 2), round(y, 2)) for x, y in points))
    if len(pts) <= 2:
        return pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def seam_ink(dark, s_box, o_box):
    """两块之间接缝处的墨线强度（用来判断这条缝是不是真正的分格线）。"""
    gap_x = max(0, max(s_box[0] - o_box[2], o_box[0] - s_box[2]))
    gap_y = max(0, max(s_box[1] - o_box[3], o_box[1] - s_box[3]))
    if gap_x >= gap_y:                       # 左右相邻，接缝是竖线
        x = (min(s_box[2], o_box[2]) + max(s_box[0], o_box[0])) / 2
        y0 = max(s_box[1], o_box[1])
        y1 = min(s_box[3], o_box[3])
        if y1 - y0 < 20:
            return 0.0
        return border_score(dark, (x, y0), (x, y1), band=4)
    y = (min(s_box[3], o_box[3]) + max(s_box[1], o_box[1])) / 2
    x0 = max(s_box[0], o_box[0])
    x1 = min(s_box[2], o_box[2])
    if x1 - x0 < 20:
        return 0.0
    return border_score(dark, (x0, y), (x1, y), band=4)


def merge_small(pieces, W, H, dark, max_ratio=0.03, seam_max=0.93):
    """把过切出来的碎片沿最长公共边并回相邻块（凸包合并，顺带补掉空洞）。

    两道保险：只合小于 max_ratio 的碎片；合并后包围盒不许膨胀超过 2.2 倍。
    """
    while len(pieces) > 1:
        small = min(pieces, key=lambda p: poly_area(p['poly']))
        if poly_area(small['poly']) >= max_ratio * W * H:
            break
        s_box = poly_bbox(small['poly'])
        best, best_overlap = None, 0
        for other in pieces:
            if other is small:
                continue
            o_box = poly_bbox(other['poly'])
            gap_x = max(0, max(s_box[0] - o_box[2], o_box[0] - s_box[2]))
            gap_y = max(0, max(s_box[1] - o_box[3], o_box[1] - s_box[3]))
            if max(gap_x, gap_y) > 40:          # 不相邻
                continue
            if gap_x >= gap_y:                  # 左右相邻 -> 看纵向重叠
                overlap = min(s_box[3], o_box[3]) - max(s_box[1], o_box[1])
            else:                               # 上下相邻 -> 看横向重叠
                overlap = min(s_box[2], o_box[2]) - max(s_box[0], o_box[0])
            if overlap <= best_overlap:
                continue
            if seam_ink(dark, s_box, o_box) >= seam_max:
                continue                      # 这条缝是真正的分格线，不许并
            best, best_overlap = other, overlap
        if best is None:
            break
        before = poly_bbox(best['poly'])
        area_before = (before[2] - before[0]) * (before[3] - before[1])
        hull = convex_hull(best['poly'] + small['poly'])
        hb = poly_bbox(hull)
        area_after = (hb[2] - hb[0]) * (hb[3] - hb[1])
        if area_after > area_before * 2.2:
            break
        best['poly'] = hull
        pieces.remove(small)
    return pieces


def grow_poly(poly, pad):
    """凸多边形整体外扩 pad 像素（沿顶点到重心的方向）。"""
    cx = sum(v[0] for v in poly) / len(poly)
    cy = sum(v[1] for v in poly) / len(poly)
    out = []
    for x, y in poly:
        dx, dy = x - cx, y - cy
        d = math.hypot(dx, dy) or 1
        k = pad * math.sqrt(2)
        out.append((x + dx / d * k, y + dy / d * k))
    return out


# ---------- 分格线提取 ----------
def axis_bands(dark, W, H):
    """单列/单行最长连续暗段 -> 近水平/近竖直的切线段。"""
    cuts = []

    def runs(mask, gap=6):
        idx = np.where(mask)[0]
        if len(idx) == 0:
            return []
        brk = np.where(np.diff(idx) > gap)[0]
        return [(int(s[0]), int(s[-1]) + 1) for s in np.split(idx, brk + 1)]

    rows = {}
    for y in range(H):
        for a, b in runs(dark[y]):
            if b - a >= 0.18 * W:
                rows.setdefault(y, []).append((a, b))
    cols = {}
    for x in range(W):
        for a, b in runs(dark[:, x]):
            if b - a >= 0.18 * H:
                cols.setdefault(x, []).append((a, b))
    for y, segs in sorted(rows.items()):
        a = min(s[0] for s in segs)
        b = max(s[1] for s in segs)
        cuts.append({'p0': (a, y), 'p1': (b, y), 'len': b - a})
    for x, segs in sorted(cols.items()):
        a = min(s[0] for s in segs)
        b = max(s[1] for s in segs)
        cuts.append({'p0': (x, a), 'p1': (x, b), 'len': b - a})
    return cuts


def hough_lines(gray, W, H):
    """Hough 提长直线，只保留近水平/近竖直且足够长的。"""
    mag = np.hypot(ndimage.sobel(gray, axis=1), ndimage.sobel(gray, axis=0))
    edge = mag > 90
    ys, xs = np.where(edge)
    if len(xs) < 100:
        return []
    thetas = np.deg2rad(np.concatenate([np.arange(-20, 20.01, .5), np.arange(70, 110.01, .5)]))
    step, nbins = 2, (int(math.hypot(W, H)) + 1) // 2 + 1
    cos, sin = np.cos(thetas)[:, None], np.sin(thetas)[:, None]
    bins = np.clip(((xs[None, :] * cos + ys[None, :] * sin) / step).astype(np.int32), 0, nbins - 1)
    acc = np.zeros((len(thetas), nbins), np.int32)
    for i in range(len(thetas)):
        acc[i] = np.bincount(bins[i], minlength=nbins)
    min_vote = int(0.16 * min(W, H))
    used = np.zeros_like(acc, bool)
    peaks = []
    for ti, bi in np.dstack(np.unravel_index(np.argsort(-acc.ravel())[:6000], acc.shape))[0]:
        if used[ti, bi] or acc[ti, bi] < min_vote:
            continue
        used[max(0, ti - 3):ti + 4, max(0, bi - 5):bi + 6] = True
        peaks.append((int(acc[ti, bi]), thetas[ti], bi * step))

    def longest_seg(theta, rho, gap=14):
        c, s = np.cos(theta), np.sin(theta)
        ok = np.abs(xs * c + ys * s - rho) < 1.6
        if ok.sum() < 10:
            return None
        t = np.sort(xs[ok] * (-s) + ys[ok] * c)
        segs = np.split(t, np.where(np.diff(t) > gap)[0] + 1)
        seg = max(segs, key=len)
        t0, t1 = seg[0], seg[-1]
        return (rho * c - t0 * s, rho * s + t0 * c, rho * c - t1 * s, rho * s + t1 * c, t1 - t0)

    cuts = []
    for _, th, rho in peaks:
        r = longest_seg(th, rho)
        if not r:
            continue
        x0, y0, x1, y1, L = r
        ang = math.degrees(math.atan2(y1 - y0, x1 - x0)) % 180
        near_h = min(ang, 180 - ang) <= 10
        near_v = abs(ang - 90) <= 10
        if not (near_h or near_v):
            continue
        if L < (0.6 * W if near_h else 0.5 * H):
            continue
        cuts.append({'p0': (float(x0), float(y0)), 'p1': (float(x1), float(y1)), 'len': float(L)})
    return cuts


def norm_line(p0, p1):
    """把线段归一化成 (角度°, 到原点的有符号距离)，用于按“同一条线”去重。"""
    ang = math.degrees(math.atan2(p1[1] - p0[1], p1[0] - p0[0]))
    if ang > 90:
        ang -= 180
    if ang < -90:
        ang += 180
    if abs(ang) > 45:            # 竖直线统一按 90° 族处理
        ang = 90.0 if ang > 0 else -90.0
    rad = math.radians(ang)
    rho = p0[1] * math.cos(rad) - p0[0] * math.sin(rad)
    return ang, rho


def dedupe(cuts, ang_tol=3.0, rho_tol=25):
    out = []
    for c in sorted(cuts, key=lambda c: -c['len']):
        ang, rho = norm_line(c['p0'], c['p1'])
        for o in out:
            oa, orho = norm_line(o['p0'], o['p1'])
            if abs(oa - ang) < ang_tol and abs(orho - rho) < rho_tol:
                break
        else:
            out.append(c)
    return out


def border_score(mask, p0, p1, band=5):
    """沿切线取 ±band 像素带，统计掩膜命中比例（墨线或亮缝都可用）。"""
    x0, y0 = p0
    x1, y1 = p1
    L = math.hypot(x1 - x0, y1 - y0)
    if L < 10:
        return 0.0
    n = int(L)
    ts = np.linspace(0, 1, n)
    H, W = mask.shape
    vals = []
    nx, ny = -(y1 - y0) / L, (x1 - x0) / L
    for t in ts:
        px, py = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        for k in range(-band, band + 1):
            xx, yy = int(px + nx * k), int(py + ny * k)
            if 0 <= xx < W and 0 <= yy < H:
                vals.append(mask[yy, xx])
    return float(np.mean(vals)) if vals else 0.0


# ---------- 递归切分 ----------
def split_poly(poly, cuts, W, H, dark, depth=0):
    if depth > 5:
        return [poly]
    page_area = W * H
    candidates = []
    for c in cuts:
        chord, a0, a1 = chord_in_poly(poly, c['p0'], c['p1'])
        ext = extent_along(poly, c['p0'], c['p1'])
        if ext < 1 or chord / ext < SPAN_RATIO:
            continue
        candidates.append((chord, c))
    if not candidates:
        return [poly]
    for chord, c in sorted(candidates, key=lambda t: -t[0]):
        a, b, k = line_from_points(c['p0'], c['p1'])
        left = clip_half_plane(poly, a, b, k)
        right = clip_half_plane(poly, -a, -b, -k)
        if len(left) < 3 or len(right) < 3:
            continue
        if min(poly_area(left), poly_area(right)) < MIN_AREA_RATIO * page_area * 0.5:
            continue
        # 不许切出细条：两侧要么有像样的短边，要么是贯穿整页的标题/说明条
        ok = True
        for part in (left, right):
            bx0, by0, bx1, by1 = poly_bbox(part)
            short = min(bx1 - bx0, by1 - by0)
            long = max(bx1 - bx0, by1 - by0)
            if not (short >= MIN_SIDE * 1.3 or (short >= 25 and long >= 0.5 * W)):
                ok = False
                break
        if not ok:
            continue
        remain = [x for x in cuts if x is not c]
        return (split_poly(left, remain, W, H, dark, depth + 1)
                + split_poly(right, remain, W, H, dark, depth + 1))
    return [poly]


def ascii_map(pieces, W, H, cols=76, rows=34):
    grid = [['.'] * cols for _ in range(rows)]
    for i, p in enumerate(pieces):
        ch = str(i + 1) if i < 9 else chr(ord('a') + i - 9)
        for r in range(rows):
            for c in range(cols):
                px, py = (c + .5) / cols * W, (r + .5) / rows * H
                if point_in_poly((px, py), p['poly']):
                    grid[r][c] = ch
    return '\n'.join(''.join(r) for r in grid)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else 'act1-the-loop.png'
    out_dir = sys.argv[2] if len(sys.argv) > 2 else 'panels'
    img = Image.open(src).convert('RGB')
    arr = np.asarray(img).astype(np.float32)
    H, W, _ = arr.shape
    gray = arr.mean(axis=2)
    dark = arr.max(axis=2) < INK_MAX

    raw = dedupe(axis_bands(dark, W, H) + hough_lines(gray, W, H))
    # 保留“真的是一条粗墨线”或“一条亮留白缝”的切线，且长度足够
    # （太短的竖线多是格内纹理，会把格子撕碎）
    paper = arr.min(axis=2) >= 205
    cuts = []
    for c in raw:
        c['ink'] = border_score(dark, c['p0'], c['p1'])
        c['paper'] = border_score(paper, c['p0'], c['p1'])
        if max(c['ink'], c['paper']) < 0.55:
            continue
        # 长度只做粗筛，真正说话的是“这条线在区域里切穿了多少”与墨线/亮缝校验
        if c['len'] >= 0.15 * max(W, H):
            cuts.append(c)
    for a, b in MANUAL_CUTS:
        cuts.append({'p0': tuple(a), 'p1': tuple(b),
                     'len': math.hypot(b[0] - a[0], b[1] - a[1]), 'ink': 1.0, 'paper': 0.0})

    print('== 通过校验的分格线（按长度）==')
    for c in sorted(cuts, key=lambda c: -c['len'])[:16]:
        kind = '墨线' if c['ink'] >= c['paper'] else '亮缝'
        print('  长%6.0f %s%.2f (%4.0f,%4.0f)->(%4.0f,%4.0f)'
              % (c['len'], kind, max(c['ink'], c['paper']), c['p0'][0], c['p0'][1], c['p1'][0], c['p1'][1]))
    print('  （原始候选 %d 条，保留 %d 条）' % (len(raw), len(cuts)))

    page = [(MARGIN, MARGIN), (W - MARGIN, MARGIN), (W - MARGIN, H - MARGIN), (MARGIN, H - MARGIN)]
    regions = split_poly(page, cuts, W, H, dark)

    pieces = [{'poly': poly} for poly in regions]
    pieces = merge_small(pieces, W, H, dark)
    kept = []
    for p in pieces:
        grown = grow_poly(p['poly'], EXPAND)
        x0, y0, x1, y1 = poly_bbox(grown)
        x0, y0 = max(0, int(x0)), max(0, int(y0))
        x1, y1 = min(W, int(x1)), min(H, int(y1))
        if x1 - x0 < MIN_SIDE or y1 - y0 < MIN_SIDE:
            continue
        if (x1 - x0) * (y1 - y0) < MIN_AREA_RATIO * W * H:
            continue
        kept.append({'poly': grown, 'box': (x0, y0, x1, y1)})
    pieces = kept
    pieces.sort(key=lambda p: (p['box'][1], p['box'][0]))

    print('\n== 版式图 ==')
    print(ascii_map(pieces, W, H))
    print()

    os.makedirs(out_dir, exist_ok=True)
    out = []
    for i, p in enumerate(pieces, 1):
        x0, y0, x1, y1 = p['box']
        crop = img.crop((x0, y0, x1, y1)).convert('RGBA')
        mask = Image.new('L', crop.size, 0)
        # 多边形 -> alpha（近似斜边，用加粗描边补回描边宽度）
        from PIL import ImageDraw
        dr = ImageDraw.Draw(mask)
        pts = [(x - x0, y - y0) for x, y in p['poly']]
        dr.polygon(pts, fill=255)
        dr.line(pts + [pts[0]], fill=255, width=6)
        crop.putalpha(mask)
        name = '%02d-panel.png' % i
        crop.save(os.path.join(out_dir, name))
        cx = sum(v[0] for v in p['poly']) / len(p['poly'])
        cy = sum(v[1] for v in p['poly']) / len(p['poly'])
        out.append({
            'src': out_dir + '/' + name,
            'x': round(x0 / W * 100, 3), 'y': round(y0 / H * 100, 3),
            'w': round((x1 - x0) / W * 100, 3), 'h': round((y1 - y0) / H * 100, 3),
            'cx': round(cx / W * 100, 3), 'cy': round(cy / H * 100, 3),
            'poly': [[round(v[0] / W * 100, 3), round(v[1] / H * 100, 3)] for v in p['poly']],
        })
        print('%s  %4dx%-4d at (%4d,%4d)' % (name, x1 - x0, y1 - y0, x0, y0))

    meta = {'source': os.path.basename(src), 'width': W, 'height': H, 'pieces': out}
    with open('panels.json', 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    with open('cuts.json', 'w', encoding='utf-8') as f:
        json.dump({'cuts': [{'p0': [round(c['p0'][0]), round(c['p0'][1])],
                             'p1': [round(c['p1'][0]), round(c['p1'][1])]} for c in cuts]},
                  f, ensure_ascii=False, indent=2)
    with open('panels.js', 'w', encoding='utf-8') as f:
        f.write('window.COMIC_PANELS = ' + json.dumps(meta, ensure_ascii=False) + ';\n')
    print('\n共切出 %d 格 -> panels/ + panels.js' % len(out))


if __name__ == '__main__':
    main()
