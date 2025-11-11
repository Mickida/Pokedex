// Minimal, easy-to-read PokeAPI helper (option A)
const API_BASE = "https://pokeapi.co/api/v2";
const API_URL = `${API_BASE}/pokemon/`;
const ARTWORK =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

// einfacher fetch-wrapper im Lernstil
async function loadData(path = "") {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error("Network error " + res.status);
  return await res.json();
}

// Liste: gibt array mit {name,id,image}
async function getPokemonList(offset = 0, limit = 20) {
  const listResponse = await loadData(
    `/pokemon?offset=${offset}&limit=${limit}`
  );
  return listResponse.results.map((listItem) => {
    const pokemonId = listItem.url.replace(/\/$/, "").split("/").pop();
    return {
      name: listItem.name,
      id: Number(pokemonId),
      image: `${ARTWORK}/${pokemonId}.png`,
    };
  });
}

// Detail: vereinfachtes Objekt
async function getPokemon(idOrName) {
  const pokemonData = await loadData(`/pokemon/${idOrName}`);
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
    moves: pokemonData.moves, // full move objects from API
    species: pokemonData.species, // contains name and url for species data
  };
}

function getPokemonById(id) {
  return getPokemon(id);
}
function getPokemonByName(name) {
  return getPokemon(name);
}

// Expose a small API object for the UI scripts to call
window.pokeApi = {
  getPokemonList,
  getPokemonById,
  getPokemonByName,
  getPokemon,
};
