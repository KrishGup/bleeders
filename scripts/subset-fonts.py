#!/usr/bin/env python3
"""Subset Shippori Mincho down to the handful of glyphs Bleedle actually uses.

The full Japanese font is ~1.4 MB per weight; Bleedle needs a few hundred
characters, so we ship two tiny subsets instead:

* ``shippori-kanji-800.woff2`` — decorative UI kanji/kana (mode emblems,
  achievement seals, the logo's katakana, race glyphs, …)
* ``shippori-names-700.woff2`` — every character's Japanese name

Run after adding Japanese text anywhere in ``src``:

    pip install fonttools brotli
    npm run fonts

The script also writes ``src/assets/fonts/glyphs.json``; a unit test checks
that every Japanese character in the source is covered by it.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = SRC / "assets" / "fonts"
FONT_DIR = ROOT / "node_modules" / "@fontsource" / "shippori-mincho" / "files"

CJK = re.compile(r"[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]")
JP_FIELD = re.compile(r"\bjp:\s*'([^']*)'")


def collect() -> tuple[set[str], set[str]]:
    ui: set[str] = set()
    names: set[str] = set()
    for path in sorted(SRC.rglob("*")):
        if path.suffix not in {".ts", ".tsx", ".css"} or "assets" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        if "characters" in path.parts:
            for match in JP_FIELD.finditer(text):
                names.update(CJK.findall(match.group(1)))
            text = JP_FIELD.sub("", text)
        ui.update(CJK.findall(text))
    names.update("・ ")
    return ui, names


def build(chars: set[str], weight: int, out_name: str) -> list[str]:
    source = FONT_DIR / f"shippori-mincho-japanese-{weight}-normal.woff2"
    font = TTFont(source)
    cmap = font.getBestCmap()
    missing = sorted(ch for ch in chars if ord(ch) not in cmap and not ch.isspace())

    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(text="".join(sorted(chars)))
    subsetter.subset(font)
    OUT.mkdir(parents=True, exist_ok=True)
    font.flavor = "woff2"
    font.save(OUT / out_name)
    return missing


def main() -> int:
    if not FONT_DIR.exists():
        print("Run `npm install` first (needs @fontsource/shippori-mincho).", file=sys.stderr)
        return 1
    ui, names = collect()
    missing_ui = build(ui, 800, "shippori-kanji-800.woff2")
    missing_names = build(names, 700, "shippori-names-700.woff2")
    (OUT / "glyphs.json").write_text(
        json.dumps({"ui": "".join(sorted(ui)), "names": "".join(sorted(names))}, ensure_ascii=False, indent=2)
        + "\n",
        encoding="utf-8",
    )
    for label, path in (("UI", "shippori-kanji-800.woff2"), ("names", "shippori-names-700.woff2")):
        print(f"{label:>5}: {(OUT / path).stat().st_size / 1024:6.1f} KB")
    print(f"glyphs: {len(ui)} UI, {len(names)} names")
    if missing_ui or missing_names:
        # Fine: the browser falls back to a system Japanese font per glyph.
        print("not in Shippori (system fallback):", "".join(missing_ui + missing_names))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
