let uiOffset = 0;
const uiLimit = 20;

const TYPE_COLORS = {
  grass: "#439837",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  bug: "#A8B820",
  normal: "#A8A878",
  poison: "#A040A0",
  fairy: "#EE99AC",
  fighting: "#C03028",
  psychic: "#F85888",
  rock: "#B8A038",
  ground: "#E0C068",
  flying: "#A890F0",
  ghost: "#705898",
  dark: "#705848",
  steel: "#B8B8D0",
  ice: "#98D8D8",
  dragon: "#7038F8",
};

// small helpers for colors
function hexToRgb(hex) {
  const clean = (hex || "").replace("#", "");
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbaStr(rgb, a) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
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
  const color = TYPE_COLORS[primaryType];
  if (!color) return;
  const rgb = hexToRgb(color);
  cardElement.style.background = `linear-gradient(180deg, ${rgbaStr(
    rgb,
    0.45
  )} 0%, ${rgbaStr(rgb, 0.95)} 100%)`;
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
