let uiOffset = 0;
const uiLimit = 20;
const PRELOADER_MS = 2500;

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

function cloneCardTemplate() {
  const tpl = document.getElementById("card-tpl");
  if (!tpl) return null;
  const node = tpl.content.cloneNode(true);
  return node.querySelector(".card");
}

function fillCardFields(article, pokemonSummary) {
  article.dataset.id = pokemonSummary.id;
  const idEl = article.querySelector(".card__id");
  if (idEl) idEl.textContent = `#${pokemonSummary.id}`;
  const nameEl = article.querySelector(".card__name");
  if (nameEl) nameEl.textContent = capitalize(pokemonSummary.name) || "";
  const img = article.querySelector(".card__img");
  if (img) {
    img.src = pokemonSummary.image || "";
    img.alt = capitalize(pokemonSummary.name) || "";
  }
  const badges = article.querySelector(".type-badges");
  if (badges) badges.dataset.id = pokemonSummary.id;
}

function attachCardClick(article, id) {
  article.addEventListener("click", (e) => {
    if (e.target && e.target.closest(".type-badges")) return;
    openDetailModalById(id);
  });
}

function applyCardTypeStyle(cardElement, primaryType) {
  const toRemove = [];
  for (let i = 0; i < cardElement.classList.length; i++) {
    const c = cardElement.classList[i];
    if (c.startsWith("type-")) toRemove.push(c);
  }
  for (let i = 0; i < toRemove.length; i++) {
    cardElement.classList.remove(toRemove[i]);
  }
  if (primaryType) cardElement.classList.add(`type-${primaryType}`);
}

function createPokemonCard(pokemonSummary) {
  const article = cloneCardTemplate();
  if (!article) return renderCardFallback(pokemonSummary);
  fillCardFields(article, pokemonSummary);
  attachCardClick(article, pokemonSummary.id);
  return article;
}

function renderCardFallback(pokemonSummary) {
  const fallback = document.createElement("article");
  fallback.className = "card";
  fallback.dataset.id = pokemonSummary.id;
  attachCardClick(fallback, pokemonSummary.id);
  const rendered = window.templates.renderCard({
    id: pokemonSummary.id,
    image: pokemonSummary.image,
    name: capitalize(pokemonSummary.name),
  });
  fallback.innerHTML = rendered;
  return fallback;
}

function buildModalIfNeeded() {
  const root = document.getElementById("detailModal");
  if (!root) return null;
  if (root.dataset.built) return root;
  root.setAttribute("aria-hidden", "true");
  renderModalContent(root);
  addModalCloseHandlers(root);
  addModalTabHandlers(root);
  addModalNavHandlers(root);
  root.dataset.built = "1";
  return root;
}

function renderModalContent(root) {
  root.innerHTML = window.templates.renderModal();
}

function addModalCloseHandlers(root) {
  const close = root.querySelector(".modal-close");
  if (close) close.addEventListener("click", closeModal);
  root.addEventListener("click", (ev) => {
    if (ev.target === root) closeModal();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closeModal();
  });
}

function addModalTabHandlers(root) {
  const tablist = root.querySelector(".detail-tabs");
  if (!tablist) return;
  tablist.addEventListener("click", (ev) => {
    const btn = ev.target.closest('[role="tab"]');
    if (!btn) return;
    switchTab(btn.dataset.tab, root);
  });
}

function addModalNavHandlers(root) {
  const prevBtn = root.querySelector(".nav-prev");
  const nextBtn = root.querySelector(".nav-next");
  if (prevBtn)
    prevBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      navigateModal(-1);
    });
  if (nextBtn)
    nextBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      navigateModal(1);
    });
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
  root.dataset.currentId = detail.id;
  setModalHeader(root, detail);
  populateModalBadges(root, detail);
  populateModalPanels(root, detail);
  updateNavButtons(root);
  const close = root.querySelector(".modal-close");
  if (close) close.focus();
}

