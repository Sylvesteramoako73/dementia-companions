// Assembles root pages from src/pages/*.html + src/partials/{header,footer}.html,
// generates one page per city from src/templates/city.html + src/data/cities.json,
// and injects SEO: canonical, Open Graph / Twitter, JSON-LD, image dimensions,
// lazy loading, sitemap.xml and robots.txt.
// Usage: node build.js
const fs = require("fs"), path = require("path");

const SITE = "https://dementiacompanions.com"; // production origin used for canonical / sitemap / schema
const CLEAN_URLS = true; // matches vercel.json cleanUrls — canonical/sitemap URLs drop the .html extension
const urlFor = file => SITE + "/" + (file === "index.html" ? "" : CLEAN_URLS ? file.replace(/.html$/, "") : file);
const BIZ = {
  name: "Dementia Companions",
  legalName: "Dementia Companions LLC",
  phone: "+1-689-333-6079",
  email: "support@dementiacompanions.com",
  logo: "assets/img/og-image.jpg",
  founded: "2022",
  sameAs: [], // add real profile URLs, e.g. "https://www.facebook.com/dementiacompanions" — icons render only when present
  hours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
    { days: ["Saturday"], opens: "10:00", closes: "14:00" },
  ],
};
const IMG = { // intrinsic sizes for width/height attributes (prevents layout shift)
  "hero.jpg": [1280, 720], "caregiver.jpg": [1200, 800], "communication.jpg": [1125, 750], "comforting.jpg": [768, 1152],
  "demen.webp": [900, 506], "hands.webp": [768, 593], "first-visit.jpg": [768, 512], "walking.jpg": [768, 512],
  "family.jpg": [768, 512], "mealtime.jpg": [768, 512], "apathy.jpg": [768, 512], "cane.jpg": [768, 510], "og-image.jpg": [1200, 630],
};

const read = p => fs.readFileSync(path.join(__dirname, p), "utf8");
const header = read("src/partials/header.html"), footer = read("src/partials/footer.html");
const cities = JSON.parse(read("src/data/cities.json"));
const esc = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const strip = s => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const json = o => JSON.stringify(o).replace(/</g, "\\u003c");

// Split a leading "<!-- key: value -->" block into meta + body
function parse(src) {
  const meta = {};
  const body = src.replace(/^<!--([\s\S]*?)-->\s*/, (_, m) => {
    m.trim().split("\n").forEach(l => { const [k, ...v] = l.split(":"); meta[k.trim()] = v.join(":").trim(); });
    return "";
  });
  return { meta, body };
}
const SOCIAL_ICON = { facebook: "i-fb", "x.com": "i-x", twitter: "i-x", instagram: "i-ig", youtube: "i-yt" };
const socialLinks = BIZ.sameAs.map(u => { const k = Object.keys(SOCIAL_ICON).find(k => u.includes(k)); return k ? `<a href="${u}" target="_blank" rel="noopener" aria-label="${k}"><svg><use href="#${SOCIAL_ICON[k]}"/></svg></a>` : ""; }).join("");
const render = (tpl, vars) => tpl.replace(/{{(\w+)}}/g, (_, k) => vars[k] ?? "");

/* ---------- Structured data ---------- */
function orgSchema() {
  return {
    "@type": "LocalBusiness", "@id": SITE + "/#organization",
    name: BIZ.name, legalName: BIZ.legalName, url: SITE + "/", logo: SITE + "/" + BIZ.logo, image: SITE + "/" + BIZ.logo,
    telephone: BIZ.phone, email: BIZ.email, foundingDate: BIZ.founded, priceRange: "$35/hour",
    description: "Consistent, AHCA-screened in-home dementia companions matched to your loved one within 48 hours. Serving families across Florida.",
    areaServed: cities.map(c => ({ "@type": "City", name: c.city, containedInPlace: { "@type": "State", name: "Florida" } })),
    address: { "@type": "PostalAddress", addressRegion: "FL", addressCountry: "US" },
    openingHoursSpecification: BIZ.hours.map(h => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
    ...(BIZ.sameAs.length ? { sameAs: BIZ.sameAs } : {}),
  };
}
function breadcrumbSchema(body, url) {
  const m = body.match(/<div class="crumbs">([\s\S]*?)<\/div>/);
  if (!m) return null;
  const last = strip((m[1].match(/<b>([\s\S]*?)<\/b>/) || [])[1] || "");
  return { "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
    { "@type": "ListItem", position: 2, name: last, item: url },
  ] };
}
function faqSchema(body) {
  if (!/faq-grid/.test(body)) return null;
  const items = [...body.matchAll(/<div class="acc"><button[^>]*>([\s\S]*?)<span class="plus">[\s\S]*?<div class="body"><p>([\s\S]*?)<\/p>/g)];
  if (!items.length) return null;
  return { "@type": "FAQPage", mainEntity: items.map(([, q, a]) => ({
    "@type": "Question", name: strip(q), acceptedAnswer: { "@type": "Answer", text: strip(a) } })) };
}
function webpageSchema(meta, url) {
  return { "@type": "WebPage", "@id": url, url, name: meta.title, description: meta.description, isPartOf: { "@id": SITE + "/#website" }, about: { "@id": SITE + "/#organization" } };
}
const websiteSchema = { "@type": "WebSite", "@id": SITE + "/#website", url: SITE + "/", name: BIZ.name, publisher: { "@id": SITE + "/#organization" } };

