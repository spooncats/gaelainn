/* ============================================================================
   MODULE B — MÍNIGH É / EXPLAIN IT

   Solo circumlocution practice. The learner sees the English concept and must
   produce a spoken or written Munster-Irish description WITHOUT using the
   target Irish word, under a short timer. The model description is revealed
   afterwards and the learner self-rates.

   Lineage note: this is the "Explain It to a Child" / Taboo mechanic from the
   existing activity bank, ported to solo practice with a scoring tail.

   ------------------------------------------------------------------
   MULTIPLAYER SEAM — read before extending
   ------------------------------------------------------------------
   A round is built by makeRound(), which returns a plain object with no DOM
   and no assumptions about how many people are in the room:

       { card, taboo, seconds, roles, source, resolve(quality) }

   roles is [{ id, part }] where part is "describer" or "guesser". Solo is
   simply a single describer. A two-player version needs to:
       (a) pass roles: [{id:'a',part:'describer'},{id:'b',part:'guesser'}]
       (b) pass source: "minigh-mp"
       (c) render a different view over the same round object
   Card selection (Engine.queue) and grading (round.resolve -> Engine.record)
   do not change, so the tag-error store stays shared and consistent across
   modes. Nothing in this file needs to be duplicated to add that.
   ============================================================================ */

