# Fools Gate

A static three-page portfolio and shop site. It opens directly in a browser and does not require a server.

## Edit content

All names, labels, portfolio entries, products, prices, and placeholder materials live in:

`content/site-content.js`

Content changes appear after refreshing the page. They do not require rebuilding the 3D code.

Supported placeholder product shapes are:

- `torus-knot`
- `icosahedron`
- `shell`
- `sphere`
- `octahedron`
- `torus`
- `box`

Portfolio images belong in `assets/images/portfolio/`. Set each project's `image` value to its relative file path, for example `assets/images/portfolio/project-01.jpg`.

Replace the landing video and poster in `assets/video/`, or change their paths in `content/site-content.js`. The gate video plays once and holds on its last frame. Set `revealProgress` between `0` and `1` to control when the centered portfolio and shop links appear.

## Main files

- `index.html`: landing page shell
- `portfolio.html`: portfolio page shell
- `shop.html`: 3D shop page shell
- `styles.css`: shared visual styles
- `fonts/oldenglishtextmt.ttf`: self-hosted site typeface
- `content/site-content.js`: editable site content
- `scripts/site.js`: shared labels and landing media
- `scripts/portfolio.js`: portfolio rendering
- `scripts/shop-3d.js`: editable Three.js carousel source
- `scripts/shop-3d.bundle.js`: browser-ready generated carousel
- `templates/`: reusable clean copies
- `backups/`: preserved earlier versions

## Develop the 3D carousel

Install the build tool once:

```sh
npm install
```

Rebuild after changing `scripts/shop-3d.js`:

```sh
npm run build
```

Use `npm run watch` while actively editing the carousel.

The site loads `scripts/shop-3d.bundle.js`, not the source file. Product content remains outside the bundle so names and prices stay easy to update.

## Hand-off notes

Keep relative paths intact so the site continues to work from `file://`. Actual GLB or GLTF product models can later replace the placeholder geometry inside `createGeometry()` in `scripts/shop-3d.js`. If external 3D models are introduced, run the site through a local or hosted web server rather than opening it directly as a file.
