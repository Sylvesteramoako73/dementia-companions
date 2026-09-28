# Dementia Companions — website

Static site modelled on the Lakare senior-care theme layout, populated with
content from dementiacompanions.com.

## Structure

- `src/partials/header.html`, `src/partials/footer.html` — shared chrome (top bar, nav, icon sprite, newsletter, footer)
- `src/pages/*.html` — page content only; a leading HTML comment sets `title:` and `description:`
- `src/templates/city.html` + `src/data/cities.json` — one city page is generated per entry (miami, orlando, tampa, jacksonville). Add a city by adding a JSON entry and rebuilding.
- `build.js` — stitches partials + pages into the root `*.html` files
- `css/style.css` — design tokens (`:root`) and all component styles
- `js/main.js` — mobile nav, service tabs, testimonial slider, accordion, counters, reveal-on-scroll, contact estimator
- `assets/img/` — photos pulled from the current dementiacompanions.com site

## SEO (handled by build.js)

Every page gets: canonical URL, Open Graph + Twitter cards, JSON-LD (WebSite, LocalBusiness,
WebPage, plus BreadcrumbList / FAQPage / Service where relevant), image width/height + lazy
loading, and is listed in .  and  are generated too.

- Set  in build.js to the production origin before deploying.
- Add social profile URLs to  — footer/contact icons appear automatically.
- Social share image:  (1200×630).

## SEO (handled by build.js)

Every page gets: canonical URL, Open Graph + Twitter cards, JSON-LD (WebSite, LocalBusiness,
WebPage, plus BreadcrumbList / FAQPage / Service where relevant), image width/height + lazy
loading, and is listed in `sitemap.xml`. `robots.txt` and `404.html` are generated too.

- Set `SITE` in build.js to the production origin before deploying.
- Add social profile URLs to `BIZ.sameAs` — footer/contact icons appear automatically.
- Social share image: `assets/img/og-image.jpg` (1200×630).

## Editing

1. Edit a page in `src/pages/` (or the partials for site-wide changes).
2. Run `node build.js`.
3. Open any root `*.html` file in a browser — no server needed.

Forms are front-end only (`data-demo`): wire them to Formspree, Netlify Forms,
or your WordPress endpoint before going live.
