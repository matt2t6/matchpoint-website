#!/usr/bin/env python
import os
import sys
import json
import time
from pathlib import Path

import argparse
import requests

ELEVEN_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"


def synthesize(api_key: str, voice_id: str, text: str, model_id: str = "eleven_multilingual_v2", voice_settings=None) -> bytes:
    url = ELEVEN_URL.format(voice_id=voice_id)
    headers = {
        "xi-api-key": api_key,
        "accept": "audio/mpeg",
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": model_id,
    }
    if voice_settings:
        payload["voice_settings"] = voice_settings
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    return resp.content


def main():
    p = argparse.ArgumentParser(description="Batch synthesize coach slogans via ElevenLabs")
    p.add_argument("--voice-id", required=True, help="ElevenLabs voice ID")
    p.add_argument("--model-id", default="eleven_multilingual_v2", help="Model ID (default: eleven_multilingual_v2)")
    p.add_argument("--slogans-json", default=str(Path("assets/slogans.json")), help="Path to slogans JSON mapping filename->text")
    p.add_argument("--out-dir", default=str(Path("assets/coach_slogans")), help="Output directory for MP3 files")
    p.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = p.parse_args()

    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        print("ERROR: ELEVENLABS_API_KEY env var not set.", file=sys.stderr)
        return 1

    with open(args.slogans_json, "r", encoding="utf-8") as f:
        mapping = json.load(f)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Synthesizing {len(mapping)} slogans to {out_dir} using voice {args.voice_id} / model {args.model_id}")
    ok = 0
    for base, text in mapping.items():
        out_file = out_dir / f"{base}.mp3"
        if out_file.exists() and not args.force:
            print(f"SKIP exists: {out_file}")
            ok += 1
            continue
        try:
            data = synthesize(api_key, args.voice_id, text, model_id=args.model_id)
            out_file.write_bytes(data)
            ok += 1
            # Gentle pacing to avoid rate limits
            time.sleep(0.4)
            print(f"OK: {out_file}")
        except requests.HTTPError as e:
            print(f"HTTP ERROR for '{text[:40]}...': {e}", file=sys.stderr)
        except Exception as e:
            print(f"ERROR for '{text[:40]}...': {e}", file=sys.stderr)

    print(f"Done. {ok}/{len(mapping)} synthesized.")
    return 0 if ok else 2


if __name__ == "__main__":
    raise SystemExit(main())

