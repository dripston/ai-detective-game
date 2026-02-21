"""
Background Remover for Detective Character Images
--------------------------------------------------
Removes background from mouth_closed.png and mouth_open.png
for all character folders.

Install deps first:
    pip install rembg pillow onnxruntime

Usage:
    python remove_bg.py

    By default, looks for:
        ./assets/characters/*/mouth_closed.png
        ./assets/characters/*/mouth_open.png

    Saves output as:
        ./assets/characters/*/mouth_closed.png  (overwrites original)
        ./assets/characters/*/mouth_open.png

    Or if you want to keep originals, set OVERWRITE = False below
    and it will save as mouth_closed_nobg.png etc.
"""

import os
import glob
from pathlib import Path
from PIL import Image
from rembg import remove

# ── Config ──────────────────────────────────────────────
CHARACTERS_DIR = "./assets/characters"   # path to your characters folder
OVERWRITE = True                          # True = replace originals, False = save as _nobg
TARGET_FILES = ["mouth_closed.png", "mouth_open.png"]
# ────────────────────────────────────────────────────────


def remove_bg(input_path: Path, output_path: Path):
    print(f"  Processing: {input_path}")
    with open(input_path, "rb") as f:
        input_data = f.read()

    output_data = remove(input_data)

    with open(output_path, "wb") as f:
        f.write(output_data)

    print(f"  ✓ Saved: {output_path}")


def main():
    char_dir = Path(CHARACTERS_DIR)

    if not char_dir.exists():
        print(f"❌ Directory not found: {char_dir.resolve()}")
        print("   Make sure you run this script from your project root.")
        return

    char_folders = [f for f in char_dir.iterdir() if f.is_dir()]

    if not char_folders:
        print(f"❌ No character folders found inside {char_dir}")
        return

    print(f"🔍 Found {len(char_folders)} character folder(s)\n")

    total = 0
    skipped = 0

    for folder in sorted(char_folders):
        print(f"📁 {folder.name}")
        for filename in TARGET_FILES:
            input_path = folder / filename

            if not input_path.exists():
                print(f"  ⚠️  Skipping (not found): {input_path}")
                skipped += 1
                continue

            if OVERWRITE:
                output_path = input_path
            else:
                stem = input_path.stem
                output_path = folder / f"{stem}_nobg.png"

            remove_bg(input_path, output_path)
            total += 1

        print()

    print(f"✅ Done! Processed {total} image(s), skipped {skipped}.")
    if not OVERWRITE:
        print("   Files saved with _nobg suffix — originals untouched.")


if __name__ == "__main__":
    main()