/* ---------- Per-page transforms ---------- */
function seoHead(meta, file, body) {
  const url = urlFor(file);
  const ogImage = SITE + "/" + (meta.image || BIZ.logo);
  const graph = [websiteSchema, orgSchema(), webpageSchema(meta, url)];
  const bc = breadcrumbSchema(body, url); if (bc) graph.push(bc);
  const faq = faqSchema(body); if (faq) graph.push(faq);
  if (meta.schema) graph.push(JSON.parse(meta.schema));
  return `<link rel="canonical" href="${url}">
<meta name="robots" content="${meta.robots || "index, follow, max-image-preview:large"}">
<meta name="theme-color" content="#2f5d50">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(BIZ.name)}">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(meta.title)}">
<meta name="twitter:description" content="${esc(meta.description)}">
<meta name="twitter:image" content="${ogImage}">
<script type="application/ld+json">${json({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}

function optimizeImages(html) {
  let first = true;
  return html.replace(/<img ([^>]*?)src="assets\/img\/([^"]+)"([^>]*)>/g, (m, pre, file, post) => {
    const dim = IMG[file];
    let attrs = pre + `src="assets/img/${file}"` + post;
    if (dim && !/width=/.test(attrs)) attrs += ` width="${dim[0]}" height="${dim[1]}"`;
    if (!/loading=/.test(attrs)) attrs += first ? ` fetchpriority="high"` : ` loading="lazy" decoding="async"`;
    first = false;
    return `<img ${attrs.trim()}>`;
  });
}

function buildPage(file, src) {
  const { meta, body } = parse(src);
  if (meta.description && meta.description.length > 160) console.warn(`  ! ${file}: description is ${meta.description.length} chars (aim ≤160)`);
  let html = render(header + body + footer, { ...meta, socialLinks, socialBlock: socialLinks ? `<h4 style="margin-top:2rem">Our Social Media</h4><div class="social" style="display:flex;gap:.6rem">${socialLinks.replace(/<a /g, '<a class="btn btn-ghost btn-sm" ')}</div>` : "" });
  html = html.replace("</head>", seoHead(meta, file, body) + "\n</head>");
  html = optimizeImages(html);
  fs.writeFileSync(path.join(__dirname, file), html);
  console.log("built", file);
  return { file, meta };
}

/* ---------- Build ---------- */
const built = [];
for (const file of fs.readdirSync(path.join(__dirname, "src/pages"))) {
  if (file.endsWith(".html")) built.push(buildPage(file, read("src/pages/" + file)));
}
const cityTpl = read("src/templates/city.html");
for (const c of cities) {
  const vars = {
    ...c,
    neighborhoodsShort: c.neighborhoods.slice(0, 3).join(", "),
    neighborhoodItems: c.neighborhoods.map(n => `<li><svg><use href="#i-pin"/></svg> ${n}</li>`).join(""),
    otherCityLinks: cities.filter(o => o.slug !== c.slug).map(o => `<a class="phone-pill" href="${o.slug}.html">${o.city}</a>`).join(""),
    schema: json({ "@type": "Service", serviceType: "In-home dementia companion care", name: `In-Home Dementia Care in ${c.city}`,
      provider: { "@id": SITE + "/#organization" }, areaServed: { "@type": "City", name: c.city, containedInPlace: { "@type": "State", name: "Florida" } },
      url: urlFor(c.slug + ".html"), offers: { "@type": "Offer", price: "35", priceCurrency: "USD", unitText: "hour" } }),
  };
  built.push(buildPage(c.slug + ".html", render(cityTpl, vars)));
}

/* ---------- sitemap.xml + robots.txt ---------- */
const NOINDEX = new Set(["404.html"]);
const priority = f => f === "index.html" ? "1.0" : /services|areas|contact|miami|orlando|tampa|jacksonville/.test(f) ? "0.8" : /privacy|cookies|terms|accessibility/.test(f) ? "0.2" : "0.6";
const today = new Date().toISOString().slice(0, 10);
const urls = built.filter(b => !NOINDEX.has(b.file)).map(b =>
  `  <url><loc>${urlFor(b.file)}</loc><lastmod>${today}</lastmod><priority>${priority(b.file)}</priority></url>`);
fs.writeFileSync(path.join(__dirname, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(__dirname, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /src/\nDisallow: /404.html\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log("built sitemap.xml, robots.txt");
