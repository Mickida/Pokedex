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
    // call global function defined in script.js
    if (typeof openDetailModalById === "function") openDetailModalById(id);
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
    image: pokemonSummary.image || "",
    name: pokemonSummary.name ? capitalize(pokemonSummary.name) : "",
  });
  fallback.innerHTML = rendered;
  return fallback;
}

function getRenderedCards() {
  const container = document.getElementById("pokemonList");
  if (!container) return [];
  return Array.from(container.querySelectorAll(".card"));
}

function getLoadedIds() {
  const cards = Array.from(document.querySelectorAll("#pokemonList .card"));
  return cards
    .filter((c) => {
      try {
        const style = window.getComputedStyle(c);
        return (
          style && style.display !== "none" && style.visibility !== "hidden"
        );
      } catch (e) {
        return true;
      }
    })
    .map((c) => parseInt(c.dataset.id, 10))
    .filter((n) => !isNaN(n));
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

function getNameFromCard(card) {
  const nameEl = card.querySelector(".card__name");
  return nameEl ? (nameEl.textContent || "").trim() : "";
}
