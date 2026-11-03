# Self-hosted fonts

`src/app/fonts.css` and `public/fonts/*.woff2` are generated. Don't edit them by hand.

```bash
pip install fonttools brotli
python3 scripts/fonts/subset.py build scripts/fonts/fonts.json
```

Then update `FONT_PRELOADS` in `src/app/layout.tsx` to the new `*-core.*.woff2`
names the script prints, and commit everything it wrote.

Each font is cut to what the site renders (`usage.json`, from a crawl of every
sitemap page) plus Latin-1 and Latin Extended-A, and split into a preloaded
`core` file (ASCII, curly quotes, dashes, ellipsis, plus each family's
`coreExtra`) and `ext` files behind `unicode-range`. Characters Google's slices
never drew (for example Inter's arrows) stay out, so they keep rendering from
the fallback exactly as before (`coverage-*.json`).

| Font | Source | Weights kept |
|---|---|---|
| Space Grotesk | `src/SpaceGrotesk-google-*.woff2` (Google Fonts' latin + latin-ext slices, as next/font served them) | full 300 to 700 axis |
| Inter | `src/Inter-google-*.woff2` (same) | 400 (default) to 900 (max) |
| DM Mono | `src/DMMono-{400,500}-google-*.woff2` (static files) | 400 and 500 |

Axes are only cut where the result is outline-identical: Inter keeps 400 (its
default) to 900 (its max). Space Grotesk's default is 300, so any narrower range
would rescale the variation deltas.

**Rerun when:**

- Inter is used lighter than 400 (the 100 to 399 range was cut);
- DM Mono or Space Grotesk get a new weight;
- CSS turns on a new OpenType feature (`font-feature-settings`, `font-variant-*`);
  `tnum`/`frac` were dropped because nothing using these fonts asks for them;
- content adds characters outside Latin-1 / Latin Extended-A (re-crawl with
  the optimize-fonts skill's `scan-usage.mjs` and refresh `usage.json`);
- a source font is upgraded.
