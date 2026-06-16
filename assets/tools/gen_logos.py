"""
TNSVT Premium Logo Generator
============================
Genera todos los iconos de la app (PWA, Android nativo, favicon) a
partir de un diseno procedural con Pillow.

Diseno: T ornamentado gold 3D con cruz, rayos de luz, marco
decorativo, "T.N.V.S.T" + tagline "MENTORIA DE ELITE" y
"ELEVA TU TRADING" en la base.

Adaptacion automatica por tamano (los detalles se pierden
gradualmente a medida que el tamano es menor):
- 48-72px:  solo T simplificada
- 96-144px: T + cruz + marco + rayos
- 180-192px: + texto T.N.V.S.T y tagline
- 256px+:   + "ELEVA TU TRADING"

Uso:
    pip install Pillow
    py assets/tools/gen_logos.py

Si queres cambiar el diseno, edita las funciones draw_*
(o make_radial_bg para el fondo) y reejecuta el script.
Despues hace un commit con los PNGs regenerados.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import math

# Paleta de colores (RGBA)
GOLD_DARK = (139, 105, 20, 255)
GOLD = (212, 175, 55, 255)
GOLD_BRIGHT = (255, 215, 100, 255)
GOLD_WHITE = (255, 240, 180, 255)
DARK = (8, 5, 16, 255)
DARK_BLUE = (12, 8, 24, 255)
DARK_VERY = (3, 2, 8, 255)


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(len(c1)))


def make_radial_bg(size):
    """Fondo dark con gradiente radial sutil y tinte gold al centro."""
    img = Image.new('RGBA', (size, size), DARK)
    px = img.load()
    cx, cy = size / 2, size * 0.45
    max_r = size * 0.6
    for y in range(size):
        for x in range(size):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            t = min(1.0, d / max_r)
            r = int(DARK_BLUE[0] + (DARK_VERY[0] - DARK_BLUE[0]) * t)
            g = int(DARK_BLUE[1] + (DARK_VERY[1] - DARK_BLUE[1]) * t)
            b = int(DARK_BLUE[2] + (DARK_VERY[2] - DARK_BLUE[2]) * t)
            if t < 0.3:
                gold_t = (0.3 - t) / 0.3
                r = min(255, int(r + 40 * gold_t))
                g = min(255, int(g + 30 * gold_t))
                b = min(255, int(b + 10 * gold_t))
            px[x, y] = (r, g, b, 255)
    return img


def draw_light_rays(img, size):
    if size < 96:
        return
    d = ImageDraw.Draw(img)
    cx, cy = size / 2, size * 0.35
    num_rays = 24
    max_len = size * 0.45
    for i in range(num_rays):
        angle = (i / num_rays) * 2 * math.pi
        ray_len = max_len * (0.7 if i % 2 == 0 else 0.4)
        end_x = cx + math.cos(angle) * ray_len
        end_y = cy + math.sin(angle) * ray_len
        opacity = 80 if i % 2 == 0 else 40
        d.line([(cx, cy), (end_x, end_y)], fill=(255, 215, 100, opacity), width=max(1, size // 200))


def draw_cross_with_rays(img, size):
    if size < 64:
        return
    d = ImageDraw.Draw(img)
    cx = size / 2
    cross_y = size * 0.18
    cross_w = size * 0.025
    cross_h = size * 0.09
    glow_r = int(cross_h * 0.8)
    for r in range(glow_r, 0, -2):
        alpha = max(20, 100 - r * 2)
        d.ellipse([cx - r, cross_y - r, cx + r, cross_y + r], fill=(255, 230, 150, alpha))
    d.rectangle([cx - cross_w/2, cross_y - cross_h/2, cx + cross_w/2, cross_y + cross_h/2], fill=GOLD_BRIGHT)
    d.rectangle([cx - cross_w/2, cross_y - cross_w/2, cx + cross_w/2, cross_y + cross_w/2], fill=GOLD_BRIGHT)
    d.rectangle([cx - cross_w/2, cross_y - cross_h/2, cx + cross_w/2, cross_y + cross_h/2], outline=GOLD_DARK, width=1)
    d.rectangle([cx - cross_w/2, cross_y - cross_w/2, cx + cross_w/2, cross_y + cross_w/2], outline=GOLD_DARK, width=1)


def draw_ornate_t(img, size):
    """T ornamentado gold 3D con glow, gradiente y serifs."""
    d = ImageDraw.Draw(img)
    cx = size / 2
    cy = size * 0.5
    t_height = size * 0.42
    t_width = size * 0.42
    stem_w = t_width * 0.18
    serif_h = t_height * 0.08
    serif_extend = t_width * 0.08
    top_color = GOLD_BRIGHT
    mid_color = GOLD
    bot_color = GOLD_DARK

    top_y = cy - t_height / 2
    bot_y = cy + t_height / 2
    crossbar_y = top_y + serif_h

    if size >= 96:
        glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.rectangle([cx - t_width/2, top_y, cx + t_width/2, crossbar_y], fill=(255, 215, 100, 100))
        gd.rectangle([cx - stem_w/2, crossbar_y, cx + stem_w/2, bot_y], fill=(255, 215, 100, 100))
        gd.rectangle([cx - t_width/2 - serif_extend, top_y, cx - t_width/2, top_y + serif_h], fill=(255, 215, 100, 100))
        gd.rectangle([cx + t_width/2, top_y, cx + t_width/2 + serif_extend, top_y + serif_h], fill=(255, 215, 100, 100))
        gd.rectangle([cx - stem_w/2 - serif_extend, bot_y - serif_h, cx - stem_w/2, bot_y], fill=(255, 215, 100, 100))
        gd.rectangle([cx + stem_w/2, bot_y - serif_h, cx + stem_w/2 + serif_extend, bot_y], fill=(255, 215, 100, 100))
        glow = glow.filter(ImageFilter.GaussianBlur(int(size * 0.05)))
        img.alpha_composite(glow)

    gradient = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gpx = gradient.load()
    for y in range(int(top_y), int(bot_y) + 1):
        rel = (y - top_y) / max(1, (bot_y - top_y))
        if rel < 0.5:
            c = lerp_color(top_color, mid_color, rel * 2)
        else:
            c = lerp_color(mid_color, bot_color, (rel - 0.5) * 2)
        for x in range(size):
            gpx[x, y] = (c[0], c[1], c[2], 255)

    mask_layer = Image.new('L', (size, size), 0)
    md = ImageDraw.Draw(mask_layer)
    md.rectangle([cx - t_width/2, top_y, cx + t_width/2, crossbar_y], fill=255)
    md.rectangle([cx - stem_w/2, crossbar_y, cx + stem_w/2, bot_y], fill=255)
    md.rectangle([cx - t_width/2 - serif_extend, top_y, cx - t_width/2, top_y + serif_h], fill=255)
    md.rectangle([cx + t_width/2, top_y, cx + t_width/2 + serif_extend, top_y + serif_h], fill=255)
    md.rectangle([cx - stem_w/2 - serif_extend, bot_y - serif_h, cx - stem_w/2, bot_y], fill=255)
    md.rectangle([cx + stem_w/2, bot_y - serif_h, cx + stem_w/2 + serif_extend, bot_y], fill=255)
    img.paste(gradient, (0, 0), mask=mask_layer)

    if size >= 96:
        hl = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        hd = ImageDraw.Draw(hl)
        max_offset = min(3, int(serif_h / 2))
        if max_offset > 0:
            for offset in range(max_offset):
                a = max(50, 180 - offset * 60)
                hd.rectangle([cx - t_width/2 + offset, top_y + offset, cx + t_width/2 - offset, top_y + serif_h], fill=(255, 240, 180, a))
                hd.rectangle([cx - t_width/2 - serif_extend + offset, top_y + offset, cx - t_width/2, top_y + serif_h + offset], fill=(255, 240, 180, a))
                hd.rectangle([cx + t_width/2, top_y + offset, cx + t_width/2 + serif_extend - offset, top_y + serif_h + offset], fill=(255, 240, 180, a))
        img.alpha_composite(hl)

    bd = ImageDraw.Draw(img)
    line_w = max(1, int(size / 250))
    bd.rectangle([cx - t_width/2, top_y, cx + t_width/2, crossbar_y], outline=(60, 40, 5, 255), width=line_w)
    bd.rectangle([cx - stem_w/2, crossbar_y, cx + stem_w/2, bot_y], outline=(60, 40, 5, 255), width=line_w)
    bd.rectangle([cx - t_width/2 - serif_extend, top_y, cx - t_width/2, top_y + serif_h], outline=(60, 40, 5, 255), width=line_w)
    bd.rectangle([cx + t_width/2, top_y, cx + t_width/2 + serif_extend, top_y + serif_h], outline=(60, 40, 5, 255), width=line_w)
    bd.rectangle([cx - stem_w/2 - serif_extend, bot_y - serif_h, cx - stem_w/2, bot_y], outline=(60, 40, 5, 255), width=line_w)
    bd.rectangle([cx + stem_w/2, bot_y - serif_h, cx + stem_w/2 + serif_extend, bot_y], outline=(60, 40, 5, 255), width=line_w)

    if size >= 192:
        gem_size = max(2, int(size * 0.012))
        for (gx, gy) in [
            (cx - t_width/2 - serif_extend/2, top_y + serif_h/2),
            (cx + t_width/2 + serif_extend/2, top_y + serif_h/2),
        ]:
            bd.ellipse([gx - gem_size, gy - gem_size, gx + gem_size, gy + gem_size], fill=GOLD_BRIGHT, outline=GOLD_DARK)


def draw_ornamental_frame(img, size):
    if size < 96:
        return
    d = ImageDraw.Draw(img)
    line_w = max(1, int(size * 0.006))
    margin = size * 0.04
    corner_size = size * 0.12
    for cx, cy, dx, dy in [
        (margin, margin, 1, 1),
        (size - margin, margin, -1, 1),
        (margin, size - margin, 1, -1),
        (size - margin, size - margin, -1, -1),
    ]:
        d.line([(cx, cy + dy * corner_size * 0.3), (cx, cy), (cx + dx * corner_size, cy)], fill=GOLD[:3] + (180,), width=line_w)


def draw_tnsvt_text(img, size):
    if size < 96:
        return
    d = ImageDraw.Draw(img)
    cy = size * 0.5
    text_y = int(cy + size * 0.27)
    try:
        font_path = "C:\\Windows\\Fonts\\georgia.ttf"
        font_main = ImageFont.truetype(font_path, int(size * 0.045))
        font_sub = ImageFont.truetype(font_path, int(size * 0.022))
    except Exception:
        try:
            font_main = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", int(size * 0.045))
            font_sub = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", int(size * 0.022))
        except Exception:
            font_main = ImageFont.load_default()
            font_sub = ImageFont.load_default()
    text = "T.N.V.S.T"
    bbox = d.textbbox((0, 0), text, font=font_main)
    text_w = bbox[2] - bbox[0]
    d.text(((size - text_w) / 2 - bbox[0], text_y - bbox[1]), text, fill=GOLD_BRIGHT, font=font_main)
    sub_text = "MENTORIA DE ELITE"
    bbox2 = d.textbbox((0, 0), sub_text, font=font_sub)
    sub_w = bbox2[2] - bbox2[0]
    sub_y = text_y + int(size * 0.05) - bbox2[1]
    d.text(((size - sub_w) / 2 - bbox2[0], sub_y), sub_text, fill=GOLD, font=font_sub)


def draw_elevate_trading(img, size):
    if size < 256:
        return
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("C:\\Windows\\Fonts\\georgiab.ttf", int(size * 0.06))
    except Exception:
        try:
            font = ImageFont.truetype("C:\\Windows\\Fonts\\georgia.ttf", int(size * 0.06))
        except Exception:
            font = ImageFont.load_default()
    text = "ELEVA TU TRADING"
    bbox = d.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_y = int(size * 0.88) - bbox[1]
    d.text(((size - text_w) / 2 - bbox[0] + 1, text_y + 1), text, fill=(0, 0, 0, 200), font=font)
    d.text(((size - text_w) / 2 - bbox[0], text_y), text, fill=GOLD_BRIGHT, font=font)


def make_icon(size, is_maskable=False, is_foreground=False):
    if is_foreground:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw_ornate_t(img, size)
    else:
        if is_maskable:
            img = Image.new('RGBA', (size, size), DARK)
        else:
            img = make_radial_bg(size)
        draw_light_rays(img, size)
        draw_ornamental_frame(img, size)
        draw_cross_with_rays(img, size)
        draw_ornate_t(img, size)
        draw_tnsvt_text(img, size)
        if not is_maskable:
            draw_elevate_trading(img, size)
    return img


def save_icon(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, 'PNG', optimize=True)
    print(f"  {path} ({img.size[0]}x{img.size[1]}, {os.path.getsize(path)} bytes)")


if __name__ == "__main__":
    # Paths relativos al root del proyecto (asume que se corre desde ahi)
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    pwa_dir = os.path.join(project_root, "public", "icons")
    res_dir = os.path.join(project_root, "android", "app", "src", "main", "res")

    print("\n=== PWA Icons ===")
    save_icon(make_icon(180), os.path.join(pwa_dir, "apple-touch-icon.png"))
    save_icon(make_icon(192), os.path.join(pwa_dir, "icon-192.png"))
    save_icon(make_icon(512), os.path.join(pwa_dir, "icon-512.png"))
    save_icon(make_icon(512, is_maskable=True), os.path.join(pwa_dir, "maskable-512.png"))

    print("\n=== Android Native ===")
    sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    for d, sz in sizes.items():
        save_icon(make_icon(sz), os.path.join(res_dir, f"mipmap-{d}", "ic_launcher.png"))
        save_icon(make_icon(sz), os.path.join(res_dir, f"mipmap-{d}", "ic_launcher_round.png"))

    print("\n=== Android Foreground (Adaptive Icons) ===")
    fg_sizes = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
    for d, sz in fg_sizes.items():
        save_icon(make_icon(sz, is_foreground=True), os.path.join(res_dir, f"mipmap-{d}", "ic_launcher_foreground.png"))

    print("\n=== Listo! Ahora hace un build del APK ===")
    print("    .\\build_apk.bat release")
    print("    adb install -r android\\app\\build\\outputs\\apk\\release\\app-release.apk")
