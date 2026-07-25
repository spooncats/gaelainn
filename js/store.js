/* ============================================================================
   STORE — localStorage persistence.

   Everything durable lives here and nowhere else. Game modules never touch
   localStorage directly; they go through Engine, which goes through Store.
   That is what lets a second (or third) game mode write to the same tag-error
   store without duplicating logic.

   SHAPE
   -----
   state = {
     v: 1,
     cards: { <cardId>: { box, due, attempts, errors, last } },
     tags:  { <tagName>: { kind, attempts, errors } },
     log:   [ { t, cardId, source, quality } ]   // newest last, capped
   }

   errors is a FLOAT, not an integer: a "struggled" self-rating in Mínigh É
   counts as half an error. Anything reading it should treat it as a weight.
   ============================================================================ */

const Store = (function () {
  const KEY = "gaeilge.corca-dhuibhne.v1";
  const LOG_CAP = 800;

  function blank() {
    return { v: 1, cards: {}, tags: {}, log: [] };
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== 1) return blank();
      // Defensive: a hand-edited or half-written blob shouldn't brick the app.
      parsed.cards = parsed.cards || {};
      parsed.tags = parsed.tags || {};
      parsed.log = parsed.log || [];
      return parsed;
    } catch (e) {
      console.warn("Could not read saved progress, starting fresh.", e);
      return blank();
    }
  }

  let saveTimer = null;
  function save() {
    // Debounced: a review session fires many small writes.
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        console.error("Could not save progress.", e);
      }
    }, 120);
  }

  function saveNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---- cards ---- */

  function card(id) {
    if (!state.cards[id]) {
      state.cards[id] = { box: 0, due: null, attempts: 0, errors: 0, last: null };
    }
    return state.cards[id];
  }

  function hasCard(id) {
    return Object.prototype.hasOwnProperty.call(state.cards, id);
  }

  /* ---- tags ---- */

  function tag(name, kind) {
    if (!state.tags[name]) {
      state.tags[name] = { kind: kind || "theme", attempts: 0, errors: 0 };
    }
    // Backfill kind if the tag was created before we knew its category.
    if (kind && state.tags[name].kind !== kind) state.tags[name].kind = kind;
    return state.tags[name];
  }

  function allTags() {
    return state.tags;
  }

  /* ---- log ---- */

  function push(entry) {
    state.log.push(entry);
    if (state.log.length > LOG_CAP) {
      state.log.splice(0, state.log.length - LOG_CAP);
    }
  }

  function log() {
    return state.log;
  }

  /* ---- lifecycle ---- */

  function reset() {
    state = blank();
    saveNow();
  }

  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }

  return {
    card: card,
    hasCard: hasCard,
    tag: tag,
    allTags: allTags,
    push: push,
    log: log,
    save: save,
    saveNow: saveNow,
    reset: reset,
    exportJSON: exportJSON,
    raw: function () { return state; }
  };
})();

window.addEventListener("beforeunload", Store.saveNow);
