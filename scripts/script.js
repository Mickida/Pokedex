let uiOffset = 0;
const uiLimit = 20;

// ---------------------
// Utilities
// ---------------------
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function createTypeBadge(typeName) {
  const span = document.createElement("span");
  span.className = `type-badge type-${typeName}`;
  span.setAttribute("title", typeName);

  const img = document.createElement("img");
  img.className = "type-icon";
  img.alt = typeName + " icon";
  img.src = `./icons/${typeName}.svg`;
  img.onerror = () => {
    span.style.display = "none";
  };

  span.appendChild(img);
  return span;
}

function applyCardTypeStyle(cardElement, primaryType) {
  const toRemove = [];
  cardElement.classList.forEach((c) => {
    if (c.startsWith("type-")) toRemove.push(c);
  });
  toRemove.forEach((c) => cardElement.classList.remove(c));
  if (primaryType) cardElement.classList.add(`type-${primaryType}`);
}

// ---------------------
// Card rendering
// ---------------------
function createPokemonCard(pokemonSummary) {
  const article = document.createElement("article");
  article.className = "card";
  article.dataset.id = pokemonSummary.id;
  article.addEventListener("click", (e) => {
    if (e.target && e.target.closest(".type-badges")) return;
    openDetailModalById(pokemonSummary.id);
  });
  const rendered = window.templates.renderCard({
    id: pokemonSummary.id,
    image: pokemonSummary.image,
    name: capitalize(pokemonSummary.name),
  });
  article.innerHTML = rendered;
  return article;
}

// ---------------------
// Modal / detail view
// ---------------------
function buildModalIfNeeded() {
  const root = document.getElementById("detailModal");
  if (!root) return null;
  if (root.dataset.built) return root;
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = window.templates.renderModal();

  root.dataset.built = "1";

  root.querySelector(".modal-close").addEventListener("click", closeModal);
  root.addEventListener("click", (ev) => {
    if (ev.target === root) closeModal();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closeModal();
  });

  const tablist = root.querySelector(".detail-tabs");
  tablist.addEventListener("click", (ev) => {
    const btn = ev.target.closest('[role="tab"]');
    if (!btn) return;
    switchTab(btn.dataset.tab, root);
  });

  const prevBtn = root.querySelector(".nav-prev");
  const nextBtn = root.querySelector(".nav-next");
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      navigateModal(-1);
    });
    nextBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      navigateModal(1);
    });
  }

  return root;
}

async function openDetailModalById(id) {
  try {
    const detail = await pokeApi.getPokemonById(id);
    showModal(detail);
  } catch (e) {
    console.warn("modal load failed", e);
  }
}

function showModal(detail) {
  const root = buildModalIfNeeded();
  if (!root) return;
  root.classList.add("open");
  root.setAttribute("aria-hidden", "false");

  const card = root.querySelector(".modal-card");
  root.querySelector("#modalTitle").textContent = capitalize(detail.name);
  root.querySelector(".id-wrap").textContent = `#${detail.id}`;
  const img = root.querySelector(".detail-image");
  img.src = detail.image || "";
  img.alt = capitalize(detail.name) || "";

  const primaryType =
    detail.types &&
    detail.types[0] &&
    detail.types[0].type &&
    detail.types[0].type.name
      ? detail.types[0].type.name
      : null;
  card.className = "modal-card";
  if (primaryType) card.classList.add(`type-${primaryType}`);

  const topBadges = root.querySelector(".modal-type-badges");
  topBadges.innerHTML = "";
  (detail.types || []).forEach((t) =>
    topBadges.appendChild(createTypeBadge(t.type.name))
  );

  updateNavButtons(root);

  const overview = root.querySelector('[data-panel="overview"]');
  overview.innerHTML = window.templates.renderOverview(detail);

  const stats = root.querySelector('[data-panel="stats"]');
  stats.innerHTML = window.templates.renderStats(detail);

  root.querySelector(".modal-close").focus();
}

