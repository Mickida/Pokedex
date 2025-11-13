let uiOffset = 0;
const uiLimit = 20;
const PRELOADER_MS = 2500;

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

function filterCardsByName(q) {
  const query = (q || "").trim().toLowerCase();
  const cards = getRenderedCards();
  if (!query) {
    showAllCards(cards);
    return;
  }
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const name = getNameFromCard(c).toLowerCase();
    if (name.includes(query)) c.style.display = "";
    else c.style.display = "none";
  }
}

function showAllCards(cards) {
  for (let i = 0; i < cards.length; i++) cards[i].style.display = "";
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
    createSuggestionButton(matches[i], container);
  }
  container.style.display = "block";
}

function updateLoadMoreButtonState() {
  const loadBtn = document.getElementById("loadMoreBtn");
  const input = document.getElementById("searchInput");
  if (!loadBtn) return;
  const hasQuery = input && (input.value || "").trim().length > 0;
  const isLoading = !!loadBtn.classList.contains("loading") || loadBtn.disabled;
  if (hasQuery) {
    loadBtn.style.display = "none";
    loadBtn.disabled = true;
    loadBtn.classList.add("disabled-by-search");
  } else {
    loadBtn.classList.remove("disabled-by-search");
    loadBtn.style.display = "";
    if (!isLoading) loadBtn.disabled = false;
  }
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
  loadBtn.addEventListener("click", () => onClickLoadMore(loadBtn));
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
    updateLoadMoreButtonState();
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
  updateLoadMoreButtonState();

  try {
    const brand = header.querySelector(".header__brand");
    if (brand) {
      brand.style.cursor = "pointer";
      brand.addEventListener("click", () => {
        window.location.reload();
      });
    }
  } catch (e) {}
}

async function initApp() {
  await initialLoad();
  setupLoadMoreButton();
  setupSearch();
}
