#!/usr/bin/env python3
"""
Generate two editorial-style images for HYBE India audition article.
Image 1: Thumbnail - Grand audition stage with spotlights, crowd silhouettes
Image 2: Body - Modern dance practice room with mirror, dancer silhouette, India map hint
"""

from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import random
import os
import math

random.seed(77)
np.random.seed(77)

WIDTH, HEIGHT = 1200, 675
OUTPUT_DIR = "/home/mhhan/workspace/kcl/public/images/news"


def add_grain(img_array, intensity=12):
    """Add photographic film grain noise."""
    noise = np.random.normal(0, intensity, img_array.shape).astype(np.int16)
    result = np.clip(img_array.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return result


def radial_gradient(cx, cy, w, h, radius):
    """Create a radial gradient mask centered at (cx, cy)."""
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    gradient = np.clip(1.0 - dist / radius, 0, 1)
    return gradient


def elliptical_gradient(cx, cy, w, h, rx, ry):
    """Create an elliptical gradient mask."""
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
    gradient = np.clip(1.0 - dist, 0, 1)
    return gradient


def create_vignette(w, h, strength=0.7):
    """Create a vignette darkening mask."""
    y, x = np.ogrid[:h, :w]
    cx, cy = w / 2, h / 2
    max_dist = np.sqrt(cx**2 + cy**2)
    dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    vignette = 1.0 - strength * (dist / max_dist) ** 1.5
    return np.clip(vignette, 0, 1)


def draw_light_ray(arr, x, top_y, bottom_y, base_width, color, alpha_base=40):
    """Draw a volumetric light ray."""
    h, w = arr.shape[:2]
    r_c, g_c, b_c = color
    for iy in range(max(0, top_y), min(h, bottom_y)):
        progress = (iy - top_y) / max(1, bottom_y - top_y)
        current_half_w = base_width * (1 + progress * 3.0) / 2
        alpha = alpha_base * (1 - progress * 0.6) * (0.3 + 0.7 * np.sin(progress * np.pi))
        if alpha < 1:
            continue
        left = max(0, int(x - current_half_w))
        right = min(w, int(x + current_half_w))
        for ix in range(left, right):
            dist_from_center = abs(ix - x) / max(1, current_half_w)
            falloff = (1 - dist_from_center ** 2) * alpha / 255.0
            arr[iy, ix, 0] = min(255, arr[iy, ix, 0] + r_c * falloff)
            arr[iy, ix, 1] = min(255, arr[iy, ix, 1] + g_c * falloff)
            arr[iy, ix, 2] = min(255, arr[iy, ix, 2] + b_c * falloff)


def draw_spotlight_cone(arr, source_x, source_y, target_x, target_y, base_width, color, alpha_base=50):
    """Draw a spotlight cone from source toward target with spreading beam."""
    h, w = arr.shape[:2]
    r_c, g_c, b_c = color
    dx = target_x - source_x
    dy = target_y - source_y
    length = math.sqrt(dx * dx + dy * dy)
    if length < 1:
        return
    steps = int(length)
    for step in range(steps):
        t = step / steps
        cx = source_x + dx * t
        cy = source_y + dy * t
        iy = int(cy)
        if iy < 0 or iy >= h:
            continue
        spread = base_width * (0.3 + t * 2.5)
        alpha = alpha_base * (1 - t * 0.4) * (0.4 + 0.6 * math.sin(t * math.pi))
        if alpha < 1:
            continue
        left = max(0, int(cx - spread))
        right = min(w, int(cx + spread))
        for ix in range(left, right):
            dist = abs(ix - cx) / max(1, spread)
            falloff = (1 - dist ** 2) * alpha / 255.0
            arr[iy, ix, 0] = min(255, arr[iy, ix, 0] + r_c * falloff)
            arr[iy, ix, 1] = min(255, arr[iy, ix, 1] + g_c * falloff)
            arr[iy, ix, 2] = min(255, arr[iy, ix, 2] + b_c * falloff)


# ============================================================
# IMAGE 1: THUMBNAIL -- Grand Audition Stage
# ============================================================
def generate_thumbnail():
    print("Generating thumbnail: Grand Audition Stage...")

    arr = np.zeros((HEIGHT, WIDTH, 3), dtype=np.float64)

    # Deep purple/indigo base gradient (dark ceiling to slightly lighter stage area)
    for y in range(HEIGHT):
        t = y / HEIGHT
        arr[y, :, 0] = 10 + 18 * t * 0.3      # R - subtle warmth
        arr[y, :, 1] = 4 + 6 * t * 0.2         # G - minimal
        arr[y, :, 2] = 22 + 50 * t * 0.5        # B - deep indigo/purple

    # Stage floor (starts at 60% down) - polished dark surface
    stage_y = int(HEIGHT * 0.60)
    for y in range(stage_y, HEIGHT):
        t = (y - stage_y) / (HEIGHT - stage_y)
        arr[y, :, 0] = 12 + 8 * t
        arr[y, :, 1] = 8 + 5 * t
        arr[y, :, 2] = 18 + 10 * t

    # --- Stage floor reflection lines ---
    for i in range(35):
        y_line = stage_y + int(i * (HEIGHT - stage_y) / 35)
        brightness = max(1, 14 - i * 0.4)
        if 0 <= y_line < HEIGHT:
            arr[y_line, :, 0] += brightness * 0.4
            arr[y_line, :, 1] += brightness * 0.3
            arr[y_line, :, 2] += brightness * 0.7

    # --- Central golden spotlight cone (main, converging to center stage) ---
    cx = WIDTH // 2
    cone_top = 0
    cone_bottom = int(HEIGHT * 0.82)
    for y in range(cone_top, cone_bottom):
        t = (y - cone_top) / (cone_bottom - cone_top)
        half_w_outer = 20 + 280 * t
        half_w_inner = 20 + 280 * t * 0.3

        envelope = np.sin(t * np.pi) * (1 - t * 0.15)

        for x in range(max(0, int(cx - half_w_outer)), min(WIDTH, int(cx + half_w_outer))):
            dist = abs(x - cx)
            if dist < half_w_outer:
                norm_dist = dist / half_w_outer
                falloff = (1 - norm_dist ** 1.5)
                inner_boost = max(0, 1 - dist / max(1, half_w_inner)) ** 2

                alpha_outer = 60 * envelope * falloff
                alpha_inner = 45 * envelope * inner_boost

                # Gold/amber color
                arr[y, x, 0] = min(255, arr[y, x, 0] + 255 * (alpha_outer + alpha_inner) / 255)
                arr[y, x, 1] = min(255, arr[y, x, 1] + 185 * (alpha_outer * 0.6 + alpha_inner) / 255)
                arr[y, x, 2] = min(255, arr[y, x, 2] + 50 * (alpha_outer * 0.2 + alpha_inner * 0.6) / 255)

    # --- Spotlight pool on floor (elliptical golden glow) ---
    pool_cx, pool_cy = WIDTH // 2, int(HEIGHT * 0.70)
    pool_g = elliptical_gradient(pool_cx, pool_cy, WIDTH, HEIGHT, 240, 75)
    pool_g = pool_g ** 1.2
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 180 * pool_g)
    arr[:, :, 1] = np.minimum(255, arr[:, :, 1] + 125 * pool_g)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 30 * pool_g)

    # --- Multiple converging side spotlights (purple/indigo) ---
    # Left spotlights aiming toward center
    left_spots = [
        (120, -30, 500, int(HEIGHT * 0.65)),
        (250, -30, 550, int(HEIGHT * 0.62)),
    ]
    right_spots = [
        (WIDTH - 120, -30, 700, int(HEIGHT * 0.65)),
        (WIDTH - 250, -30, 650, int(HEIGHT * 0.62)),
    ]

    for sx, sy, tx, ty in left_spots:
        draw_spotlight_cone(arr, sx, sy, tx, ty, 18, (130, 60, 210), alpha_base=35)
    for sx, sy, tx, ty in right_spots:
        draw_spotlight_cone(arr, sx, sy, tx, ty, 18, (130, 60, 210), alpha_base=35)

    # --- Additional side rays (saffron/orange accent - subtle Indian flag reference) ---
    saffron_rays_left = [60, 170]
    saffron_rays_right = [WIDTH - 60, WIDTH - 170]
    for rx in saffron_rays_left:
        draw_light_ray(arr, rx, 0, int(HEIGHT * 0.55), random.randint(8, 14),
                       (255, 140, 50), alpha_base=18)
    for rx in saffron_rays_right:
        draw_light_ray(arr, rx, 0, int(HEIGHT * 0.55), random.randint(8, 14),
                       (255, 140, 50), alpha_base=18)

    # --- Side stage lighting rays (purple/indigo) ---
    ray_positions = [100, 220, 360, 500, 700, 840, 980, 1100]
    ray_colors = [
        (110, 40, 180), (80, 50, 160), (60, 40, 200), (100, 55, 175),
        (90, 45, 190), (70, 55, 170), (85, 60, 200), (105, 45, 165),
    ]
    for rx, rc in zip(ray_positions, ray_colors):
        ray_w = random.randint(8, 18)
        alpha = random.randint(15, 32)
        draw_light_ray(arr, rx, 0, int(HEIGHT * 0.58), ray_w, rc, alpha)

    arr = np.clip(arr, 0, 255)

    # Convert to PIL for drawing audience and details
    img = Image.fromarray(arr.astype(np.uint8)).convert("RGBA")

    # --- Stage truss / rigging at top ---
    truss_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    td = ImageDraw.Draw(truss_layer)
    # Horizontal bars
    for ty in [12, 28]:
        td.line([(0, ty), (WIDTH, ty)], fill=(8, 6, 15, 140), width=4)
    # Vertical supports
    for tx in range(0, WIDTH, 80):
        td.line([(tx, 10), (tx, 32)], fill=(10, 8, 18, 120), width=3)
    # Diagonal cross-bracing
    for tx in range(0, WIDTH, 80):
        td.line([(tx, 12), (tx + 40, 28)], fill=(8, 6, 15, 60), width=2)
        td.line([(tx + 40, 12), (tx, 28)], fill=(8, 6, 15, 60), width=2)
    # Spotlight fixtures (small circles hanging from truss)
    fixture_positions = [100, 250, 450, 600, 750, 950, 1100]
    for fx in fixture_positions:
        td.line([(fx, 28), (fx, 45)], fill=(12, 10, 20, 130), width=3)
        td.ellipse([(fx - 8, 42), (fx + 8, 55)], fill=(15, 12, 22, 160))
        # Lens glow
        glow_color = random.choice([
            (255, 200, 80, 70), (180, 100, 220, 60), (255, 150, 50, 55)
        ])
        td.ellipse([(fx - 4, 46), (fx + 4, 52)], fill=glow_color)
    img = Image.alpha_composite(img, truss_layer)

    # --- Audience silhouettes in foreground ---
    aud_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ad = ImageDraw.Draw(aud_layer)
    aud_base = HEIGHT - 40

    for row in range(5):
        y_off = row * 16
        base_y = aud_base - y_off
        alpha = 230 - row * 35

        step = random.randint(20, 30)
        for x in range(0, WIDTH, step):
            hr = random.randint(8, 14)
            hx = x + random.randint(-5, 5)
            hy = base_y - hr + random.randint(-4, 4)
            # Head
            ad.ellipse([(hx - hr, hy - hr), (hx + hr, hy + hr)], fill=(3, 2, 8, alpha))
            # Shoulders
            sw = hr + random.randint(5, 12)
            ad.rectangle([(hx - sw, hy + hr - 2), (hx + sw, HEIGHT)], fill=(3, 2, 8, alpha))

        # Raised hands / phones in front rows
        if row <= 1:
            for x in range(30, WIDTH, random.randint(55, 100)):
                if random.random() > 0.5:
                    hx = x + random.randint(-6, 6)
                    hy = base_y - random.randint(30, 55)
                    # Arm
                    ad.line([(hx, base_y - 10), (hx + random.randint(-5, 5), hy)],
                            fill=(4, 3, 10, alpha - 30), width=3)
                    if random.random() > 0.5:
                        # Phone glow
                        pw, ph = random.randint(3, 6), random.randint(7, 12)
                        glow = random.choice([
                            (160, 160, 210, 50), (200, 160, 200, 45),
                            (150, 180, 200, 42), (190, 180, 160, 40),
                        ])
                        ad.rectangle([(hx - pw, hy - ph), (hx + pw, hy + ph)], fill=glow)
                    else:
                        # Open hand silhouette
                        ad.ellipse([(hx - 5, hy - 6), (hx + 5, hy + 6)],
                                   fill=(4, 3, 10, alpha - 20))

    img = Image.alpha_composite(img, aud_layer)

    # --- Atmospheric haze/fog ---
    haze_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ha = np.array(haze_layer).astype(np.float64)

    for band in range(8):
        by = int(HEIGHT * (0.18 + band * 0.08))
        bh = random.randint(45, 90)
        for y in range(max(0, by - bh), min(HEIGHT, by + bh)):
            t = 1 - abs(y - by) / bh
            a = 14 * t
            ha[y, :, 0] = np.maximum(ha[y, :, 0], 70 * t)
            ha[y, :, 1] = np.maximum(ha[y, :, 1], 40 * t)
            ha[y, :, 2] = np.maximum(ha[y, :, 2], 120 * t)
            ha[y, :, 3] = np.clip(ha[y, :, 3] + a, 0, 255)

    haze_layer = Image.fromarray(np.clip(ha, 0, 255).astype(np.uint8))
    haze_layer = haze_layer.filter(ImageFilter.GaussianBlur(radius=28))
    img = Image.alpha_composite(img, haze_layer)

    # --- Floating dust particles in spotlight ---
    dust_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dust_layer)
    for _ in range(150):
        dx = random.randint(WIDTH // 2 - 280, WIDTH // 2 + 280)
        dy = random.randint(20, int(HEIGHT * 0.78))
        cone_w_at_y = 20 + (280 * dy / (HEIGHT * 0.82))
        if abs(dx - WIDTH // 2) < cone_w_at_y:
            size = random.uniform(0.7, 2.2)
            brightness = random.randint(150, 245)
            alpha = random.randint(25, 75)
            dd.ellipse(
                [(dx - size, dy - size), (dx + size, dy + size)],
                fill=(brightness, brightness - 15, brightness - 40, alpha),
            )

    dust_layer = dust_layer.filter(ImageFilter.GaussianBlur(radius=1))
    img = Image.alpha_composite(img, dust_layer)

    # --- Top light source glow (golden) ---
    glow_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ga = np.array(glow_layer).astype(np.float64)
    glow = radial_gradient(WIDTH // 2, -60, WIDTH, HEIGHT, 400)
    ga[:, :, 0] = 255 * glow * 0.28
    ga[:, :, 1] = 200 * glow * 0.2
    ga[:, :, 2] = 100 * glow * 0.12
    ga[:, :, 3] = 55 * glow
    glow_layer = Image.fromarray(np.clip(ga, 0, 255).astype(np.uint8))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=22))
    img = Image.alpha_composite(img, glow_layer)

    # --- Subtle saffron/green/white accent bands at edges (Indian tricolor hint, very subtle) ---
    accent_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    aa = np.array(accent_layer).astype(np.float64)
    # Saffron glow top-left
    saffron_g = radial_gradient(0, 0, WIDTH, HEIGHT, 300)
    aa[:, :, 0] += 255 * saffron_g * 0.12
    aa[:, :, 1] += 130 * saffron_g * 0.06
    aa[:, :, 2] += 30 * saffron_g * 0.02
    aa[:, :, 3] += 20 * saffron_g
    # Green glow bottom-right
    green_g = radial_gradient(WIDTH, HEIGHT, WIDTH, HEIGHT, 280)
    aa[:, :, 0] += 20 * green_g * 0.03
    aa[:, :, 1] += 130 * green_g * 0.08
    aa[:, :, 2] += 40 * green_g * 0.03
    aa[:, :, 3] += 15 * green_g
    accent_layer = Image.fromarray(np.clip(aa, 0, 255).astype(np.uint8))
    accent_layer = accent_layer.filter(ImageFilter.GaussianBlur(radius=40))
    img = Image.alpha_composite(img, accent_layer)

    # --- Vignette + grain ---
    final_arr = np.array(img).astype(np.float64)
    vignette = create_vignette(WIDTH, HEIGHT, strength=0.72)
    for c in range(3):
        final_arr[:, :, c] *= vignette
    final_arr = add_grain(np.clip(final_arr, 0, 255).astype(np.uint8), intensity=8)

    result = Image.fromarray(final_arr).convert("RGB")
    out_path = os.path.join(OUTPUT_DIR, "hybe-india-audition-kpop-thumbnail.png")
    result.save(out_path, "PNG", optimize=True)
    print(f"Thumbnail saved: {out_path}")
    return out_path


# ============================================================
# IMAGE 2: BODY -- Modern Dance Practice Room
# ============================================================
def generate_body():
    print("Generating body image: Dance Practice Room...")

    arr = np.zeros((HEIGHT, WIDTH, 3), dtype=np.float64)

    # Cool blue/cyan gradient for walls and ceiling
    floor_y = int(HEIGHT * 0.58)
    for y in range(floor_y):
        t = y / floor_y
        arr[y, :, 0] = 10 + 8 * t       # R
        arr[y, :, 1] = 18 + 20 * t       # G - cool cyan
        arr[y, :, 2] = 35 + 30 * t       # B - blue dominant

    # Polished light hardwood floor
    for y in range(floor_y, HEIGHT):
        t = (y - floor_y) / (HEIGHT - floor_y)
        arr[y, :, 0] = 32 + 18 * (1 - t)
        arr[y, :, 1] = 28 + 14 * (1 - t)
        arr[y, :, 2] = 22 + 8 * (1 - t)

    # --- Wood grain texture on floor ---
    for i in range(55):
        y_line = floor_y + int(i * (HEIGHT - floor_y) / 55)
        if 0 <= y_line < HEIGHT:
            grain_bright = random.uniform(0.2, 0.9) * 7
            arr[y_line, :, 0] += grain_bright * 0.9
            arr[y_line, :, 1] += grain_bright * 0.7
            arr[y_line, :, 2] += grain_bright * 0.35

    # Perspective lines on floor
    vp_x, vp_y = int(WIDTH * 0.5), floor_y - 20
    img_pil = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")
    draw = ImageDraw.Draw(img_pil)
    for i in range(25):
        x_bot = int(i * WIDTH / 25)
        alpha = random.randint(3, 8)
        draw.line([(x_bot, HEIGHT), (vp_x, vp_y)], fill=(42, 36, 28, alpha))

    # --- Full mirror wall on left side ---
    mirror_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    md = ImageDraw.Draw(mirror_layer)
    wall_right = int(WIDTH * 0.62)

    # Wall base color
    for y in range(0, floor_y):
        t_y = y / floor_y
        base = 18 + int(8 * t_y)
        md.line([(0, y), (wall_right, y)], fill=(base, base + 4, base + 10, 240))

    # Large mirror panels spanning the wall
    mirror_panels = [
        (20, 18, 190, floor_y - 6),
        (200, 18, 370, floor_y - 6),
        (380, 18, 550, floor_y - 6),
        (560, 18, wall_right - 15, floor_y - 6),
    ]
    for mx1, my1, mx2, my2 in mirror_panels:
        # Mirror glass - cool cyan-blue reflection
        for y in range(my1, my2):
            t = (y - my1) / (my2 - my1)
            r = int(14 + 10 * t)
            g = int(22 + 18 * t)
            b = int(38 + 22 * t)
            md.line([(mx1, y), (mx2, y)], fill=(r, g, b, 215))

        # Frame
        md.rectangle([(mx1, my1), (mx2, my2)], outline=(52, 50, 58, 190), width=2)

        # Subtle horizontal reflection band
        hl_y = my1 + int((my2 - my1) * 0.38)
        for dy in range(-18, 18):
            a = int(15 * (1 - abs(dy) / 18))
            md.line([(mx1 + 6, hl_y + dy), (mx2 - 6, hl_y + dy)], fill=(50, 58, 75, a))

    img_pil = Image.alpha_composite(img_pil, mirror_layer)

    # --- Dancer silhouette (center-right of frame) ---
    dancer_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    dd = ImageDraw.Draw(dancer_layer)

    d_cx = int(WIDTH * 0.72)
    d_base = floor_y  # feet at floor level

    # Silhouette color - very dark, near-black
    sil = (5, 3, 10, 220)
    sil_light = (5, 3, 10, 200)

    # --- Dynamic dance pose: one leg extended, arms raised ---
    # Head
    head_cy = d_base - 175
    head_cx = d_cx - 5
    dd.ellipse([(head_cx - 12, head_cy - 14), (head_cx + 12, head_cy + 12)], fill=sil)

    # Neck
    dd.line([(head_cx, head_cy + 12), (head_cx + 2, head_cy + 24)], fill=sil, width=5)

    # Torso (slightly angled)
    torso_top = head_cy + 22
    torso_bottom = d_base - 90
    dd.polygon([
        (d_cx - 16, torso_top), (d_cx + 18, torso_top),
        (d_cx + 14, torso_bottom), (d_cx - 12, torso_bottom)
    ], fill=sil)

    # Left arm raised high (reaching up)
    arm_l_pts = [(d_cx - 14, torso_top + 5), (d_cx - 35, torso_top - 20),
                 (d_cx - 50, head_cy - 30), (d_cx - 55, head_cy - 55)]
    for i in range(len(arm_l_pts) - 1):
        dd.line([arm_l_pts[i], arm_l_pts[i + 1]], fill=sil, width=5)

    # Right arm extended to side
    arm_r_pts = [(d_cx + 16, torso_top + 5), (d_cx + 50, torso_top + 15),
                 (d_cx + 85, torso_top + 8), (d_cx + 110, torso_top - 5)]
    for i in range(len(arm_r_pts) - 1):
        dd.line([arm_r_pts[i], arm_r_pts[i + 1]], fill=sil, width=5)

    # Left leg (standing, slightly bent)
    hip_y = torso_bottom
    knee_l_x, knee_l_y = d_cx - 5, d_base - 48
    foot_l_x, foot_l_y = d_cx - 8, d_base
    dd.line([(d_cx - 8, hip_y), (knee_l_x, knee_l_y)], fill=sil, width=7)
    dd.line([(knee_l_x, knee_l_y), (foot_l_x, foot_l_y)], fill=sil, width=6)

    # Right leg extended back
    knee_r_x, knee_r_y = d_cx + 35, d_base - 55
    foot_r_x, foot_r_y = d_cx + 70, d_base - 35
    dd.line([(d_cx + 10, hip_y), (knee_r_x, knee_r_y)], fill=sil_light, width=7)
    dd.line([(knee_r_x, knee_r_y), (foot_r_x, foot_r_y)], fill=sil_light, width=6)

    # --- Rim light on silhouette edges (warm amber from back) ---
    rim_color = (180, 120, 50, 55)
    dd.line([(d_cx + 18, torso_top), (d_cx + 14, torso_bottom)], fill=rim_color, width=2)
    dd.arc([(head_cx - 12, head_cy - 14), (head_cx + 12, head_cy + 12)],
           start=-60, end=60, fill=(180, 120, 50, 45), width=2)

    img_pil = Image.alpha_composite(img_pil, dancer_layer)

    # --- Reflection of dancer in mirror (fainter, mirrored) ---
    reflect_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    rd = ImageDraw.Draw(reflect_layer)

    # Reflected position (mirror is on the left wall, so reflection appears offset)
    r_cx = int(WIDTH * 0.38)  # reflected X position
    r_sil = (8, 6, 18, 90)  # fainter
    r_sil_light = (8, 6, 18, 75)

    r_head_cy = d_base - 175
    r_head_cx = r_cx + 5  # mirrored

    rd.ellipse([(r_head_cx - 11, r_head_cy - 13), (r_head_cx + 11, r_head_cy + 11)], fill=r_sil)
    rd.line([(r_head_cx, r_head_cy + 11), (r_head_cx - 2, r_head_cy + 23)], fill=r_sil, width=4)

    r_torso_top = r_head_cy + 21
    r_torso_bottom = d_base - 90
    rd.polygon([
        (r_cx + 15, r_torso_top), (r_cx - 17, r_torso_top),
        (r_cx - 13, r_torso_bottom), (r_cx + 11, r_torso_bottom)
    ], fill=r_sil)

    # Reflected arms (mirrored)
    r_arm_l = [(r_cx + 13, r_torso_top + 5), (r_cx + 34, r_torso_top - 20),
               (r_cx + 49, r_head_cy - 30), (r_cx + 54, r_head_cy - 55)]
    for i in range(len(r_arm_l) - 1):
        rd.line([r_arm_l[i], r_arm_l[i + 1]], fill=r_sil, width=4)

    r_arm_r = [(r_cx - 15, r_torso_top + 5), (r_cx - 49, r_torso_top + 15),
               (r_cx - 84, r_torso_top + 8), (r_cx - 109, r_torso_top - 5)]
    for i in range(len(r_arm_r) - 1):
        rd.line([r_arm_r[i], r_arm_r[i + 1]], fill=r_sil, width=4)

    # Reflected legs
    r_knee_l = (r_cx + 4, d_base - 48)
    r_foot_l = (r_cx + 7, d_base)
    rd.line([(r_cx + 7, r_torso_bottom), r_knee_l], fill=r_sil, width=6)
    rd.line([r_knee_l, r_foot_l], fill=r_sil, width=5)

    r_knee_r = (r_cx - 34, d_base - 55)
    r_foot_r = (r_cx - 69, d_base - 35)
    rd.line([(r_cx - 9, r_torso_bottom), r_knee_r], fill=r_sil_light, width=6)
    rd.line([r_knee_r, r_foot_r], fill=r_sil_light, width=5)

    img_pil = Image.alpha_composite(img_pil, reflect_layer)

    # --- Abstract geometric India map hint (right wall area) ---
    geo_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    gd = ImageDraw.Draw(geo_layer)

    # Abstract triangular/diamond shapes suggesting India's shape
    # Very subtle, like a logo or design element on the right wall
    map_cx = int(WIDTH * 0.88)
    map_top = int(HEIGHT * 0.12)
    map_bottom = int(HEIGHT * 0.45)

    # Simplified abstract India outline using geometric shapes
    # Main body (inverted triangle tapering to south)
    india_points = [
        (map_cx - 30, map_top),          # NW
        (map_cx + 25, map_top),           # NE
        (map_cx + 35, map_top + 40),      # E upper
        (map_cx + 30, map_top + 90),      # E mid
        (map_cx + 15, map_top + 140),     # E lower
        (map_cx + 5, map_bottom),          # S tip
        (map_cx - 10, map_top + 140),     # W lower
        (map_cx - 25, map_top + 90),      # W mid
        (map_cx - 35, map_top + 40),      # W upper
    ]
    # Draw as subtle wireframe
    for i in range(len(india_points)):
        p1 = india_points[i]
        p2 = india_points[(i + 1) % len(india_points)]
        gd.line([p1, p2], fill=(60, 80, 120, 25), width=1)

    # A few internal lines (like a globe grid)
    for offset in range(0, 170, 35):
        y_line = map_top + offset
        # Find intersections with polygon at this y (approximate)
        gd.line([(map_cx - 30, y_line), (map_cx + 30, y_line)], fill=(50, 70, 110, 18), width=1)
    for offset in range(-30, 35, 15):
        x_line = map_cx + offset
        gd.line([(x_line, map_top), (x_line, map_bottom)], fill=(50, 70, 110, 15), width=1)

    # Small dot markers (like cities)
    city_dots = [
        (map_cx - 5, map_top + 30),    # Delhi area
        (map_cx + 10, map_top + 65),    # Kolkata area
        (map_cx - 15, map_top + 100),   # Mumbai area
        (map_cx + 5, map_top + 130),    # Chennai area
    ]
    for cx, cy in city_dots:
        for r in range(6, 0, -1):
            a = int(22 * (1 - r / 6))
            gd.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=(100, 140, 200, a))
        gd.ellipse([(cx - 2, cy - 2), (cx + 2, cy + 2)], fill=(80, 120, 180, 35))

    img_pil = Image.alpha_composite(img_pil, geo_layer)

    # --- Warm amber accent lights (ceiling-mounted) ---
    amber_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    aa = np.array(amber_layer).astype(np.float64)

    # Amber accent from right side
    amber_g = radial_gradient(int(WIDTH * 0.85), 0, WIDTH, HEIGHT, 350)
    aa[:, :, 0] += 200 * amber_g * 0.15
    aa[:, :, 1] += 130 * amber_g * 0.08
    aa[:, :, 2] += 40 * amber_g * 0.03
    aa[:, :, 3] += 30 * amber_g

    # Additional amber from back center
    amber_g2 = radial_gradient(int(WIDTH * 0.5), -40, WIDTH, HEIGHT, 300)
    aa[:, :, 0] += 180 * amber_g2 * 0.1
    aa[:, :, 1] += 120 * amber_g2 * 0.06
    aa[:, :, 2] += 35 * amber_g2 * 0.02
    aa[:, :, 3] += 22 * amber_g2

    amber_layer = Image.fromarray(np.clip(aa, 0, 255).astype(np.uint8))
    amber_layer = amber_layer.filter(ImageFilter.GaussianBlur(radius=20))
    img_pil = Image.alpha_composite(img_pil, amber_layer)

    # --- Cool blue ambient light (overhead fluorescents) ---
    cool_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ca = np.array(cool_layer).astype(np.float64)
    for lx in [200, 480]:
        rg = radial_gradient(lx, -20, WIDTH, HEIGHT, 350)
        ca[:, :, 0] += 20 * rg * 0.2
        ca[:, :, 1] += 50 * rg * 0.3
        ca[:, :, 2] += 80 * rg * 0.35
        ca[:, :, 3] += 20 * rg
    cool_layer = Image.fromarray(np.clip(ca, 0, 255).astype(np.uint8))
    cool_layer = cool_layer.filter(ImageFilter.GaussianBlur(radius=18))
    img_pil = Image.alpha_composite(img_pil, cool_layer)

    # --- Floor reflections (subtle light bounce) ---
    floor_reflect = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    fa = np.array(floor_reflect).astype(np.float64)
    # Amber floor patch under dancer
    fl_g = elliptical_gradient(int(WIDTH * 0.72), int(HEIGHT * 0.72), WIDTH, HEIGHT, 120, 50)
    fa[:, :, 0] += 100 * fl_g * 0.15
    fa[:, :, 1] += 70 * fl_g * 0.1
    fa[:, :, 2] += 25 * fl_g * 0.05
    fa[:, :, 3] += 18 * fl_g
    floor_reflect = Image.fromarray(np.clip(fa, 0, 255).astype(np.uint8))
    floor_reflect = floor_reflect.filter(ImageFilter.GaussianBlur(radius=15))
    img_pil = Image.alpha_composite(img_pil, floor_reflect)

    # --- Atmospheric haze ---
    haze_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ha = np.array(haze_layer).astype(np.float64)
    for band in range(5):
        by = int(HEIGHT * (0.20 + band * 0.10))
        bh = random.randint(50, 90)
        for y in range(max(0, by - bh), min(HEIGHT, by + bh)):
            t = 1 - abs(y - by) / bh
            ha[y, :, 0] = np.maximum(ha[y, :, 0], 25 * t)
            ha[y, :, 1] = np.maximum(ha[y, :, 1], 45 * t)
            ha[y, :, 2] = np.maximum(ha[y, :, 2], 60 * t)
            ha[y, :, 3] = np.clip(ha[y, :, 3] + 10 * t, 0, 255)
    haze_layer = Image.fromarray(np.clip(ha, 0, 255).astype(np.uint8))
    haze_layer = haze_layer.filter(ImageFilter.GaussianBlur(radius=26))
    img_pil = Image.alpha_composite(img_pil, haze_layer)

    # --- Floating dust in light ---
    dust_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    dust_d = ImageDraw.Draw(dust_layer)
    for _ in range(90):
        dx = random.randint(int(WIDTH * 0.3), int(WIDTH * 0.9))
        dy = random.randint(int(HEIGHT * 0.08), int(HEIGHT * 0.65))
        size = random.uniform(0.5, 1.8)
        brightness = random.randint(140, 220)
        alpha = random.randint(18, 50)
        dust_d.ellipse([(dx - size, dy - size), (dx + size, dy + size)],
                       fill=(brightness, brightness - 20, brightness - 50, alpha))
    dust_layer = dust_layer.filter(ImageFilter.GaussianBlur(radius=1))
    img_pil = Image.alpha_composite(img_pil, dust_layer)

    # --- Vignette + grain ---
    final_arr = np.array(img_pil).astype(np.float64)
    vignette = create_vignette(WIDTH, HEIGHT, strength=0.65)
    for c in range(3):
        final_arr[:, :, c] *= vignette
    final_arr = add_grain(np.clip(final_arr, 0, 255).astype(np.uint8), intensity=9)

    result = Image.fromarray(final_arr).convert("RGB")
    out_path = os.path.join(OUTPUT_DIR, "hybe-india-audition-kpop-1.png")
    result.save(out_path, "PNG", optimize=True)
    print(f"Body image saved: {out_path}")
    return out_path


if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    thumb = generate_thumbnail()
    body = generate_body()

    for path in [thumb, body]:
        size = os.path.getsize(path)
        print(f"{os.path.basename(path)}: {size:,} bytes ({size / 1024:.1f} KB)")
        assert size > 10240, f"File too small: {path} ({size} bytes)"

    print("\nDone! Both images generated successfully.")
