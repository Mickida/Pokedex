const API_BASE = "https://pokeapi.co/api/v2";
const ARTWORK =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

const _inFlightDetailFetches = {};

async function loadData(path = "") {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error("Network error " + res.status);
  return await res.json();
}

function _parseSummariesFromResults(results) {
  return results.map((listItem) => {
    const pokemonId = listItem.url.replace(/\/$/, "").split("/").pop();
    return {
      name: listItem.name,
      id: Number(pokemonId),
      image: `${ARTWORK}/${pokemonId}.png`,
    };
  });
}

async function _fetchPokemonPage(offset = 0, limit = 20) {
  const listResponse = await loadData(
    `/pokemon?offset=${offset}&limit=${limit}`
  );
  return _parseSummariesFromResults(listResponse.results || []);
}

function _mergeAndSaveSummaries(store, fetched) {
  const merged = store.summaries ? store.summaries.slice() : [];
  for (let i = 0; i < fetched.length; i++) {
    const it = fetched[i];
    if (!merged.some((m) => m.id === it.id)) merged.push(it);
  }
  store.summaries = merged;
  writeStore(store);
}

async function getPokemonList(offset = 0, limit = 20) {
  const store = readStore();
  if (store.summaries.length >= offset + limit)
    return store.summaries.slice(offset, offset + limit);
  const fetched = await _fetchPokemonPage(offset, limit);
  _mergeAndSaveSummaries(store, fetched);
  return fetched;
}

function _buildFullFromPokemonData(pokemonData) {
  const officialArtworkUrl =
    pokemonData.sprites?.other?.["official-artwork"]?.front_default;
  return {
    id: pokemonData.id,
    name: pokemonData.name,
    image: officialArtworkUrl || `${ARTWORK}/${pokemonData.id}.png`,
    types: pokemonData.types,
    stats: pokemonData.stats,
    abilities: pokemonData.abilities,
    height: pokemonData.height,
    weight: pokemonData.weight,
    species: pokemonData.species,
  };
}

function _saveDetailAndNotify(full) {
  const store = readStore();
  store.details = store.details || {};
  store.details[full.id] = full;
  writeStore(store);
  try {
    window.dispatchEvent(
      new CustomEvent("pokedex:detail-updated", { detail: { id: full.id } })
    );
  } catch (e) {}
}

async function _fetchStoreNotify(id) {
  const pokemonData = await loadData(`/pokemon/${id}`);
  const full = _buildFullFromPokemonData(pokemonData);
  _saveDetailAndNotify(full);
  return full;
}

async function _fetchAndStoreFullDetail(id) {
  if (_inFlightDetailFetches[id]) return _inFlightDetailFetches[id];
  _inFlightDetailFetches[id] = _fetchStoreNotify(id).finally(() => {
    delete _inFlightDetailFetches[id];
  });
  return _inFlightDetailFetches[id];
}

function findFullCached(store, idOrName) {
  const asNum = Number(idOrName);
  if (!isNaN(asNum) && store.details && store.details[asNum])
    return store.details[asNum];
  const nameKey = String(idOrName).toLowerCase();
  for (const k of Object.keys(store.details || {})) {
    const obj = store.details[k];
    if (obj && obj.name && String(obj.name).toLowerCase() === nameKey)
      return obj;
  }
  return null;
}

function findSummary(store, idOrName) {
  const asNum = Number(idOrName);
  const nameKey = String(idOrName).toLowerCase();
  return (store.summaries || []).find(
    (s) =>
      s.id === asNum ||
      String(s.id) === String(idOrName) ||
      (s.name && s.name.toLowerCase() === nameKey)
  );
}

function _makeMinimalFromSummary(summary) {
  return {
    id: summary.id,
    name: summary.name,
    image: summary.image,
    types: [],
    stats: [],
    abilities: [],
    height: null,
    weight: null,
    species: null,
    _partial: true,
  };
}

function storeMinimalAndFetch(store, summary) {
  const minimal = _makeMinimalFromSummary(summary);
  try {
    store.details = store.details || {};
    store.details[minimal.id] = minimal;
    writeStore(store);
  } catch (e) {}
  _fetchAndStoreFullDetail(minimal.id).catch(() => {});
  return minimal;
}

async function getPokemonById(idOrName) {
  const store = readStore();
  const full = findFullCached(store, idOrName);
  if (full) return full;
  const summary = findSummary(store, idOrName);
  if (summary) return storeMinimalAndFetch(store, summary);
  return await _fetchAndStoreFullDetail(idOrName);
}

window.pokeApi = {
  getPokemonList,
  getPokemonById,
};
