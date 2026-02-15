"""Batch remove backgrounds from all character sprites."""
import os
from pathlib import Path
from rembg import remove
from PIL import Image

CHARACTERS_DIR = Path(".")
OUTPUT_DIR = Path("public/assets/characters")

CHARACTER_FOLDERS = [
    "athletic-girl",
    "bald-uncle",
    "calm-uncle",
    "modern-aunty",
    "modern-girl",
    "old-aunty",
    "scared-boy",
    "street-boy",
]

def main():
    for folder_name in CHARACTER_FOLDERS:
        src_folder = CHARACTERS_DIR / folder_name
        dst_folder = OUTPUT_DIR / folder_name
        dst_folder.mkdir(parents=True, exist_ok=True)

        for img_name in ["mouth_closed.png", "mouth_open.png"]:
            src_path = src_folder / img_name
            dst_path = dst_folder / img_name

            if not src_path.exists():
                print(f"  SKIP: {src_path} not found")
                continue

            print(f"Processing {src_path} -> {dst_path}")
            inp = Image.open(src_path)
            out = remove(inp)
            out.save(dst_path)
            print(f"  Done: {dst_path}")

    print("\nAll backgrounds removed!")

if __name__ == "__main__":
    main()
