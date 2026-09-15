#!/usr/bin/env python3
"""PWA- és bolti ikonok a macska sprite 0. kockájából, papír háttéren, nearest-neighbor nagyítással.

Bemenet: web/public/sprites/cat.png (a színezett sprite-csík).
Kimenet: web/public/icons/{icon-192,icon-512,icon-512-maskable,apple-touch-icon,favicon}.png
Futtatás: ../matecska/.venv/bin/python tools/make_icons.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "web" / "public" / "sprites" / "cat.png"
OUT = ROOT / "web" / "public" / "icons"
PAPER = (0xFD, 0xF6, 0xE3, 255)
FRAME = 16


def icon(size: int, cat_ratio: float, name: str) -> None:
    sheet = Image.open(SRC).convert("RGBA")
    cat = sheet.crop((0, 0, FRAME, FRAME))
    scale = max(1, int(size * cat_ratio) // FRAME)
    cat = cat.resize((FRAME * scale, FRAME * scale), Image.NEAREST)
    canvas = Image.new("RGBA", (size, size), PAPER)
    offset = ((size - cat.width) // 2, (size - cat.height) // 2)
    canvas.alpha_composite(cat, offset)
    canvas.convert("RGB").save(OUT / name)
    print(f"OK {name} {size}px, macska {cat.width}px")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    icon(192, 0.75, "icon-192.png")
    icon(512, 0.75, "icon-512.png")
    icon(512, 0.55, "icon-512-maskable.png")  # maskable: a biztonságos zóna a középső 80%
    icon(180, 0.75, "apple-touch-icon.png")
    icon(64, 0.9, "favicon.png")


if __name__ == "__main__":
    main()
