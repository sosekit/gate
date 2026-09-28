# Aidan Kelley

A lightweight static portfolio and shop site. It opens directly in a browser and does not require a server or build step.

## Edit content

All names, labels, portfolio entries, products, prices, and placeholder materials live in:

`content/site-content.js`

Content changes appear after refreshing the page.

Supported placeholder product shapes are:

- `canvas-portrait`
- `canvas-square`
- `canvas-landscape`
- `canvas-tall`
- `canvas-wide`

Portfolio images belong in `assets/images/portfolio/`. Set each project's `image` value to its relative file path, for example `assets/images/portfolio/project-01.jpg`.

Replace the landing video and poster in `assets/video/`, or change their paths in `content/site-content.js`. The gate video plays once and holds on its last frame. Set `revealProgress` between `0` and `1` to control when the centered destination links appear. `minimumRevealMs` keeps those links hidden until the name animation has completed.

The Contact link opens `contact.html`. Edit its two lines in the `contact` section of `content/site-content.js`.

## Main files

- `index.html`: landing page shell
- `portfolio.html`: portfolio page shell
- `shop.html`: shop page shell
- `contact.html`: short contact page shell
- `styles.css`: shared visual styles
- `fonts/oldenglishtextmt.ttf`: self-hosted site typeface
- `content/site-content.js`: editable site content
- `scripts/site.js`: shared labels and landing media
- `scripts/portfolio.js`: portfolio rendering
- `scripts/shop.js`: lightweight CSS 3D carousel
- `templates/`: reusable clean copies
- `backups/`: preserved earlier versions

## Hand-off notes

Keep relative paths intact so the site continues to work from `file://`. Product content remains separate from the carousel code, so names and prices stay easy to update. The blank canvas objects use ordinary HTML and CSS rather than a rendering library.
