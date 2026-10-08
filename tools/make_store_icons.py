"""Generates the Microsoft Store tile and icon images in build/appx from
assets/icon.png.  electron-builder picks them up when building the Store
package (npm run dist:store).  Run:  python3 tools/make_store_icons.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "icon.png"
OUT = ROOT / "build" / "appx"
TILE_GREEN = (206, 223, 190)  # the icon's background colour


def canvas(icon, width, height, fill):
    """Transparent width x height image with the icon centred, `fill` of the height."""
    side = max(1, round(min(width, height) * fill))
    im = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    small = icon.resize((side, side), Image.LANCZOS)
    im.paste(small, ((width - side) // 2, (height - side) // 2), small)
    return im


def main():
    icon = Image.open(SRC).convert("RGBA")
    # the paper's shadow in icon.png is see-through; fill it with the icon's own green
    # so the Start menu or taskbar colour does not show through it
    solid = Image.new("RGBA", icon.size, TILE_GREEN + (0,))
    solid.putalpha(icon.getchannel("A").point(lambda a: 255 if a else 0))
    icon = Image.alpha_composite(solid, icon)
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.png"):
        old.unlink()
    files = {}

    # name, base width, base height, how much of the tile the icon fills
    tiles = [
        ("StoreLogo", 50, 50, 1.0),
        ("Square44x44Logo", 44, 44, 1.0),
        ("Square150x150Logo", 150, 150, 0.7),
        ("Wide310x150Logo", 310, 150, 0.7),
        ("SmallTile", 71, 71, 0.8),
        ("LargeTile", 310, 310, 0.7),
    ]
    for name, w, h, fill in tiles:
        files[f"{name}.png"] = canvas(icon, w, h, fill)
        files[f"{name}.scale-200.png"] = canvas(icon, w * 2, h * 2, fill)

    # taskbar, Start and search icons; "unplated" ones are drawn without a backing square
    for size in (16, 24, 32, 48, 256):
        im = canvas(icon, size, size, 1.0)
        files[f"Square44x44Logo.targetsize-{size}.png"] = im
        files[f"Square44x44Logo.targetsize-{size}_altform-unplated.png"] = im
        files[f"Square44x44Logo.targetsize-{size}_altform-lightunplated.png"] = im

    for name, im in sorted(files.items()):
        im.save(OUT / name, optimize=True)
    print("wrote", len(files), "images to", OUT)


if __name__ == "__main__":
    main()
