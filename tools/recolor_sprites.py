#!/usr/bin/env python3
"""A GameBoy-os matecska sprite-csík átszínezése a színes (CGB) palettákra.

Bemenet: ../matecska/assets/matecska_sprites_1x.png (240x16, 15 db 16x16 kocka,
DMG zöld rámpa: világos #8BAC0F, közép #306230, sötét #0F380F, átlátszó háttér).
Kimenet: Matecska/Assets.xcassets/CatSprites.imageset/CatSprites.png

A paletták a GameBoy projekt src/render.c fájljából származnak.
Futtatás: ../matecska/.venv/bin/python tools/recolor_sprites.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "matecska" / "assets" / "matecska_sprites_1x.png"
DST = ROOT / "Matecska" / "Assets.xcassets" / "CatSprites.imageset" / "CatSprites.png"

FRAME = 16
DMG = {"L": (0x8B, 0xAC, 0x0F), "M": (0x30, 0x62, 0x30), "D": (0x0F, 0x38, 0x0F)}

CAT = {"L": (0xFF, 0xB3, 0x47), "M": (0xC6, 0x5D, 0x1E), "D": (0x1A, 0x1A, 0x1A)}
BOWL_FISH = {"L": (0xA8, 0xDA, 0xDC), "M": (0x45, 0x7B, 0x9D), "D": (0x1D, 0x35, 0x57)}
BOWL_KIBBLE = {"L": (0xE9, 0xC4, 0x6A), "M": (0xB5, 0x65, 0x1D), "D": (0x4A, 0x2C, 0x0B)}
BOWL_VEG = {"L": (0xB7, 0xE4, 0xA0), "M": (0x52, 0xA4, 0x47), "D": (0x1E, 0x56, 0x31)}
HEART = {"L": (0xFF, 0xB3, 0xC1), "M": (0xE6, 0x39, 0x46), "D": (0x7A, 0x10, 0x20)}
DROP = {"L": (0xBD, 0xE0, 0xFE), "M": (0x4A, 0x90, 0xE2), "D": (0x1F, 0x4E, 0x9A)}


def palette_for(frame: int, x_in_frame: int) -> dict:
    if frame <= 10:
        return CAT
    if frame == 11:
        return BOWL_FISH
    if frame == 12:
        return BOWL_KIBBLE
    if frame == 13:
        return BOWL_VEG
    return HEART if x_in_frame < FRAME // 2 else DROP


def main() -> None:
    src = Image.open(SRC).convert("RGBA")
    assert src.size == (15 * FRAME, FRAME), src.size
    dmg_to_key = {rgb: key for key, rgb in DMG.items()}
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    unknown = set()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = src.getpixel((x, y))
            if a == 0:
                continue
            key = dmg_to_key.get((r, g, b))
            if key is None:
                unknown.add((r, g, b))
                continue
            pal = palette_for(x // FRAME, x % FRAME)
            out.putpixel((x, y), (*pal[key], 255))
    if unknown:
        raise SystemExit(f"Ismeretlen színek a forrásban: {sorted(unknown)}")
    DST.parent.mkdir(parents=True, exist_ok=True)
    out.save(DST)
    print(f"OK {DST.relative_to(ROOT)} {out.size}")


if __name__ == "__main__":
    main()
