"""Render the complete annotated facility PDF and create a Leaflet tile pyramid.

Usage: python scripts/build-facility-tiles.py SOURCE.pdf
The PDF is rendered as a page, rather than extracting its background image, so
its separate callouts and annotations remain visible.
"""

from pathlib import Path
import subprocess
import sys
import tempfile

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "facility-map" / "tiles"
WIDTH, HEIGHT = 6429, 4500
MAX_ZOOM = 4
TILE = 256
POPPLER = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe"


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/build-facility-tiles.py SOURCE.pdf")
    source = Path(sys.argv[1]).resolve()
    if not source.is_file():
        raise SystemExit(f"Missing PDF: {source}")
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as directory:
        prefix = Path(directory) / "facility"
        subprocess.run(
            [str(POPPLER), "-f", "1", "-l", "1", "-r", "72", "-singlefile", "-png", str(source), str(prefix)],
            check=True,
        )
        with Image.open(prefix.with_suffix(".png")) as original:
            original.load()
            if original.size != (WIDTH, HEIGHT):
                raise SystemExit(f"Unexpected rendered page size: {original.size}")
            for zoom in range(MAX_ZOOM + 1):
                scale = 2 ** (MAX_ZOOM - zoom)
                size = ((WIDTH + scale - 1) // scale, (HEIGHT + scale - 1) // scale)
                page = original.resize(size, Image.Resampling.LANCZOS) if scale > 1 else original
                count = 0
                for y in range(0, size[1], TILE):
                    for x in range(0, size[0], TILE):
                        tile = Image.new("RGB", (TILE, TILE), "#e8e4d9")
                        tile.paste(page.crop((x, y, min(x + TILE, size[0]), min(y + TILE, size[1]))), (0, 0))
                        dest = OUT / str(zoom) / str(x // TILE)
                        dest.mkdir(parents=True, exist_ok=True)
                        tile.save(dest / f"{y // TILE}.webp", "WEBP", quality=88, method=5)
                        count += 1
                print(f"zoom {zoom}: {size[0]}x{size[1]}, {count} tiles")


if __name__ == "__main__":
    main()
