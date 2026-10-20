#!/usr/bin/env python3
"""Verify a final Windows ZIP or Android APK against the generated audio manifest.

No extraction, Wwise installation, SDK or third-party Python packages required.
The reference manifest comes from the reviewed native delivery, not from the APK.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile


def verify_archive(archive, platform, reference, prefix, require_stored=False):
    if platform not in ("Windows", "Android") or reference.get("platform") != platform:
        raise ValueError("Reference manifest platform mismatch")
    if reference.get("schemaVersion") != 1 or reference.get("mediaCount", 201) > 200:
        raise ValueError("Invalid native audio manifest/media limit")
    prefix = prefix.strip("/") + "/"
    if ".." in prefix.split("/") or "\\" in prefix:
        raise ValueError("Invalid archive prefix")
    required = {entry["file"]: entry for entry in reference["files"]}
    if len(required) != len(reference["files"]):
        raise ValueError("Duplicate reference path")
    audio_bytes = 0
    with zipfile.ZipFile(archive) as package:
        names = package.namelist()
        if len(names) != len(set(names)):
            raise ValueError("Duplicate archive entries")
        packaged = json.loads(package.read(prefix + "audio-manifest.json"))
        if packaged != reference:
            raise ValueError("Packaged manifest differs from generated delivery/platform")
        for name, entry in required.items():
            if name.startswith("/") or ".." in name.split("/") or "\\" in name:
                raise ValueError("Invalid reference path")
            info = package.getinfo(prefix + name)
            if info.file_size != entry["bytes"]:
                raise ValueError("Packaged audio length mismatch: " + name)
            payload = package.read(info)  # zipfile also verifies CRC.
            if len(payload) != entry["bytes"] or hashlib.sha256(payload).hexdigest() != entry["sha256"]:
                raise ValueError("Packaged audio hash mismatch: " + name)
            if name.endswith((".bnk", ".wem")):
                audio_bytes += len(payload)
                if require_stored and info.compress_type != zipfile.ZIP_STORED:
                    raise ValueError("APK streaming audio must be stored/seekable, not compressed: " + name)
        for name in names:
            if name.startswith(prefix) and name.lower().endswith((".bnk", ".wem", ".wav", ".mp3", ".ogg", ".gz")):
                if name[len(prefix):] not in required:
                    raise ValueError("Unexpected audio in package: " + name)
    if audio_bytes != reference["audioBytes"]:
        raise ValueError("Packaged audio byte total mismatch")
    return {"ok": True, "platform": platform, "verifiedFiles": len(required),
            "mediaCount": reference["mediaCount"], "streamedMedia": len(reference["streams"]),
            "audioBytes": audio_bytes, "apkSeekableAssetsChecked": require_stored,
            "diskOnly": True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--apk", type=Path, help="Android APK; requires uncompressed BNK/WEM entries")
    group.add_argument("--archive", type=Path, help="SoundBank delivery ZIP (not an app playback check)")
    parser.add_argument("--platform", choices=["Windows", "Android"])
    parser.add_argument("--prefix", help="Bank directory inside the archive, without a leading slash")
    parser.add_argument("--manifest", type=Path, help="Trusted generated audio-manifest.json")
    args = parser.parse_args()
    platform = args.platform or ("Android" if args.apk else None)
    if platform is None or args.apk and platform != "Android":
        parser.error("Use --archive with --platform Windows|Android; --apk is Android only")
    repo = Path(__file__).resolve().parents[2]
    manifest = args.manifest or repo / "audio/wwise/generated/native" / platform / "audio-manifest.json"
    prefix = args.prefix or ("assets" if platform == "Android" else "audio") + "/wwise/" + platform
    if args.apk:
        with zipfile.ZipFile(args.apk) as package:
            if "AndroidManifest.xml" not in package.namelist():
                raise ValueError("Not an APK: AndroidManifest.xml is missing")
    result = verify_archive(args.apk or args.archive, platform, json.loads(manifest.read_text(encoding="utf-8")), prefix, bool(args.apk))
    print(json.dumps(result))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, OSError, zipfile.BadZipFile) as error:
        print("Native audio package verification failed: " + str(error), file=sys.stderr)
        sys.exit(1)
