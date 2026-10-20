"""Real native-media fixtures in ZIP/APK asset layout; does not build/run an Android app."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location("verify_native", Path(__file__).with_name("verify-native-archive.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
repo = Path(__file__).resolve().parents[2]


class ArchiveTests(unittest.TestCase):
    def build_and_verify(self, platform="Android", skip=None, compress=None, corrupt=None):
        root = repo / "audio/wwise/generated/native" / platform
        reference = json.loads((root / "audio-manifest.json").read_text(encoding="utf-8"))
        prefix = ("assets" if platform == "Android" else "audio") + "/wwise/" + platform
        with tempfile.TemporaryDirectory(prefix="wake native zip ") as directory:
            archive = Path(directory) / "layout.zip"
            with zipfile.ZipFile(archive, "w") as package:
                package.write(root / "audio-manifest.json", prefix + "/audio-manifest.json")
                for entry in reference["files"]:
                    name = entry["file"]
                    if skip and skip(name):
                        continue
                    data = (root / name).read_bytes()
                    if corrupt and corrupt(name):
                        data = data[:-1] + bytes([data[-1] ^ 1])
                    encoding = zipfile.ZIP_DEFLATED if compress and compress(name) else zipfile.ZIP_STORED
                    package.writestr(prefix + "/" + name, data, compress_type=encoding)
            return module.verify_archive(archive, platform, reference, prefix, platform == "Android")

    def test_seekable_android_assets(self):
        report = self.build_and_verify()
        self.assertTrue(report["apkSeekableAssetsChecked"])
        self.assertEqual(report["streamedMedia"], 9)

    def test_windows_zip_can_be_compressed_for_distribution(self):
        self.assertTrue(self.build_and_verify("Windows", compress=lambda _: True)["ok"])

    def test_missing_wem_fails(self):
        with self.assertRaises(KeyError):
            self.build_and_verify(skip=lambda name: name.endswith(".wem"))

    def test_apk_recompression_fails(self):
        with self.assertRaisesRegex(ValueError, "must be stored/seekable"):
            self.build_and_verify(compress=lambda name: name.endswith(".wem"))

    def test_changed_bank_in_archive_fails(self):
        with self.assertRaisesRegex(ValueError, "hash mismatch"):
            self.build_and_verify(corrupt=lambda name: name == "Init.bnk")


if __name__ == "__main__":
    unittest.main()
