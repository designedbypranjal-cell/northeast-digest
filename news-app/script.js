const SECTION_LABELS = {
  assamese: "Assamese / Assam",
  hindi: "Hindi",
  english: "English",
};

let currentData = null;
let currentSection = "assamese";

const statusEl = document.getElementById("status");
const contentEl = document.getElementById("content");
const updatedEl = document.getElementById("updated-at");
const tabsEl = document.getElementById("tabs");

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

function render() {
  contentEl.innerHTML = "";
  const items = (currentData?.sections?.[currentSection]) || [];

  if (items.length === 0) {
    const p = document.createElement("p");
    p.className = "status";
    p.textContent = "No stories in this section right now — check back after the next refresh.";
    contentEl.appendChild(p);
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "card";

    const h3 = document.createElement("h3");
    const a = document.createElement("a");
    a.href = item.link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = item.title;
    h3.appendChild(a);
    card.appendChild(h3);

    if (item.summary) {
      const p = document.createElement("p");
      p.textContent = item.summary;
      card.appendChild(p);
    }

    const meta = document.createElement("div");
    meta.className = "card-meta";
    const parts = [item.source];
    const ago = formatTimeAgo(item.published);
    if (ago) parts.push(ago);
    meta.textContent = parts.join(" · ");
    card.appendChild(meta);

    contentEl.appendChild(card);
  }
}

function setSection(section) {
  currentSection = section;
  [...tabsEl.querySelectorAll(".tab")].forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === section);
  });
  render();
}

async function loadData() {
  statusEl.textContent = "Loading news…";
  try {
    const res = await fetch(`data.json?_=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currentData = await res.json();
    updatedEl.textContent = `Updated ${formatTimeAgo(currentData.updated_at)}`;
    render();
  } catch (err) {
    updatedEl.textContent = "";
    contentEl.innerHTML = "";
    statusEl.textContent = `Couldn't load news data (${err.message}). Try refreshing in a bit.`;
    contentEl.appendChild(statusEl);
  }
}

tabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (btn) setSection(btn.dataset.section);
});

document.getElementById("refresh-btn").addEventListener("click", loadData);

loadData();
