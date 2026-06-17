"""
Genera los iconos del juego T.N.S.V.T Market Instinct (com.tnsvt.game)
Logo: letra "T" dorada con gamepad emoji, fondo violeta oscuro.
Version optimizada: sin loops pixel-by-pixel.
"""
from PIL import Image, ImageDraw, ImageFont
import os
import math

OUTPUT_ROOT = r"C:\Users\HP 240 inch G9\tnsvt-symfony\game-app\android\app\src\main\res"

BG_DARK = (13, 10, 26)
BG_DARKER = (6, 4, 15)
GOLD = (212, 175, 55)
GOLD_BRIGHT = (240, 192, 96)
GOLD_LIGHT = (255, 240, 192)
VIOLET = (147, 83, 255)
VIOLET_DARK = (122, 61, 224)
VIOLET_LIGHT = (200, 160, 255)
GREEN = (74, 222, 128)
RED = (248, 113, 113)

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i]-c1[i]) * t) for i in range(3))

def find_font(size, bold=True):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\calibrib.ttf",
    ]
    if not bold:
        candidates = [r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf"]
    for f in candidates:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, size)
            except: continue
    return ImageFont.load_default()

def make_gradient_bg(size):
    """Fondo con gradiente diagonal via Image.linear_gradient"""
    c1 = hex_to_rgb('#0d0a1a')
    c2 = hex_to_rgb('#1a1230')
    # Crear gradiente vertical simple
    img = Image.new('RGB', (size, size), c1)
    # Mezclar colores en lineas
    for y in range(size):
        t = y / size
        col = lerp_color(c1, c2, t)
        for x in range(size):
            # Mezclar con diagonal
            t2 = (x + y) / (2 * size)
            col2 = lerp_color(c1, c2, t2)
            img.putpixel((x, y), col2)
    return img

def draw_T_layer(size):
    """Retorna una capa RGBA con la T en blanco, alpha=letra"""
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    font_size = int(size * 0.72)
    font = find_font(font_size, bold=True)
    text = "T"
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) / 2 - bbox[0]
    y = (size - h) / 2 - bbox[1] - int(size * 0.04)
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    return layer

def draw_gamepad(draw, size):
    """Dibuja un gamepad estilo emoji en la esquina inferior derecha"""
    s = int(size * 0.32)
    cx, cy = int(size * 0.74), int(size * 0.74)
    pad_color = (40, 32, 70)
    body_w = int(s * 1.1)
    body_h = int(s * 0.65)
    # Cuerpo principal
    draw.rounded_rectangle(
        [cx - body_w//2, cy - body_h//2, cx + body_w//2, cy + body_h//2],
        radius=body_h//2, fill=pad_color, outline=GOLD_BRIGHT, width=max(1, size//200)
    )
    # D-pad (cruz)
    d = max(2, size // 40)
    dd = s // 8
    draw.rectangle([cx - s//3 - dd, cy - d, cx - s//3 + dd, cy + d], fill=GOLD_BRIGHT)
    draw.rectangle([cx - s//3 - d, cy - dd, cx - s//3 + d, cy + dd], fill=GOLD_BRIGHT)
    # Botones
    br = max(2, size // 50)
    bpos = [
        (cx + s//4, cy - s//5, GOLD_BRIGHT),
        (cx + s//3 + s//12, cy, VIOLET_LIGHT),
        (cx + s//4, cy + s//5, GREEN),
        (cx + s//6, cy, RED),
    ]
    for bx, by, bc in bpos:
        draw.ellipse([bx - br, by - br, bx + br, by + br], fill=bc)

def make_logo(size, with_controller=True):
    """Genera el logo completo"""
    img = make_gradient_bg(size).convert('RGBA')

    # Halo violeta
    halo = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    halo_r = int(size * 0.42)
    for i in range(8, 0, -1):
        alpha = int(15 * i / 8)
        r = halo_r + i * 3
        hd.ellipse([size//2 - r, size//2 - r, size//2 + r, size//2 + r], outline=(147, 83, 255, alpha), width=2)
    img = Image.alpha_composite(img, halo)

    # T con gradiente dorado
    t_layer = draw_T_layer(size)
    t_alpha = t_layer.split()[3]
    # Crear gradiente dorado
    grad = Image.new('RGB', (1, size))
    for y in range(size):
        t = y / size
        col = lerp_color(GOLD, GOLD_LIGHT, t)
        grad.putpixel((0, y), col)
    grad = grad.resize((size, size), Image.BILINEAR)
    # Aplicar gradiente con la máscara de la T
    t_colored = Image.composite(grad, Image.new('RGB', (size, size), (0, 0, 0)), t_alpha.convert('L'))
    img.paste(t_colored, (0, 0), t_alpha)

    # Borde/resaltado de la T (opcional, muy sutil)
    # Skip para mantener limpieza

    # Gamepad
    if with_controller:
        draw = ImageDraw.Draw(img)
        draw_gamepad(draw, size)

    return img.convert('RGB')

def save_mipmaps():
    sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
        'mipmap-anydpi-v26': 192,
    }
    for folder, sz in sizes.items():
        out_dir = os.path.join(OUTPUT_ROOT, folder)
        os.makedirs(out_dir, exist_ok=True)
        logo = make_logo(sz, with_controller=True)
        logo.save(os.path.join(out_dir, 'ic_launcher.png'))
        logo_round = make_logo(sz, with_controller=False)
        logo_round.save(os.path.join(out_dir, 'ic_launcher_round.png'))
        # Foreground para adaptive icon (grande, padding alrededor)
        fg_size = 432 if folder == 'mipmap-anydpi-v26' else int(sz * 2.25)
        fg = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
        inner = make_logo(int(fg_size * 0.72), with_controller=True)
        offset = (fg_size - inner.width) // 2
        fg.paste(inner, (offset, offset))
        fg.save(os.path.join(out_dir, 'ic_launcher_foreground.png'))
        print(f"OK {folder}/ic_launcher.png + foreground ({sz}px)")

    # Splash
    out_splash = os.path.join(OUTPUT_ROOT, 'drawable', 'splash.png')
    os.makedirs(os.path.dirname(out_splash), exist_ok=True)
    splash = make_logo(512, with_controller=True)
    splash.save(out_splash)
    print(f"OK drawable/splash.png (512px)")

    for dens, mult in [('mdpi',1),('hdpi',1.5),('xhdpi',2),('xxhdpi',3),('xxxhdpi',4)]:
        for orient in ['port', 'land']:
            sz = int(512 * mult)
            sp = make_logo(sz, with_controller=True)
            out_dir = os.path.join(OUTPUT_ROOT, f'drawable-{orient}-{dens}')
            os.makedirs(out_dir, exist_ok=True)
            sp.save(os.path.join(out_dir, 'splash.png'))
            print(f"OK drawable-{orient}-{dens}/splash.png ({sz}px)")

if __name__ == '__main__':
    print("Generando iconos T.N.S.V.T Market Instinct (optimizado)...")
    save_mipmaps()
    print("\nListo.")
