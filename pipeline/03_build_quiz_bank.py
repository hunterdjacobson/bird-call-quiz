import json
import logging
import re
from pathlib import Path

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

def generate_slug(name: str) -> str:
    """
    Generate a short slug from the common name.
    Converts to lowercase, replaces spaces and hyphens with underscores,
    and removes other non-alphanumeric characters.
    """
    cleaned = name.lower().replace(" ", "_").replace("-", "_")
    return re.sub(r'[^a-z0-9_]', '', cleaned)

def main():
    # Use pathlib.Path throughout
    script_dir = Path(__file__).parent.resolve()
    recordings_path = script_dir / "raw_recordings.json"
    photos_path = script_dir / "raw_photos.json"
    
    workspace_root = script_dir.parent
    output_path = workspace_root / "frontend" / "src" / "data" / "quizBank.json"

    # Verify input files exist
    if not recordings_path.exists():
        logger.error(f"Raw recordings not found at {recordings_path}")
        return
    if not photos_path.exists():
        logger.error(f"Raw photos not found at {photos_path}")
        return

    # Load data
    with open(recordings_path, "r", encoding="utf-8") as f:
        recordings = json.load(f)
    
    with open(photos_path, "r", encoding="utf-8") as f:
        photos = json.load(f)

    # Create mapping of common_name -> photo data
    photos_map = {item["common_name"]: item for item in photos}

    quiz_bank = []
    missing_audio_count = 0
    missing_photo_count = 0
    missing_fact_count = 0

    for rec in recordings:
        common_name = rec["common_name"]
        audio_url = rec.get("file_url")

        # Drop any entry where audio_url is missing
        if not audio_url:
            missing_audio_count += 1
            logger.warning(f"Dropping {common_name} because audio_url is missing.")
            continue

        # Get matching photo and fun fact
        photo_info = photos_map.get(common_name, {})
        thumbnail_url = photo_info.get("thumbnail_url")
        fun_fact = photo_info.get("fun_fact")

        if not thumbnail_url:
            missing_photo_count += 1
        if not fun_fact:
            missing_fact_count += 1

        # Build dictionary entry
        entry = {
            "id": generate_slug(common_name),
            "common_name": common_name,
            "scientific_name": rec["scientific_name"],
            "family": rec["family"],
            "audio_url": audio_url,
            "recordist": rec.get("recordist"),
            "license_url": rec.get("license_url"),
            "country": rec.get("country"),
            "thumbnail_url": thumbnail_url,
            "fun_fact": fun_fact
        }
        quiz_bank.append(entry)

    # Sort alphabetically by common_name
    quiz_bank.sort(key=lambda x: x["common_name"])

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Save to frontend/src/data/quizBank.json
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(quiz_bank, f, indent=2, ensure_ascii=False)

    logger.info(f"Quiz bank successfully saved to {output_path}")

    # Print summary information
    print("\n" + "=" * 40)
    print("BUILD QUIZ BANK SUMMARY")
    print("=" * 40)
    print(f"Final Playable Bird Count:   {len(quiz_bank)}")
    print(f"Dropped (Missing Audio):     {missing_audio_count}")
    print(f"Missing Thumbnail URL:       {missing_photo_count}")
    print(f"Missing Fun Fact:            {missing_fact_count}")
    print("=" * 40)

if __name__ == "__main__":
    main()
