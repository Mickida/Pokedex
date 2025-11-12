function getPrimaryType(detail) {
  const types = detail.types || [];
  return types[0] && types[0].type && types[0].type.name
    ? types[0].type.name
    : null;
}

function setModalImageTitleId(root, detail) {
  const title = root.querySelector("#modalTitle");
  if (title) title.textContent = capitalize(detail.name);
  const idWrap = root.querySelector(".id-wrap");
  if (idWrap) idWrap.textContent = `#${detail.id}`;
  const img = root.querySelector(".detail-image");
  if (img) {
    img.src = detail.image || "";
    img.alt = capitalize(detail.name) || "";
  }
}

function showAllCards(cards) {
  for (let i = 0; i < cards.length; i++) cards[i].style.display = "";
}

function onSuggestionClick(m, container) {
  const input = document.getElementById("searchInput");
  if (input) input.value = m.name;
  filterCardsByName(m.name);
  updateLoadMoreButtonState();
  container.innerHTML = "";
  container.style.display = "none";
  if (m.id) openDetailModalById(m.id);
}

function createSuggestionButton(m, container) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "search-suggestion";
  btn.textContent = `${m.name}`;
  btn.dataset.id = m.id;
  btn.addEventListener("click", () => onSuggestionClick(m, container));
  container.appendChild(btn);
}

async function onClickLoadMore(loadBtn) {
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
