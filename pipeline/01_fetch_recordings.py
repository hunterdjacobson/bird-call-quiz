import json
import logging
import os
import time
from pathlib import Path
import httpx
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

def parse_length(length_str: str) -> float:
    """
    Parse a length string like 'MM:SS' or 'H:MM:SS' into seconds.
    If format is invalid or empty, return 0.0.
    """
    if not length_str:
        return 0.0
    parts = length_str.strip().split(':')
    try:
        if len(parts) == 1:
            return float(parts[0])
        elif len(parts) == 2:
            return float(parts[0]) * 60 + float(parts[1])
        elif len(parts) == 3:
            return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
    except ValueError:
        pass
    return 0.0

def select_best_recording(recordings: list) -> dict:
    """
    Pick ONE recording per species:
    - Prefer the shortest recording between 3 and 20 seconds;
    - Otherwise, pick the shortest available.
    """
    if not recordings:
        return None

    parsed_recordings = []
    for rec in recordings:
        length_str = rec.get("length", "")
        sec = parse_length(length_str)
        parsed_recordings.append((rec, sec))

    # Filter for recordings between 3 and 20 seconds
    in_range = [item for item in parsed_recordings if 3.0 <= item[1] <= 20.0]

    if in_range:
        # Sort by length ascending and pick the shortest
        in_range.sort(key=lambda item: item[1])
        return in_range[0][0]
    else:
        # Sort all by length ascending and pick the shortest available
        parsed_recordings.sort(key=lambda item: item[1])
        return parsed_recordings[0][0]

def main():
    # Use pathlib.Path throughout for path resolution relative to the script location
    script_dir = Path(__file__).parent.resolve()
    env_path = script_dir / ".env"
    species_path = script_dir / "species_list.json"
    output_path = script_dir / "raw_recordings.json"

    # Load environment variables
    load_dotenv(dotenv_path=env_path)
    api_key = os.getenv("XENO_CANTO_API_KEY")
    if not api_key:
        logger.error(f"XENO_CANTO_API_KEY not found in {env_path}")
        return

    # Load species list
    if not species_path.exists():
        logger.error(f"Species list not found at {species_path}")
        return

    with open(species_path, "r", encoding="utf-8") as f:
        species_list = json.load(f)

    successes = 0
    fallback_count = 0
    zero_results_species = []
    results = []

    # Xeno-canto API endpoint
    url = "https://xeno-canto.org/api/3/recordings"

    # Use httpx Client with follow_redirects=True and a generous timeout
    with httpx.Client(follow_redirects=True, timeout=60.0) as client:
        for idx, species in enumerate(species_list):
            common_name = species["common_name"]
            scientific_name = species["scientific_name"]
            family = species["family"]

            logger.info(f"[{idx + 1}/{len(species_list)}] Querying recordings for: {common_name} ({scientific_name})...")

            # Define query attempts in fallback order
            attempts = [
                # 1. Common Name - Quality A with length filter
                (f'en:"{common_name}" q:A len:3-30', f"common: q:A, len:3-30"),
                # 2. Common Name - Quality B with length filter
                (f'en:"{common_name}" q:B len:3-30', f"common: q:B, len:3-30"),
                # 3. Common Name - Quality A without length filter
                (f'en:"{common_name}" q:A', f"common: q:A, no length limit"),
                # 4. Common Name - Quality B without length filter
                (f'en:"{common_name}" q:B', f"common: q:B, no length limit"),
                # 5. Common Name - No quality or length filters
                (f'en:"{common_name}"', f"common: no quality/length limits"),
                # 6. Scientific Name - Quality A with length filter (major fallback)
                (f'sp:"{scientific_name}" q:A len:3-30', f"scientific: q:A, len:3-30"),
                # 7. Scientific Name - Quality B with length filter
                (f'sp:"{scientific_name}" q:B len:3-30', f"scientific: q:B, len:3-30"),
                # 8. Scientific Name - Quality A without length filter
                (f'sp:"{scientific_name}" q:A', f"scientific: q:A, no length limit"),
                # 9. Scientific Name - Quality B without length filter
                (f'sp:"{scientific_name}" q:B', f"scientific: q:B, no length limit"),
                # 10. Scientific Name - No quality or length filters
                (f'sp:"{scientific_name}"', f"scientific: no quality/length limits")
            ]

            selected_rec = None
            used_fallback = False

            for attempt_idx, (query, query_desc) in enumerate(attempts):
                params = {
                    "query": query,
                    "key": api_key
                }

                try:
                    response = client.get(url, params=params)
                    response.raise_for_status()
                    data = response.json()
                except Exception as e:
                    logger.error(f"HTTP/API error for '{common_name}' with query '{query}': {e}")
                    # In case of minor network issues, sleep briefly and try next fallback
                    time.sleep(1)
                    continue

                recordings = data.get("recordings", [])
                if recordings:
                    # If this is not the first attempt, it's a fallback
                    if attempt_idx > 0:
                        logger.warning(
                            f"Fallback used for '{common_name}': query '{query}' "
                            f"({query_desc}) returned {len(recordings)} results."
                        )
                        used_fallback = True
                    
                    selected_rec = select_best_recording(recordings)
                    if selected_rec:
                        break

            if selected_rec:
                recording_info = {
                    "common_name": common_name,
                    "scientific_name": scientific_name,
                    "family": family,
                    "xc_id": selected_rec.get("id"),
                    "file_url": selected_rec.get("file"),
                    "recordist": selected_rec.get("rec"),
                    "country": selected_rec.get("cnt"),
                    "license_url": selected_rec.get("lic"),
                    "length": selected_rec.get("length"),
                    "quality": selected_rec.get("q")
                }
                results.append(recording_info)
                successes += 1
                if used_fallback:
                    fallback_count += 1
            else:
                logger.error(f"Zero results found for species '{common_name}' after trying all fallback queries.")
                zero_results_species.append(common_name)

            # Sleep 1 second between requests
            time.sleep(1)

    # Save output to raw_recordings.json
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    # Print Summary
    print("\n" + "=" * 40)
    print("FETCH SUMMARY")
    print("=" * 40)
    print(f"Total Species Processed: {len(species_list)}")
    print(f"Successes:              {successes}")
    print(f"Fallback Count:         {fallback_count}")
    if zero_results_species:
        print(f"Species with Zero Results ({len(zero_results_species)}):")
        for sp in zero_results_species:
            print(f"  - {sp}")
    else:
        print("Species with Zero Results: None")
    print("=" * 40)

if __name__ == "__main__":
    main()
