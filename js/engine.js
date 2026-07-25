/* ============================================================================
   ENGINE — SRS scheduling + tag error-weighting + card selection.

   This is the differentiator. Both game modules (and any future one, including
   a multiplayer Mínigh É) go through exactly two calls:

       Engine.queue({ themes, grammar, limit, source })   -> ordered cards
       Engine.record({ cardId, quality, source })         -> writes everything

   Nothing module-specific lives in here, and no module writes to Store
   directly. Adding a third game mode means calling these two functions and
   passing a new `source` string — no scheduling or tagging logic is duplicated.

   QUALITY SCALE (shared by every mode)
   ------------------------------------
       1.0  got it            flashcards "correct"     | Mínigh É "understood"
       0.5  partial           (unused by flashcards)   | Mínigh É "struggled"
       0.0  missed            flashcards "incorrect"   | Mínigh É "couldn't"

   errorWeight = 1 - quality, applied identically to the card and to EVERY tag
   the card carries, theme and grammar alike.
   ============================================================================ */

const Engine = (function () {

  const DAY = 86400000;

  /* Leitner intervals in days, indexed by box. Box 0 = relearn today. */
  const BOX_DAYS = [0, 1, 2, 4, 8, 16, 32];
  const MAX_BOX = BOX_DAYS.length - 1;

  /* Scoring weights. Tuned so that a tag the learner is genuinely weak on can
     pull a not-yet-due card above a mildly overdue one, but cannot outrank a
     badly overdue card. Adjust here, not in the modules. */
  const W = {
    tag: 1.8,        // how hard weak tags pull cards forward
    ownError: 0.5,   // the card's own error history
    newCard: 1.0,    // baseline score for an unseen card
    jitter: 0.12     // small randomisation so order isn't identical each time
  };

  /* Smoothing: errors / (attempts + PRIOR). An untouched tag scores 0, and a
     tag with one error out of one attempt scores 0.33 rather than 1.0, so a
     single slip doesn't dominate the ranking. */
  const PRIOR = 2;

  /* Cards answered in this page session, so we don't show the same card twice
     in a row while other cards are still available. Not persisted. */
  const seenThisSession = new Set();

  let byId = {};
  function index() {
    byId = {};
    CARDS.forEach(function (c) { byId[c.id] = c; });
  }
  index();

  function get(id) { return byId[id]; }

  /* ---------------------------------------------------------------- tags -- */

  /* Every tag a card carries, with its category. The two categories stay
     separate in the data model and are only combined at the point of scoring. */
  function tagsOf(cardData) {
    const out = [];
    (cardData.themeTags || []).forEach(function (t) { out.push({ name: t, kind: "theme" }); });
    (cardData.grammarTags || []).forEach(function (t) { out.push({ name: t, kind: "grammar" }); });
    return out;
  }

  function tagErrorRate(name) {
    const s = Store.allTags()[name];
    if (!s || !s.attempts) return 0;
    return s.errors / (s.attempts + PRIOR);
  }

  /* Weak-tag ranking, sitewide. Used by the Dashboard and by scoring.
     `minAttempts` filters out tags with too little evidence to be meaningful;
     the Dashboard passes a low number and marks thin data rather than hiding it. */
  function weakTags(opts) {
    opts = opts || {};
    const minAttempts = opts.minAttempts == null ? 1 : opts.minAttempts;
    const kind = opts.kind || null;          // "theme" | "grammar" | null for both
    const limit = opts.limit || 10;

    const tags = Store.allTags();
    const rows = [];
    Object.keys(tags).forEach(function (name) {
      const s = tags[name];
      if (s.attempts < minAttempts) return;
      if (kind && s.kind !== kind) return;
      rows.push({
        name: name,
        kind: s.kind,
        attempts: s.attempts,
        errors: s.errors,
        rate: tagErrorRate(name),
        rawRate: s.attempts ? s.errors / s.attempts : 0,
        thin: s.attempts < 4
      });
    });
    rows.sort(function (a, b) {
      if (b.rate !== a.rate) return b.rate - a.rate;
      return b.attempts - a.attempts;
    });
    return rows.slice(0, limit);
  }

  /* --------------------------------------------------------------- scoring - */

  /* How overdue is this card?
       unseen        -> W.newCard
       due/overdue   -> 1.5 .. 2.5, rising with days overdue
       not yet due   -> 0 .. 0.4, rising as it approaches its due date
     The floor above zero for not-due cards is deliberate: it is what lets tag
     weight surface a card early. */
  function duenessScore(prog, now) {
    if (!prog || prog.due == null) return W.newCard;
    const daysOver = (now - prog.due) / DAY;
    if (daysOver >= 0) {
      return 1.5 + Math.min(daysOver, 30) / 30;
    }
    const interval = Math.max(BOX_DAYS[Math.min(prog.box, MAX_BOX)], 1);
    const remaining = Math.min(-daysOver / interval, 1);   // 1 = just answered
    return 0.4 * (1 - remaining);
  }

  /* Weight from the tags this card carries. Weighted towards the card's WORST
     tag rather than its average, so a card that is the learner's only exposure
     to a badly-broken grammar point still surfaces. */
  function tagScore(cardData) {
    const tags = tagsOf(cardData);
    if (!tags.length) return 0;
    let max = 0, sum = 0;
    tags.forEach(function (t) {
      const r = tagErrorRate(t.name);
      if (r > max) max = r;
      sum += r;
    });
    const mean = sum / tags.length;
    return 0.65 * max + 0.35 * mean;
  }

  function ownErrorScore(prog) {
    if (!prog || !prog.attempts) return 0;
    return prog.errors / (prog.attempts + PRIOR);
  }

  function score(cardData, now) {
    const prog = Store.hasCard(cardData.id) ? Store.card(cardData.id) : null;
    return duenessScore(prog, now)
      + W.tag * tagScore(cardData)
      + W.ownError * ownErrorScore(prog)
      + Math.random() * W.jitter;
  }

  /* -------------------------------------------------------------- filtering - */

  /* Tag-combination query. Themes OR'd together, grammar tags OR'd together,
     the two categories AND'd. Empty category = no constraint. There are no
     decks; this is the only way any mode selects cards. */
  function matches(cardData, themes, grammar) {
    if (themes && themes.length) {
      const hit = (cardData.themeTags || []).some(function (t) { return themes.indexOf(t) !== -1; });
      if (!hit) return false;
    }
    if (grammar && grammar.length) {
      const hit = (cardData.grammarTags || []).some(function (t) { return grammar.indexOf(t) !== -1; });
      if (!hit) return false;
    }
    return true;
  }

  /* ------------------------------------------------------------------ queue - */

  /* opts: { themes:[], grammar:[], limit:n, source:"flashcards"|"minigh"|... ,
             requireModel:bool }
     `requireModel` is used by Mínigh É, which can only run cards that have a
     model description written. `source` is accepted here so future modes can
     filter on it; it is not currently used for selection. */
  function queue(opts) {
    opts = opts || {};
    const now = Date.now();
    const limit = opts.limit || 20;

    let pool = CARDS.filter(function (c) {
      if (!matches(c, opts.themes, opts.grammar)) return false;
      if (opts.requireModel && !c.model) return false;
      return true;
    });

    if (!pool.length) return [];

    // Prefer cards not yet answered in this page session, but fall back to the
    // full pool rather than showing an empty screen.
    let fresh = pool.filter(function (c) { return !seenThisSession.has(c.id); });
    if (fresh.length < Math.min(limit, 4)) fresh = pool;

    const scored = fresh.map(function (c) {
      return { card: c, s: score(c, now) };
    });
    scored.sort(function (a, b) { return b.s - a.s; });

    return scored.slice(0, limit).map(function (r) { return r.card; });
  }

  /* ----------------------------------------------------------------- record - */

  /* The single write path. Every mode calls this and nothing else.
     { cardId, quality (1 | 0.5 | 0), source } */
  function record(ev) {
    const cardData = get(ev.cardId);
    if (!cardData) { console.warn("record() for unknown card", ev.cardId); return; }

    const quality = ev.quality;
    const errWeight = 1 - quality;
    const now = Date.now();

    /* -- card-level -- */
    const prog = Store.card(cardData.id);
    prog.attempts += 1;
    prog.errors += errWeight;
    prog.last = now;

    if (quality === 1) {
      prog.box = Math.min(prog.box + 1, MAX_BOX);
    } else if (quality === 0) {
      prog.box = 0;
    } /* partial: box unchanged, but it gets rescheduled below */

    prog.due = now + BOX_DAYS[prog.box] * DAY;

    /* -- tag-level: EVERY tag the card carries, theme and grammar alike -- */
    tagsOf(cardData).forEach(function (t) {
      const s = Store.tag(t.name, t.kind);
      s.attempts += 1;
      s.errors += errWeight;
    });

    /* -- attempt log, so a later mode (or an analytics view) can attribute
          performance by source without re-deriving it -- */
    Store.push({
      t: now,
      cardId: cardData.id,
      source: ev.source || "unknown",
      quality: quality
    });

    seenThisSession.add(cardData.id);
    Store.save();
  }

  /* -------------------------------------------------------------- reporting - */

  function dueCount() {
    const now = Date.now();
    let due = 0, unseen = 0;
    CARDS.forEach(function (c) {
      if (!Store.hasCard(c.id)) { unseen += 1; return; }
      const p = Store.card(c.id);
      if (p.due == null || p.due <= now) due += 1;
    });
    return { due: due, unseen: unseen, total: CARDS.length };
  }

  function cardStats() {
    let learned = 0;
    CARDS.forEach(function (c) {
      if (Store.hasCard(c.id) && Store.card(c.id).box >= 3) learned += 1;
    });
    return { learned: learned };
  }

  /* All tags present in the card set, for the filter chips. Derived from the
     data file, so adding a tag in cards.js makes it filterable automatically. */
  function tagVocabulary() {
    const themes = new Set(), grammar = new Set();
    CARDS.forEach(function (c) {
      (c.themeTags || []).forEach(function (t) { themes.add(t); });
      (c.grammarTags || []).forEach(function (t) { grammar.add(t); });
    });
    return {
      themes: Array.from(themes).sort(),
      grammar: Array.from(grammar).sort()
    };
  }

  function clearSession() { seenThisSession.clear(); }

  return {
    queue: queue,
    record: record,
    weakTags: weakTags,
    tagErrorRate: tagErrorRate,
    tagsOf: tagsOf,
    dueCount: dueCount,
    cardStats: cardStats,
    tagVocabulary: tagVocabulary,
    clearSession: clearSession,
    get: get,
    BOX_DAYS: BOX_DAYS,
    MAX_BOX: MAX_BOX
  };
})();
