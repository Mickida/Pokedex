let uiOffset = 0;
const uiLimit = 20;

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

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function createPokemonCard(pokemonSummary) {
  const article = document.createElement("article");
  article.className = "card";
  article.dataset.id = pokemonSummary.id;
  // open modal on click
  article.addEventListener("click", (e) => {
    // ignore clicks on badge icons
    if (e.target && e.target.closest(".type-badges")) return;
    openDetailModalById(pokemonSummary.id);
  });
  article.innerHTML = `
    <div class="card__header">
      <span class="card__id">#${pokemonSummary.id}</span>
      <h3 class="card__name">${capitalize(pokemonSummary.name)}</h3>
    </div>
    <div class="card__media"><img src="${
      pokemonSummary.image
    }" alt="${capitalize(pokemonSummary.name)}"></div>
    <div class="card__body">
      <div class="type-badges" data-id="${pokemonSummary.id}"></div>
    </div>`;
  return article;
}

// --- Modal: build/open/close ---
function buildModalIfNeeded() {
  const root = document.getElementById("detailModal");
  if (!root) return null;
  if (root.dataset.built) return root;

  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <button class="modal-close" aria-label="Close">×</button>
      <div class="card-top">
        <div class="top-inner">
          <div class="title-wrap">
            <h2 id="modalTitle">Name</h2>
          </div>
          <div class="id-wrap">#000</div>
          <div class="modal-type-badges"></div>
          <div class="detail-image-wrap"><img class="detail-image" src="" alt=""></div>
        </div>
      </div>
      <div class="card-bottom">
        <div class="card-body">
          <div class="detail-content">
            <div class="detail-tabs" role="tablist">
              <button role="tab" data-tab="overview" aria-selected="true">About</button>
              <button role="tab" data-tab="stats">Stats</button>
            </div>
            <div class="detail-panels">
              <section data-panel="overview" role="tabpanel">Loading...</section>
              <section data-panel="stats" role="tabpanel" hidden></section>
            </div>
          </div>
        </div>
        <div class="modal-nav" aria-hidden="true">
          <button class="nav-btn nav-prev" aria-label="Previous">‹</button>
          <button class="nav-btn nav-next" aria-label="Next">›</button>
        </div>
      </div>
    </div>`;

  root.dataset.built = "1";

  // handlers
  root.querySelector(".modal-close").addEventListener("click", closeModal);
  root.addEventListener("click", (ev) => {
    if (ev.target === root) closeModal();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") closeModal();
  });

  // tab clicks
  const tablist = root.querySelector(".detail-tabs");
  tablist.addEventListener("click", (ev) => {
    const btn = ev.target.closest('[role="tab"]');
    if (!btn) return;
    switchTab(btn.dataset.tab, root);
  });

  // nav button clicks (prev / next)
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
  // set title/id
  root.querySelector("#modalTitle").textContent = capitalize(detail.name);
  root.querySelector(".id-wrap").textContent = `#${detail.id}`;
  // image
  const img = root.querySelector(".detail-image");
  img.src = detail.image || "";
  img.alt = capitalize(detail.name) || "";

  // set modal color class by primary type
  const primaryType =
    detail.types &&
    detail.types[0] &&
    detail.types[0].type &&
    detail.types[0].type.name
      ? detail.types[0].type.name
      : null;
  // clear previous type- on card
  card.className = "modal-card";
  if (primaryType) card.classList.add(`type-${primaryType}`);

  // render type badges in top area
  const topBadges = root.querySelector(".modal-type-badges");
  topBadges.innerHTML = "";
  (detail.types || []).forEach((t) =>
    topBadges.appendChild(createTypeBadge(t.type.name))
  );

  // update nav button disabled state
  updateNavButtons(root);

  // populate basic panels
  const overview = root.querySelector('[data-panel="overview"]');
  const speciesName =
    detail.species && detail.species.name
      ? capitalize(detail.species.name)
      : "-";
  overview.innerHTML = `
    <div class="about-grid">
      <div><strong>Species</strong></div><div>${speciesName}</div>
      <div><strong>Height</strong></div><div>${detail.height}</div>
      <div><strong>Weight</strong></div><div>${detail.weight}</div>
      <div><strong>Abilities</strong></div><div>${(detail.abilities || [])
        .map((a) => a.ability.name)
        .join(", ")}</div>
    </div>
  `;

  const stats = root.querySelector('[data-panel="stats"]');
  // create stat bars
  const maxStat = 160; // visual scale
  stats.innerHTML = (detail.stats || [])
    .map((s) => {
      const val = s.base_stat || 0;
      const pct = Math.min(100, Math.round((val / maxStat) * 100));
      return `
      <div class="stat-row">
        <div class="stat-label">${s.stat.name}</div>
        <div class="stat-value">${val}</div>
        <div class="stat-bar">
          <div class="stat-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
    })
    .join("");
  // Evolution chain removed — nothing to render here

  // focus
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

// --- modal navigation helpers ---
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

async function enrichCardWithTypes(cardElement, pokemonId) {
  try {
    const detail = await pokeApi.getPokemonById(pokemonId);
    const badges = cardElement.querySelector(".type-badges");
    badges.innerHTML = "";

    const types = (detail.types || []).map((t) => t.type.name);
    types.forEach((typeName) => badges.appendChild(createTypeBadge(typeName)));

    // apply primary type styling (if any)
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

document.addEventListener("DOMContentLoaded", () => {
  loadAndRenderPage();
  const loadBtn = document.getElementById("loadMoreBtn");
  if (loadBtn) loadBtn.addEventListener("click", loadAndRenderPage);
});

// --- Search / Filter helpers ---
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
      // set input, clear suggestions, open modal for that pokemon
      const input = document.getElementById("searchInput");
      if (input) input.value = m.name;
      container.innerHTML = "";
      container.style.display = "none";
      // open detail if id available
      if (m.id) openDetailModalById(m.id);
    });
    container.appendChild(btn);
  });
  container.style.display = "block";
}

// wire the input: create suggestion container and attach handlers
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  const input = document.getElementById("searchInput");
  if (!input || !header) return;

  // create suggestion box directly under header input
  let sug = document.getElementById("searchSuggestions");
  if (!sug) {
    sug = document.createElement("div");
    sug.id = "searchSuggestions";
    sug.className = "search-suggestions";
    // insert after input
    input.insertAdjacentElement("afterend", sug);
  }

  // position suggestions directly under the input and match its width
  function positionSuggestions() {
    const rect = input.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    // since header is positioned relative, compute offsets relative to header
    const left = rect.left - headerRect.left;
    const top = rect.top - headerRect.top + input.offsetHeight + 6; // small gap
    sug.style.left = left + "px";
    sug.style.top = top + "px";
    // use bounding rect width so fractional pixels and transforms match the visible input width
    sug.style.width = Math.max(0, Math.round(rect.width)) + "px";
  }
  // initial position
  positionSuggestions();
  // reposition on resize and scroll (viewport changes)
  window.addEventListener("resize", positionSuggestions);
  window.addEventListener("orientationchange", positionSuggestions);
  // also reposition when the input gains focus (in case layout shifted)
  input.addEventListener("focus", positionSuggestions);

  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", "searchSuggestions");

  input.addEventListener("input", (ev) => {
    const q = ev.target.value || "";
    filterCardsByName(q);
    showSearchSuggestions(q);
  });

  // hide suggestions when clicking outside
  document.addEventListener("click", (ev) => {
    if (!sug) return;
    if (ev.target === input) return;
    if (ev.target.closest && ev.target.closest("#searchSuggestions")) return;
    sug.innerHTML = "";
    sug.style.display = "none";
  });
});