function closeModal() {
  const root = document.getElementById("detailModal");
  if (!root) return;
  root.classList.remove("open");
  root.setAttribute("aria-hidden", "true");
}

function switchTab(tabName, root) {
  if (!root) root = document.getElementById("detailModal");
  const tabs = root.querySelectorAll('[role="tab"]');
  tabs.forEach((t) =>
    t.setAttribute(
      "aria-selected",
      t.dataset.tab === tabName ? "true" : "false"
    )
  );
  const panels = root.querySelectorAll('[role="tabpanel"]');
  panels.forEach((p) => {
    if (p.dataset.panel === tabName) p.removeAttribute("hidden");
    else p.setAttribute("hidden", "");
  });
}

function getLoadedIds() {
  const cards = Array.from(document.querySelectorAll("#pokemonList .card"));
  return cards.map((c) => parseInt(c.dataset.id, 10)).filter((n) => !isNaN(n));
}

function getCurrentModalId() {
  const root = document.getElementById("detailModal");
  if (!root) return null;
  const idWrap = root.querySelector(".id-wrap");
  if (!idWrap) return null;
  const txt = (idWrap.textContent || "").replace("#", "").trim();
  const n = parseInt(txt, 10);
  return isNaN(n) ? null : n;
}

function navigateModal(offset) {
  const ids = getLoadedIds();
  if (!ids.length) return;
  const current = getCurrentModalId();
  const idx = ids.indexOf(current);
  if (idx === -1) return;
  const target = ids[idx + offset];
  if (typeof target !== "undefined") {
    openDetailModalById(target);
  }
}

function updateNavButtons(root) {
  if (!root) root = document.getElementById("detailModal");
  const prevBtn = root.querySelector(".nav-prev");
  const nextBtn = root.querySelector(".nav-next");
  const ids = getLoadedIds();
  const current = getCurrentModalId();
  const idx = ids.indexOf(current);
  if (prevBtn) prevBtn.disabled = idx <= 0;
  if (nextBtn) nextBtn.disabled = idx === -1 || idx >= ids.length - 1;
}

// ---------------------
// Data loading / enrichment
// ---------------------
async function enrichCardWithTypes(cardElement, pokemonId) {
  try {
    const detail = await pokeApi.getPokemonById(pokemonId);
    const badges = cardElement.querySelector(".type-badges");
    badges.innerHTML = "";

    const types = (detail.types || []).map((t) => t.type.name);
    types.forEach((typeName) => badges.appendChild(createTypeBadge(typeName)));

    if (types.length > 0) applyCardTypeStyle(cardElement, types[0]);
  } catch (e) {
    console.warn("type load failed", e);
  }
}

async function loadAndRenderPage() {
  const container = document.getElementById("pokemonList");
  const list = await pokeApi.getPokemonList(uiOffset, uiLimit);
  list.forEach((s) => {
    const card = createPokemonCard(s);
    container.appendChild(card);
    enrichCardWithTypes(card, s.id);
  });
  uiOffset += uiLimit;
}

// ---------------------
// Spinner / loading helpers
// ---------------------
function showMainSpinner() {
  const g = document.getElementById("mainSpinner");
  if (!g) return;
  console.log("showMainSpinner: showing main spinner");
  g.setAttribute("aria-hidden", "false");
  g.style.display = "flex";
}
function hideMainSpinner() {
  const g = document.getElementById("mainSpinner");
  if (!g) return;
  console.log("hideMainSpinner: hiding main spinner");
  g.setAttribute("aria-hidden", "true");
  g.style.display = "none";
}
function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.classList.add("loading");
    btn.disabled = true;
  } else {
    btn.classList.remove("loading");
    btn.disabled = false;
  }
}

const PRELOADER_MS = 2500;

// ---------------------
// Search / filtering helpers
// ---------------------
function getRenderedCards() {
  const container = document.getElementById("pokemonList");
  if (!container) return [];
  return Array.from(container.querySelectorAll(".card"));
}

