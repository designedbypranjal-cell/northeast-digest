#!/usr/bin/env python3
"""
Fetches non-political news headlines in Assamese/Assam-regional, Hindi, and
English, and writes them to data.json for the static site to display.

Runs server-side (in GitHub Actions), so there are no browser CORS issues.
Designed to fail soft: if one feed is down or changes shape, it's skipped
rather than breaking the whole build.
"""
import json
import re
import sys
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import feedparser

# ---------------------------------------------------------------------------
# Sources
# ---------------------------------------------------------------------------
# "assamese" = Assam-regional outlets (their own reporting, not aggregated).
# "hindi" / "english" = Google News topic feeds, which already separate out
# non-political topics (Entertainment/Business/Technology/Sports/Science) from
# the Nation/World/Politics sections we deliberately never query.

GOOGLE_NEWS_TOPICS = ["ENTERTAINMENT", "BUSINESS", "TECHNOLOGY", "SPORTS", "SCIENCE", "HEALTH"]

def google_news_feed(topic, hl, gl, ceid):
    return f"https://news.google.com/rss/headlines/section/topic/{topic}?hl={hl}&gl={gl}&ceid={ceid}"

SOURCES = {
    "assamese": [
        {"name": "EastMojo (Assam)", "url": "https://eastmojo.com/assam/feed/"},
        {"name": "The Assam Tribune", "url": "https://assamtribune.com/feed"},
        {"name": "The Sentinel Assam", "url": "https://www.sentinelassam.com/feed"},
    ],
    "hindi": [
        {"name": f"Google News Hindi – {t.title()}",
         "url": google_news_feed(t, "hi", "IN", "IN:hi")}
        for t in GOOGLE_NEWS_TOPICS
    ],
    "english": [
        {"name": "TechCrunch", "url": "https://techcrunch.com/feed/"},
        *[
            {"name": f"Google News – {t.title()}",
             "url": google_news_feed(t, "en-IN", "IN", "IN:en")}
            for t in GOOGLE_NEWS_TOPICS
        ],
    ],
}

MAX_ITEMS_PER_SECTION = 15
MAX_AGE_DAYS = 4

# ---------------------------------------------------------------------------
# Political-content filter (best-effort keyword match, not perfect).
# Matched case-insensitively against the item's title + summary.
# ---------------------------------------------------------------------------
BLOCKLIST = [
    # English
    "election", "elections", "parliament", "lok sabha", "rajya sabha",
    "assembly session", "assembly elections", "cabinet reshuffle", "minister",
    "ministers", "ministry of", "chief minister", "prime minister", "president",
    "governor", "mla", "mp ", " mp,", "bjp", "congress party", "aap party",
    "shiv sena", "trinamool", "rjd", "jdu", "opposition party", "ruling party",
    "political party", "party workers", "protest march", "bandh", "rally",
    "manifesto", "no-confidence", "impeach", "coalition government",
    "vote bank", "poll body", "election commission", "referendum", "sena",
    "modi", "rahul gandhi", "amit shah", "parliament session",
    # Hindi (Devanagari)
    "चुनाव", "मंत्री", "संसद", "विधानसभा", "मुख्यमंत्री", "प्रधानमंत्री",
    "भाजपा", "कांग्रेस", "राजनीति", "राजनीतिक", "सांसद", "विधायक",
    "कैबिनेट", "गठबंधन", "विपक्ष", "मतदान", "रैली", "प्रदर्शन", "हड़ताल",
    "गवर्नर", "राज्यपाल", "लोकसभा", "राज्यसभा",
]

BLOCKLIST_RE = re.compile("|".join(re.escape(k) for k in BLOCKLIST), re.IGNORECASE)


def is_political(title, summary):
    text = f"{title} {summary}"
    return bool(BLOCKLIST_RE.search(text))


def parse_date(entry):
    for key in ("published", "updated"):
        val = entry.get(key)
        if val:
            try:
                return parsedate_to_datetime(val)
            except Exception:
                pass
    return None


def strip_html(text):
    return re.sub("<[^<]+?>", "", text or "").strip()


def fetch_section(sources):
    items = []
    now = datetime.now(timezone.utc)
    for src in sources:
        try:
            parsed = feedparser.parse(src["url"])
            if parsed.bozo and not parsed.entries:
                print(f"  skip (unparseable): {src['name']}", file=sys.stderr)
                continue
            for entry in parsed.entries[:20]:
                title = strip_html(entry.get("title", "")).strip()
                if not title:
                    continue
                summary = strip_html(entry.get("summary", entry.get("description", "")))
                if is_political(title, summary):
                    continue
                dt = parse_date(entry)
                if dt is not None:
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    if (now - dt).days > MAX_AGE_DAYS:
                        continue
                items.append({
                    "title": title,
                    "summary": (summary[:220] + "…") if len(summary) > 220 else summary,
                    "link": entry.get("link", ""),
                    "source": src["name"],
                    "published": dt.isoformat() if dt else None,
                })
        except Exception as e:
            print(f"  error fetching {src['name']}: {e}", file=sys.stderr)
            continue

    # De-dupe by title, keep newest-first, cap length
    seen = set()
    deduped = []
    for it in sorted(items, key=lambda x: x["published"] or "", reverse=True):
        key = it["title"].lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(it)
    return deduped[:MAX_ITEMS_PER_SECTION]


def main():
    data = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "sections": {},
    }
    for section, sources in SOURCES.items():
        print(f"Fetching section: {section}", file=sys.stderr)
        data["sections"][section] = fetch_section(sources)

    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    total = sum(len(v) for v in data["sections"].values())
    print(f"Wrote data.json with {total} items total", file=sys.stderr)


if __name__ == "__main__":
    main()