function setModalHeader(root, detail) {
  const card = root.querySelector(".modal-card");
  if (!card) return;
  const title = root.querySelector("#modalTitle");
  if (title) title.textContent = capitalize(detail.name);
  const idWrap = root.querySelector(".id-wrap");
  if (idWrap) idWrap.textContent = `#${detail.id}`;
  const img = root.querySelector(".detail-image");
  if (img) {
    img.src = detail.image || "";
    img.alt = capitalize(detail.name) || "";
  }
  const primaryType =
    detail.types &&
    detail.types[0] &&
    detail.types[0].type &&
    detail.types[0].type.name
      ? detail.types[0].type.name
      : null;
  card.className = "modal-card";
  if (primaryType) card.classList.add(`type-${primaryType}`);
}

function populateModalBadges(root, detail) {
  const topBadges = root.querySelector(".modal-type-badges");
  if (!topBadges) return;
  topBadges.innerHTML = "";
  const detailTypes = detail.types || [];
  for (let i = 0; i < detailTypes.length; i++)
    topBadges.appendChild(createTypeBadge(detailTypes[i].type.name));
}

function populateModalPanels(root, detail) {
  const overview = root.querySelector('[data-panel="overview"]');
  if (overview) overview.innerHTML = window.templates.renderOverview(detail);
  const stats = root.querySelector('[data-panel="stats"]');
  if (stats) stats.innerHTML = window.templates.renderStats(detail);
}

function closeModal() {
  const root = document.getElementById("detailModal");
  if (!root) return;
  root.classList.remove("open");
  root.setAttribute("aria-hidden", "true");
  try {
    delete root.dataset.currentId;
  } catch (e) {
    root.dataset.currentId = "";
  }
}

function switchTab(tabName, root) {
  if (!root) root = document.getElementById("detailModal");
  const tabs = root.querySelectorAll('[role="tab"]');
  for (let i = 0; i < tabs.length; i++) {
    const t = tabs[i];
    t.setAttribute(
      "aria-selected",
      t.dataset.tab === tabName ? "true" : "false"
    );
  }
  const panels = root.querySelectorAll('[role="tabpanel"]');
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    if (p.dataset.panel === tabName) p.removeAttribute("hidden");
    else p.setAttribute("hidden", "");
  }
}

function getLoadedIds() {
  const cards = Array.from(document.querySelectorAll("#pokemonList .card"));
  return cards.map((c) => parseInt(c.dataset.id, 10)).filter((n) => !isNaN(n));
}

function getCurrentModalId() {
  const root = document.getElementById("detailModal");
  if (!root || !root.dataset.currentId) return null;
  const n = parseInt(root.dataset.currentId, 10);
  return isNaN(n) ? null : n;
}

function navigateModal(offset) {
  const ids = getLoadedIds();
  if (!ids.length) return;
  const idx = ids.indexOf(getCurrentModalId());
  const next = ids[idx + offset];
  if (typeof next !== "undefined") openDetailModalById(next);
}

function updateNavButtons(root) {
  root = root || document.getElementById("detailModal");
  const prev = root.querySelector(".nav-prev");
  const next = root.querySelector(".nav-next");
  const ids = getLoadedIds();
  const idx = ids.indexOf(getCurrentModalId());
  if (prev) prev.disabled = idx <= 0;
  if (next) next.disabled = idx < 0 || idx >= ids.length - 1;
}

async function enrichCardWithTypes(cardElement, pokemonId) {
  try {
    const types = await fetchTypesForPokemon(pokemonId);
    const badges = cardElement.querySelector(".type-badges");
    if (!badges) return;
    badges.innerHTML = "";
    appendBadges(badges, types);
    if (types.length > 0) applyCardTypeStyle(cardElement, types[0]);
  } catch (e) {
    console.warn("type load failed", e);
  }
}

async function fetchTypesForPokemon(pokemonId) {
  const detail = await pokeApi.getPokemonById(pokemonId);
  const types = detail.types || [];
  const result = [];
  for (let i = 0; i < types.length; i++) {
    const t = types[i];
    result.push(t.type.name);
  }
  return result;
}

function appendBadges(badgesEl, types) {
  for (let i = 0; i < types.length; i++)
    badgesEl.appendChild(createTypeBadge(types[i]));
}

