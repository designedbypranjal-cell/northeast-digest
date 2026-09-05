# Northeast Digest

A news site with three sections — **Assamese/Assam-regional**, **Hindi**, and
**English** — focused on culture, business, sports, science and tech.
Political and government stories are deliberately left out. Includes a
live, cross-language search box (as-you-type, no page reload) and a
modern, responsive, dark-mode-aware layout.

**Live site:** enable GitHub Pages for this repo (Settings → Pages → Source:
`main` branch, `/ (root)` folder) and it'll be at
`https://<your-username>.github.io/<repo-name>/`.

## How it stays current

A [GitHub Actions workflow](.github/workflows/update-news.yml) runs every 4
hours (and on every push), fetches fresh headlines, filters them, and commits
the result to `data.json`. The page (`index.html`) just reads that file — no
server, no API keys, no backend to maintain.

## Sources

- **Assamese/Assam:** EastMojo (Assam), The Assam Tribune, The Sentinel Assam
  — their own reporting, not aggregated from anywhere else.
- **Hindi & English:** Google News topic feeds, deliberately restricted to
  Entertainment, Business, Technology, Sports, Science and Health — the
  Nation/World/Politics topics are never queried in the first place. English
  also includes TechCrunch directly.

Every story links back to the original publisher. Nothing is rehosted,
embedded, or pulled from another portal's video player.

## About the political-content filter

On top of only pulling non-political topic feeds, each headline is checked
against a keyword blocklist (election, minister, parliament, party names,
etc., in English and Hindi) before it's shown. This is a best-effort filter,
not a guarantee — an occasional government or civic story may slip through
if it doesn't match any keyword. Edit the `BLOCKLIST` list in
`scripts/fetch_news.py` to tune it.

## Running it yourself / adding sources

```bash
pip install -r requirements.txt
python scripts/fetch_news.py   # writes data.json
```

Add or remove feeds in the `SOURCES` dict at the top of
`scripts/fetch_news.py`.
