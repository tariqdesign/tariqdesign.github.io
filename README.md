# Tariq Design — Director-level authority site

A lightweight static site designed for GitHub Pages. No framework or build step is required.

## Structure

- `index.html` — all website content
- `styles.css` — layout, typography and responsive design
- `script.js` — mobile navigation and current year
- `CNAME` — custom domain for GitHub Pages
- `assets/fonts/` — locally hosted Overused Grotesk variable webfont and license

## Editing guide

The site is intentionally framework-free and split by responsibility:

- Edit visible wording, navigation links, work names, Behance links, and the email address in `index.html`.
- Edit colors, page width, spacing, and type sizes in the `:root` design tokens near the top of `styles.css`.
- Edit section layouts inside the clearly labelled CSS blocks. The mobile layout starts at `@media (max-width: 800px)`.
- `script.js` only controls the mobile menu. Its breakpoint must match the CSS breakpoint.

HTML sections are marked with comments. Each selected-work item currently links to the main Behance archive; replace its `href` with the direct case-study URL when available.

## Overused Grotesk

The site uses the locally hosted `OverusedGrotesk-VF.woff2` variable font, supporting weights from 300 to 900. It is distributed under the SIL Open Font License 1.1.

Typography uses an 18px base and a 1.333 (Major Third) modular scale: 18px, 24px, 32px, and 42.7px. A 22px optical reading size is also available as `--reading`.

- Source: https://github.com/RandomMaerks/Overused-Grotesk
- License: `assets/fonts/OFL-1.1.txt`

## Important edits before launch

1. Confirm the Behance profile URL and add direct case-study URLs when ready.
2. Keep the confirmed `16+ years` figure consistent with the CV and LinkedIn.
3. Add a social sharing image and reference it with `og:image` in `index.html`.
4. The temporary contact email is `tariqdesign@gmail.com`; replace it in `index.html` when the permanent address is ready.

## Publish through GitHub Pages

1. Create a public GitHub repository, for example `tariqdesign-site`.
2. Upload all files in this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select `main` and `/root`, then save.
6. In **Custom domain**, enter `tariqdesign.com`.
7. Enable **Enforce HTTPS** after GitHub confirms the DNS records.

## Domain DNS

For an apex domain on GitHub Pages, point the domain to GitHub's current Pages IP records and add the `www` CNAME requested by GitHub. Confirm the current records in GitHub's official documentation before changing DNS because infrastructure values can change.

The included `CNAME` file contains:

```text
tariqdesign.com
```
