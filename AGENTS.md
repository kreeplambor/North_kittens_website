# AGENTS.md

Static one-page site for «Северные котята» (street-cat volunteers in the Северный district). Plain HTML/CSS/JS with no build system, package manager, tests, lint, or CI.

## Layout

- `index.html` — the whole page. Sections `#about`, `#news`, `#activities`, `#cats`, `#help` are also navigation anchors; keep section IDs and nav links in sync.
- `styles.css` — all styles, grouped by section in the same order as the HTML. Responsive overrides are at the end (`max-width: 768px`).
- `image_carousel _script.js` — news image carousels. **The filename contains a literal space before `_script`** and is referenced that way in `index.html`; renaming it requires updating the `<script src>` too.
- `Test_image*.jpg` — placeholder photos intentionally reused across sections; duplicates are not a bug.
- `README.md` — placeholder text only; do not rely on it for setup instructions.

## Conventions

- All user-facing copy and code comments are in Russian. Keep `<html lang="ru">` and Russian text.
- Keep the site dependency-free: vanilla HTML/CSS/JS, relative asset paths, no frameworks or bundlers unless explicitly requested.
- Navigation is hash-based within the single page; external calls to action link to `https://t.me/north_kittens`.

## Carousel behavior

- `image_carousel _script.js` auto-initializes every `.news-image-carousel`. Each carousel needs at least one `img.is-active`; previous/next buttons are optional.
- The active image's aspect ratio controls the carousel height, and the JS reads the CSS variables `--image-corner-radius` and `--carousel-slide-duration` (currently `20px` and `350ms`). Keep them in sync when changing animation timing.
- Buttons appear on hover (desktop); touch devices use horizontal swipe, so preserve `touch-action: pan-y` and the pointer handlers.

## Verification

There is no automated check. Open `index.html` directly in a browser and verify:

- desktop and narrow/mobile layout, including the nav anchors;
- a news carousel with buttons on desktop and swipe in mobile/touch emulation;
- no console errors after switching carousel images.
