# Tariq Design — static portfolio with Pages CMS

This is a framework-free static website for GitHub Pages. Content is stored in JSON and edited through Pages CMS; there is no database, backend, or build step.

## Repository structure

- `index.html` — semantic page shell
- `styles.css` — existing layout, typography, animation, and responsive rules
- `script.js` — loads JSON content, renders the visual feed and lightbox, and connects the CMS content to the homepage
- `content/site.json` — general website content
- `content/engagements.json` — selected engagement records
- `.pages.yml` — Pages CMS fields and media settings
- `assets/images/uploads/` — images uploaded through Pages CMS
- `assets/fonts/` — locally hosted Geist Sans font and license

## Connect the repository to Pages CMS

1. Commit and push this repository, including `.pages.yml`, to GitHub.
2. Open [Pages CMS](https://app.pagescms.org/).
3. Choose **Sign in with GitHub** and authorize Pages CMS.
4. If prompted, install the Pages CMS GitHub App for the GitHub account or organisation that owns the site. Give it access to this repository.
5. In Pages CMS, select the repository and then select the branch used by GitHub Pages (normally `main`). Pages CMS reads `.pages.yml` from that branch.
6. Open **General website content** to edit the site-wide wording and links, or **Selected engagements** to edit the project records.

## Edit and publish content

1. Change a field in Pages CMS. Keep required fields filled in.
2. For an engagement, set **Published** off to hide it. Published engagements appear in ascending **Order**; equal order values keep their JSON order.
3. Add up to 14 published projects in **Selected engagements**. Each project appears once with its cover and supporting images grouped beneath one project name. **Additional lightbox images** remain available after the project images in the full-screen viewer.
   The homepage builds justified rows automatically from the images’ natural proportions and a shared target height. Depending on the image shapes, a desktop row may contain one landscape, two square, or three portrait images; completed rows fill the available width at equal height. The final incomplete row keeps the target height and natural widths. Mobile recalculates the same system with a maximum of two images per row.
4. Leave an optional field empty when the information is not available. Empty metadata and images are omitted from the page.
5. Save/publish the entry in Pages CMS. Pages CMS commits the JSON change directly to the selected GitHub branch—no CMS password or token is stored in this repository.
6. Open the repository on GitHub and confirm the new Pages CMS commit appears in the branch history.

## Mixed-media projects

Existing projects continue to use **Cover image** and **Lightbox supporting images**. To use the new system, add one or more **Ordered mixed-media blocks** to a project. Once that list contains a valid block, it becomes the project’s homepage media sequence and replaces the legacy cover/supporting layout.

Available blocks:

- **Single image** joins adjacent image blocks in the automatic justified gallery.
- **Looping video** accepts MP4 or WebM, autoplays muted, loops, includes native controls, and can use a poster image. Convert MOV files before uploading.
- **Image slider** accepts two to four slides, changes every four seconds, supports swipe and arrow controls, and includes pause/play and a slide counter. Use the same aspect ratio for every slide to avoid cropping changes.

Drag blocks in Pages CMS to control their exact order. Static images and slider slides remain available in the full-screen lightbox; videos play directly in the project feed.

## Upload images

1. Choose **Additional lightbox images** in General website content, choose a legacy project image field, or add an image/video inside **Ordered mixed-media blocks**.
2. Select an existing media item or upload a WebP, JPG, JPEG, or PNG file.
3. Pages CMS stores images in `assets/images/uploads` and videos in `assets/videos/uploads`, then writes their public paths into the relevant JSON file.
4. Save/publish the content. Use concise descriptive filenames; Pages CMS safely normalises uploaded filenames.

The browser converts CMS image paths to page-relative URLs at runtime. This keeps uploads working at `https://tariqdesign.com/` and in GitHub Pages project-site previews. If an image cannot load, it is removed cleanly instead of showing a broken-image icon.

## Confirm GitHub Pages redeploys

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, then select the CMS branch (normally `main`) and `/root`.
3. After a Pages CMS commit, open the repository’s **Actions** tab and wait for the `pages build and deployment` workflow to finish successfully.
4. Open `https://tariqdesign.github.io/` in a private browser window and confirm the edited content is live. GitHub Pages deployments can take a few minutes after the commit.

When you are ready to move the custom domain, enter `tariqdesign.com` under **Settings → Pages → Custom domain** and enable **Enforce HTTPS** after GitHub verifies the DNS records. Do not change the domain’s DNS until you are ready to replace the current Hostinger website.

## Local preview

JSON loading requires an HTTP server rather than opening `index.html` directly from disk. From the repository root, run a small static server such as `python3 -m http.server 8000`, then open `http://localhost:8000/`.

## Layout system

The site uses one Swiss-style outer grid defined by reusable CSS variables at the top of `styles.css`:

- `--site-grid` is the shared page grid: four equal columns on desktop and two on mobile.
- `--edge` controls the common left and right page margin.
- `--gap` controls the common space between columns.
- `--type-body` sets the primary reading size to 14pt.
- `--type-header` compensates for the greater visual height of uppercase text so the header feels balanced with the 14pt reading text.
- `--gallery-target-ratio` controls the preferred project-image row height relative to the available width.
- `--gallery-max-items` limits how many images may share a justified row at each breakpoint.

Use `var(--site-grid)` for new page-level sections so their edges align with the header, profile, and footer. Image galleries and multi-column text inside a section may use a smaller nested grid, but the section itself should always sit on the shared outer grid. Editing these variables updates the system consistently across the website.

## Geist Sans

The website uses the locally hosted `Geist-VF.woff2` variable font under the SIL Open Font License 1.1. The license is in `assets/fonts/OFL-1.1.txt`.
