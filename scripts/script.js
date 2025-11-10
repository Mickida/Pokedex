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

// (modal code removed)

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
