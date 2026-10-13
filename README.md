# FoldOut website

The marketing, support and legal pages for **FoldOut: Cube Folding Puzzle**, built as a static site for GitHub Pages.
It has no build step and no dependencies.

| Page | File | Use in App Store Connect |
| --- | --- | --- |
| Home | `index.html` | Marketing URL (optional) |
| Support | `support.html` | **Support URL (required)** |
| Privacy Policy | `privacy.html` | **Privacy Policy URL (required)** |
| Terms of Use | `terms.html` | In-app paywall link and App Description |
| Not found | `404.html` | Served automatically by GitHub Pages |

## Publish on GitHub Pages

1. Create a new **public** repository on GitHub, for example `foldout`.
2. Upload everything in this folder to the root of the repository, including the hidden `.nojekyll` file and the `assets` folder.
3. Open **Settings › Pages**, set **Source** to *Deploy from a branch*, pick `main` and `/ (root)`, then click **Save**.
4. After a minute or two the site will be live at `https://<your-username>.github.io/<repo-name>/`.

The URLs will then be:

- `https://<your-username>.github.io/<repo-name>/`
- `https://<your-username>.github.io/<repo-name>/support.html`
- `https://<your-username>.github.io/<repo-name>/privacy.html`
- `https://<your-username>.github.io/<repo-name>/terms.html`

## When the app goes live

Both "Coming soon · App Store" buttons on the home page have `data-app-store-link` and `href="#"`.
Replace `#` with your App Store URL, and optionally swap the buttons for Apple's official
"Download on the App Store" badge from https://developer.apple.com/app-store/marketing/guidelines/.

## Structure

- `assets/style.css`: the theme, using the app's light and dark palette
- `assets/site.js`: the theme toggle (system, light or dark), reveal-on-scroll and the table of contents
- `assets/fold.js`: the hero animation (a CSS 3D port of the app's fold-up animation) and the 11-net picker
- `assets/favicon.svg`: the isometric cube logo
- `assets/apple-touch-icon.png`: the home-screen icon for iPhone and iPad
- `assets/og-image.png`: the preview image used when the link is shared (wired up once the site's final URL is known)
