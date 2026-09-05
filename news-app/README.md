# Northeast Digest

A news site with four sections — **Assamese/Assam-regional**, **Hindi**,
**English (India)**, and **World** — focused on culture, business, sports,
science and tech. Political and government stories are deliberately left
out. Includes a live, cross-language search box (as-you-type, no page
reload) and a modern, responsive, dark-mode-aware layout.

**Live site:** enable GitHub Pages for this repo (Settings → Pages → Source:
`main` branch, `/ (root)` folder) and it'll be at
`https://<your-username>.github.io/<repo-name>/`.

## How it stays current

A [GitHub Actions workflow](.github/workflows/update-news.yml) runs every 4
hours (and on every push), fetches fresh headlines from every section
(including World), filters them, and commits the result to `data.json`. The
page (`index.html`) just reads that file — no server, no API keys, no
backend to maintain.

## Sources

- **Assamese/Assam:** EastMojo (Assam), The Assam Tribune, The Sentinel Assam
  — their own reporting, not aggregated from anywhere else.
- **Hindi:** Google News India, Hindi-language, topic feeds.
- **English:** Google News India, English-language, topic feeds + TechCrunch.
- **World:** Google News US/global-edition topic feeds + ScienceDaily — for
  coverage that isn't India-specific.

All four are deliberately restricted to non-political topics (Entertainment,
Business, Technology, Sports, Science, Health) — the Nation/World-politics
sections are never queried in the first place.

Every story links back to the original publisher. Nothing is rehosted,
embedded, or pulled from another portal's video player.

## About the political-content filter

On top of only pulling non-political topic feeds, each headline is checked
against a keyword blocklist (election, minister, parliament, party names,
etc., in English and Hindi) before it's shown. This is a best-effort filter,
not a guarantee — an occasional government or civic story may slip through
if it doesn't match any keyword. Edit the `BLOCKLIST` list in
`scripts/fetch_news.py` to tune it.

## Making it findable in search engines worldwide

A few things are already in place so the site can be indexed by Google and
other search engines, not just found by people who already have the link:

- `robots.txt` explicitly allows all crawlers and points to `sitemap.xml`.
- `sitemap.xml` lists the page so crawlers know it exists.
- `index.html` has an SEO title/description, Open Graph and Twitter-card
  tags (for link previews), a canonical URL, and JSON-LD `WebSite` structured
  data with a `SearchAction` — this is what lets Google show a search box
  directly under the site in results, and lets `?q=your+search` deep-link
  straight into a filtered view.

**Being crawlable isn't the same as being crawled yet.** A brand-new site
doesn't get indexed the moment it's live — search engines need to discover
it first. To speed that up:

1. Update the two hard-coded URLs (`https://designedbypranjal-cell.github.io/northeast-digest/`)
   in `index.html`, `robots.txt`, and `sitemap.xml` if you ever rename the
   repo or use a custom domain.
2. Submit the site in [Google Search Console](https://search.google.com/search-console)
   (Add property → your GitHub Pages URL → verify → submit `sitemap.xml`).
   This is the single biggest thing that speeds up indexing — usually days
   rather than weeks.
3. Do the same in [Bing Webmaster Tools](https://www.bing.com/webmasters)
   if you want Bing/Yahoo coverage too.
4. Sharing the link anywhere public (social media, forums, other sites
   linking to it) also helps search engines find and trust it faster.

## Running it yourself / adding sources

```bash
pip install -r requirements.txt
python scripts/fetch_news.py   # writes data.json
```

Add or remove feeds (including a 5th section, if you want one) in the
`SOURCES` dict at the top of `scripts/fetch_news.py`.