function filterCardsByName(q) {
  const query = (q || "").trim().toLowerCase();
  const cards = getRenderedCards();
  if (!query) {
    cards.forEach((c) => (c.style.display = ""));
    return;
  }
  cards.forEach((c) => {
    const nameEl = c.querySelector(".card__name");
    const name = nameEl ? (nameEl.textContent || "").toLowerCase() : "";
    if (name.includes(query)) c.style.display = "";
    else c.style.display = "none";
  });
}

function getNameFromCard(card) {
  const nameEl = card.querySelector(".card__name");
  return nameEl ? (nameEl.textContent || "").trim() : "";
}

function showSearchSuggestions(q) {
  const container = document.getElementById("searchSuggestions");
  if (!container) return;
  container.innerHTML = "";
  const query = (q || "").trim().toLowerCase();
  if (!query) {
    container.style.display = "none";
    return;
  }
  const cards = getRenderedCards();
  const matches = cards
    .map((c) => ({
      id: c.dataset.id,
      name: getNameFromCard(c),
    }))
    .filter((p) => p.name.toLowerCase().includes(query))
    .slice(0, 8);

  if (!matches.length) {
    container.style.display = "none";
    return;
  }

  matches.forEach((m) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "search-suggestion";
    btn.textContent = `${m.name}`;
    btn.dataset.id = m.id;
    btn.addEventListener("click", (ev) => {
      const input = document.getElementById("searchInput");
      if (input) input.value = m.name;
      container.innerHTML = "";
      container.style.display = "none";
      if (m.id) openDetailModalById(m.id);
    });
    container.appendChild(btn);
  });
  container.style.display = "block";
}

// ---------------------
// DOM Ready: initialize loader, buttons and search
// ---------------------
document.addEventListener("DOMContentLoaded", async () => {
  // Initial loader + first page
  showMainSpinner();
  try {
    const loadPromise = loadAndRenderPage();
    const timerPromise = new Promise((res) => setTimeout(res, PRELOADER_MS));
    await Promise.all([loadPromise, timerPromise]);
  } catch (e) {
    console.warn("initial load failed", e);
  } finally {
    hideMainSpinner();
  }

  // Load more button
  const loadBtn = document.getElementById("loadMoreBtn");
  if (loadBtn) {
    loadBtn.addEventListener("click", async (ev) => {
      try {
        showMainSpinner();
        setButtonLoading(loadBtn, true);
        const timerPromise = new Promise((res) =>
          setTimeout(res, PRELOADER_MS)
        );
        await Promise.all([loadAndRenderPage(), timerPromise]);
      } catch (e) {
        console.warn("load more failed", e);
      } finally {
        setButtonLoading(loadBtn, false);
        hideMainSpinner();
      }
    });
  }

  // Search input & suggestions setup
  const header = document.querySelector("header");
  const input = document.getElementById("searchInput");
  if (!input || !header) return;

  let sug = document.getElementById("searchSuggestions");
  if (!sug) {
    sug = document.createElement("div");
    sug.id = "searchSuggestions";
    sug.className = "search-suggestions";
    input.insertAdjacentElement("afterend", sug);
  }

  function positionSuggestions() {
    const rect = input.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const left = rect.left - headerRect.left;
    const top = rect.top - headerRect.top + input.offsetHeight + 6;
    sug.style.left = left + "px";
    sug.style.top = top + "px";
    sug.style.width = Math.max(0, Math.round(rect.width)) + "px";
  }

  positionSuggestions();
  window.addEventListener("resize", positionSuggestions);
  window.addEventListener("orientationchange", positionSuggestions);
  input.addEventListener("focus", positionSuggestions);

  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", "searchSuggestions");

  input.addEventListener("input", (ev) => {
    const q = ev.target.value || "";
    filterCardsByName(q);
    showSearchSuggestions(q);
  });

  document.addEventListener("click", (ev) => {
    if (!sug) return;
    if (ev.target === input) return;
    if (ev.target.closest && ev.target.closest("#searchSuggestions")) return;
    sug.innerHTML = "";
    sug.style.display = "none";
  });
});
