/* ============================================================================
   DASHBOARD — weak points and due count.

   Reads only. Every number here comes from Engine, which is fed identically by
   both modules, so the ranking already reflects flashcards and Mínigh É
   together without this file knowing either exists.
   ============================================================================ */

const Dashboard = (function () {

  let root;

  function mount(container) {
    root = container;
    render();
  }

  function refresh() { if (root) render(); }

  let recOpen = false;

  function render() {
    UI.clear(root);
    root.appendChild(duePanel());
    root.appendChild(weakPanel());
    root.appendChild(audioPanel());
    root.appendChild(reviewPanel());
    root.appendChild(dataPanel());
  }

  /* ------------------------------------------------------------------ due -- */

  function duePanel() {
    const p = UI.el("div", "panel");
    p.appendChild(UI.el("h2", null, "STAID / STATE"));

    const d = Engine.dueCount();
    const s = Engine.cardStats();
    const stats = UI.el("div", "stats");
    [
      { cls: "due", n: d.due, label: "due now" },
      { cls: "", n: d.unseen, label: "unseen" },
      { cls: "", n: s.learned, label: "learned" },
      { cls: "", n: d.total, label: "cards" }
    ].forEach(function (item) {
      const div = UI.el("div", item.cls);
      div.appendChild(UI.el("span", null, String(item.n)));
      div.appendChild(UI.el("small", null, item.label));
      stats.appendChild(div);
    });
    p.appendChild(stats);
    return p;
  }

  /* ------------------------------------------------------------ weak tags -- */

  function weakPanel() {
    const p = UI.el("div", "panel");
    p.appendChild(UI.el("h2", null, "LAGPHOINTÍ / WEAK POINTS"));
    p.appendChild(UI.el("div", "sub",
      "Error weight per tag, across both modules. Solid outline is a theme tag, dashed is a grammar tag. Cards carrying these tags are being surfaced more often."));

    const rows = Engine.weakTags({ limit: 10, minAttempts: 1 })
      .filter(function (r) { return r.errors > 0; });

    if (!rows.length) {
      p.appendChild(UI.el("div", "empty",
        "Nothing recorded yet. Answer some cards and the weak tags will rank themselves here."));
      return p;
    }

    const max = rows[0].rate || 1;
    rows.forEach(function (r) {
      const row = UI.el("div", "weak-row");
      row.appendChild(UI.el("span", "kind" + (r.kind === "grammar" ? " grammar" : ""), r.kind));

      const name = UI.el("span", "name");
      name.appendChild(document.createTextNode(r.name));
      if (r.thin) {
        name.appendChild(document.createTextNode(" "));
        name.appendChild(UI.el("span", "thin", "(thin data)"));
      }
      row.appendChild(name);

      const bar = UI.el("div", "bar");
      const fill = UI.el("i");
      fill.style.width = Math.round(100 * r.rate / max) + "%";
      bar.appendChild(fill);
      row.appendChild(bar);

      row.appendChild(UI.el("span", "pct", Math.round(100 * r.rawRate) + "%"));
      p.appendChild(row);
    });

    return p;
  }

  /* ---------------------------------------------------------------- audio -- */

  /* Teacher-side. Kept off the learner path deliberately: the learner taps a
     speaker, the teacher fills the speakers. */
  function audioPanel() {
    const p = UI.el("div", "panel");
    p.appendChild(UI.el("h2", null, "FUAIM / AUDIO"));

    const hasVoice = Fuaim.hasIrishVoice();
    const recorded = Fuaim.recordedCount();

    p.appendChild(UI.el("div", "sub",
      recorded + " of " + CARDS.length + " cards have a recording on this device."
      + (hasVoice
        ? " This device also has an Irish synthetic voice, used where no recording exists."
        : " This device has no Irish synthetic voice.")));

    if (!hasVoice) {
      p.appendChild(UI.el("div", "notice",
        "Almost no device ships an Irish (ga-IE) voice. Rather than let the browser read Munster Irish in an English voice — confidently wrong pronunciation, which is worse than silence for a dialect app — cards with no recording show an inactive speaker. Recording them in your own voice is the fix, and is better than any synthetic voice would have been."));
    }

    const check = Fuaim.canRecord();
    if (!check.ok) {
      p.appendChild(UI.el("div", "notice", check.why));
    }

    /* Opt-in stand-in voice, off by default and labelled as wrong. */
    const tr = UI.el("label", "toggle-row");
    const cb = UI.el("input");
    cb.type = "checkbox";
    cb.checked = Fuaim.allowForeignVoice();
    cb.addEventListener("change", function () {
      Fuaim.setAllowForeignVoice(cb.checked);
      App.refreshAll();
      render();
    });
    tr.appendChild(cb);
    tr.appendChild(document.createTextNode(
      "Use a non-Irish voice as a stand-in where nothing else is available. The pronunciation will be wrong; this is for checking the app works, not for learners."));
    p.appendChild(tr);

    const row = UI.el("div", "btn-row");
    const toggle = UI.el("button", "btn ghost", recOpen ? "FOLAIGH" : "RECORD CARDS");
    toggle.addEventListener("click", function () { recOpen = !recOpen; render(); });
    row.appendChild(toggle);

    if (recorded) {
      const exp = UI.el("button", "btn ghost", "EXPORT CLIPS");
      exp.addEventListener("click", function () {
        Fuaim.exportClips().then(function (n) {
          alert(n + " clips downloaded. Put them in an audio/ folder in the repo and add audioFile: \"audio/<id>.webm\" to those cards to ship them with the app.");
        });
      });
      row.appendChild(exp);
    }
    p.appendChild(row);

    if (recOpen) p.appendChild(recorderList());
    return p;
  }

  function recorderList() {
    const wrap = UI.el("div", "rec-scroll");
    wrap.style.marginTop = "14px";

    CARDS.forEach(function (card) {
      const row = UI.el("div", "rec-row");

      row.appendChild(Fuaim.button(card, { small: true }));

      const txt = UI.el("div", "txt");
      txt.appendChild(UI.el("span", "ga", card.ga));
      txt.appendChild(UI.el("span", "en", card.en));
      row.appendChild(txt);

      const src = Fuaim.sourceFor(card);
      const check = Fuaim.canRecord();

      const rec = UI.el("button", "btn ghost sm", src === "recording" ? "REDO" : "RECORD");
      if (!check.ok) rec.disabled = true;
      rec.addEventListener("click", function () {
        if (Fuaim.isRecording()) {
          Fuaim.stopRecording(card.id).then(function () { render(); })
            .catch(function (e) { alert(e.message); render(); });
          return;
        }
        Fuaim.startRecording().then(function () {
          rec.textContent = "STOP";
          rec.classList.add("burg");
          rec.classList.remove("ghost");
        }).catch(function (e) { alert(e.message); });
      });
      row.appendChild(rec);

      if (src === "recording") {
        const del = UI.el("button", "btn ghost sm", "DELETE");
        del.addEventListener("click", function () {
          Fuaim.deleteClip(card.id).then(render);
        });
        row.appendChild(del);
      }

      wrap.appendChild(row);
    });

    return wrap;
  }

  /* ------------------------------------------------- content review queue -- */

  /* Not a learner feature. This is the sign-off list: every card the generator
     was not confident about, in one place, so review is a sitting rather than
     a hunt through the data file. */
  function reviewPanel() {
    const p = UI.el("div", "panel");
    p.appendChild(UI.el("h2", null, "LE SEICEÁIL / CONTENT REVIEW"));

    const flagged = CARDS.filter(function (c) { return c.flag === "UNCERTAIN"; });
    p.appendChild(UI.el("div", "sub",
      "The " + CARDS.length + " phrases are a generated draft and have not been through your review. "
      + flagged.length + " carry a specific doubt worth settling first — the rest need a read for dialect. "
      + "Set CARD_SET.reviewed = true in data/cards.js when you have signed off."));

    if (!flagged.length) {
      p.appendChild(UI.el("div", "empty", "No cards flagged."));
      return p;
    }

    const ul = UI.el("ul", "review-list");
    flagged.forEach(function (c) {
      const li = UI.el("li");
      li.appendChild(UI.el("span", "ga", c.ga));
      li.appendChild(document.createTextNode("  —  " + c.en));
      li.appendChild(UI.el("span", "why", c.flagNote || ""));
      ul.appendChild(li);
    });
    p.appendChild(ul);
    return p;
  }

  /* ----------------------------------------------------------------- data -- */

  function dataPanel() {
    const p = UI.el("div", "panel");
    p.appendChild(UI.el("h2", null, "SONRAÍ / DATA"));
    p.appendChild(UI.el("div", "sub",
      "Progress lives in this browser's localStorage only. Nothing leaves the device."));

    const row = UI.el("div", "btn-row");

    const exp = UI.el("button", "btn ghost", "EXPORT");
    exp.addEventListener("click", function () {
      const blob = new Blob([Store.exportJSON()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "gaeilge-progress.json";
      a.click();
      URL.revokeObjectURL(a.href);
    });
    row.appendChild(exp);

    const res = UI.el("button", "btn ghost", "RESET");
    res.addEventListener("click", function () {
      if (confirm("Delete all progress and weak-tag data on this device?")) {
        Store.reset();
        Engine.clearSession();
        App.refreshAll();
        render();
      }
    });
    row.appendChild(res);

    p.appendChild(row);
    return p;
  }

  return { mount: mount, refresh: refresh };
})();
