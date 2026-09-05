const SECTION_LABELS = {
  assamese: "Assamese / Assam",
  hindi: "Hindi",
  english: "English",
  world: "World",
};

let currentData = null;
let currentSection = "assamese";
let searchQuery = "";

const statusEl = document.getElementById("status");
const contentEl = document.getElementById("content");
const updatedEl = document.getElementById("updated-at");
const tabsEl = document.getElementById("tabs");
const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");
const refreshBtn = document.getElementById("refresh-btn");

function formatTimeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text, query) {
  if (!query) return document.createTextNode(text);
  const frag = document.createDocumentFragment();
  const re = new RegExp(`(${escapeRegExp(query)})`, "ig");
  const parts = text.split(re);
  for (const part of parts) {
    if (part.toLowerCase() === query.toLowerCase()) {
      const mark = document.createElement("mark");
      mark.textContent = part;
      frag.appendChild(mark);
    } else if (part) {
      frag.appendChild(document.createTextNode(part));
    }
  }
  return frag;
}

function matches(item, query) {
  const q = query.toLowerCase();
  return (
    item.title.toLowerCase().includes(q) ||
    (item.summary || "").toLowerCase().includes(q) ||
    (item.source || "").toLowerCase().includes(q)
  );
}

function buildCard(item, section, query) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.section = section;

  const top = document.createElement("div");
  top.className = "card-top";
  const pill = document.createElement("span");
  pill.className = "pill";
  pill.textContent = SECTION_LABELS[section];
  top.appendChild(pill);
  card.appendChild(top);

  const h3 = document.createElement("h3");
  const a = document.createElement("a");
  a.href = item.link;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.appendChild(highlight(item.title, query));
  h3.appendChild(a);
  card.appendChild(h3);

  if (item.summary) {
    const p = document.createElement("p");
    p.appendChild(highlight(item.summary, query));
    card.appendChild(p);
  }

  const meta = document.createElement("div");
  meta.className = "card-meta";
  const parts = [item.source];
  const ago = formatTimeAgo(item.published);
  if (ago) parts.push(ago);
  meta.textContent = parts.join(" · ");
  card.appendChild(meta);

  return card;
}

function render() {
  contentEl.innerHTML = "";
  if (!currentData) return;

  const query = searchQuery.trim();
  const grid = document.createElement("div");
  grid.className = "results-grid";
  let count = 0;

  if (query) {
    // Dynamic cross-language search: scan every section live, no reload.
    for (const section of Object.keys(SECTION_LABELS)) {
      const items = currentData.sections?.[section] || [];
      for (const item of items) {
        if (matches(item, query)) {
          grid.appendChild(buildCard(item, section, query));
          count++;
        }
      }
    }
  } else {
    const items = currentData.sections?.[currentSection] || [];
    for (const item of items) {
      grid.appendChild(buildCard(item, currentSection, ""));
      count++;
    }
  }

  if (count === 0) {
    const p = document.createElement("p");
    p.className = "status";
    p.textContent = query
      ? `No stories match "${query}" right now.`
      : "No stories in this section right now — check back after the next refresh.";
    contentEl.appendChild(p);
    return;
  }

  contentEl.appendChild(grid);
}

function setSection(section) {
  currentSection = section;
  [...tabsEl.querySelectorAll(".tab")].forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === section);
  });
  render();
}

async function loadData({ silent = false } = {}) {
  if (!silent) statusEl.textContent = "Loading news…";
  refreshBtn.classList.add("spinning");
  try {
    const res = await fetch(`data.json?_=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currentData = await res.json();
    updatedEl.textContent = `Updated ${formatTimeAgo(currentData.updated_at)}`;
    render();
  } catch (err) {
    updatedEl.textContent = "";
    contentEl.innerHTML = "";
    const p = document.createElement("p");
    p.className = "status";
    p.textContent = `Couldn't load news data (${err.message}). Try refreshing in a bit.`;
    contentEl.appendChild(p);
  } finally {
    refreshBtn.classList.remove("spinning");
  }
}

tabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (btn) setSection(btn.dataset.section);
});

// Live, as-you-type search — no page reload, no submit button.
searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value;
  searchClear.hidden = searchQuery.length === 0;
  render();
});

searchClear.addEventListener("click", () => {
  searchQuery = "";
  searchInput.value = "";
  searchClear.hidden = true;
  searchInput.focus();
  render();
});

refreshBtn.addEventListener("click", () => loadData());

// Keep it feeling live: silently re-check for new data periodically,
// and whenever the tab regains focus.
setInterval(() => loadData({ silent: true }), 5 * 60 * 1000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") loadData({ silent: true });
});

// Honor a ?q=... URL (used by the site's search-engine SearchAction / shared
// links), so search results are directly linkable.
const initialQuery = new URLSearchParams(location.search).get("q");
if (initialQuery) {
  searchInput.value = initialQuery;
  searchQuery = initialQuery;
  searchClear.hidden = false;
}

searchInput.addEventListener("input", () => {
  const params = new URLSearchParams(location.search);
  if (searchInput.value) params.set("q", searchInput.value);
  else params.delete("q");
  const qs = params.toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
});

loadData();
