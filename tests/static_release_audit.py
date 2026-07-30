#!/usr/bin/env python3
"""Reproducible static release audit for TableGate v10.

This script verifies the assembled release tree without contacting the deployed
Google Apps Script service. It writes machine-readable reports and manifests to
``docs/audits`` and ``docs/manifests``.
"""
from __future__ import annotations

import hashlib
import json
import mimetypes
import re
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
AUDITS = ROOT / "docs" / "audits"
MANIFESTS = ROOT / "docs" / "manifests"
AUDITS.mkdir(parents=True, exist_ok=True)
MANIFESTS.mkdir(parents=True, exist_ok=True)

VERSION = "10.0.0"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
BACKEND_URL = "https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec"
LIBRARY_URL = "https://script.google.com/macros/library/d/18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr/6"
EXPECTED_BACKEND_SHA256 = "8a439d64e740e7f5e8eaf3cdcaa018b2966e7a999cd232742986c3be91accc67"
GITHUB_LIMIT_BYTES = 23 * 1024 * 1024
SELF_EXCLUDED = {
    "docs/manifests/FILE_MANIFEST_v10.json",
    "docs/manifests/CODE_USAGE_MANIFEST_v10.json",
    "docs/audits/AUTOMATED_TEST_REPORT_v10.json",
    "docs/audits/BACKEND_ROUTE_COVERAGE_v10.json",
    "docs/audits/KNOWLEDGE_PACK_AUDIT_v10.json",
}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def clean_ref(value: str) -> str | None:
    value = value.strip().strip('"\'')
    if not value or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
        return None
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc:
        return None
    path = parsed.path
    if not path or path in {".", "./"}:
        return None
    return path.lstrip("./")


class RefParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: list[tuple[str, str, int]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        amap = dict(attrs)
        for key in ("src", "href", "poster"):
            value = amap.get(key)
            if value:
                self.refs.append((tag, value, self.getpos()[0]))


def parse_named_mapping(js: str, marker: str) -> dict[str, str]:
    match = re.search(rf"{re.escape(marker)}=Object\.freeze\(\{{(.*?)\}}\);", js, re.S)
    if not match:
        return {}
    return dict(re.findall(r"([A-Za-z0-9_]+):'([A-Za-z0-9_]+)'", match.group(1)))


def parse_named_set(js: str, marker: str) -> set[str]:
    match = re.search(rf"{re.escape(marker)}=new Set\(\[(.*?)\]\);", js, re.S)
    if not match:
        return set()
    return set(re.findall(r"'([^']+)'", match.group(1)))


def classify(path: Path, html_loaded: set[str], sw_loaded: set[str]) -> tuple[str, str]:
    rel = path.relative_to(ROOT).as_posix()
    if rel in html_loaded:
        return "active-runtime", "Loaded directly by TableGate.html"
    if rel in sw_loaded:
        return "active-runtime", "Precached by service-worker.js"
    if rel == "backend/tablegate_backend_v3.gs":
        return "backend-reference", "Exact unchanged copy of the supplied Apps Script backend"
    if rel.startswith("json/knowledge-pack/"):
        return "knowledge-data", "Injected nine-system JSON knowledge pack"
    if rel.startswith("docs/source-code/") or rel.startswith("docs/source-character-sheets/") or rel.startswith("docs/character-sheets-"):
        return "retained-source-reference", "Retained and documented source/reference material; not a hidden archive"
    if rel.startswith("docs/licenses/") or rel.startswith("docs/source-readmes/"):
        return "license-provenance", "License, provenance, or upstream documentation"
    if rel.startswith("docs/audits/") or rel.startswith("docs/manifests/"):
        return "audit-manifest", "Generated or retained validation evidence"
    if rel.startswith("docs/") or rel == "README.md":
        return "documentation", "Release or architecture documentation"
    if rel.startswith("tests/"):
        return "test-source", "Reproducible automated test source"
    if rel.startswith("tools/"):
        return "integrated-tool", "Packaged tool module referenced by the runtime or service worker"
    if rel.startswith("assets/"):
        return "runtime-asset", "Packaged visual/audio/runtime asset"
    if rel.startswith(("js/", "css/", "json/")):
        return "runtime-support", "Runtime module, stylesheet, or structured data"
    if rel in {"TableGate.html", "manifest.webmanifest", "service-worker.js"}:
        return "active-runtime", "Application entry point or PWA bootstrap"
    return "release-support", "Packaged release support file"


def add_test(tests: list[dict[str, Any]], name: str, passed: bool, details: Any = "") -> None:
    tests.append({"name": name, "passed": bool(passed), "details": details})


def main() -> int:
    tests: list[dict[str, Any]] = []
    all_files = sorted(p for p in ROOT.rglob("*") if p.is_file())
    rels = {p.relative_to(ROOT).as_posix() for p in all_files}

    # Entry point and local references.
    html_files = sorted(ROOT.rglob("*.html"))
    add_test(tests, "exactly one HTML application entry point", len(html_files) == 1 and html_files[0].name == "TableGate.html", [p.relative_to(ROOT).as_posix() for p in html_files])
    html_text = (ROOT / "TableGate.html").read_text(encoding="utf-8", errors="replace")
    parser = RefParser()
    parser.feed(html_text)
    html_refs: list[dict[str, Any]] = []
    missing_html_refs: list[dict[str, Any]] = []
    html_loaded: set[str] = {"TableGate.html"}
    for tag, raw, line in parser.refs:
        ref = clean_ref(raw)
        if ref is None:
            continue
        exists = (ROOT / ref).is_file()
        item = {"tag": tag, "reference": raw, "resolved": ref, "line": line, "exists": exists}
        html_refs.append(item)
        if exists:
            html_loaded.add(ref)
        else:
            missing_html_refs.append(item)
    add_test(tests, "all local HTML asset references resolve", not missing_html_refs, missing_html_refs)

    # CSS url() references resolve relative to each stylesheet.
    missing_css_refs: list[dict[str, Any]] = []
    css_ref_count = 0
    for css in ROOT.rglob("*.css"):
        text = css.read_text(encoding="utf-8", errors="replace")
        for match in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", text, re.I):
            raw = match.group(2)
            stripped = raw.strip().strip('\"\'')
            if not stripped or stripped.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
                continue
            parsed = urlsplit(stripped)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            ref = parsed.path
            css_ref_count += 1
            target = (css.parent / ref).resolve()
            try:
                target.relative_to(ROOT.resolve())
            except ValueError:
                continue
            if not target.is_file():
                missing_css_refs.append({"stylesheet": css.relative_to(ROOT).as_posix(), "reference": raw, "line": text.count("\n", 0, match.start()) + 1})
    add_test(tests, "all local CSS url() references resolve", not missing_css_refs, {"checked": css_ref_count, "missing": missing_css_refs})

    # Service worker core assets.
    sw = (ROOT / "service-worker.js").read_text(encoding="utf-8", errors="replace")
    core_match = re.search(r"const CORE=\[(.*?)\];", sw, re.S)
    sw_refs = re.findall(r"['\"](\.\/[^'\"]+)['\"]", core_match.group(1) if core_match else "")
    sw_loaded: set[str] = set()
    missing_sw: list[str] = []
    for raw in sw_refs:
        ref = clean_ref(raw)
        if ref is None:
            continue
        if (ROOT / ref).is_file():
            sw_loaded.add(ref)
        else:
            missing_sw.append(ref)
    add_test(tests, "all service worker core assets resolve", bool(core_match) and not missing_sw, {"coreEntries": len(sw_refs), "missing": missing_sw})

    # No hidden archives, and GitHub per-file limit.
    archive_exts = {".zip", ".7z", ".rar", ".tar", ".gz", ".bz2", ".xz"}
    nested_archives = [p.relative_to(ROOT).as_posix() for p in all_files if p.suffix.lower() in archive_exts]
    add_test(tests, "no nested source or legacy archives", not nested_archives, nested_archives)
    oversized = [{"path": p.relative_to(ROOT).as_posix(), "bytes": p.stat().st_size} for p in all_files if p.stat().st_size > GITHUB_LIMIT_BYTES]
    add_test(tests, "no project file exceeds 23 MiB GitHub limit", not oversized, oversized)

    # Backend integrity, URLs, and JavaScript syntax.
    backend_path = ROOT / "backend" / "tablegate_backend_v3.gs"
    backend_text = backend_path.read_text(encoding="utf-8", errors="replace")
    backend_hash = sha256(backend_path)
    add_test(tests, "supplied backend copy is byte-identical", backend_hash == EXPECTED_BACKEND_SHA256, {"sha256": backend_hash, "expected": EXPECTED_BACKEND_SHA256, "bytes": backend_path.stat().st_size})
    core_text = (ROOT / "js" / "messenger-core.js").read_text(encoding="utf-8", errors="replace")
    add_test(tests, "frontend uses requested backend deployment URL", BACKEND_URL in core_text, BACKEND_URL)
    add_test(tests, "frontend records requested Apps Script library URL/version", LIBRARY_URL in core_text, LIBRARY_URL)

    js_results: list[dict[str, Any]] = []
    for path in sorted(ROOT.rglob("*.js")):
        proc = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
        js_results.append({"path": path.relative_to(ROOT).as_posix(), "passed": proc.returncode == 0, "stderr": proc.stderr.strip()})
    # Apps Script file is JavaScript syntax; check a temporary .js sibling outside release tree.
    backend_tmp = ROOT.parent / ".tablegate_backend_syntax_check.js"
    backend_tmp.write_text(backend_text, encoding="utf-8")
    proc = subprocess.run(["node", "--check", str(backend_tmp)], capture_output=True, text=True)
    backend_tmp.unlink(missing_ok=True)
    add_test(tests, "all JavaScript modules pass node syntax check", all(x["passed"] for x in js_results), {"checked": len(js_results), "failures": [x for x in js_results if not x["passed"]]})
    add_test(tests, "supplied Apps Script backend passes JavaScript syntax check", proc.returncode == 0, proc.stderr.strip())

    # JSON parse validation.
    json_results: list[dict[str, Any]] = []
    for path in sorted(ROOT.rglob("*.json")):
        try:
            json.loads(path.read_text(encoding="utf-8"))
            json_results.append({"path": path.relative_to(ROOT).as_posix(), "passed": True})
        except Exception as exc:  # pragma: no cover - reported for users
            json_results.append({"path": path.relative_to(ROOT).as_posix(), "passed": False, "error": str(exc)})
    add_test(tests, "all JSON files parse", all(x["passed"] for x in json_results), {"checked": len(json_results), "failures": [x for x in json_results if not x["passed"]]})

    # Backend route catalog and frontend action coverage.
    route_catalog = json.loads((ROOT / "json" / "backend-route-catalog.json").read_text(encoding="utf-8"))
    routes = route_catalog.get("routes", [])
    route_actions = [r.get("action") for r in routes]
    route_handlers = [r.get("handler") for r in routes]
    missing_handlers = [r for r in routes if not re.search(rf"\bfunction\s+{re.escape(str(r.get('handler')))}\s*\(", backend_text)]
    duplicate_actions = [a for a, n in Counter(route_actions).items() if n > 1]
    add_test(tests, "backend route catalog contains 223 unique supplied actions", len(routes) == 223 and len(set(route_actions)) == 223 and not duplicate_actions, {"routeCount": len(routes), "uniqueActions": len(set(route_actions)), "duplicates": duplicate_actions})
    add_test(tests, "every cataloged route handler exists in supplied backend", not missing_handlers, [{"action": r.get("action"), "handler": r.get("handler")} for r in missing_handlers])

    aliases = parse_named_mapping(core_text, "BACKEND_ACTION_ALIASES")
    virtual_actions = parse_named_set(core_text, "BACKEND_VIRTUAL_ACTIONS")
    invalid_aliases = {k: v for k, v in aliases.items() if v not in set(route_actions)}
    add_test(tests, "all compatibility aliases target supplied backend actions", not invalid_aliases, {"aliases": aliases, "invalid": invalid_aliases})

    literal_calls: list[dict[str, Any]] = []
    active_unresolved: list[dict[str, Any]] = []
    retained_unresolved: list[dict[str, Any]] = []
    excluded_generated = {"js/backend-route-catalog.js", "js/knowledge-pack-catalog.js", "js/docs-catalog.js"}
    patterns = [r"\bAPI\.call\(\s*['\"]([^'\"]+)", r"\brawBackendCall\(\s*['\"]([^'\"]+)"]
    for path in sorted(ROOT.rglob("*.js")):
        rel = path.relative_to(ROOT).as_posix()
        if rel in excluded_generated:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for pattern in patterns:
            for match in re.finditer(pattern, text):
                action = match.group(1)
                item = {"action": action, "path": rel, "line": text.count("\n", 0, match.start()) + 1}
                literal_calls.append(item)
                if action not in set(route_actions) and action not in aliases and action not in virtual_actions:
                    if rel.startswith("docs/source-code/"):
                        retained_unresolved.append(item)
                    else:
                        active_unresolved.append(item)
    add_test(tests, "all active frontend API calls resolve to supplied, aliased, or composed routes", not active_unresolved, {"literalCalls": len(literal_calls), "uniqueActions": len({x['action'] for x in literal_calls}), "unresolved": active_unresolved, "retainedReferenceOnly": retained_unresolved})

    # Ensure catalogs and capability UIs are connected to entry point.
    required_ui = {
        "js/backend-route-catalog.js",
        "js/knowledge-pack-catalog.js",
        "js/backend-capability-center.js",
        "js/knowledge-pack-browser.js",
        "css/backend-center.css",
    }
    add_test(tests, "backend capability and knowledge browser assets are loaded", required_ui.issubset(html_loaded), {"required": sorted(required_ui), "loaded": sorted(required_ui & html_loaded), "missing": sorted(required_ui - html_loaded)})

    # Knowledge pack catalog integrity.
    knowledge_catalog = json.loads((ROOT / "json" / "knowledge-pack" / "catalog.json").read_text(encoding="utf-8"))
    knowledge_files = knowledge_catalog.get("files", [])
    knowledge_failures: list[dict[str, Any]] = []
    seen_knowledge_paths: set[str] = set()
    actual_knowledge_bytes = 0
    systems = Counter()
    for item in knowledge_files:
        rel = str(item.get("path", ""))
        seen_knowledge_paths.add(rel)
        path = ROOT / "json" / "knowledge-pack" / rel
        if not path.is_file():
            knowledge_failures.append({"path": rel, "error": "missing"})
            continue
        size = path.stat().st_size
        actual_knowledge_bytes += size
        folder = rel.split("/", 1)[0] if "/" in rel else ""
        systems[folder] += 1
        actual_hash = sha256(path)
        expected_size = item.get("sizeBytes", item.get("bytes"))
        if size != expected_size or actual_hash != item.get("sha256"):
            knowledge_failures.append({"path": rel, "expectedBytes": expected_size, "actualBytes": size, "expectedSha256": item.get("sha256"), "actualSha256": actual_hash})
    actual_json_rel = {
        p.relative_to(ROOT / "json" / "knowledge-pack").as_posix()
        for p in (ROOT / "json" / "knowledge-pack").rglob("*.json")
        if p.name != "catalog.json"
    }
    unlisted = sorted(actual_json_rel - seen_knowledge_paths)
    missing_from_disk = sorted(seen_knowledge_paths - actual_json_rel)
    knowledge_ok = (
        len(knowledge_files) == 244
        and knowledge_catalog.get("fileCount") == 244
        and knowledge_catalog.get("systemCount") == 9
        and knowledge_catalog.get("totalBytes") == 208836941
        and actual_knowledge_bytes == 208836941
        and len(systems) == 9
        and not knowledge_failures
        and not unlisted
        and not missing_from_disk
    )
    add_test(tests, "knowledge catalog matches all 244 injected JSON files across nine systems", knowledge_ok, {"catalogFiles": len(knowledge_files), "systems": dict(sorted(systems.items())), "catalogBytes": knowledge_catalog.get("totalBytes"), "actualBytes": actual_knowledge_bytes, "failures": knowledge_failures, "unlisted": unlisted, "missingFromDisk": missing_from_disk})

    # Code-use and file manifests. Generated reports are intentionally excluded
    # from their own hash manifest to avoid a recursive self-hash cycle.
    manifest_files = [p for p in all_files if p.relative_to(ROOT).as_posix() not in SELF_EXCLUDED]
    file_entries: list[dict[str, Any]] = []
    usage_entries: list[dict[str, Any]] = []
    class_counts: Counter[str] = Counter()
    class_bytes: Counter[str] = Counter()
    for path in manifest_files:
        rel = path.relative_to(ROOT).as_posix()
        size = path.stat().st_size
        mime = mimetypes.guess_type(rel)[0] or "application/octet-stream"
        category, rationale = classify(path, html_loaded, sw_loaded)
        class_counts[category] += 1
        class_bytes[category] += size
        file_entries.append({"path": rel, "bytes": size, "sha256": sha256(path), "mimeType": mime, "classification": category})
        usage_entries.append({"path": rel, "classification": category, "rationale": rationale, "bytes": size})

    file_manifest = {
        "release": f"TableGate {VERSION}",
        "generatedAt": GENERATED_AT,
        "root": "TableGate/",
        "selfExcludedPaths": sorted(SELF_EXCLUDED),
        "fileCount": len(file_entries),
        "totalBytes": sum(x["bytes"] for x in file_entries),
        "files": file_entries,
    }
    usage_manifest = {
        "release": f"TableGate {VERSION}",
        "generatedAt": GENERATED_AT,
        "purpose": "Documents how every shipped file is used or retained; no source is hidden inside internal archives.",
        "classificationSummary": [
            {"classification": key, "files": class_counts[key], "bytes": class_bytes[key]}
            for key in sorted(class_counts)
        ],
        "files": usage_entries,
    }
    write_json(MANIFESTS / "FILE_MANIFEST_v10.json", file_manifest)
    write_json(MANIFESTS / "CODE_USAGE_MANIFEST_v10.json", usage_manifest)

    route_report = {
        "release": f"TableGate {VERSION}",
        "generatedAt": GENERATED_AT,
        "backendSha256": backend_hash,
        "backendUnchanged": backend_hash == EXPECTED_BACKEND_SHA256,
        "backendRouteCount": len(routes),
        "uniqueBackendActions": len(set(route_actions)),
        "handlersPresent": len(routes) - len(missing_handlers),
        "compatibilityAliases": aliases,
        "composedFrontendActions": sorted(virtual_actions),
        "literalFrontendCallCount": len(literal_calls),
        "literalFrontendActions": sorted({x["action"] for x in literal_calls}),
        "activeUnresolvedCalls": active_unresolved,
        "retainedReferenceOnlyUnresolvedCalls": retained_unresolved,
        "routes": routes,
    }
    write_json(AUDITS / "BACKEND_ROUTE_COVERAGE_v10.json", route_report)

    knowledge_report = {
        "release": f"TableGate {VERSION}",
        "generatedAt": GENERATED_AT,
        "passed": knowledge_ok,
        "systemCount": len(systems),
        "fileCount": len(knowledge_files),
        "totalBytes": actual_knowledge_bytes,
        "systems": dict(sorted(systems.items())),
        "catalogPath": "json/knowledge-pack/catalog.json",
        "failures": knowledge_failures,
        "unlisted": unlisted,
        "missingFromDisk": missing_from_disk,
    }
    write_json(AUDITS / "KNOWLEDGE_PACK_AUDIT_v10.json", knowledge_report)

    passed = sum(1 for t in tests if t["passed"])
    failed = len(tests) - passed
    report = {
        "release": f"TableGate {VERSION}",
        "generatedAt": GENERATED_AT,
        "scope": "Static release integrity, syntax, local reference, backend contract, knowledge catalog, and GitHub packaging readiness.",
        "liveDeploymentTested": False,
        "liveDeploymentNote": "The isolated build environment could not reach the supplied Google Apps Script deployment. Browser contract tests use backend-shaped fixtures and do not replace the supplied backend.",
        "tests": tests,
        "passed": passed,
        "failed": failed,
        "metrics": {
            "releaseFilesScanned": len(all_files),
            "releaseBytesScanned": sum(p.stat().st_size for p in all_files),
            "javascriptFilesChecked": len(js_results),
            "jsonFilesChecked": len(json_results),
            "backendRoutes": len(routes),
            "knowledgeFiles": len(knowledge_files),
            "knowledgeBytes": actual_knowledge_bytes,
            "htmlReferences": len(html_refs),
            "serviceWorkerCoreReferences": len(sw_refs),
        },
        "reports": {
            "backendCoverage": "docs/audits/BACKEND_ROUTE_COVERAGE_v10.json",
            "knowledgeAudit": "docs/audits/KNOWLEDGE_PACK_AUDIT_v10.json",
            "fileManifest": "docs/manifests/FILE_MANIFEST_v10.json",
            "codeUsageManifest": "docs/manifests/CODE_USAGE_MANIFEST_v10.json",
            "browserContract": "docs/audits/BROWSER_CONTRACT_TEST_v10.json",
        },
    }
    write_json(AUDITS / "AUTOMATED_TEST_REPORT_v10.json", report)

    print(json.dumps({"passed": passed, "failed": failed, "metrics": report["metrics"], "failures": [t for t in tests if not t["passed"]]}, indent=2))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
