# Tariq Design — static portfolio with Pages CMS

This is a framework-free static website for GitHub Pages. Content is stored in JSON and edited through Pages CMS; there is no database, backend, or build step.

## Repository structure

- `index.html` — semantic page shell
- `about/index.html` — full profile, capabilities, approach, and recognition
- `work/index.html` — all published engagements and their complete media sequences
- `visual-log/index.html` — standalone single-image work in a proportion-aware lightbox gallery
- `project/index.html` — data-driven full project page for a selected engagement
- `styles.css` — existing layout, typography, animation, and responsive rules
- `script.js` — loads JSON content and renders the homepage covers, About content, Work feed, and lightbox
- `content/site.json` — general website content
- `content/engagements.json` — selected engagement records
- `content/visual-log.json` — standalone Visual Log entries
- `.pages.yml` — Pages CMS fields and media settings
- `assets/images/uploads/` — images uploaded through Pages CMS
- `assets/fonts/` — locally hosted Geist Sans font and license

## Connect the repository to Pages CMS

1. Commit and push this repository, including `.pages.yml`, to GitHub.
2. Open [Pages CMS](https://app.pagescms.org/).
3. Choose **Sign in with GitHub** and authorize Pages CMS.
4. If prompted, install the Pages CMS GitHub App for the GitHub account or organisation that owns the site. Give it access to this repository.
5. In Pages CMS, select the repository and then select the branch used by GitHub Pages (normally `main`). Pages CMS reads `.pages.yml` from that branch.
6. Open **General website content** to edit site-wide wording and links, **Selected engagements** to edit full projects, or **Visual Log** to edit standalone single-image work.

## Edit and publish content

1. Change a field in Pages CMS. Keep required fields filled in.
2. For an engagement, set **Published** off to hide it. Drag engagement entries into the desired top-to-bottom order; the Home and Work pages use that same Pages CMS list order.
3. Add an optional **Project thumbnail**, choose its **Thumbnail crop focus**, and turn on **Feature on homepage** to make an engagement eligible for the homepage. The homepage shows cropped 16:9 thumbnails for the first three published, featured engagements in the shared list order. If the separate thumbnail is empty, the existing **Project cover image** is used. Selecting more than three does not create a separate order; only the first three appear. Each thumbnail opens that engagement's full project page.
4. Each published project appears once on the Work page as a linked thumbnail with its name below. Landscape thumbnails such as 1920×1080 and 1290×1080 span the full twelve-column grid. Square thumbnails such as 1080×1080 use six columns, allowing two to share a row. All thumbnails stack full width on mobile. The dedicated project page retains the complete ordered media sequence and lightbox.
5. Leave an optional field empty when the information is not available. Empty metadata and images are omitted from the page.
6. Save/publish the entry in Pages CMS. Pages CMS commits the JSON change directly to the selected GitHub branch—no CMS password or token is stored in this repository.
7. Open the repository on GitHub and confirm the new Pages CMS commit appears in the branch history.

## Visual Log

Use the separate **Visual Log** tab in Pages CMS for standalone work that has one image rather than a complete project story. Each entry has a name, optional year, image, accessible image description, and Published switch. Drag entries to control their order.

Visual Log images retain their source proportions. Horizontal images span the desktop grid; square and portrait images use six columns and can share a row. All entries stack full width on mobile. Selecting an entry opens the image in the shared keyboard-accessible lightbox; Visual Log entries do not create dedicated project pages.

## Mixed-media projects

Existing projects continue to use **Project cover image** and **Lightbox supporting images**. To use the full project-page system, add one or more **Ordered mixed-media blocks** to a project. Once that list contains a valid block, it becomes the dedicated project page’s media sequence and replaces the legacy cover/supporting layout. Home and Work use **Project thumbnail** when supplied, then fall back to **Project cover image**.

Available blocks:

- **Single image** joins adjacent image blocks in the automatic justified gallery.
- **Looping video** accepts MP4 or WebM, autoplays muted, loops, and includes native controls. Add the required fallback still image; it stays visible while the video loads and is used whenever playback is unavailable. Convert MOV files before uploading.
- **Image slider** accepts two to four slides, advances every second, and repeats seamlessly in order (1, 2, 3, 4, then 1 again) without visibly rewinding. It also supports swipe and clickable circle indicators. Use the same aspect ratio for every slide to avoid cropping changes.

Drag blocks in Pages CMS to control their exact order. Static images and slider slides remain available in the full-screen lightbox; videos play directly in the project feed.

Use **Project information** for the short description shown beside a project title in the work feed. The lightbox deliberately shows only the project title.

## Additional About sections

Use **Additional About sections** in General website content to build future profile content on the About page without editing code. Available blocks are **Text section**, **Image section**, and **Text + image section**. Blocks can be reordered and temporarily hidden with **Show section**.

Text supports headings, paragraphs, bold, italic, links, and lists, with controlled small, standard, or large type sizes. Images use one-, two-, or three-column grid widths and require an accessible image description. All blocks inherit Geist Sans, the shared four-column grid, responsive spacing, and mobile stacking rules.

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

- `--site-grid` is the shared page grid: twelve equal columns on desktop and two on mobile.
- `--edge` controls the common left and right page margin.
- `--gap` controls the common space between columns.
- `--type-body` sets the primary reading size to 14pt.
- `--type-header` compensates for the greater visual height of uppercase text so the header feels balanced with the 14pt reading text.
- `--gallery-target-ratio` controls the preferred project-image row height relative to the available width.
- `--gallery-max-items` limits how many images may share a justified row at each breakpoint.

Use `var(--site-grid)` for new page-level sections so their edges align with the header, profile, and footer. Image galleries and multi-column text inside a section may use a smaller nested grid, but the section itself should always sit on the shared outer grid. Editing these variables updates the system consistently across the website.

## Geist Sans

The website uses the locally hosted `Geist-VF.woff2` variable font under the SIL Open Font License 1.1. The license is in `assets/fonts/OFL-1.1.txt`.
