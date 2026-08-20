"""Genera los sprites de personajes a partir de las fotos originales.

Recorta cada foto a un cuadrado centrado en la cara (deteccion simple por
tono de piel), la escala a SPRITE_SIZE y la guarda como WebP en
`public/characters/`. Las fotos originales viven en `assets/originals/`.

Uso:  python scripts/prepare-characters.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "assets" / "originals"
OUTPUT_DIR = ROOT / "public" / "characters"
SPRITE_SIZE = 384
# Ancho del recorte en multiplos del ancho de la cara detectada.
CROP_FACE_RATIO = 1.85
# Cuanto sube el recorte respecto al centro de la cara (deja sitio al pelo).
CROP_RISE = 0.10


def skin_mask(rgb: np.ndarray) -> np.ndarray:
    r = rgb[:, :, 0].astype(np.int16)
    g = rgb[:, :, 1].astype(np.int16)
    b = rgb[:, :, 2].astype(np.int16)
    y = 0.299 * r + 0.587 * g + 0.114 * b
    cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
    cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
    return (y > 60) & (cb > 77) & (cb < 130) & (cr > 133) & (cr < 178)


def face_box(rgb: np.ndarray) -> tuple[float, float, float]:
    """Devuelve (centro_x, centro_y, ancho) de la cara en pixeles."""
    mask = skin_mask(rgb)
    rows = mask.sum(axis=1)
    if rows.sum() == 0:
        h, w = mask.shape
        return w / 2, h * 0.3, w * 0.4

    # La cara es la mancha de piel mas alta y densa: nos quedamos con las
    # filas por encima del percentil 60 de piel acumulada.
    ys = np.flatnonzero(rows > rows.max() * 0.15)
    top, bottom = ys[0], ys[-1]
    # Recortamos a la mitad superior de la region de piel (cara, no manos/cuello).
    bottom = top + (bottom - top) * 0.65
    band = mask[int(top) : int(bottom) + 1]
    cols = band.sum(axis=0)
    xs = np.flatnonzero(cols > cols.max() * 0.2)
    left, right = xs[0], xs[-1]
    return (left + right) / 2, (top + bottom) / 2, float(right - left)


def crop_square(img: Image.Image) -> Image.Image:
    rgb = np.asarray(img.convert("RGB"))
    cx, cy, face_w = face_box(rgb)
    side = max(face_w * CROP_FACE_RATIO, SPRITE_SIZE)
    side = min(side, min(img.width, img.height))
    cy -= side * CROP_RISE

    left = int(round(min(max(cx - side / 2, 0), img.width - side)))
    top = int(round(min(max(cy - side / 2, 0), img.height - side)))
    return img.crop((left, top, left + int(side), top + int(side)))


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sources = sorted(SOURCE_DIR.glob("*.png")) + sorted(SOURCE_DIR.glob("*.jpg"))
    if not sources:
        raise SystemExit(f"No hay fotos en {SOURCE_DIR}")

    for path in sources:
        img = Image.open(path).convert("RGB")
        sprite = crop_square(img).resize((SPRITE_SIZE, SPRITE_SIZE), Image.LANCZOS)
        out = OUTPUT_DIR / f"{path.stem}.webp"
        sprite.save(out, "WEBP", quality=88, method=6)
        print(f"{path.name} -> {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
