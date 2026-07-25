/* ============================================================================
   UI — shared rendering helpers. No state, no persistence.
   ============================================================================ */

const UI = (function () {

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  /* Tag names are stored as slugs ("prepositional-pronoun"). Shown as-is:
     they are the teacher's own vocabulary and shouldn't be prettified into
     something that no longer matches cards.js. */
  function tagRow(card) {
    const row = el("div", "tagline");
    (card.themeTags || []).forEach(function (t) {
      row.appendChild(el("span", "minitag", t));
    });
    (card.grammarTags || []).forEach(function (t) {
      row.appendChild(el("span", "minitag grammar", t));
    });
    return row;
  }

  /* A small gold mark, shown on the reveal rather than shouted on the prompt.
     The learner still sees that the phrase isn't signed off; it just doesn't
     make the app look like a scaffold. */
  function uncertainMark(card) {
    if (card.flag !== "UNCERTAIN") return null;
    return el("span", "mark-uncertain", "GAN DEIMHNIÚ");
  }

  /* Dialect note, general note, and the UNCERTAIN flag. The flag is shown to
     the user, not hidden in the data — this set is unreviewed and the app
     should say so at the point of contact, not only in a banner. */
  function noteBlocks(card) {
    const wrap = el("div", "notes");
    let any = false;

    if (card.dialectNote) {
      const b = el("div", "note-block dialect");
      b.appendChild(el("span", "lbl", "CANÚINT / DIALECT"));
      b.appendChild(document.createTextNode(card.dialectNote));
      wrap.appendChild(b);
      any = true;
    }
    if (card.note) {
      const b = el("div", "note-block");
      b.appendChild(el("span", "lbl", "NOTA"));
      b.appendChild(document.createTextNode(card.note));
      wrap.appendChild(b);
      any = true;
    }
    if (card.flag === "UNCERTAIN") {
      const b = el("div", "note-block uncertain");
      b.appendChild(el("span", "lbl", "UNCERTAIN — NEEDS REVIEW"));
      b.appendChild(document.createTextNode(card.flagNote || "Dialectal accuracy not confirmed."));
      wrap.appendChild(b);
      any = true;
    }
    return any ? wrap : null;
  }

  /* Theme and grammar chips, rendered as two separate rows because they are
     two separate tag categories in the data model and the learner should see
     that distinction. Returns a getter for the current selection. */
  function filterBar(container, onChange) {
    const vocab = Engine.tagVocabulary();
    const selected = { themes: [], grammar: [] };

    /* Tags the learner is currently weakest on get a marker, so the filter bar
       doubles as a nudge towards weak areas. */
    const weak = Engine.weakTags({ limit: 5, minAttempts: 2 }).map(function (r) { return r.name; });

    function buildRow(label, names, kind, bucket) {
      const row = el("div", "filter-row");
      row.appendChild(el("div", "cat", label));
      const chips = el("div", "chips");
      names.forEach(function (name) {
        const b = el("button", "chip" + (kind === "grammar" ? " grammar" : ""));
        b.appendChild(document.createTextNode(name));
        if (weak.indexOf(name) !== -1) b.appendChild(el("span", "weak-dot"));
        b.addEventListener("click", function () {
          const i = bucket.indexOf(name);
          if (i === -1) bucket.push(name); else bucket.splice(i, 1);
          b.classList.toggle("on");
          onChange(selected);
        });
        chips.appendChild(b);
      });
      row.appendChild(chips);
      return row;
    }

    clear(container);
    container.appendChild(buildRow("ÁBHAR / THEME", vocab.themes, "theme", selected.themes));
    container.appendChild(buildRow("GRAMADACH / GRAMMAR", vocab.grammar, "grammar", selected.grammar));
    return selected;
  }

  function statsRow(container) {
    const d = Engine.dueCount();
    const s = Engine.cardStats();
    clear(container);
    [
      { cls: "due", n: d.due, label: "due" },
      { cls: "", n: d.unseen, label: "unseen" },
      { cls: "", n: s.learned, label: "learned" }
    ].forEach(function (item) {
      const div = el("div", item.cls);
      div.appendChild(el("span", null, String(item.n)));
      div.appendChild(el("small", null, item.label));
      container.appendChild(div);
    });
  }

  return {
    el: el,
    clear: clear,
    tagRow: tagRow,
    uncertainMark: uncertainMark,
    noteBlocks: noteBlocks,
    filterBar: filterBar,
    statsRow: statsRow
  };
})();
