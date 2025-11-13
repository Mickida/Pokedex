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
      if (prevBtn.disabled) return;
      navigateModal(-1);
    });
  if (nextBtn)
    nextBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (nextBtn.disabled) return;
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
  setModalImageTitleId(root, detail);
  const primaryType = getPrimaryType(detail);
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
