# Tariq Design — static portfolio with Pages CMS

This is a framework-free static website for GitHub Pages. Content is stored in JSON and edited through Pages CMS; there is no database, backend, or build step.

## Repository structure

- `index.html` — semantic page shell
- `styles.css` — existing layout, typography, animation, and responsive rules
- `script.js` — loads JSON content, renders engagements, and controls mobile navigation
- `content/site.json` — general website content
- `content/engagements.json` — the three selected engagements
- `.pages.yml` — Pages CMS fields and media settings
- `assets/images/uploads/` — images uploaded through Pages CMS
- `assets/fonts/` — locally hosted Overused Grotesk font and license
- `CNAME` — the `tariqdesign.com` custom domain

## Connect the repository to Pages CMS

1. Commit and push this repository, including `.pages.yml`, to GitHub.
2. Open [Pages CMS](https://app.pagescms.org/).
3. Choose **Sign in with GitHub** and authorize Pages CMS.
4. If prompted, install the Pages CMS GitHub App for the GitHub account or organisation that owns the site. Give it access to this repository.
5. In Pages CMS, select the repository and then select the branch used by GitHub Pages (normally `main`). Pages CMS reads `.pages.yml` from that branch.
6. Open **General website content** to edit the site-wide wording and links, or **Selected engagements** to edit the project records.

## Edit and publish content

1. Change a field in Pages CMS. Keep required fields filled in.
2. For an engagement, set **Published** off to hide it. Published engagements appear in ascending **Display order**; equal order values keep their JSON order.
3. Leave an optional field empty when the information is not available. Empty metadata and images are omitted from the page.
4. Save/publish the entry in Pages CMS. Pages CMS commits the JSON change directly to the selected GitHub branch—no CMS password or token is stored in this repository.
5. Open the repository on GitHub and confirm the new Pages CMS commit appears in the branch history.

## Upload images

1. In an engagement, choose **Cover image** or **Supporting images**.
2. Select an existing media item or upload a WebP, JPG, JPEG, or PNG file.
3. Pages CMS stores uploads in `assets/images/uploads` and writes the public path as `/assets/images/uploads/...` in `content/engagements.json`.
4. Save/publish the engagement. Use concise descriptive filenames; Pages CMS safely normalises uploaded filenames.

The browser converts CMS image paths to page-relative URLs at runtime. This keeps uploads working at `https://tariqdesign.com/` and in GitHub Pages project-site previews. If an image cannot load, it is removed cleanly instead of showing a broken-image icon.

## Confirm GitHub Pages redeploys

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, then select the CMS branch (normally `main`) and `/root`.
3. After a Pages CMS commit, open the repository’s **Actions** tab and wait for the `pages build and deployment` workflow to finish successfully.
4. Open `https://tariqdesign.com/` in a private browser window and confirm the edited content is live. GitHub Pages deployments can take a few minutes after the commit.

For initial domain setup, enter `tariqdesign.com` under **Settings → Pages → Custom domain** and enable **Enforce HTTPS** after GitHub verifies the DNS records. The included `CNAME` file already contains the domain.

## Local preview

JSON loading requires an HTTP server rather than opening `index.html` directly from disk. From the repository root, run a small static server such as `python3 -m http.server 8000`, then open `http://localhost:8000/`.

## Overused Grotesk

The website uses the locally hosted `OverusedGrotesk-VF.woff2` variable font under the SIL Open Font License 1.1. The license is in `assets/fonts/OFL-1.1.txt`.
