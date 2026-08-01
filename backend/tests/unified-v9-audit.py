#!/usr/bin/env python3
"""Static acceptance audit for the TableGate V9 unified release tree."""

from __future__ import annotations

import collections
import hashlib
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MAX_FILE = 24_000_000
MAX_FILES_PER_DIR = 900
BACKEND = "https://script.google.com/macros/s/AKfycbyqw2pg_-I8i8jP-nIVq4ATC_bw0fRNFi_yhM044TnbRtbuiEt98Btg1Q0ZnQRsIpItag/exec"
LIBRARY_ID = "18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr"


def fail(errors, message):
    errors.append(message)


def main() -> int:
    errors = []
    files = sorted(path for path in ROOT.rglob("*") if path.is_file())
    required = [
        "tablegate.html", "manifest.webmanifest", "service-worker.js",
        "js/tablegate/shell/app.js", "js/tablegate/shell/views.js", "js/tablegate/shell/workspaces.js",
        "js/tablegate/shell/workspace-templates.js", "backend/api/tablegate-backend-v8.gs",
        "js/admins/creator-forge/lifesimulator/universal-spec-v9.js",
        "css/admins/creator-forge/lifesimulator/universal-spec-v9.css",
        "json/admins/lifesimulator/universal-spec-v9.json",
        "js/players/character-sheets/character-sheet-library.js",
        "js/sessions/dice-roller/tablegate-session-bridge.js",
    ]
    for relative in required:
        if not (ROOT / relative).is_file():
            fail(errors, f"missing required file: {relative}")

    html_files = [path.relative_to(ROOT).as_posix() for path in files if path.suffix.lower() == ".html"]
    if html_files != ["tablegate.html"]:
        fail(errors, f"expected one root HTML entry, found: {html_files}")

    oversized = [(path.relative_to(ROOT).as_posix(), path.stat().st_size) for path in files if path.stat().st_size > MAX_FILE]
    if oversized:
        fail(errors, f"files exceed {MAX_FILE} bytes: {oversized[:8]}")

    directory_counts = collections.Counter(path.parent.relative_to(ROOT).as_posix() for path in files)
    crowded = [(directory, count) for directory, count in directory_counts.items() if count > MAX_FILES_PER_DIR]
    if crowded:
        fail(errors, f"directories exceed {MAX_FILES_PER_DIR} direct files: {crowded}")

    hashes = collections.defaultdict(list)
    for path in files:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        hashes[(path.stat().st_size, digest)].append(path.relative_to(ROOT).as_posix())
    duplicates = [paths for paths in hashes.values() if len(paths) > 1]
    if duplicates:
        fail(errors, f"exact duplicate groups found: {duplicates[:6]}")

    invalid_json = []
    for path in files:
        if path.suffix.lower() not in {".json", ".webmanifest"}:
            continue
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as error:
            invalid_json.append((path.relative_to(ROOT).as_posix(), str(error)))
    if invalid_json:
        fail(errors, f"invalid JSON: {invalid_json[:8]}")

    config = (ROOT / "js/tablegate/shell/config.js").read_text(encoding="utf-8")
    life_config = (ROOT / "js/admins/creator-forge/lifesimulator/config.js").read_text(encoding="utf-8")
    for name, text in [("shell config", config), ("Life Simulator config", life_config)]:
        if BACKEND not in text:
            fail(errors, f"{name} does not contain authoritative backend URL")
        if LIBRARY_ID not in text:
            fail(errors, f"{name} does not contain authoritative library ID")
    if not re.search(r"BACKEND_LIBRARY_VERSION:\s*['\"]10['\"]", config):
        fail(errors, "shell library version is not 10")
    if not re.search(r"backendLibraryVersion:\s*8", life_config):
        fail(errors, "Life Simulator library version is not 8")

    old_shell = []
    for path in (ROOT / "js/tablegate").rglob("*.js"):
        relative = path.relative_to(ROOT).as_posix()
        if not relative.startswith(("js/tablegate/shell/", "js/tablegate/vendor/", "js/tablegate/systems/")):
            old_shell.append(relative)
    if old_shell:
        fail(errors, f"legacy corrupted TableGate shell files were retained: {old_shell[:8]}")

    spec = json.loads((ROOT / "json/admins/lifesimulator/universal-spec-v9.json").read_text(encoding="utf-8"))
    if spec.get("schema") != "tablegate.life-simulator.universal-spec.v9":
        fail(errors, "Life Simulator compiled schema mismatch")
    if len(spec.get("protectedBaselines", {})) != 22:
        fail(errors, "Life Simulator must retain B01-B22")
    if len(spec.get("biomeMap", [])) != 61:
        fail(errors, "Life Simulator must retain all 61 specific biome mappings")
    expected_colors = {"capital":"#DC143C", "city":"#32FF32", "town":"#FFA500", "village":"#000080"}
    if spec.get("pinColors") != expected_colors:
        fail(errors, f"protected pin colors changed: {spec.get('pinColors')}")
    if len(spec.get("functionalCategories", [])) != 16:
        fail(errors, "expected 16 protected functional categories")
    if not all(profile.get("immutable") for profile in spec.get("protectedBaselines", {}).values()):
        fail(errors, "a protected baseline is mutable")

    backend = (ROOT / "backend/api/tablegate-backend-v8.gs").read_text(encoding="utf-8", errors="replace")
    frontend = "\n".join((ROOT / relative).read_text(encoding="utf-8", errors="replace") for relative in ["js/tablegate/shell/app.js", "js/tablegate/shell/api.js"])
    requested = set(re.findall(r"api\.request\(\s*['\"]([^'\"]+)", frontend))
    missing_actions = sorted(action for action in requested if action != "health" and action not in backend)
    if missing_actions:
        fail(errors, f"frontend actions missing from V8 backend: {missing_actions}")

    result = {
        "ok": not errors,
        "fileCount": len(files),
        "totalBytes": sum(path.stat().st_size for path in files),
        "htmlFiles": html_files,
        "maxFileBytes": max((path.stat().st_size for path in files), default=0),
        "maxDirectFiles": max(directory_counts.values(), default=0),
        "duplicateGroups": len(duplicates),
        "jsonFilesChecked": sum(path.suffix.lower() in {".json", ".webmanifest"} for path in files),
        "frontendBackendActions": len(requested),
        "lifeSimulatorBaselines": len(spec.get("protectedBaselines", {})),
        "lifeSimulatorBiomeMappings": len(spec.get("biomeMap", [])),
        "errors": errors,
    }
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
