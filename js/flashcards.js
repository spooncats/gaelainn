/* ============================================================================
   MODULE A — FLASHCARDS (Cártaí)

   Recognition-recall: Irish shown, learner self-reports on reveal.
   Selection and grading go entirely through Engine; this file holds no
   scheduling logic of its own.
   ============================================================================ */

const Flashcards = (function () {

  const SOURCE = "flashcards";
  const SESSION_LEN = 12;

  let filters = { themes: [], grammar: [] };
  let queue = [];
  let idx = 0;
  let revealed = false;
  let done = 0;

  let root, stage, statsEl, filtersEl;

  function mount(container) {
    root = container;
    UI.clear(root);

    filtersEl = UI.el("div", "filters");
    root.appendChild(filtersEl);

    statsEl = UI.el("div", "stats");
    root.appendChild(statsEl);

    stage = UI.el("div");
    root.appendChild(stage);

    filters = UI.filterBar(filtersEl, function (sel) {
      filters = sel;
      build();
    });

    build();
  }

  function build() {
    queue = Engine.queue({
      themes: filters.themes,
      grammar: filters.grammar,
      limit: SESSION_LEN,
      source: SOURCE
    });
    idx = 0;
    done = 0;
    revealed = false;
    render();
  }

  function current() { return queue[idx]; }

  function grade(quality) {
    const card = current();
    if (!card) return;
    Engine.record({ cardId: card.id, quality: quality, source: SOURCE });
    done += 1;
    idx += 1;
    revealed = false;
    render();
  }

  function render() {
    UI.statsRow(statsEl);
    UI.clear(stage);

    if (!queue.length) {
      const p = UI.el("div", "empty",
        "No cards match that combination of theme and grammar tags. Clear a filter, or add cards in data/cards.js.");
      stage.appendChild(p);
      return;
    }

    if (idx >= queue.length) {
      renderDone();
      return;
    }

    const card = current();
    const box = UI.el("div", "card");

    box.appendChild(UI.el("div", "corner left", (idx + 1) + " / " + queue.length));

    /* Irish text and its speaker button on one row. The button stops event
       propagation so tapping it doesn't also flip the card. */
    const row = UI.el("div", "frontrow");
    row.appendChild(UI.el("div", "prompt-ga", card.ga));
    row.appendChild(Fuaim.button(card));
    box.appendChild(row);

    if (!revealed) {
      box.appendChild(UI.el("div", "hint", "Tap to reveal"));
      box.style.cursor = "pointer";
      box.addEventListener("click", function () {
        revealed = true;
        render();
      });
      stage.appendChild(box);
      return;
    }

    const rev = UI.el("div", "reveal");
    rev.appendChild(UI.el("div", "answer", card.en));
    const notes = UI.noteBlocks(card);
    if (notes) rev.appendChild(notes);
    rev.appendChild(UI.tagRow(card));
    const mark = UI.uncertainMark(card);
    if (mark) {
      const mr = UI.el("div", "tagline");
      mr.appendChild(mark);
      rev.appendChild(mr);
    }
    box.appendChild(rev);
    stage.appendChild(box);

    const grades = UI.el("div", "grades");

    const bad = UI.el("button", "grade bad");
    bad.appendChild(document.createTextNode("NÍ RAIBH"));
    bad.appendChild(UI.el("small", null, "I didn't have it"));
    bad.addEventListener("click", function () { grade(0); });

    const good = UI.el("button", "grade good");
    good.appendChild(document.createTextNode("BHÍ SÉ AGAM"));
    good.appendChild(UI.el("small", null, "I had it"));
    good.addEventListener("click", function () { grade(1); });

    grades.appendChild(bad);
    grades.appendChild(good);
    stage.appendChild(grades);
  }

  function renderDone() {
    const box = UI.el("div", "card");
    box.appendChild(UI.el("div", "prompt-en", "Críochnaithe"));
    box.appendChild(UI.el("div", "hint", done + " cards reviewed. Weak tags have been updated."));
    stage.appendChild(box);

    const row = UI.el("div", "btn-row");
    const again = UI.el("button", "btn", "ARÍS");
    again.addEventListener("click", build);
    row.appendChild(again);

    const dash = UI.el("button", "btn ghost", "LAGPHOINTÍ");
    dash.addEventListener("click", function () { App.go("dashboard"); });
    row.appendChild(dash);

    stage.appendChild(row);
  }

  /* Called when the tab is re-entered, so a session started earlier reflects
     grades recorded by the other module in the meantime. */
  function refresh() {
    if (!root) return;
    if (idx >= queue.length) build(); else UI.statsRow(statsEl);
  }

  return { mount: mount, refresh: refresh };
})();
