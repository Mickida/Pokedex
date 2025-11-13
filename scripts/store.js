const STORAGE_KEY = "pokedex";

function _parseStoreRaw(raw) {
  if (!raw) return { summaries: [], details: {} };
  try {
    const parsed = JSON.parse(raw);
    return {
      summaries: Array.isArray(parsed.summaries) ? parsed.summaries : [],
      details:
        parsed.details && typeof parsed.details === "object"
          ? parsed.details
          : {},
    };
  } catch (e) {
    return { summaries: [], details: {} };
  }
}

function readStore() {
  try {
    return _parseStoreRaw(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    console.warn("readStore failed", e);
    return { summaries: [], details: {} };
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn("writeStore failed", e);
  }
}