const Minigh = (function () {

  const SOURCE = "minigh";
  const SESSION_LEN = 8;
  const DEFAULT_SECONDS = 40;      // spec: 30-45s

  let filters = { themes: [], grammar: [] };
  let queue = [];
  let idx = 0;
  let done = 0;
  let phase = "idle";              // idle | running | reveal | finished
  let round = null;
  let secondsLeft = 0;
  let ticker = null;
  let scratchText = "";

  let root, stage, statsEl, filtersEl, secondsSetting = DEFAULT_SECONDS;

  /* ---------------------------------------------------------- round object -- */

  /* The mode-agnostic unit of play. Multiplayer builds the same thing with a
     longer roles array and a different source string. */
  function makeRound(card, opts) {
    opts = opts || {};
    return {
      card: card,
      taboo: card.ga,                                   // the word that may not be used
      seconds: opts.seconds || DEFAULT_SECONDS,
      roles: opts.roles || [{ id: "solo", part: "describer" }],
      source: opts.source || SOURCE,
      resolve: function (quality) {
        Engine.record({ cardId: card.id, quality: quality, source: this.source });
      }
    };
  }

  /* -------------------------------------------------------------- lifecycle -- */

  function mount(container) {
    root = container;
    UI.clear(root);

    const intro = UI.el("div", "sc-label", "MÍNIGH É — DESCRIBE IT WITHOUT THE WORD");
    root.appendChild(intro);

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
    stopTimer();
    queue = Engine.queue({
      themes: filters.themes,
      grammar: filters.grammar,
      limit: SESSION_LEN,
      source: SOURCE,
      requireModel: true            // only cards with a model description
    });
    idx = 0;
    done = 0;
    phase = "idle";
    round = null;
    scratchText = "";
    render();
  }

  function startRound() {
    const card = queue[idx];
    if (!card) { phase = "finished"; render(); return; }
    round = makeRound(card, { seconds: secondsSetting, source: SOURCE });
    secondsLeft = round.seconds;
    scratchText = "";
    phase = "running";
    render();
    startTimer();
  }

  function startTimer() {
    stopTimer();
    ticker = setInterval(function () {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        secondsLeft = 0;
        stopTimer();
        phase = "reveal";
        render();
      } else {
        paintTimer();
      }
    }, 1000);
  }

  function stopTimer() {
    if (ticker) { clearInterval(ticker); ticker = null; }
  }

  function paintTimer() {
    const num = document.getElementById("mnTimerNum");
    const bar = document.getElementById("mnTimerBar");
    if (!num || !round) return;
    num.textContent = String(secondsLeft);
    const low = secondsLeft <= 10;
    num.classList.toggle("low", low);
    if (bar) {
      bar.style.width = (100 * secondsLeft / round.seconds) + "%";
      bar.classList.toggle("low", low);
    }
  }

  function rate(quality) {
    if (round) round.resolve(quality);
    done += 1;
    idx += 1;
    phase = "idle";
    round = null;
    render();
  }

  /* ----------------------------------------------------------------- render -- */

  function render() {
    UI.statsRow(statsEl);
    UI.clear(stage);

    if (!queue.length) {
      stage.appendChild(UI.el("div", "empty",
        "No cards with a model description match those tags. Mínigh É only uses cards that have a `model` field in data/cards.js."));
      return;
    }

    if (phase === "finished" || idx >= queue.length) { renderDone(); return; }
    if (phase === "idle") { renderReady(); return; }
    if (phase === "running") { renderRunning(); return; }
    if (phase === "reveal") { renderReveal(); return; }
  }

  function renderReady() {
    const card = queue[idx];
    const box = UI.el("div", "card");
    box.appendChild(UI.el("div", "corner left", (idx + 1) + " / " + queue.length));
    box.appendChild(UI.el("div", "prompt-en", card.en));
    box.appendChild(UI.el("div", "hint",
      "You will have " + secondsSetting + " seconds to describe this in Irish without using the word itself."));
    stage.appendChild(box);

    const go = UI.el("button", "btn wide", "TOSAIGH");
    go.addEventListener("click", startRound);
    stage.appendChild(go);

    const row = UI.el("div", "btn-row");
    [30, 40, 45].forEach(function (s) {
      const b = UI.el("button", "btn ghost" + (s === secondsSetting ? " gold" : ""), s + "s");
      b.addEventListener("click", function () { secondsSetting = s; render(); });
      row.appendChild(b);
    });
    stage.appendChild(row);
  }

  function renderRunning() {
    const card = round.card;

    const box = UI.el("div", "card");
    box.appendChild(UI.el("div", "corner left", (idx + 1) + " / " + queue.length));
    box.appendChild(UI.el("div", "prompt-en", card.en));

    const con = UI.el("div", "constraint");
    con.appendChild(document.createTextNode("Ná habair: "));
    const b = UI.el("b", null, round.taboo);
    con.appendChild(b);
    box.appendChild(con);

    stage.appendChild(box);

    const tw = UI.el("div", "timer-wrap");
    const num = UI.el("div", "timer-num");
    num.id = "mnTimerNum";
    num.textContent = String(secondsLeft);
    tw.appendChild(num);
    const bar = UI.el("div", "timer-bar");
    const fill = UI.el("i");
    fill.id = "mnTimerBar";
    bar.appendChild(fill);
    tw.appendChild(bar);
    stage.appendChild(tw);

    /* Optional written mode. Speaking aloud is the intended default; the box
       is here so the module works in a quiet room or on a bus. */
    const ta = UI.el("textarea", "scratch");
    ta.placeholder = "Labhair os ard, nó scríobh anseo.";
    ta.value = scratchText;
    ta.addEventListener("input", function () { scratchText = ta.value; });
    stage.appendChild(ta);

    const skip = UI.el("button", "btn ghost wide", "RÉITEACH ANOIS");
    skip.style.marginTop = "12px";
    skip.addEventListener("click", function () {
      stopTimer();
      phase = "reveal";
      render();
    });
    stage.appendChild(skip);
  }

  function renderReveal() {
    const card = round.card;

    const box = UI.el("div", "card");
    box.appendChild(UI.el("div", "corner left", (idx + 1) + " / " + queue.length));

    box.appendChild(UI.el("div", "prompt-en", card.en));

    const rev = UI.el("div", "reveal");
    rev.appendChild(UI.el("div", "sc-label", "SAMPLA / MODEL"));
    rev.appendChild(UI.el("div", "model-text", card.model));
    rev.appendChild(UI.el("div", "sc-label", "AN FOCAL FÉIN"));

    /* The word they were not allowed to use, with its audio — this is the
       moment they most want to hear it. */
    const wordRow = UI.el("div", "frontrow");
    wordRow.appendChild(UI.el("div", "answer-ga", card.ga));
    wordRow.appendChild(Fuaim.button(card));
    rev.appendChild(wordRow);

    if (scratchText.trim()) {
      const mine = UI.el("div", "note-block");
      mine.appendChild(UI.el("span", "lbl", "WHAT YOU WROTE"));
      mine.appendChild(document.createTextNode(scratchText.trim()));
      rev.appendChild(mine);
    }

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

    /* Self-rating feeds the same error-weighting engine as flashcards, on the
       same 1 / 0.5 / 0 scale, tagged by this card's theme and grammar tags. */
    const grades = UI.el("div", "grades three");

    const g1 = UI.el("button", "grade good");
    g1.appendChild(document.createTextNode("THUIG SÉ É"));
    g1.appendChild(UI.el("small", null, "understood it"));
    g1.addEventListener("click", function () { rate(1); });

    const g2 = UI.el("button", "grade mid");
    g2.appendChild(document.createTextNode("STRUGGLED"));
    g2.appendChild(UI.el("small", null, "got there slowly"));
    g2.addEventListener("click", function () { rate(0.5); });

    const g3 = UI.el("button", "grade bad");
    g3.appendChild(document.createTextNode("NÍORBH FHÉIDIR"));
    g3.appendChild(UI.el("small", null, "couldn't do it"));
    g3.addEventListener("click", function () { rate(0); });

    grades.appendChild(g1);
    grades.appendChild(g2);
    grades.appendChild(g3);
    stage.appendChild(grades);
  }

  function renderDone() {
    const box = UI.el("div", "card");
    box.appendChild(UI.el("div", "prompt-en", "Críochnaithe"));
    box.appendChild(UI.el("div", "hint", done + " described. Your self-ratings have been written to the same weak-tag store as the flashcards."));
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

  function refresh() {
    if (!root) return;
    if (phase === "idle" || phase === "finished") build();
  }

  function leave() { stopTimer(); }

  return { mount: mount, refresh: refresh, leave: leave, makeRound: makeRound };
})();
