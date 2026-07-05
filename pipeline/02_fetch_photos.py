import json
import logging
import re
import time
from pathlib import Path
import httpx

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

def get_first_sentence(text: str) -> str:
    """
    Extract the first sentence from a text block.
    Splits on punctuation (.!?) followed by whitespace.
    """
    if not text:
        return ""
    text = text.strip()
    # Split on sentence ending punctuation followed by one or more spaces
    sentences = re.split(r'(?<=[.!?])\s+', text)
    if sentences:
        return sentences[0]
    return text

def main():
    script_dir = Path(__file__).parent.resolve()
    species_path = script_dir / "species_list.json"
    output_path = script_dir / "raw_photos.json"

    if not species_path.exists():
        logger.error(f"Species list not found at {species_path}")
        return

    with open(species_path, "r", encoding="utf-8") as f:
        species_list = json.load(f)

    # Wikipedia REST API Summary Endpoint
    base_url = "https://en.wikipedia.org/api/rest_v1/page/summary"
    headers = {
        "User-Agent": "bird-call-quiz/1.0 (contact: hdjno@example.com)"
    }

    results = []
    photo_count = 0
    fact_count = 0
    neither_list = []

    # Use httpx Client
    with httpx.Client(follow_redirects=True, timeout=20.0) as client:
        for idx, species in enumerate(species_list):
            common_name = species["common_name"]
            scientific_name = species["scientific_name"]

            logger.info(f"[{idx + 1}/{len(species_list)}] Fetching info for: {common_name} ({scientific_name})...")

            # Helper function to request and parse Wikipedia summary
            def fetch_wiki_summary(title_name: str):
                title_slug = title_name.replace(" ", "_")
                url = f"{base_url}/{title_slug}"
                try:
                    response = client.get(url, headers=headers)
                    if response.status_code == 404:
                        return None
                    response.raise_for_status()
                    return response.json()
                except Exception as e:
                    logger.debug(f"API request failed for {title_name}: {e}")
                    return None

            # Attempt 1: Using Common Name
            wiki_data = fetch_wiki_summary(common_name)
            
            # Check if Attempt 1 succeeded and has a thumbnail
            has_thumbnail = wiki_data and "thumbnail" in wiki_data and "source" in wiki_data["thumbnail"]
            
            if not wiki_data or not has_thumbnail:
                # Attempt 2: Using Scientific Name (on 404 or missing thumbnail)
                logger.info(f"  Attempting scientific name fallback for: {scientific_name}")
                fallback_data = fetch_wiki_summary(scientific_name)
                if fallback_data:
                    # Keep the fallback if we got a summary (and ideally a thumbnail)
                    wiki_data = fallback_data

            # Process the response data
            thumbnail_url = None
            fun_fact = None

            if wiki_data:
                # Extract thumbnail
                if "thumbnail" in wiki_data and "source" in wiki_data["thumbnail"]:
                    thumbnail_url = wiki_data["thumbnail"]["source"]

                # Extract fun fact (first sentence of extract)
                if "extract" in wiki_data:
                    fun_fact = get_first_sentence(wiki_data["extract"])

            # Log warnings or count achievements
            if thumbnail_url:
                photo_count += 1
            if fun_fact:
                fact_count += 1
            
            if not thumbnail_url and not fun_fact:
                logger.warning(f"No photo and no fact found for: {common_name} ({scientific_name})")
                neither_list.append(common_name)
            elif not thumbnail_url:
                logger.warning(f"No photo found (fact found) for: {common_name} ({scientific_name})")
            elif not fun_fact:
                logger.warning(f"No fact found (photo found) for: {common_name} ({scientific_name})")

            results.append({
                "common_name": common_name,
                "thumbnail_url": thumbnail_url,
                "fun_fact": fun_fact
            })

            # Sleep 0.5 seconds between requests
            time.sleep(0.5)

    # Save outputs to raw_photos.json
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    # Print Summary
    print("\n" + "=" * 40)
    print("PHOTO/FACT FETCH SUMMARY")
    print("=" * 40)
    print(f"Total Species Processed: {len(species_list)}")
    print(f"Got Photo:              {photo_count}")
    print(f"Got Fact:               {fact_count}")
    if neither_list:
        print(f"Species with Neither ({len(neither_list)}):")
        for sp in neither_list:
            print(f"  - {sp}")
    else:
        print("Species with Neither: None")
    print("=" * 40)

if __name__ == "__main__":
    main()
