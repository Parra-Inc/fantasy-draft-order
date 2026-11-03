#!/usr/bin/env python3
"""Subset web fonts to what a site uses and split each into core + extended.

Run by hand, commit the output. Never wire this into the build.

  python3 subset.py inspect FONT [FONT...]
  python3 subset.py google-coverage "Family" "wght@100..900" OUT.json
  python3 subset.py build fonts.json

Requires: pip install fonttools brotli
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from fontTools.ttLib import TTFont

# fontTools stamps head.modified with the current time, so identical input
# would give new bytes (and new hashed filenames) on every run. Pin it.
os.environ.setdefault("SOURCE_DATE_EPOCH", "0")

HINT_TABLES = {"fpgm", "prep", "cvt ", "hdmx", "VDMX", "LTSH", "TSI0", "TSI1", "TSI2", "TSI3", "TSI5"}
CORE = set(range(0x20, 0x7F)) | {0x2018, 0x2019, 0x201C, 0x201D, 0x2013, 0x2014, 0x2026}
FLOOR = set(range(0xA0, 0x100)) | set(range(0x100, 0x180)) | {0x2010}
DEFAULT_FEATURES = ["ccmp", "locl", "mark", "mkmk", "kern", "liga", "calt", "rlig", "rvrn"]


def features_of(font):
    tags = set()
    for t in ("GSUB", "GPOS"):
        if t in font and font[t].table.FeatureList:
            tags |= {fr.FeatureTag for fr in font[t].table.FeatureList.FeatureRecord}
    return sorted(tags)


def inspect(path):
    p = Path(path)
    f = TTFont(p)
    name = f["name"]
    get = lambda i: (name.getDebugName(i) or "")
    axes = {a.axisTag: (a.minValue, a.defaultValue, a.maxValue) for a in f["fvar"].axes} if "fvar" in f else {}
    lic = f"{get(0)} {get(13)}"
    rfn = re.search(r"Reserved Font Names?\s*[\"“']?([^\"”'.\n]+)", lic, re.I)
    print(f"\n{p.name}  {p.stat().st_size:,} B")
    print(f"  family     {get(1)} / {get(2)}  (typo: {get(16) or '-'})")
    print(f"  glyphs     {f['maxp'].numGlyphs}   codepoints {len(f.getBestCmap())}")
    print(f"  axes       {axes or 'static'}")
    print(f"  features   {' '.join(features_of(f))}")
    print(f"  hinting    {sorted(t.strip() for t in HINT_TABLES & set(f.keys())) or 'none'}")
    print(f"  RFN        {rfn.group(1).strip() if rfn else 'none found (read the license to be sure)'}")


def to_ranges(cps):
    cps, out, i = sorted(cps), [], 0
    while i < len(cps):
        j = i
        while j + 1 < len(cps) and cps[j + 1] == cps[j] + 1:
            j += 1
        out.append(f"U+{cps[i]:X}" if i == j else f"U+{cps[i]:X}-{cps[j]:X}")
        i = j + 1
    return ", ".join(out)


def rename(font, new_family):
    name = font["name"]
    style = name.getDebugName(17) or name.getDebugName(2) or "Regular"
    ps = re.sub(r"[^A-Za-z0-9-]", "", f"{new_family}-{style}")
    for rec in list(name.names):
        if rec.nameID in (1, 16):
            rec.string = new_family
        elif rec.nameID == 4:
            rec.string = f"{new_family} {style}"
        elif rec.nameID in (3, 6):
            rec.string = ps


def build_one(cfg, root, style, source, used, out_dir, rendered=None):
    family = cfg.get("renameTo") or cfg["family"]
    # "slug" lets two entries share one family name (static per-weight files,
    # e.g. DM Mono 400 and 500) without overwriting each other's outputs.
    slug = cfg.get("slug") or re.sub(r"[^a-z0-9]+", "-", family.lower()).strip("-")
    slug += "-italic" if style == "italic" else ""
    features = cfg.get("features") or DEFAULT_FEATURES
    tmp = Path(tempfile.mkdtemp())

    # A source may be one file or a list (for example Google's per-script
    # slices of the same font, which render exactly like what was served).
    # Each codepoint comes from the first source that has it.
    axes = cfg.get("axes") or {}
    limits = {}
    for tag, spec in axes.items():
        lo, _, hi = str(spec).partition(":")
        limits[tag] = float(lo) if not hi else (float(lo), float(hi))
    staged_fonts = []
    for i, src in enumerate([source] if isinstance(source, str) else source):
        font = TTFont(root / src)
        if limits and "fvar" in font:
            from fontTools.varLib.instancer import instantiateVariableFont

            font = instantiateVariableFont(font, limits)
        if cfg.get("renameTo"):
            rename(font, cfg["renameTo"])
        staged = tmp / f"staged{i}.ttf"
        font.save(staged)
        staged_fonts.append((staged, TTFont(staged)))

    claimed, plan = set(), []
    for staged, font in staged_fonts:
        have = set(font.getBestCmap()) - claimed
        if rendered is not None:
            have &= rendered
        claimed |= have
        # coreExtra: characters on most pages (a footer ©, a · separator).
        # Left in an extended file they would pull it onto every page.
        core_set = CORE | {ord(c) for c in cfg.get("coreExtra", "")}
        plan.append((staged, font, core_set & have, ((used | FLOOR) - core_set) & have))

    results = []
    for part in ("core", "ext"):
        n = 0
        for staged, font, core, ext in plan:
            cps = core if part == "core" else ext
            if not cps:
                continue
            n += 1
            name = f"{slug}-{part}" + (f"{n}" if n > 1 else "")
            dst = tmp / f"{name}.woff2"
            subprocess.run([
                sys.executable, "-m", "fontTools.subset", str(staged),
                f"--unicodes={','.join(f'{c:X}' for c in sorted(cps))}",
                f"--layout-features={','.join(features)}",
                "--flavor=woff2", "--no-hinting", "--desubroutinize",
                "--name-IDs=*", "--name-languages=*", "--notdef-outline",
                f"--output-file={dst}",
            ], check=True)
            digest = hashlib.sha256(dst.read_bytes()).hexdigest()[:8]
            final = out_dir / f"{name}.{digest}.woff2"
            for old in out_dir.glob(f"{name}.*.woff2"):
                old.unlink()
            final.write_bytes(dst.read_bytes())

            # Verify the output, and derive unicode-range from what it actually holds.
            check = TTFont(final)
            got = set(check.getBestCmap())
            problems = []
            if check["maxp"].numGlyphs <= 1:
                problems.append("no glyphs")
            if got != cps:
                problems.append(f"cmap differs from request: missing {sorted(cps - got)[:10]} extra {sorted(got - cps)[:10]}")
            left = HINT_TABLES & set(check.keys())
            if left:
                problems.append(f"hint tables remain {sorted(left)}")
            # pyftsubset prunes features with no lookups left for the kept glyphs
            # (ccmp/mark on an ASCII core is expected). Only kern/liga/calt or
            # explicitly requested non-default tags losing out is suspicious.
            watch = {"kern", "liga", "calt"} | (set(features) - set(DEFAULT_FEATURES))
            dropped = [t for t in features if t in watch and t in features_of(font) and t not in features_of(check)]
            if dropped and part == "core":
                problems.append(f"features lost {dropped} (check the core glyphs really don't use them)")
            got_axes = {a.axisTag: (a.minValue, a.maxValue) for a in check["fvar"].axes} if "fvar" in check else {}
            if "wght" in got_axes:
                weight = "{:g} {:g}".format(*got_axes["wght"])
            elif isinstance(limits.get("wght"), float):
                weight = f"{limits['wght']:g}"
            else:
                weight = None
            results.append({
                "part": part, "file": final, "bytes": final.stat().st_size, "glyphs": check["maxp"].numGlyphs,
                "range": to_ranges(got), "axes": got_axes, "weight": weight, "problems": problems,
            })
    return family, results


def parse_range(spec):
    out = set()
    for part in spec.split(","):
        part = part.strip().upper().replace("U+", "")
        if "-" in part:
            a, b = part.split("-")
            out |= set(range(int(a, 16), int(b, 16) + 1))
        elif part:
            out.add(int(part, 16))
    return out


def google_coverage(family, axes, out_path):
    """Codepoints a Google Fonts family renders today: for each slice, the
    intersection of its declared unicode-range and its cmap. Characters outside
    this set currently render in a fallback font; adding them would change how
    they look, so build() can restrict to this set (renderedBy)."""
    import urllib.request

    ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
    url = f"https://fonts.googleapis.com/css2?family={family.replace(' ', '+')}:{axes}&display=swap"
    css = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": ua})).read().decode()
    covered = set()
    tmp = Path(tempfile.mkdtemp())
    for i, (src, rng) in enumerate(re.findall(r"url\((\S+?)\).*?unicode-range:\s*([^;]+);", css, re.S)):
        f = tmp / f"{i}.woff2"
        f.write_bytes(urllib.request.urlopen(src).read())
        covered |= parse_range(rng) & set(TTFont(f).getBestCmap())
    Path(out_path).write_text(json.dumps({"family": family, "axes": axes, "codepoints": sorted(covered)}))
    print(f"{family}: {len(covered)} codepoints rendered by Google's slices -> {out_path}")


def build(config_path):
    config_path = Path(config_path)
    cfg = json.loads(config_path.read_text())
    root = Path.cwd()
    out_dir = root / cfg["outDir"]
    out_dir.mkdir(parents=True, exist_ok=True)
    url_prefix = "/" + str(Path(cfg["outDir"]).relative_to("public")) if cfg["outDir"].startswith("public") else cfg.get("urlPrefix", "/fonts")

    variables = []
    css, preloads, failed = ["/* Generated by scripts/fonts/subset.py. Do not edit; rerun the script. */"], [], False
    for fam in cfg["families"]:
        used = set()
        if fam.get("usedCodepoints"):
            usage = json.loads((root / fam["usedCodepoints"]).read_text())
            fams = usage.get("families", {})
            for key in fam.get("usageKeys") or [k for k in fams if fam["family"].lower() in k.lower()]:
                used |= set(fams[key]["codepoints"])
        used |= {ord(c) for c in fam.get("alsoKeep", "")}
        rendered = None
        if fam.get("renderedBy"):
            # Only what the current font actually draws today; anything else
            # comes from a fallback font now and must keep doing so.
            rendered = set(json.loads((root / fam["renderedBy"]).read_text())["codepoints"])
        for style, src_key in (("normal", "source"), ("italic", "italicSource")):
            if not fam.get(src_key):
                continue
            family, results = build_one(fam, root, style, fam[src_key], used, out_dir, rendered)
            for r in results:
                rel = r["file"].name
                weight = r["weight"] or fam.get("weight", "400")
                css.append(
                    "@font-face {\n"
                    f'  font-family: "{family}";\n'
                    f'  src: url("{url_prefix}/{rel}") format("woff2");\n'
                    f"  font-weight: {weight};\n  font-style: {style};\n"
                    f"  font-display: {fam.get('display', 'swap')};\n"
                    f"  unicode-range: {r['range']};\n}}"
                )
                if r["part"] == "core" and (style == "normal" or fam.get("preloadItalic")):
                    preloads.append(f"{url_prefix}/{rel}")
                status = "OK" if not r["problems"] else "FAIL " + "; ".join(r["problems"])
                failed |= bool(r["problems"])
                print(f"{rel:44} {r['bytes']:>8,} B  {r['glyphs']:>4} glyphs  axes={r['axes'] or '-'}  {status}")
        if fam.get("fallbackCss"):
            css.append(fam["fallbackCss"].strip())
        if fam.get("variable"):
            fb = re.search(r'font-family:\s*"?([^";]+)"?', fam.get("fallbackCss", ""))
            stack = f'"{family}"' + (f', "{fb.group(1)}"' if fb else "")
            variables.append(f"  {fam['variable']}: {stack};")

    if variables:
        # Same stack next/font emitted (family, then its metric-matched fallback).
        css.append(f"{cfg.get('variablesSelector', ':root')} {{\n" + "\n".join(variables) + "\n}")
    if cfg.get("cssOut"):
        (root / cfg["cssOut"]).write_text("\n\n".join(css) + "\n")
        print(f"\nwrote {cfg['cssOut']}")
    print("\npreload these (core only):")
    for p in preloads:
        print(f'  preload("{p}", {{ as: "font", type: "font/woff2", crossOrigin: "anonymous" }});')
    print(
        "\nRerun when: CSS adds a weight, axis value or OpenType feature; content adds new"
        " non-Latin characters or a language; the source font is upgraded."
    )
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] not in ("inspect", "build", "google-coverage"):
        print(__doc__)
        sys.exit(2)
    if sys.argv[1] == "google-coverage":
        google_coverage(sys.argv[2], sys.argv[3], sys.argv[4])
    elif sys.argv[1] == "inspect":
        for p in sys.argv[2:]:
            inspect(p)
    else:
        build(sys.argv[2])
