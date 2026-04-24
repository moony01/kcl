#!/usr/bin/env python3
"""
Generate replacement images for 5 blurry/incomplete articles.
PIL + numpy infographic style, 1200x675 per image.

Articles:
  1. hybe-bang-arrest-warrant
  2. bigbang-august-tour
  3. nct-wish-cortis-clash
  4. idle-us-tour-cancelled
  5. taemin-coachella-first
"""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np
import random
import os
import math

random.seed(42)
np.random.seed(42)

WIDTH, HEIGHT = 1200, 675
OUTPUT_DIR = "/home/mhhan/workspace/kcl/public/images/news"

FONT_BLACK = "/usr/share/fonts/truetype/lato/Lato-Black.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/lato/Lato-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/lato/Lato-Regular.ttf"


# ============================================================
# SHARED UTILITIES
# ============================================================

def add_grain(img_array, intensity=12):
    noise = np.random.normal(0, intensity, img_array.shape).astype(np.int16)
    result = np.clip(img_array.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return result


def radial_gradient(cx, cy, w, h, radius):
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    gradient = np.clip(1.0 - dist / radius, 0, 1)
    return gradient


def elliptical_gradient(cx, cy, w, h, rx, ry):
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
    gradient = np.clip(1.0 - dist, 0, 1)
    return gradient


def create_vignette(w, h, strength=0.7):
    y, x = np.ogrid[:h, :w]
    cx, cy = w / 2, h / 2
    max_dist = np.sqrt(cx**2 + cy**2)
    dist = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    vignette = 1.0 - strength * (dist / max_dist) ** 1.5
    return np.clip(vignette, 0, 1)


def apply_vignette_and_grain(img_pil, vignette_strength=0.65, grain_intensity=9):
    final_arr = np.array(img_pil.convert("RGB")).astype(np.float64)
    vignette = create_vignette(WIDTH, HEIGHT, strength=vignette_strength)
    for c in range(3):
        final_arr[:, :, c] *= vignette
    final_arr = add_grain(np.clip(final_arr, 0, 255).astype(np.uint8), intensity=grain_intensity)
    return Image.fromarray(final_arr)


def make_gradient_bg(color_top, color_bottom):
    """Simple vertical gradient background."""
    arr = np.zeros((HEIGHT, WIDTH, 3), dtype=np.float64)
    for y in range(HEIGHT):
        t = y / HEIGHT
        for c in range(3):
            arr[y, :, c] = color_top[c] * (1 - t) + color_bottom[c] * t
    return arr


def draw_centered_text(draw, text, y, font_path, size, color, max_width=None):
    """Draw text centered horizontally."""
    try:
        font = ImageFont.truetype(font_path, size)
    except Exception:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    x = (WIDTH - text_w) // 2
    draw.text((x, y), text, font=font, fill=color)
    return bbox[3] - bbox[1]  # return height


def draw_text_shadow(draw, text, pos, font_path, size, color, shadow_color=(0, 0, 0, 140), offset=3):
    """Draw text with drop shadow."""
    try:
        font = ImageFont.truetype(font_path, size)
    except Exception:
        font = ImageFont.load_default()
    sx, sy = pos[0] + offset, pos[1] + offset
    draw.text((sx, sy), text, font=font, fill=shadow_color)
    draw.text(pos, text, font=font, fill=color)


def draw_rect_with_alpha(img_pil, x1, y1, x2, y2, color_rgba):
    """Draw semi-transparent rectangle."""
    overlay = Image.new("RGBA", img_pil.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle([(x1, y1), (x2, y2)], fill=color_rgba)
    return Image.alpha_composite(img_pil.convert("RGBA"), overlay)


def add_diagonal_lines(img_pil, spacing=40, color=(255, 255, 255, 15), width=1):
    """Add subtle diagonal pattern."""
    overlay = Image.new("RGBA", img_pil.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i in range(-HEIGHT, WIDTH + HEIGHT, spacing):
        od.line([(i, 0), (i + HEIGHT, HEIGHT)], fill=color, width=width)
    return Image.alpha_composite(img_pil.convert("RGBA"), overlay)


def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


# ============================================================
# 1. HYBE-BANG-ARREST-WARRANT
# ============================================================

def gen_hybe_bang_thumbnail():
    """Dark crimson/charcoal — legal gravity, crisis mood."""
    # Deep dark background gradient (near-black to deep crimson)
    arr = make_gradient_bg((12, 4, 8), (45, 8, 12))

    # Add dark red accent radial from top-center
    rg = radial_gradient(WIDTH // 2, 0, WIDTH, HEIGHT, 500)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 80 * rg)
    arr[:, :, 1] = np.minimum(255, arr[:, :, 1] + 10 * rg)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 10 * rg)

    # Bottom darker pool
    rg2 = radial_gradient(WIDTH // 2, HEIGHT, WIDTH, HEIGHT, 600)
    arr[:, :, 0] = np.maximum(0, arr[:, :, 0] - 20 * rg2)

    arr = np.clip(arr, 0, 255)
    img = Image.fromarray(arr.astype(np.uint8)).convert("RGBA")

    # Subtle diagonal lines texture
    img = add_diagonal_lines(img, spacing=55, color=(200, 50, 50, 10))

    # Wide dark overlay band in center for text
    img = draw_rect_with_alpha(img, 0, 170, WIDTH, 505, (0, 0, 0, 100))

    # Top thin red accent bar
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle([(0, 0), (WIDTH, 5)], fill=(220, 30, 40, 200))
    od.rectangle([(0, 8), (WIDTH, 10)], fill=(180, 20, 30, 120))
    img = Image.alpha_composite(img, overlay)

    draw = ImageDraw.Draw(img)

    # Label chip
    label_font = get_font(FONT_BOLD, 24)
    chip_text = "  BREAKING  "
    bbox = draw.textbbox((0, 0), chip_text, font=label_font)
    chip_w = bbox[2] - bbox[0] + 20
    chip_x = (WIDTH - chip_w) // 2
    chip_y = 148
    draw.rectangle([(chip_x, chip_y), (chip_x + chip_w, chip_y + 36)], fill=(200, 30, 40, 230))
    draw.text((chip_x + 10, chip_y + 6), chip_text.strip(), font=label_font, fill=(255, 255, 255, 255))

    # Main headline
    headline_font = get_font(FONT_BLACK, 90)
    line1 = "ARREST"
    line2 = "WARRANT"
    bbox1 = draw.textbbox((0, 0), line1, font=headline_font)
    bbox2 = draw.textbbox((0, 0), line2, font=headline_font)
    x1 = (WIDTH - (bbox1[2] - bbox1[0])) // 2
    x2 = (WIDTH - (bbox2[2] - bbox2[0])) // 2

    # Shadow
    draw.text((x1 + 4, 204), line1, font=headline_font, fill=(0, 0, 0, 160))
    draw.text((x2 + 4, 304), line2, font=headline_font, fill=(0, 0, 0, 160))
    draw.text((x1, 200), line1, font=headline_font, fill=(240, 50, 60, 255))
    draw.text((x2, 300), line2, font=headline_font, fill=(255, 255, 255, 255))

    # Sub line
    sub_font = get_font(FONT_BOLD, 36)
    sub = "BANG SI-HYUK · HYBE CHAIRMAN"
    bbox_s = draw.textbbox((0, 0), sub, font=sub_font)
    xs = (WIDTH - (bbox_s[2] - bbox_s[0])) // 2
    draw.text((xs, 412), sub, font=sub_font, fill=(200, 200, 200, 230))

    # Key facts row
    facts_font = get_font(FONT_BLACK, 48)
    detail_font = get_font(FONT_REGULAR, 22)

    # Three fact boxes
    facts = [
        ("200B WON", "Alleged gain"),
        ("APR 21", "2026"),
        ("HYBE IPO", "Pre-listing"),
    ]
    box_w = 280
    total_w = box_w * 3 + 40
    start_x = (WIDTH - total_w) // 2

    for i, (main, sub_txt) in enumerate(facts):
        bx = start_x + i * (box_w + 20)
        by = 480
        # Box
        overlay2 = Image.new("RGBA", img.size, (0, 0, 0, 0))
        od2 = ImageDraw.Draw(overlay2)
        od2.rectangle([(bx, by), (bx + box_w, by + 100)], fill=(180, 20, 30, 60))
        od2.rectangle([(bx, by), (bx + box_w, by + 3)], fill=(220, 40, 50, 200))
        img = Image.alpha_composite(img, overlay2)
        draw = ImageDraw.Draw(img)

        bbox_m = draw.textbbox((0, 0), main, font=facts_font)
        mx = bx + (box_w - (bbox_m[2] - bbox_m[0])) // 2
        draw.text((mx, by + 12), main, font=facts_font, fill=(255, 230, 80, 255))
        bbox_d = draw.textbbox((0, 0), sub_txt, font=detail_font)
        dx = bx + (box_w - (bbox_d[2] - bbox_d[0])) // 2
        draw.text((dx, by + 68), sub_txt, font=detail_font, fill=(180, 180, 180, 200))

    # Bottom tag
    tag_font = get_font(FONT_REGULAR, 20)
    draw.text((20, HEIGHT - 30), "KCL · K-POP CULTURE LENS · BUSINESS", font=tag_font, fill=(120, 80, 80, 180))

    result = apply_vignette_and_grain(img, vignette_strength=0.70, grain_intensity=8)
    out_path = os.path.join(OUTPUT_DIR, "hybe-bang-arrest-warrant-thumbnail.png")
    result.save(out_path, "PNG", optimize=True)
    print(f"Saved: {out_path}")
    return out_path


def gen_hybe_bang_body():
    """Darker split composition — warrant vs BTS tour collision."""
    # Split background: left dark red, right dark navy
    arr = np.zeros((HEIGHT, WIDTH, 3), dtype=np.float64)
    split_x = WIDTH // 2
    for y in range(HEIGHT):
        t = y / HEIGHT
        for x in range(WIDTH):
            if x < split_x:
                # Dark crimson side
                arr[y, x, 0] = 20 + 30 * (1 - t)
                arr[y, x, 1] = 4 + 5 * (1 - t)
                arr[y, x, 2] = 6 + 8 * (1 - t)
            else:
                # Dark navy side
                arr[y, x, 0] = 6 + 10 * t
                arr[y, x, 1] = 10 + 18 * (1 - t)
                arr[y, x, 2] = 25 + 40 * (1 - t)

    # Center glare line
    for y in range(HEIGHT):
        for dx in range(-3, 4):
            xi = split_x + dx
            if 0 <= xi < WIDTH:
                alpha = max(0, 1 - abs(dx) / 4)
                arr[y, xi, 0] = min(255, arr[y, xi, 0] + 200 * alpha)
                arr[y, xi, 1] = min(255, arr[y, xi, 1] + 100 * alpha)
                arr[y, xi, 2] = min(255, arr[y, xi, 2] + 50 * alpha)

    arr = np.clip(arr, 0, 255)
    img = Image.fromarray(arr.astype(np.uint8)).convert("RGBA")

    # Left side: overlay tint
    img = draw_rect_with_alpha(img, 0, 0, split_x, HEIGHT, (100, 10, 15, 40))
    # Right side: overlay tint
    img = draw_rect_with_alpha(img, split_x, 0, WIDTH, HEIGHT, (10, 30, 80, 40))

    # Subtle diagonal lines on both sides
    img = add_diagonal_lines(img, spacing=45, color=(255, 100, 100, 8))

    draw = ImageDraw.Draw(img)

    # Left panel: GOVERNANCE RISK
    label_font = get_font(FONT_BOLD, 22)
    draw.text((60, 80), "GOVERNANCE RISK", font=label_font, fill=(220, 60, 70, 230))

    big_font = get_font(FONT_BLACK, 68)
    left_lines = ["WARRANT", "FILED"]
    for i, line in enumerate(left_lines):
        bbox = draw.textbbox((0, 0), line, font=big_font)
        draw.text((62, 128 + i * 80), line, font=big_font, fill=(240, 60, 70, 255))

    mid_font = get_font(FONT_BOLD, 30)
    draw.text((62, 300), "Capital Markets Act", font=mid_font, fill=(200, 180, 100, 220))
    draw.text((62, 340), "Fraudulent unfair trading", font=mid_font, fill=(180, 180, 180, 200))

    facts2_font = get_font(FONT_BLACK, 42)
    detail2_font = get_font(FONT_REGULAR, 20)
    draw.text((62, 410), "₩200,000,000,000", font=facts2_font, fill=(255, 220, 60, 255))
    draw.text((62, 460), "Alleged post-IPO gain (30% share)", font=detail2_font, fill=(160, 160, 160, 200))
    draw.text((62, 495), "Pre-IPO investor deception alleged", font=detail2_font, fill=(160, 160, 160, 200))
    draw.text((62, 525), "Investigation since 2019 events", font=detail2_font, fill=(160, 160, 160, 200))

    # Divider line
    overlay3 = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od3 = ImageDraw.Draw(overlay3)
    od3.line([(split_x, 60), (split_x, HEIGHT - 60)], fill=(255, 180, 100, 150), width=2)
    img = Image.alpha_composite(img, overlay3)
    draw = ImageDraw.Draw(img)

    # Right panel: BTS TOUR
    draw.text((split_x + 50, 80), "COMEBACK NARRATIVE", font=label_font, fill=(80, 150, 220, 230))

    right_big = get_font(FONT_BLACK, 68)
    right_lines = ["BTS", "U.S. TOUR"]
    for i, line in enumerate(right_lines):
        draw.text((split_x + 50, 128 + i * 80), line, font=right_big, fill=(100, 180, 255, 255))

    draw.text((split_x + 50, 300), "HYBE's biggest Q2 driver", font=mid_font, fill=(200, 180, 100, 220))
    draw.text((split_x + 50, 340), "Starting Tampa, late April", font=mid_font, fill=(180, 180, 180, 200))

    draw.text((split_x + 50, 410), "LISTED COMPANY", font=facts2_font, fill=(80, 200, 255, 255))
    draw.text((split_x + 50, 460), "Governance > artist comeback", font=detail2_font, fill=(160, 160, 160, 200))
    draw.text((split_x + 50, 495), "Founder concentration risk exposed", font=detail2_font, fill=(160, 160, 160, 200))
    draw.text((split_x + 50, 525), "Key-man risk now in public record", font=detail2_font, fill=(160, 160, 160, 200))

    # VS badge in center
    vs_overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    vsd = ImageDraw.Draw(vs_overlay)
    badge_cx = split_x
    badge_cy = HEIGHT // 2 + 20
    for r in range(50, 0, -1):
        a = int(180 * (1 - r / 50))
        vsd.ellipse([(badge_cx - r, badge_cy - r), (badge_cx + r, badge_cy + r)], fill=(30, 20, 10, a))
    img = Image.alpha_composite(img, vs_overlay)
    draw = ImageDraw.Draw(img)
    vs_font = get_font(FONT_BLACK, 36)
    bbox_vs = draw.textbbox((0, 0), "VS", font=vs_font)
    vx = badge_cx - (bbox_vs[2] - bbox_vs[0]) // 2
    vy = badge_cy - (bbox_vs[3] - bbox_vs[1]) // 2
    draw.text((vx, vy), "VS", font=vs_font, fill=(255, 200, 60, 255))

    # Bottom bar
    img = draw_rect_with_alpha(img, 0, HEIGHT - 45, WIDTH, HEIGHT, (0, 0, 0, 140))
    draw = ImageDraw.Draw(img)
    tag_font = get_font(FONT_REGULAR, 20)
    draw.text((20, HEIGHT - 32), "KCL · K-POP CULTURE LENS · April 21, 2026", font=tag_font, fill=(140, 120, 120, 200))
    right_tag = "HYBE · Bang Si-hyuk · Governance Crisis"
    bbox_rt = draw.textbbox((0, 0), right_tag, font=tag_font)
    draw.text((WIDTH - (bbox_rt[2] - bbox_rt[0]) - 20, HEIGHT - 32), right_tag, font=tag_font, fill=(140, 140, 160, 200))

    result = apply_vignette_and_grain(img, vignette_strength=0.60, grain_intensity=8)
    out_path = os.path.join(OUTPUT_DIR, "hybe-bang-arrest-warrant-1.png")
    result.save(out_path, "PNG", optimize=True)
    print(f"Saved: {out_path}")
    return out_path


# ============================================================
# 2. BIGBANG-AUGUST-TOUR
# ============================================================

def gen_bigbang_thumbnail():
    """Gold/amber warm festival energy — Coachella desert sunset."""
    arr = make_gradient_bg((8, 6, 18), (35, 18, 5))

    # Golden radial from top-center (spotlight)
    rg = radial_gradient(WIDTH // 2, -80, WIDTH, HEIGHT, 600)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 180 * rg)
    arr[:, :, 1] = np.minimum(255, arr[:, :, 1] + 100 * rg)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 20 * rg)

    # Warm amber pool in lower center
    pool = elliptical_gradient(WIDTH // 2, int(HEIGHT * 0.75), WIDTH, HEIGHT, 300, 120)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 120 * pool)
    arr[:, :, 1] = np.minimum(255, arr[:, :, 1] + 70 * pool)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 10 * pool)

    # Subtle purple accent from sides
    left_rg = radial_gradient(0, HEIGHT // 2, WIDTH, HEIGHT, 400)
    right_rg = radial_gradient(WIDTH, HEIGHT // 2, WIDTH, HEIGHT, 400)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 40 * left_rg)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 60 * left_rg)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 40 * right_rg)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 60 * right_rg)

    arr = np.clip(arr, 0, 255)
    img = Image.fromarray(arr.astype(np.uint8)).convert("RGBA")

    # Subtle diagonal texture
    img = add_diagonal_lines(img, spacing=60, color=(255, 200, 80, 8))

    # Stage floor line (dark band)
    stage_y = int(HEIGHT * 0.65)
    img = draw_rect_with_alpha(img, 0, stage_y, WIDTH, HEIGHT, (0, 0, 0, 80))

    # Gold accent bar at top
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle([(0, 0), (WIDTH, 6)], fill=(255, 180, 30, 220))
    od.rectangle([(0, 9), (WIDTH, 11)], fill=(255, 140, 20, 100))
    img = Image.alpha_composite(img, overlay)

    # Text area dark overlay
    img = draw_rect_with_alpha(img, 0, 100, WIDTH, 470, (0, 0, 0, 100))

    draw = ImageDraw.Draw(img)

    # Label chip
    label_font = get_font(FONT_BOLD, 24)
    chip = "  WORLD TOUR CONFIRMED  "
    bbox_c = draw.textbbox((0, 0), chip, font=label_font)
    cw = bbox_c[2] - bbox_c[0] + 20
    cx_chip = (WIDTH - cw) // 2
    draw.rectangle([(cx_chip, 118), (cx_chip + cw, 154)], fill=(200, 140, 20, 220))
    draw.text((cx_chip + 10, 124), chip.strip(), font=label_font, fill=(10, 8, 2, 255))

    # Main text
    big_font = get_font(FONT_BLACK, 110)
    aug_text = "AUGUST"
    bbox_a = draw.textbbox((0, 0), aug_text, font=big_font)
    ax = (WIDTH - (bbox_a[2] - bbox_a[0])) // 2
    draw.text((ax + 4, 174), aug_text, font=big_font, fill=(0, 0, 0, 160))
    draw.text((ax, 170), aug_text, font=big_font, fill=(255, 210, 60, 255))

    sub_font = get_font(FONT_BLACK, 52)
    sub2 = "2026"
    bbox_s2 = draw.textbbox((0, 0), sub2, font=sub_font)
    sx2 = (WIDTH - (bbox_s2[2] - bbox_s2[0])) // 2
    draw.text((sx2, 295), sub2, font=sub_font, fill=(255, 255, 255, 230))

    # BIGBANG name
    name_font = get_font(FONT_BOLD, 36)
    name = "BIGBANG  ·  20TH ANNIVERSARY  ·  WORLD TOUR"
    bbox_n = draw.textbbox((0, 0), name, font=name_font)
    nx = (WIDTH - (bbox_n[2] - bbox_n[0])) // 2
    draw.text((nx, 370), name, font=name_font, fill=(255, 230, 140, 240))

    # Songs bar
    songs_font = get_font(FONT_REGULAR, 22)
    songs = "Bang Bang Bang  ·  Fantastic Baby  ·  Haru Haru  ·  Still Life"
    bbox_sg = draw.textbbox((0, 0), songs, font=songs_font)
    sgx = (WIDTH - (bbox_sg[2] - bbox_sg[0])) // 2
    draw.text((sgx, 425), songs, font=songs_font, fill=(200, 180, 130, 200))

    # Three fact boxes at bottom
    facts_font = get_font(FONT_BLACK, 40)
    small_font = get_font(FONT_REGULAR, 20)
    facts = [
        ("2006", "Debut year"),
        ("COACHELLA", "Stage confirmed"),
        ("NEW ALBUM", "Ready"),
    ]
    box_w = 290
    start_x = (WIDTH - (box_w * 3 + 40)) // 2
    for i, (main, sub_txt) in enumerate(facts):
        bx = start_x + i * (box_w + 20)
        by = 485
        o = Image.new("RGBA", img.size, (0, 0, 0, 0))
        od_f = ImageDraw.Draw(o)
        od_f.rectangle([(bx, by), (bx + box_w, by + 90)], fill=(0, 0, 0, 80))
        od_f.rectangle([(bx, by), (bx + box_w, by + 3)], fill=(255, 180, 30, 220))
        img = Image.alpha_composite(img, o)
        draw = ImageDraw.Draw(img)
        bbox_m = draw.textbbox((0, 0), main, font=facts_font)
        mx = bx + (box_w - (bbox_m[2] - bbox_m[0])) // 2
        draw.text((mx, by + 10), main, font=facts_font, fill=(255, 220, 80, 255))
        bbox_d = draw.textbbox((0, 0), sub_txt, font=small_font)
        dx = bx + (box_w - (bbox_d[2] - bbox_d[0])) // 2
        draw.text((dx, by + 62), sub_txt, font=small_font, fill=(180, 180, 170, 200))

    # Bottom tag
    draw = ImageDraw.Draw(img)
    tag_font = get_font(FONT_REGULAR, 20)
    draw.text((20, HEIGHT - 30), "KCL · K-POP CULTURE LENS · ARTIST", font=tag_font, fill=(130, 110, 60, 200))

    result = apply_vignette_and_grain(img, vignette_strength=0.65, grain_intensity=9)
    out_path = os.path.join(OUTPUT_DIR, "bigbang-august-tour-thumbnail.png")
    result.save(out_path, "PNG", optimize=True)
    print(f"Saved: {out_path}")
    return out_path


def gen_bigbang_body():
    """Desert golden hour + stage symbolism — Coachella starting gun."""
    # Orange/sunset gradient background
    arr = make_gradient_bg((18, 10, 5), (50, 25, 8))

    # Central warm glow (sun/spotlight)
    rg = radial_gradient(WIDTH // 2, HEIGHT // 3, WIDTH, HEIGHT, 450)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 200 * rg)
    arr[:, :, 1] = np.minimum(255, arr[:, :, 1] + 120 * rg)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 30 * rg)

    # Dark bottom (ground)
    for y in range(int(HEIGHT * 0.65), HEIGHT):
        t = (y - HEIGHT * 0.65) / (HEIGHT * 0.35)
        arr[y, :, 0] = arr[y, :, 0] * (1 - t * 0.7)
        arr[y, :, 1] = arr[y, :, 1] * (1 - t * 0.7)
        arr[y, :, 2] = arr[y, :, 2] * (1 - t * 0.7)

    arr = np.clip(arr, 0, 255)
    img = Image.fromarray(arr.astype(np.uint8)).convert("RGBA")

    # Horizontal stage lines
    stage_overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(stage_overlay)
    stage_y = int(HEIGHT * 0.63)
    for i in range(25):
        y_l = stage_y + int(i * (HEIGHT - stage_y) / 25)
        a = max(0, 30 - i * 1)
        sd.line([(0, y_l), (WIDTH, y_l)], fill=(200, 140, 50, a))
    img = Image.alpha_composite(img, stage_overlay)

    # Left dark panel for text
    img = draw_rect_with_alpha(img, 0, 0, WIDTH // 2 + 100, HEIGHT, (0, 0, 0, 140))

    draw = ImageDraw.Draw(img)

    # Eyebrow
    eyebrow_font = get_font(FONT_BOLD, 24)
    draw.text((60, 70), "COACHELLA 2026 · INDIO, CALIFORNIA", font=eyebrow_font, fill=(255, 180, 50, 220))

    # Main text block
    main_font = get_font(FONT_BLACK, 78)
    lines_main = ["IT STARTS", "IN AUGUST"]
    for i, line in enumerate(lines_main):
        draw.text((62, 115 + i * 90), line, font=main_font, fill=(255, 240, 200, 255))

    # Quote line
    quote_font = get_font(FONT_BOLD, 28)
    draw.text((62, 310), '"BIGBANG world tour begins in August"', font=quote_font, fill=(255, 210, 100, 220))
    draw.text((62, 348), "— G-Dragon, Coachella Outdoor Theatre", font=get_font(FONT_REGULAR, 22), fill=(180, 180, 160, 190))

    # Separator
    sep_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sepd = ImageDraw.Draw(sep_o)
    sepd.line([(62, 390), (480, 390)], fill=(255, 180, 40, 120), width=1)
    img = Image.alpha_composite(img, sep_o)
    draw = ImageDraw.Draw(img)

    # Stats grid 2x2
    stat_font = get_font(FONT_BLACK, 44)
    stat_sub_font = get_font(FONT_REGULAR, 20)
    stats = [
        ("20 YRS", "Since debut Aug 2006", 62, 415),
        ("1 HR SET", "Coachella performance", 62, 510),
        ("NEW ALBUM", "Confirmed complete", 370, 415),
        ("AUG 2026", "Tour launch target", 370, 510),
    ]
    for main_s, sub_s, sx, sy in stats:
        draw.text((sx, sy), main_s, font=stat_font, fill=(255, 220, 60, 255))
        draw.text((sx, sy + 52), sub_s, font=stat_sub_font, fill=(170, 165, 140, 200))

    # Right panel — setlist / visual
    img = draw_rect_with_alpha(img, WIDTH // 2 + 80, 60, WIDTH - 40, HEIGHT - 60, (0, 0, 0, 80))

    # Redraw after new overlay
    draw = ImageDraw.Draw(img)
    setlist_header = get_font(FONT_BOLD, 26)
    draw.text((WIDTH // 2 + 110, 90), "COACHELLA SETLIST", font=setlist_header, fill=(255, 200, 70, 230))

    # Thin gold line
    sl_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sld = ImageDraw.Draw(sl_o)
    sld.line([(WIDTH // 2 + 110, 125), (WIDTH - 60, 125)], fill=(255, 180, 40, 120), width=1)
    img = Image.alpha_composite(img, sl_o)
    draw = ImageDraw.Draw(img)

    setlist = [
        "Bang Bang Bang",
        "Fantastic Baby",
        "Sober",
        "Lies",
        "Haru Haru",
        "Still Life",
    ]
    song_font = get_font(FONT_BOLD, 30)
    num_font = get_font(FONT_BLACK, 30)
    for i, song in enumerate(setlist):
        y_s = 140 + i * 65
        draw.text((WIDTH // 2 + 110, y_s), f"{i + 1:02d}", font=num_font, fill=(255, 200, 60, 180))
        draw.text((WIDTH // 2 + 160, y_s), song, font=song_font, fill=(230, 220, 200, 230))
        # Underline
        sl2 = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sld2 = ImageDraw.Draw(sl2)
        sld2.line([(WIDTH // 2 + 110, y_s + 40), (WIDTH - 60, y_s + 40)], fill=(255, 180, 30, 30), width=1)
        img = Image.alpha_composite(img, sl2)
        draw = ImageDraw.Draw(img)

    # Bottom bar
    img = draw_rect_with_alpha(img, 0, HEIGHT - 42, WIDTH, HEIGHT, (0, 0, 0, 160))
    draw = ImageDraw.Draw(img)
    tag_font = get_font(FONT_REGULAR, 20)
    draw.text((20, HEIGHT - 30), "KCL · K-POP CULTURE LENS · April 20, 2026", font=tag_font, fill=(140, 130, 100, 200))

    result = apply_vignette_and_grain(img, vignette_strength=0.60, grain_intensity=9)
    out_path = os.path.join(OUTPUT_DIR, "bigbang-august-tour-1.png")
    result.save(out_path, "PNG", optimize=True)
    print(f"Saved: {out_path}")
    return out_path


# ============================================================
# 3. NCT-WISH-CORTIS-CLASH
# ============================================================

def gen_nct_wish_cortis_thumbnail():
    """Split two-tone — SM blue vs HYBE purple/pink. 6PM showdown."""
    arr = np.zeros((HEIGHT, WIDTH, 3), dtype=np.float64)
    # Left: SM-inspired teal/blue
    # Right: HYBE/CORTIS purple-pink
    for y in range(HEIGHT):
        t = y / HEIGHT
        for x in range(WIDTH):
            frac = x / WIDTH
            # Left blue side
            lr = 8 + 12 * frac
            lg = 20 + 40 * (1 - t)
            lb = 50 + 60 * (1 - t)
            # Right purple side
            rr = 40 + 60 * (1 - t)
            rg = 8 + 12 * t
            rb = 50 + 40 * (1 - t)
            # Blend
            arr[y, x, 0] = lr * (1 - frac) + rr * frac
            arr[y, x, 1] = lg * (1 - frac) + rg * frac
            arr[y, x, 2] = lb * (1 - frac) + rb * frac

    # Center white glare split
    for y in range(HEIGHT):
        for dx in range(-4, 5):
            xi = WIDTH // 2 + dx
            if 0 <= xi < WIDTH:
                alpha = max(0, 1 - abs(dx) / 5)
                arr[y, xi, 0] = min(255, arr[y, xi, 0] + 220 * alpha)
                arr[y, xi, 1] = min(255, arr[y, xi, 1] + 220 * alpha)
                arr[y, xi, 2] = min(255, arr[y, xi, 2] + 220 * alpha)

    arr = np.clip(arr, 0, 255)
    img = Image.fromarray(arr.astype(np.uint8)).convert("RGBA")
    img = add_diagonal_lines(img, spacing=50, color=(255, 255, 255, 10))

    # Dark overlays for text readability
    img = draw_rect_with_alpha(img, 0, 90, WIDTH // 2, HEIGHT - 50, (0, 0, 0, 100))
    img = draw_rect_with_alpha(img, WIDTH // 2, 90, WIDTH, HEIGHT - 50, (0, 0, 0, 100))

    # Top accent bars
    bar_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    bd = ImageDraw.Draw(bar_o)
    bd.rectangle([(0, 0), (WIDTH // 2 - 5, 6)], fill=(80, 180, 255, 220))
    bd.rectangle([(WIDTH // 2 + 5, 0), (WIDTH, 6)], fill=(220, 80, 200, 220))
    img = Image.alpha_composite(img, bar_o)

    draw = ImageDraw.Draw(img)

    # Left panel — NCT WISH
    label_font = get_font(FONT_BOLD, 22)
    draw.text((50, 28), "SM ENTERTAINMENT", font=label_font, fill=(80, 200, 255, 230))
    name_font = get_font(FONT_BLACK, 60)
    draw.text((50, 105), "NCT WISH", font=name_font, fill=(140, 220, 255, 255))
    album_font = get_font(FONT_BOLD, 28)
    draw.text((50, 180), "ODE TO LOVE", font=album_font, fill=(200, 240, 255, 230))
    draw.text((50, 215), "First Full Album", font=get_font(FONT_REGULAR, 22), fill=(160, 200, 220, 200))

    stat_font = get_font(FONT_BLACK, 42)
    stat_sub = get_font(FONT_REGULAR, 20)
    draw.text((50, 275), "NCT 2026", font=stat_font, fill=(80, 200, 255, 255))
    draw.text((50, 325), "10th Anniversary Framework", font=stat_sub, fill=(160, 200, 220, 200))
    draw.text((50, 365), "FULL ALBUM", font=stat_font, fill=(80, 200, 255, 255))
    draw.text((50, 415), "2 years into career", font=stat_sub, fill=(160, 200, 220, 200))
    draw.text((50, 455), "DEBUT ERA", font=stat_font, fill=(80, 200, 255, 255))
    draw.text((50, 505), "Building brand weight", font=stat_sub, fill=(160, 200, 220, 200))

    # Right panel — CORTIS
    rx = WIDTH // 2 + 50
    draw.text((rx, 28), "BIGHIT MUSIC · HYBE", font=label_font, fill=(220, 100, 220, 230))
    draw.text((rx, 105), "CORTIS", font=name_font, fill=(255, 160, 240, 255))
    draw.text((rx, 180), "REDRED → GREENGREEN", font=album_font, fill=(255, 200, 255, 230))
    draw.text((rx, 215), "Pre-release + EP May 4", font=get_font(FONT_REGULAR, 22), fill=(200, 180, 220, 200))

    draw.text((rx, 275), "1,227,986", font=stat_font, fill=(255, 140, 230, 255))
    draw.text((rx, 325), "Pre-orders as of Apr 2", font=stat_sub, fill=(200, 180, 220, 200))
    draw.text((rx, 365), "2-STEP", font=stat_font, fill=(255, 140, 230, 255))
    draw.text((rx, 415), "Pre-release → full EP funnel", font=stat_sub, fill=(200, 180, 220, 200))
    draw.text((rx, 455), "HYPE PAID", font=stat_font, fill=(255, 140, 230, 255))
    draw.text((rx, 505), "Purchase cycle already running", font=stat_sub, fill=(200, 180, 220, 200))

    # VS badge center
    vs_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    vd = ImageDraw.Draw(vs_o)
    badge_cx = WIDTH // 2
    badge_cy = HEIGHT // 2 + 30
    for r in range(55, 0, -1):
        a = int(200 * (1 - r / 55))
        vd.ellipse([(badge_cx - r, badge_cy - r), (badge_cx + r, badge_cy + r)], fill=(15, 10, 20, a))
    img = Image.alpha_composite(img, vs_o)
    draw = ImageDraw.Draw(img)
    vs_font = get_font(FONT_BLACK, 38)
    bbox_vs = draw.textbbox((0, 0), "VS", font=vs_font)
    vvx = badge_cx - (bbox_vs[2] - bbox_vs[0]) // 2
    vvy = badge_cy - (bbox_vs[3] - bbox_vs[1]) // 2
    draw.text((vvx, vvy), "VS", font=vs_font, fill=(255, 255, 255, 255))

    # Bottom bar
    img = draw_rect_with_alpha(img, 0, HEIGHT - 50, WIDTH, HEIGHT, (0, 0, 0, 160))
    draw = ImageDraw.Draw(img)
    time_font = get_font(FONT_BLACK, 28)
    bbox_tm = draw.textbbox((0, 0), "6:00 PM KST · April 20, 2026", font=time_font)
    tx = (WIDTH - (bbox_tm[2] - bbox_tm[0])) // 2
    draw.text((tx, HEIGHT - 42), "6:00 PM KST · April 20, 2026", font=time_font, fill=(255, 220, 80, 255))

    result = apply_vignette_and_grain(img, vignette_strength=0.60, grain_intensity=8)
    out_path = os.path.join(OUTPUT_DIR, "nct-wish-cortis-clash-thumbnail.png")
    result.save(out_path, "PNG", optimize=True)
    print(f"Saved: {out_path}")
    return out_path


def gen_nct_wish_cortis_body():
    """Timeline/clock motif — scheduling war visualization."""
    arr = make_gradient_bg((8, 8, 22), (22, 8, 30))

    # Clock-face inspired radial from center
    rg_c = radial_gradient(WIDTH // 2, HEIGHT // 2, WIDTH, HEIGHT, 420)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 30 * rg_c)
    arr[:, :, 1] = np.minimum(255, arr[:, :, 1] + 40 * rg_c)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 80 * rg_c)

    arr = np.clip(arr, 0, 255)
    img = Image.fromarray(arr.astype(np.uint8)).convert("RGBA")

    # Draw clock circle
    clock_cx, clock_cy = WIDTH // 2, HEIGHT // 2 - 10
    clock_r = 210
    clock_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    cd = ImageDraw.Draw(clock_o)
    # Outer ring
    cd.ellipse([(clock_cx - clock_r, clock_cy - clock_r), (clock_cx + clock_r, clock_cy + clock_r)],
               outline=(80, 120, 200, 100), width=3)
    # Inner ring
    cd.ellipse([(clock_cx - clock_r + 10, clock_cy - clock_r + 10),
                (clock_cx + clock_r - 10, clock_cy + clock_r - 10)],
               outline=(80, 120, 200, 50), width=1)
    img = Image.alpha_composite(img, clock_o)

    # Clock hour ticks
    tick_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    td2 = ImageDraw.Draw(tick_o)
    for h in range(12):
        angle = math.radians(h * 30 - 90)
        inner_r = clock_r - 20
        outer_r = clock_r - 5
        x1 = clock_cx + int(inner_r * math.cos(angle))
        y1 = clock_cy + int(inner_r * math.sin(angle))
        x2 = clock_cx + int(outer_r * math.cos(angle))
        y2 = clock_cy + int(outer_r * math.sin(angle))
        td2.line([(x1, y1), (x2, y2)], fill=(100, 140, 220, 120), width=2)
    img = Image.alpha_composite(img, tick_o)

    # 6PM hand pointing down (18:00 = straight down)
    hand_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    hd = ImageDraw.Draw(hand_o)
    # Hour hand pointing at 6 (straight down)
    angle_6 = math.radians(90)  # 6 o'clock = 180 degrees from top
    hx = clock_cx + int(140 * math.cos(angle_6))
    hy = clock_cy + int(140 * math.sin(angle_6))
    hd.line([(clock_cx, clock_cy), (hx, hy)], fill=(255, 220, 60, 220), width=5)
    # Minute hand at 12 (straight up) for 6:00 sharp
    angle_12 = math.radians(-90)
    mx2 = clock_cx + int(175 * math.cos(angle_12))
    my2 = clock_cy + int(175 * math.sin(angle_12))
    hd.line([(clock_cx, clock_cy), (mx2, my2)], fill=(200, 200, 255, 220), width=3)
    # Center dot
    hd.ellipse([(clock_cx - 8, clock_cy - 8), (clock_cx + 8, clock_cy + 8)], fill=(255, 255, 255, 240))
    img = Image.alpha_composite(img, hand_o)

    # 6PM label in clock center
    draw = ImageDraw.Draw(img)
    center_font = get_font(FONT_BLACK, 52)
    time_label = "6PM"
    bbox_tl = draw.textbbox((0, 0), time_label, font=center_font)
    tlx = clock_cx - (bbox_tl[2] - bbox_tl[0]) // 2
    tly = clock_cy - (bbox_tl[3] - bbox_tl[1]) // 2
    draw.text((tlx, tly - 10), time_label, font=center_font, fill=(255, 230, 80, 255))
    kst_font = get_font(FONT_REGULAR, 22)
    kst_label = "KST"
    bbox_kl = draw.textbbox((0, 0), kst_label, font=kst_font)
    draw.text((clock_cx - (bbox_kl[2] - bbox_kl[0]) // 2, tly + 50), kst_label, font=kst_font,
              fill=(180, 180, 220, 200))

    # Left panel
    img = draw_rect_with_alpha(img, 0, 0, clock_cx - clock_r - 10, HEIGHT, (0, 0, 0, 120))
    draw = ImageDraw.Draw(img)
    lp_font = get_font(FONT_BLACK, 42)
    lp_sub = get_font(FONT_REGULAR, 20)
    draw.text((30, 60), "NCT WISH", font=lp_font, fill=(100, 200, 255, 255))
    draw.text((30, 110), "ODE TO LOVE", font=get_font(FONT_BOLD, 26), fill=(160, 220, 255, 220))
    draw.text((30, 150), "1st Full Album", font=lp_sub, fill=(140, 180, 220, 190))
    draw.text((30, 200), "NCT 10th yr", font=lp_font, fill=(80, 180, 255, 230))
    draw.text((30, 250), "Anniversary frame", font=lp_sub, fill=(140, 180, 220, 190))
    draw.text((30, 300), "SM STRATEGY", font=get_font(FONT_BOLD, 26), fill=(60, 160, 240, 220))
    draw.text((30, 335), "Position within", font=lp_sub, fill=(140, 180, 220, 190))
    draw.text((30, 355), "NCT brand", font=lp_sub, fill=(140, 180, 220, 190))

    # Right panel
    rp_x = clock_cx + clock_r + 10
    img = draw_rect_with_alpha(img, rp_x, 0, WIDTH, HEIGHT, (0, 0, 0, 120))
    draw = ImageDraw.Draw(img)
    rp_font = get_font(FONT_BLACK, 42)
    rp_sub = get_font(FONT_REGULAR, 20)
    draw.text((rp_x + 20, 60), "CORTIS", font=rp_font, fill=(255, 130, 230, 255))
    draw.text((rp_x + 20, 110), "REDRED", font=get_font(FONT_BOLD, 26), fill=(255, 180, 240, 220))
    draw.text((rp_x + 20, 150), "Pre-release single", font=rp_sub, fill=(200, 170, 220, 190))
    draw.text((rp_x + 20, 200), "1,227,986", font=rp_font, fill=(255, 140, 220, 255))
    draw.text((rp_x + 20, 250), "Pre-orders (Apr 2)", font=rp_sub, fill=(200, 170, 220, 190))
    draw.text((rp_x + 20, 300), "HYBE FUNNEL", font=get_font(FONT_BOLD, 26), fill=(220, 100, 210, 220))
    draw.text((rp_x + 20, 335), "Pre-release →", font=rp_sub, fill=(200, 170, 220, 190))
    draw.text((rp_x + 20, 355), "EP May 4", font=rp_sub, fill=(200, 170, 220, 190))

    # Bottom headline
    img = draw_rect_with_alpha(img, 0, HEIGHT - 85, WIDTH, HEIGHT, (0, 0, 0, 160))
    draw = ImageDraw.Draw(img)
    bottom_font = get_font(FONT_BLACK, 36)
    btxt = "FIFTH-GEN COMPETITION: SCHEDULING WARS"
    bbox_bt = draw.textbbox((0, 0), btxt, font=bottom_font)
    bx = (WIDTH - (bbox_bt[2] - bbox_bt[0])) // 2
    draw.text((bx, HEIGHT - 75), btxt, font=bottom_font, fill=(255, 220, 80, 255))
    sub_btxt = "April 20, 2026  ·  Same hour  ·  Two strategies  ·  One fandom wallet"
    sub_font2 = get_font(FONT_REGULAR, 22)
    bbox_sb = draw.textbbox((0, 0), sub_btxt, font=sub_font2)
    sbx = (WIDTH - (bbox_sb[2] - bbox_sb[0])) // 2
    draw.text((sbx, HEIGHT - 32), sub_btxt, font=sub_font2, fill=(180, 180, 200, 200))

    result = apply_vignette_and_grain(img, vignette_strength=0.60, grain_intensity=8)
    out_path = os.path.join(OUTPUT_DIR, "nct-wish-cortis-clash-1.png")
    result.save(out_path, "PNG", optimize=True)
    print(f"Saved: {out_path}")
    return out_path


# ============================================================
# 4. IDLE-US-TOUR-CANCELLED
# ============================================================

def gen_idle_thumbnail():
    """Cold grey/steel — arena emptiness, stark cancellation."""
    arr = make_gradient_bg((14, 14, 18), (28, 26, 32))

    # Cool blue-grey ambient
    rg = radial_gradient(WIDTH // 2, -50, WIDTH, HEIGHT, 550)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 25 * rg)
    arr[:, :, 1] = np.minimum(255, arr[:, :, 1] + 35 * rg)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 60 * rg)

    arr = np.clip(arr, 0, 255)
    img = Image.fromarray(arr.astype(np.uint8)).convert("RGBA")

    # Subtle horizontal scan-line texture
    scan_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    scd = ImageDraw.Draw(scan_o)
    for y in range(0, HEIGHT, 4):
        scd.line([(0, y), (WIDTH, y)], fill=(0, 0, 0, 15))
    img = Image.alpha_composite(img, scan_o)

    # Red cancel diagonal stripe (subtle)
    stripe_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    std = ImageDraw.Draw(stripe_o)
    std.line([(0, 0), (WIDTH, HEIGHT)], fill=(200, 30, 40, 25), width=80)
    std.line([(0, 0), (WIDTH, HEIGHT)], fill=(200, 30, 40, 15), width=160)
    img = Image.alpha_composite(img, stripe_o)

    # Centre dark overlay for text
    img = draw_rect_with_alpha(img, 60, 100, WIDTH - 60, HEIGHT - 80, (0, 0, 0, 120))

    # Top red bar
    bar_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    bd = ImageDraw.Draw(bar_o)
    bd.rectangle([(0, 0), (WIDTH, 6)], fill=(200, 30, 40, 220))
    img = Image.alpha_composite(img, bar_o)

    draw = ImageDraw.Draw(img)

    # Label
    label_font = get_font(FONT_BOLD, 24)
    chip_text = "  TOUR UPDATE  "
    bbox_c = draw.textbbox((0, 0), chip_text, font=label_font)
    cw = bbox_c[2] - bbox_c[0] + 20
    cx_chip = (WIDTH - cw) // 2
    draw.rectangle([(cx_chip, 118), (cx_chip + cw, 154)], fill=(180, 25, 35, 220))
    draw.text((cx_chip + 10, 124), chip_text.strip(), font=label_font, fill=(255, 255, 255, 255))

    # CANCELLED big text
    big_font = get_font(FONT_BLACK, 110)
    cancel_text = "CANCELLED"
    bbox_b = draw.textbbox((0, 0), cancel_text, font=big_font)
    bx = (WIDTH - (bbox_b[2] - bbox_b[0])) // 2
    draw.text((bx + 4, 174), cancel_text, font=big_font, fill=(0, 0, 0, 150))
    draw.text((bx, 170), cancel_text, font=big_font, fill=(220, 40, 50, 255))

    # Strikethrough on CANCELLED
    strike_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    skd = ImageDraw.Draw(strike_o)
    mid_y = 170 + (bbox_b[3] - bbox_b[1]) // 2
    skd.line([(bx - 5, mid_y), (bx + (bbox_b[2] - bbox_b[0]) + 5, mid_y)], fill=(255, 255, 255, 120), width=5)
    img = Image.alpha_composite(img, strike_o)
    draw = ImageDraw.Draw(img)

    # Sub
    sub_font = get_font(FONT_BOLD, 34)
    sub = "i-dle  ·  SYNCOPATION TOUR"
    bbox_s = draw.textbbox((0, 0), sub, font=sub_font)
    sx = (WIDTH - (bbox_s[2] - bbox_s[0])) // 2
    draw.text((sx, 305), sub, font=sub_font, fill=(180, 180, 200, 240))

    # Cities row
    cities_font = get_font(FONT_REGULAR, 24)
    cities = "Philadelphia  ·  San Antonio  ·  Multiple dates affected"
    bbox_ci = draw.textbbox((0, 0), cities, font=cities_font)
    cix = (WIDTH - (bbox_ci[2] - bbox_ci[0])) // 2
    draw.text((cix, 360), cities, font=cities_font, fill=(150, 150, 170, 200))

    # Facts row
    facts_font = get_font(FONT_BLACK, 44)
    small_font = get_font(FONT_REGULAR, 20)
    facts = [
        ("10 CITIES", "Announced Mar 5"),
        ("CANCELLED", "Multiple NA dates"),
        ("CUBE", "No explanation yet"),
    ]
    box_w = 290
    start_x = (WIDTH - (box_w * 3 + 40)) // 2
    for i, (main, sub_txt) in enumerate(facts):
        bx2 = start_x + i * (box_w + 20)
        by = 425
        o = Image.new("RGBA", img.size, (0, 0, 0, 0))
        od2 = ImageDraw.Draw(o)
        od2.rectangle([(bx2, by), (bx2 + box_w, by + 95)], fill=(0, 0, 0, 90))
        od2.rectangle([(bx2, by), (bx2 + box_w, by + 3)],
                      fill=(200, 30, 40, 200) if i == 1 else (60, 100, 180, 200))
        img = Image.alpha_composite(img, o)
        draw = ImageDraw.Draw(img)
        col = (220, 60, 70, 255) if i == 1 else (140, 180, 240, 255)
        bbox_m = draw.textbbox((0, 0), main, font=facts_font)
        mx = bx2 + (box_w - (bbox_m[2] - bbox_m[0])) // 2
        draw.text((mx, by + 10), main, font=facts_font, fill=col)
        bbox_d = draw.textbbox((0, 0), sub_txt, font=small_font)
        dx = bx2 + (box_w - (bbox_d[2] - bbox_d[0])) // 2
        draw.text((dx, by + 65), sub_txt, font=small_font, fill=(160, 160, 180, 200))

    # Lollapalooza still on
    lolla_font = get_font(FONT_BOLD, 24)
    lolla = "Lollapalooza July 31  ·  Mexico City — Still Active"
    bbox_ll = draw.textbbox((0, 0), lolla, font=lolla_font)
    llx = (WIDTH - (bbox_ll[2] - bbox_ll[0])) // 2
    draw.text((llx, 540), lolla, font=lolla_font, fill=(80, 200, 120, 220))

    # Bottom tag
    tag_font = get_font(FONT_REGULAR, 20)
    draw.text((20, HEIGHT - 30), "KCL · K-POP CULTURE LENS · MARKET TREND", font=tag_font, fill=(100, 100, 120, 180))

    result = apply_vignette_and_grain(img, vignette_strength=0.70, grain_intensity=10)
    out_path = os.path.join(OUTPUT_DIR, "idle-us-tour-cancelled-thumbnail.png")
    result.save(out_path, "PNG", optimize=True)
    print(f"Saved: {out_path}")
    return out_path


def gen_idle_body():
    """Empty arena mood — data timeline of cancellation sequence."""
    arr = make_gradient_bg((10, 10, 14), (20, 18, 25))

    # Spotlight from above, empty
    rg = radial_gradient(WIDTH // 2, -100, WIDTH, HEIGHT, 500)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 60 * rg)
    arr[:, :, 1] = np.minimum(255, arr[:, :, 1] + 70 * rg)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 90 * rg)

    arr = np.clip(arr, 0, 255)
    img = Image.fromarray(arr.astype(np.uint8)).convert("RGBA")

    # Empty seats suggestion — rows of dots
    seats_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sed = ImageDraw.Draw(seats_o)
    for row in range(15):
        y_r = int(HEIGHT * 0.12) + row * 28
        for col in range(0, WIDTH, 22):
            shade = random.randint(18, 35)
            sed.ellipse([(col, y_r), (col + 12, y_r + 10)], fill=(shade, shade, shade + 8, 80))
    img = Image.alpha_composite(img, seats_o)

    # Center dark overlay for timeline
    img = draw_rect_with_alpha(img, 80, 60, WIDTH - 80, HEIGHT - 40, (0, 0, 0, 140))

    draw = ImageDraw.Draw(img)

    # Title
    title_font = get_font(FONT_BLACK, 52)
    title = "SYNCOPATION TOUR — TIMELINE"
    bbox_t = draw.textbbox((0, 0), title, font=title_font)
    tx = (WIDTH - (bbox_t[2] - bbox_t[0])) // 2
    draw.text((tx, 75), title, font=title_font, fill=(200, 200, 220, 255))

    # Subtitle
    sub_font3 = get_font(FONT_REGULAR, 24)
    sub3 = "How a 10-city North America expansion became a cancellation story"
    bbox_s3 = draw.textbbox((0, 0), sub3, font=sub_font3)
    sx3 = (WIDTH - (bbox_s3[2] - bbox_s3[0])) // 2
    draw.text((sx3, 140), sub3, font=sub_font3, fill=(150, 150, 170, 200))

    # Timeline line
    tl_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    tld = ImageDraw.Draw(tl_o)
    tl_x = 160
    tld.line([(tl_x, 200), (tl_x, HEIGHT - 80)], fill=(80, 100, 160, 150), width=2)
    img = Image.alpha_composite(img, tl_o)
    draw = ImageDraw.Draw(img)

    timeline = [
        ("MAR 5", "10-city NA leg announced via Today Show", "Confirmed", (80, 180, 120)),
        ("MAR 11", "Tickets on sale for Syncopation Tour", "On Sale", (80, 180, 120)),
        ("APR 13", "July album + Lollapalooza Jul 31 confirmed", "Confirmed", (80, 180, 120)),
        ("APR 18–19", "Cancellation labels spread: Philadelphia, San Antonio", "CANCELLED", (220, 50, 60)),
        ("APR 19+", "Mexico City + Lollapalooza still active", "Ongoing", (200, 180, 60)),
    ]

    date_font = get_font(FONT_BLACK, 26)
    event_font = get_font(FONT_BOLD, 24)
    status_font = get_font(FONT_BOLD, 20)

    for i, (date, event, status, color) in enumerate(timeline):
        y_t = 210 + i * 86
        # Dot on timeline
        tl_dot = Image.new("RGBA", img.size, (0, 0, 0, 0))
        dotd = ImageDraw.Draw(tl_dot)
        dotd.ellipse([(tl_x - 8, y_t - 8), (tl_x + 8, y_t + 8)], fill=(*color, 220))
        img = Image.alpha_composite(img, tl_dot)
        draw = ImageDraw.Draw(img)

        # Date
        draw.text((tl_x + 25, y_t - 16), date, font=date_font, fill=(200, 200, 220, 240))
        # Event
        draw.text((tl_x + 25, y_t + 14), event, font=event_font, fill=(170, 170, 190, 220))
        # Status badge
        badge_x = WIDTH - 280
        draw.rectangle([(badge_x, y_t - 14), (badge_x + 200, y_t + 18)], fill=(*color, 80))
        bbox_st = draw.textbbox((0, 0), status, font=status_font)
        stx = badge_x + (200 - (bbox_st[2] - bbox_st[0])) // 2
        draw.text((stx, y_t - 10), status, font=status_font, fill=(*color, 255))

    # Bottom note
    note_font = get_font(FONT_REGULAR, 22)
    note = "No official cause confirmed · Market reads it as arena sizing overreach"
    bbox_n = draw.textbbox((0, 0), note, font=note_font)
    nx = (WIDTH - (bbox_n[2] - bbox_n[0])) // 2
    draw.text((nx, HEIGHT - 45), note, font=note_font, fill=(140, 140, 160, 200))

    result = apply_vignette_and_grain(img, vignette_strength=0.65, grain_intensity=10)
    out_path = os.path.join(OUTPUT_DIR, "idle-us-tour-cancelled-1.png")
    result.save(out_path, "PNG", optimize=True)
    print(f"Saved: {out_path}")
    return out_path


# ============================================================
# 5. TAEMIN-COACHELLA-FIRST
# ============================================================

def gen_taemin_thumbnail():
    """Deep purple/magenta stage lighting — historic solo moment."""
    arr = make_gradient_bg((8, 4, 18), (20, 6, 35))

    # Strong purple spotlight from above
    rg = radial_gradient(WIDTH // 2, -60, WIDTH, HEIGHT, 520)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 100 * rg)
    arr[:, :, 1] = np.minimum(255, arr[:, :, 1] + 20 * rg)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 180 * rg)

    # Gold accent at stage level
    pool = elliptical_gradient(WIDTH // 2, int(HEIGHT * 0.7), WIDTH, HEIGHT, 350, 100)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 150 * pool)
    arr[:, :, 1] = np.minimum(255, arr[:, :, 1] + 90 * pool)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 20 * pool)

    # Right side warm glow (Grammy Museum reference)
    rg_r = radial_gradient(WIDTH - 100, HEIGHT // 2, WIDTH, HEIGHT, 400)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 80 * rg_r)
    arr[:, :, 1] = np.minimum(255, arr[:, :, 1] + 50 * rg_r)

    arr = np.clip(arr, 0, 255)
    img = Image.fromarray(arr.astype(np.uint8)).convert("RGBA")
    img = add_diagonal_lines(img, spacing=50, color=(180, 100, 255, 8))

    # Stage floor
    stage_y = int(HEIGHT * 0.65)
    img = draw_rect_with_alpha(img, 0, stage_y, WIDTH, HEIGHT, (0, 0, 0, 100))

    # Dark text zone
    img = draw_rect_with_alpha(img, 0, 80, WIDTH, 510, (0, 0, 0, 110))

    # Top bar
    bar_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    bd = ImageDraw.Draw(bar_o)
    bd.rectangle([(0, 0), (WIDTH, 6)], fill=(180, 60, 255, 220))
    bd.rectangle([(0, 9), (WIDTH, 11)], fill=(140, 40, 200, 100))
    img = Image.alpha_composite(img, bar_o)

    draw = ImageDraw.Draw(img)

    # Label chip
    label_font = get_font(FONT_BOLD, 24)
    chip = "  COACHELLA HISTORY  "
    bbox_c = draw.textbbox((0, 0), chip, font=label_font)
    cw = bbox_c[2] - bbox_c[0] + 20
    cx_chip = (WIDTH - cw) // 2
    draw.rectangle([(cx_chip, 100), (cx_chip + cw, 136)], fill=(150, 40, 220, 220))
    draw.text((cx_chip + 10, 106), chip.strip(), font=label_font, fill=(255, 255, 255, 255))

    # FIRST big text
    first_font = get_font(FONT_BLACK, 120)
    first_text = "FIRST"
    bbox_f = draw.textbbox((0, 0), first_text, font=first_font)
    fx = (WIDTH - (bbox_f[2] - bbox_f[0])) // 2
    draw.text((fx + 4, 154), first_text, font=first_font, fill=(0, 0, 0, 150))
    draw.text((fx, 150), first_text, font=first_font, fill=(200, 120, 255, 255))

    # Sub headline
    sub_font4 = get_font(FONT_BLACK, 48)
    sub4 = "KOREAN MALE SOLO AT COACHELLA"
    bbox_s4 = draw.textbbox((0, 0), sub4, font=sub_font4)
    s4x = (WIDTH - (bbox_s4[2] - bbox_s4[0])) // 2
    draw.text((s4x, 285), sub4, font=sub_font4, fill=(255, 255, 255, 240))

    # TAEMIN name
    name_font2 = get_font(FONT_BOLD, 36)
    name2 = "TAEMIN  ·  Mojave Stage  ·  April 11 & 18, 2026"
    bbox_n2 = draw.textbbox((0, 0), name2, font=name_font2)
    n2x = (WIDTH - (bbox_n2[2] - bbox_n2[0])) // 2
    draw.text((n2x, 350), name2, font=name_font2, fill=(220, 180, 255, 230))

    # Three fact boxes
    facts_font2 = get_font(FONT_BLACK, 44)
    small_font2 = get_font(FONT_REGULAR, 20)
    facts2 = [
        ("50 MIN", "Solo set length"),
        ("6 NEW", "Unreleased songs"),
        ("GRAMMY", "Museum display"),
    ]
    box_w = 290
    start_x = (WIDTH - (box_w * 3 + 40)) // 2
    for i, (main, sub_txt) in enumerate(facts2):
        bx3 = start_x + i * (box_w + 20)
        by3 = 430
        o3 = Image.new("RGBA", img.size, (0, 0, 0, 0))
        od3 = ImageDraw.Draw(o3)
        od3.rectangle([(bx3, by3), (bx3 + box_w, by3 + 95)], fill=(80, 20, 130, 80))
        od3.rectangle([(bx3, by3), (bx3 + box_w, by3 + 3)], fill=(200, 80, 255, 220))
        img = Image.alpha_composite(img, o3)
        draw = ImageDraw.Draw(img)
        bbox_m3 = draw.textbbox((0, 0), main, font=facts_font2)
        mx3 = bx3 + (box_w - (bbox_m3[2] - bbox_m3[0])) // 2
        draw.text((mx3, by3 + 12), main, font=facts_font2, fill=(255, 200, 255, 255))
        bbox_d3 = draw.textbbox((0, 0), sub_txt, font=small_font2)
        dx3 = bx3 + (box_w - (bbox_d3[2] - bbox_d3[0])) // 2
        draw.text((dx3, by3 + 65), sub_txt, font=small_font2, fill=(180, 160, 200, 200))

    # Grammy museum tag
    draw.text((20, HEIGHT - 30), "KCL · K-POP CULTURE LENS · TECH & CULTURE", font=get_font(FONT_REGULAR, 20),
              fill=(120, 80, 160, 180))

    result = apply_vignette_and_grain(img, vignette_strength=0.72, grain_intensity=9)
    out_path = os.path.join(OUTPUT_DIR, "taemin-coachella-first-thumbnail.png")
    result.save(out_path, "PNG", optimize=True)
    print(f"Saved: {out_path}")
    return out_path


def gen_taemin_body():
    """Gold spotlight + museum feel — Grammy Museum + Coachella dual moment."""
    arr = make_gradient_bg((10, 6, 20), (30, 14, 45))

    # Gold spotlight from upper left (museum lighting)
    rg_l = radial_gradient(int(WIDTH * 0.2), 0, WIDTH, HEIGHT, 500)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 180 * rg_l)
    arr[:, :, 1] = np.minimum(255, arr[:, :, 1] + 100 * rg_l)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 20 * rg_l)

    # Purple stage lighting from upper right (Coachella)
    rg_r2 = radial_gradient(int(WIDTH * 0.8), 0, WIDTH, HEIGHT, 500)
    arr[:, :, 0] = np.minimum(255, arr[:, :, 0] + 80 * rg_r2)
    arr[:, :, 1] = np.minimum(255, arr[:, :, 1] + 10 * rg_r2)
    arr[:, :, 2] = np.minimum(255, arr[:, :, 2] + 160 * rg_r2)

    arr = np.clip(arr, 0, 255)
    img = Image.fromarray(arr.astype(np.uint8)).convert("RGBA")

    # Vertical split line (museum | stage)
    split_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    spd = ImageDraw.Draw(split_o)
    spd.line([(WIDTH // 2, 40), (WIDTH // 2, HEIGHT - 40)], fill=(255, 220, 100, 60), width=1)
    img = Image.alpha_composite(img, split_o)

    # Dark overlays per side
    img = draw_rect_with_alpha(img, 0, 0, WIDTH // 2, HEIGHT, (0, 0, 0, 100))
    img = draw_rect_with_alpha(img, WIDTH // 2, 0, WIDTH, HEIGHT, (0, 0, 0, 100))

    draw = ImageDraw.Draw(img)

    # LEFT: Grammy Museum
    left_head = get_font(FONT_BLACK, 36)
    draw.text((50, 50), "GRAMMY MUSEUM", font=left_head, fill=(255, 200, 80, 240))
    draw.text((50, 96), "Los Angeles · Apr 1 – May 25", font=get_font(FONT_REGULAR, 22), fill=(180, 170, 140, 200))

    exhibit_font = get_font(FONT_BLACK, 52)
    ex_lines = ["TAEMIN:", "Performer.", "Artist. Icon."]
    for i, line in enumerate(ex_lines):
        col = (255, 220, 80, 255) if i == 0 else (230, 230, 255, 240)
        draw.text((50, 150 + i * 68), line, font=exhibit_font if i == 0 else get_font(FONT_BOLD, 46), fill=col)

    draw.text((50, 365), "First museum display", font=get_font(FONT_BOLD, 26), fill=(200, 180, 120, 220))
    draw.text((50, 400), "dedicated to a solo K-pop artist", font=get_font(FONT_REGULAR, 22), fill=(170, 160, 130, 200))

    # Separator line under museum quote
    sep2_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    s2d = ImageDraw.Draw(sep2_o)
    s2d.line([(50, 440), (WIDTH // 2 - 50, 440)], fill=(255, 200, 80, 80), width=1)
    img = Image.alpha_composite(img, sep2_o)
    draw = ImageDraw.Draw(img)

    rolling_font = get_font(FONT_BOLD, 22)
    draw.text((50, 460), '"the idol\'s idol"', font=rolling_font, fill=(220, 200, 140, 220))
    draw.text((50, 492), "— Rolling Stone UK", font=get_font(FONT_REGULAR, 20), fill=(160, 150, 120, 190))
    draw.text((50, 530), '"next first"', font=rolling_font, fill=(220, 200, 140, 220))
    draw.text((50, 562), "— Forbes post-Coachella", font=get_font(FONT_REGULAR, 20), fill=(160, 150, 120, 190))

    # RIGHT: Coachella stage
    rx2 = WIDTH // 2 + 50
    right_head = get_font(FONT_BLACK, 36)
    draw.text((rx2, 50), "COACHELLA 2026", font=right_head, fill=(200, 120, 255, 240))
    draw.text((rx2, 96), "Mojave Stage · Apr 11 & 18, 2026", font=get_font(FONT_REGULAR, 22), fill=(180, 160, 200, 200))

    stats_font = get_font(FONT_BLACK, 60)
    draw.text((rx2, 150), "50 MIN", font=stats_font, fill=(255, 180, 255, 255))
    draw.text((rx2, 220), "Solo set", font=get_font(FONT_REGULAR, 22), fill=(180, 160, 200, 200))

    draw.text((rx2, 280), "6 TRACKS", font=stats_font, fill=(255, 180, 255, 255))
    draw.text((rx2, 350), "Unreleased previewed", font=get_font(FONT_REGULAR, 22), fill=(180, 160, 200, 200))

    draw.text((rx2, 390), "Move  ·  Heaven", font=get_font(FONT_BOLD, 28), fill=(220, 200, 240, 220))
    draw.text((rx2, 430), "+ signature songs performed", font=get_font(FONT_REGULAR, 22), fill=(160, 150, 190, 190))

    # Highlights
    hlt_o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    hd2 = ImageDraw.Draw(hlt_o)
    hd2.rectangle([(rx2, 480), (WIDTH - 40, 590)], fill=(80, 20, 120, 60))
    hd2.rectangle([(rx2, 480), (WIDTH - 40, 483)], fill=(200, 80, 255, 180))
    img = Image.alpha_composite(img, hlt_o)
    draw = ImageDraw.Draw(img)

    kw_font = get_font(FONT_BLACK, 28)
    draw.text((rx2 + 15, 495), "FIRST KOREAN MALE SOLO", font=kw_font, fill=(220, 140, 255, 255))
    draw.text((rx2 + 15, 535), "on Coachella official lineup", font=get_font(FONT_REGULAR, 22),
              fill=(180, 160, 200, 200))

    # Bottom bar
    img = draw_rect_with_alpha(img, 0, HEIGHT - 42, WIDTH, HEIGHT, (0, 0, 0, 160))
    draw = ImageDraw.Draw(img)
    tag_font2 = get_font(FONT_REGULAR, 20)
    draw.text((20, HEIGHT - 30), "KCL · K-POP CULTURE LENS · April 19, 2026", font=tag_font2,
              fill=(140, 120, 160, 200))
    rt2 = "Taemin · SHINee · SM Entertainment · Coachella"
    bbox_rt2 = draw.textbbox((0, 0), rt2, font=tag_font2)
    draw.text((WIDTH - (bbox_rt2[2] - bbox_rt2[0]) - 20, HEIGHT - 30), rt2, font=tag_font2,
              fill=(140, 120, 160, 200))

    result = apply_vignette_and_grain(img, vignette_strength=0.65, grain_intensity=9)
    out_path = os.path.join(OUTPUT_DIR, "taemin-coachella-first-1.png")
    result.save(out_path, "PNG", optimize=True)
    print(f"Saved: {out_path}")
    return out_path


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    generators = [
        ("hybe-bang-arrest-warrant-thumbnail", gen_hybe_bang_thumbnail),
        ("hybe-bang-arrest-warrant-1", gen_hybe_bang_body),
        ("bigbang-august-tour-thumbnail", gen_bigbang_thumbnail),
        ("bigbang-august-tour-1", gen_bigbang_body),
        ("nct-wish-cortis-clash-thumbnail", gen_nct_wish_cortis_thumbnail),
        ("nct-wish-cortis-clash-1", gen_nct_wish_cortis_body),
        ("idle-us-tour-cancelled-thumbnail", gen_idle_thumbnail),
        ("idle-us-tour-cancelled-1", gen_idle_body),
        ("taemin-coachella-first-thumbnail", gen_taemin_thumbnail),
        ("taemin-coachella-first-1", gen_taemin_body),
    ]

    results = []
    for name, gen_fn in generators:
        print(f"\n--- Generating: {name} ---")
        path = gen_fn()
        size = os.path.getsize(path)
        print(f"  {os.path.basename(path)}: {size:,} bytes ({size / 1024:.1f} KB)")
        assert size > 10240, f"File too small: {path} ({size} bytes)"
        results.append((name, path, size))

    print("\n" + "=" * 60)
    print("ALL IMAGES GENERATED SUCCESSFULLY")
    print("=" * 60)
    for name, path, size in results:
        print(f"  {name}: {size / 1024:.1f} KB")