async function loadAndRenderPage() {
  const container = document.getElementById("pokemonList");
  const list = await pokeApi.getPokemonList(uiOffset, uiLimit);
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    const card = createPokemonCard(s);
    container.appendChild(card);
    enrichCardWithTypes(card, s.id);
  }
  uiOffset += uiLimit;
}

function showMainSpinner() {
  const g = document.getElementById("mainSpinner");
  if (!g) return;
  g.setAttribute("aria-hidden", "false");
  g.style.display = "flex";
}
function hideMainSpinner() {
  const g = document.getElementById("mainSpinner");
  if (!g) return;
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

function getRenderedCards() {
  const container = document.getElementById("pokemonList");
  if (!container) return [];
  return Array.from(container.querySelectorAll(".card"));
}

function filterCardsByName(q) {
  const query = (q || "").trim().toLowerCase();
  const cards = getRenderedCards();
  if (!query) {
    for (let i = 0; i < cards.length; i++) {
      cards[i].style.display = "";
    }
    return;
  }
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const nameEl = c.querySelector(".card__name");
    const name = nameEl ? (nameEl.textContent || "").toLowerCase() : "";
    if (name.includes(query)) c.style.display = "";
    else c.style.display = "none";
  }
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
  const matches = getSearchMatches(query).slice(0, 8);
  if (!matches.length) {
    container.style.display = "none";
    return;
  }
  renderSearchSuggestions(container, matches);
}

function getSearchMatches(query) {
  const cards = getRenderedCards();
  const matches = [];
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const name = getNameFromCard(c);
    if (name.toLowerCase().includes(query))
      matches.push({ id: c.dataset.id, name });
  }
  return matches;
}

function renderSearchSuggestions(container, matches) {
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "search-suggestion";
    btn.textContent = `${m.name}`;
    btn.dataset.id = m.id;
    btn.addEventListener("click", () => {
      const input = document.getElementById("searchInput");
      if (input) input.value = m.name;
      container.innerHTML = "";
      container.style.display = "none";
      if (m.id) openDetailModalById(m.id);
    });
    container.appendChild(btn);
  }
  container.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initialLoad() {
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
}

function setupLoadMoreButton() {
  const loadBtn = document.getElementById("loadMoreBtn");
  if (!loadBtn) return;
  async function onClickLoadMore() {
    showMainSpinner();
    setButtonLoading(loadBtn, true);
    try {
      await loadAndRenderPage();
      await new Promise((res) => setTimeout(res, PRELOADER_MS));
    } catch (e) {
      console.warn("load more failed", e);
    } finally {
      setButtonLoading(loadBtn, false);
      hideMainSpinner();
    }
  }

  loadBtn.addEventListener("click", onClickLoadMore);
}

function ensureSuggestionElement(input) {
  let sug = document.getElementById("searchSuggestions");
  if (!sug) {
    sug = document.createElement("div");
    sug.id = "searchSuggestions";
    sug.className = "search-suggestions";
    input.insertAdjacentElement("afterend", sug);
  }
  return sug;
}

function configureSuggestionPositioning(header, input, sug) {
  function position() {
    const rect = input.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    sug.style.left = rect.left - headerRect.left + "px";
    sug.style.top = rect.top - headerRect.top + input.offsetHeight + 6 + "px";
    sug.style.width = Math.max(0, Math.round(rect.width)) + "px";
  }
  position();
  window.addEventListener("resize", position);
  window.addEventListener("orientationchange", position);
  input.addEventListener("focus", position);
}

function configureSearchInput(input, header) {
  const sug = ensureSuggestionElement(input);
  configureSuggestionPositioning(header, input, sug);
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", "searchSuggestions");
  input.addEventListener("input", (ev) => {
    const q = ev.target.value || "";
    filterCardsByName(q);
    showSearchSuggestions(q);
  });
  document.addEventListener("click", (ev) => {
    if (ev.target === input) return;
    if (ev.target.closest && ev.target.closest("#searchSuggestions")) return;
    sug.innerHTML = "";
    sug.style.display = "none";
  });
}

function setupSearch() {
  const header = document.querySelector("header");
  const input = document.getElementById("searchInput");
  if (!input || !header) return;
  configureSearchInput(input, header);
}

async function initApp() {
  await initialLoad();
  setupLoadMoreButton();
  setupSearch();
}
