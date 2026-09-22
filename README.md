# isjaredbusy

One page. One question. **Is Jared busy?**

A tiny static site: a big live status badge ("Yep." / "Nope.") computed from
the weekly schedule in `app.js`, plus a week-at-a-glance grid of free windows.
Hand the URL to anyone instead of repeating your availability for the 40th time.

## How it works

- `index.html` — the page
- `styles.css` — the look
- `app.js` — **the schedule lives here** (`SCHEDULE`, free windows per day in `HH:MM`)

To update availability, edit the `SCHEDULE` object in `app.js`, commit, push.
GitHub Pages rebuilds automatically — the site updates within a minute or two.

## Deploy (GitHub Pages)

1. Push this repo to GitHub.
2. Repo Settings → Pages → Deploy from branch → `main` / `/ (root)`.
3. Site goes live at `https://<username>.github.io/isjaredbusy/`.

No build step, no dependencies, no backend. It's just files.
