/* ============================================================================
   APP — screen routing and boot.
   ============================================================================ */

const App = (function () {

  const SCREENS = {
    flashcards: { module: Flashcards, el: null, btn: null, mounted: false },
    minigh:     { module: Minigh,     el: null, btn: null, mounted: false },
    dashboard:  { module: Dashboard,  el: null, btn: null, mounted: false }
  };

  let currentName = null;

  function go(name) {
    if (!SCREENS[name]) return;

    if (currentName && SCREENS[currentName].module.leave) {
      SCREENS[currentName].module.leave();
    }

    Object.keys(SCREENS).forEach(function (k) {
      const s = SCREENS[k];
      s.el.classList.toggle("active", k === name);
      s.btn.classList.toggle("active", k === name);
    });

    currentName = name;
    const s = SCREENS[name];
    if (!s.mounted) {
      s.module.mount(s.el);
      s.mounted = true;
    } else if (s.module.refresh) {
      s.module.refresh();
    }
  }

  function refreshAll() {
    Object.keys(SCREENS).forEach(function (k) {
      const s = SCREENS[k];
      if (s.mounted && s.module.refresh) s.module.refresh();
    });
  }

  function boot() {
    Object.keys(SCREENS).forEach(function (k) {
      SCREENS[k].el = document.getElementById("screen-" + k);
      SCREENS[k].btn = document.getElementById("nav-" + k);
      SCREENS[k].btn.addEventListener("click", function () { go(k); });
    });

    /* Review status is one quiet line under the masthead. The full explanation
       lives on the Lagphointí tab, one tap away — a pilot tool shouldn't open
       with a warning box, but it shouldn't hide the state of its content
       either. Driven by the data file: set CARD_SET.reviewed = true and the
       line changes by itself. */
    const line = document.getElementById("statusLine");
    if (CARD_SET.reviewed) {
      line.appendChild(document.createTextNode(CARDS.length + " phrases, reviewed"));
    } else {
      const dot = document.createElement("span");
      dot.className = "dot";
      line.appendChild(dot);
      line.appendChild(document.createTextNode(CARDS.length + " phrases, unreviewed draft — "));
      const a = document.createElement("a");
      a.textContent = "review notes";
      a.addEventListener("click", function () { go("dashboard"); });
      line.appendChild(a);
    }

    Fuaim.preload().then(function () { refreshAll(); });

    go("flashcards");
  }

  return { go: go, refreshAll: refreshAll, boot: boot };
})();

document.addEventListener("DOMContentLoaded", App.boot);
