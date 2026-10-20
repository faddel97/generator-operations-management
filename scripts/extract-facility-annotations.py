"""Extract the PDF's real FreeText code annotations into a searchable index."""

import json
from pathlib import Path
import sys

from pypdf import PdfReader


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/extract-facility-annotations.py SOURCE.pdf")
    page = PdfReader(sys.argv[1]).pages[0]
    height = float(page.mediabox.height)
    by_code: dict[str, dict] = {}
    for annotation in page.get("/Annots", []):
        item = annotation.get_object()
        if str(item.get("/Subtype")) != "/FreeText":
            continue
        code = str(item.get("/Contents", "")).strip()
        rect = item.get("/Rect")
        if not code or not rect:
            continue
        x0, y0, x1, y1 = (float(value) for value in rect)
        anchor = {"x": round((x0 + x1) / 2, 2), "y": round(height - (y0 + y1) / 2, 2)}
        if code not in by_code:
            by_code[code] = {"code": code, "annotationBoxes": []}
        by_code[code]["annotationBoxes"].append(anchor)
    destination = Path(__file__).resolve().parents[1] / "src/lib/facility-map/pdf-annotations.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(sorted(by_code.values(), key=lambda row: row["code"]), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Indexed {len(by_code)} distinct engineering codes from {sum(len(row['annotationBoxes']) for row in by_code.values())} PDF annotations")


if __name__ == "__main__":
    main()
