"""Genera los sprites de personajes a partir de las fotos originales.

Recorta cada foto a un cuadrado centrado en la cara (deteccion simple por
tono de piel), la escala y la guarda como WebP en `public/characters/<familia>/`.

La lista de personajes vive en `src/data/characters.json`, que es tambien la
que lee el juego: asi los sprites y los datos no pueden desincronizarse.
Las fotos originales viven en `assets/originals/<familia>/` y no se suben a Git.

Uso:
    python scripts/prepare-characters.py
    python scripts/prepare-characters.py --size 320 --quality 78
    python scripts/prepare-characters.py --only valverde
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "src" / "data" / "characters.json"
SOURCE_DIR = ROOT / "assets" / "originals"
OUTPUT_DIR = ROOT / "public" / "characters"

DEFAULT_SIZE = 384
DEFAULT_QUALITY = 80
# Ancho del recorte en multiplos del ancho de la cara detectada. Las fotos de
# los Valverde son primerisimos planos, asi que un ratio alto se satura y acaba
# recortando el cuadrado entero; cada personaje puede ajustarlo en el manifiesto
# con "cropRatio".
DEFAULT_CROP_FACE_RATIO = 1.85
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


def crop_square(img: Image.Image, size: int, ratio: float, manual: dict | None) -> Image.Image:
    """Cuadrado alrededor de la cara.

    Si el personaje trae `crop` en el manifiesto se usa tal cual (fracciones:
    `cx` del ancho, `cy` del alto, `side` del lado corto). Es lo que necesitan
    los primerisimos planos, donde la cara ocupa el fotograma entero y no hay
    deteccion que ayude: lo unico que se decide es el encuadre.
    """
    if manual:
        side = float(manual["side"]) * min(img.width, img.height)
        cx = float(manual["cx"]) * img.width
        cy = float(manual["cy"]) * img.height
    else:
        rgb = np.asarray(img.convert("RGB"))
        cx, cy, face_w = face_box(rgb)
        side = max(face_w * ratio, size)
        cy -= side * CROP_RISE

    side = min(side, min(img.width, img.height))

    left = int(round(min(max(cx - side / 2, 0), img.width - side)))
    top = int(round(min(max(cy - side / 2, 0), img.height - side)))
    return img.crop((left, top, left + int(side), top + int(side)))


def load_manifest() -> list[dict]:
    with MANIFEST.open(encoding="utf-8") as fh:
        return json.load(fh)["families"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--size", type=int, default=DEFAULT_SIZE, help="lado del sprite en px")
    parser.add_argument("--quality", type=int, default=DEFAULT_QUALITY, help="calidad WebP 0-100")
    parser.add_argument("--only", help="procesar solo esta familia")
    args = parser.parse_args()

    total_bytes = 0
    total_files = 0
    missing: list[str] = []

    for family in load_manifest():
        if args.only and family["id"] != args.only:
            continue

        src_dir = SOURCE_DIR / family["id"]
        out_dir = OUTPUT_DIR / family["id"]
        out_dir.mkdir(parents=True, exist_ok=True)

        for char in family["characters"]:
            src = src_dir / char["source"]
            if not src.exists():
                missing.append(str(src.relative_to(ROOT)))
                continue

            ratio = float(char.get("cropRatio", DEFAULT_CROP_FACE_RATIO))
            img = Image.open(src).convert("RGB")
            sprite = crop_square(img, args.size, ratio, char.get("crop")).resize(
                (args.size, args.size), Image.LANCZOS
            )
            out = out_dir / f"{char['id']}.webp"
            sprite.save(out, "WEBP", quality=args.quality, method=6)

            size_b = out.stat().st_size
            total_bytes += size_b
            total_files += 1
            print(f"{family['id']}/{src.name:24} -> {out.relative_to(ROOT)} ({size_b // 1024} KB)")

    print(f"\n{total_files} sprites, {total_bytes / 1024:.0f} KB en total")
    if missing:
        print("\nFaltan fotos originales (descargalas a assets/originals/):", file=sys.stderr)
        for m in missing:
            print(f"  - {m}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
