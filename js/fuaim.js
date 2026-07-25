/* ============================================================================
   FUAIM — audio.

   Named Fuaim rather than Audio so it doesn't shadow window.Audio.

   THE PROBLEM THIS SOLVES
   -----------------------
   Hafıza uses the Web Speech API with a Turkish voice, which works because
   every platform ships tr-TR. Almost none ship ga-IE. If you ask
   speechSynthesis for Irish on an iPad it does not fail — it quietly reads the
   Irish with an English voice, which for a Corca Dhuibhne app produces
   confidently wrong pronunciation. That is worse than silence.

   So the resolution order for any card is:

     1. A clip Ciara recorded herself, stored in IndexedDB on this device.
     2. A file shipped with the repo, if the card declares `audioFile`.
     3. Real Irish TTS — only if the device genuinely has a ga-* voice.
     4. Nothing. The button shows as unavailable and says why.

   Step 4 is deliberate. There is an opt-in override on the Dashboard for using
   a non-Irish voice as a stand-in, off by default and labelled as wrong.
   ============================================================================ */

const Fuaim = (function () {

  const DB_NAME = "gaeilge-audio";
  const STORE = "clips";
  const PREF_KEY = "gaeilge.audio.allowForeignVoice";

  let db = null;
  let gaVoice = null;
  let anyVoice = null;
  let primed = false;
  let currentEl = null;
  let recorder = null;
  let recChunks = [];
  const clipCache = {};          // cardId -> objectURL | null (null = known absent)

  /* ------------------------------------------------------------ IndexedDB -- */

  function openDB() {
    if (db) return Promise.resolve(db);
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error("no indexedDB")); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
      };
      req.onsuccess = function () { db = req.result; resolve(db); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idbPut(key, blob) {
    return openDB().then(function (d) {
      return new Promise(function (resolve, reject) {
        const tx = d.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(blob, key);
        tx.oncomplete = resolve;
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function idbGet(key) {
    return openDB().then(function (d) {
      return new Promise(function (resolve, reject) {
        const tx = d.transaction(STORE, "readonly");
        const r = tx.objectStore(STORE).get(key);
        r.onsuccess = function () { resolve(r.result || null); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }

  function idbDel(key) {
    return openDB().then(function (d) {
      return new Promise(function (resolve) {
        const tx = d.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = resolve;
      });
    });
  }

  function idbKeys() {
    return openDB().then(function (d) {
      return new Promise(function (resolve) {
        const tx = d.transaction(STORE, "readonly");
        const r = tx.objectStore(STORE).getAllKeys();
        r.onsuccess = function () { resolve(r.result || []); };
        r.onerror = function () { resolve([]); };
      });
    }).catch(function () { return []; });
  }

  /* ----------------------------------------------------------------- voice -- */

  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const vs = speechSynthesis.getVoices();
    // "ga" is Irish. Guard against "gl" (Galician) and "gu" (Gujarati).
    gaVoice = vs.find(function (v) {
      const l = (v.lang || "").toLowerCase();
      return l === "ga" || l.indexOf("ga-") === 0 || l.indexOf("ga_") === 0;
    }) || null;
    anyVoice = vs.find(function (v) {
      return (v.lang || "").toLowerCase().indexOf("en") === 0;
    }) || vs[0] || null;
  }

  if ("speechSynthesis" in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  /* iOS blocks speech and audio until a user gesture; prime on the first tap. */
  function prime() {
    if (primed) return;
    primed = true;
    if ("speechSynthesis" in window) {
      try {
        const u = new SpeechSynthesisUtterance("");
        u.volume = 0;
        speechSynthesis.speak(u);
      } catch (e) {}
    }
  }
  document.addEventListener("touchstart", prime, { once: true, passive: true });
  document.addEventListener("click", prime, { once: true });

  function allowForeignVoice() {
    return localStorage.getItem(PREF_KEY) === "1";
  }
  function setAllowForeignVoice(on) {
    localStorage.setItem(PREF_KEY, on ? "1" : "0");
  }

  function hasIrishVoice() { return !!gaVoice; }

  /* ------------------------------------------------------------ resolution -- */

  /* What would play for this card, without playing it.
     -> "recording" | "file" | "tts" | "foreign" | "none"   */
  function sourceFor(card) {
    if (clipCache[card.id]) return "recording";
    if (card.audioFile) return "file";
    if (gaVoice) return "tts";
    if (allowForeignVoice() && anyVoice) return "foreign";
    return "none";
  }

  /* Warm the cache so buttons can render their state synchronously. */
  function preload() {
    return idbKeys().then(function (keys) {
      const set = {};
      keys.forEach(function (k) { set[k] = true; });
      return Promise.all(CARDS.map(function (c) {
        if (!set[c.id]) { clipCache[c.id] = null; return null; }
        return idbGet(c.id).then(function (blob) {
          clipCache[c.id] = blob ? URL.createObjectURL(blob) : null;
        });
      }));
    }).catch(function () { /* no IDB: everything falls through to TTS */ });
  }

  /* --------------------------------------------------------------- playing -- */

  function stop() {
    if (currentEl) { currentEl.pause(); currentEl = null; }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  function playURL(url) {
    stop();
    const el = new window.Audio(url);
    currentEl = el;
    el.play().catch(function () {});
    return true;
  }

  function speakText(text, voice) {
    if (!("speechSynthesis" in window)) return false;
    stop();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice === gaVoice ? "ga-IE" : (voice && voice.lang) || "en-IE";
    if (voice) u.voice = voice;
    u.rate = 0.9;
    speechSynthesis.speak(u);
    return true;
  }

  /* Play whatever this card has. Returns the source that was used. */
  function play(card) {
    prime();
    const src = sourceFor(card);
    if (src === "recording") { playURL(clipCache[card.id]); return src; }
    if (src === "file") { playURL(card.audioFile); return src; }
    if (src === "tts") { speakText(card.ga, gaVoice); return src; }
    if (src === "foreign") { speakText(card.ga, anyVoice); return src; }
    return "none";
  }

  /* --------------------------------------------------------------- recording -- */

  /* getUserMedia needs a secure context. GitHub Pages (https) and localhost are
     fine; opening index.html straight off the disk is not, and we say so rather
     than failing with a bare permission error. */
  function canRecord() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { ok: false, why: "This browser has no microphone API." };
    }
    if (!window.isSecureContext) {
      return {
        ok: false,
        why: "Recording needs a secure context. It works on GitHub Pages or localhost, but not when index.html is opened directly from the disk."
      };
    }
    if (typeof MediaRecorder === "undefined") {
      return { ok: false, why: "This browser has no MediaRecorder." };
    }
    return { ok: true };
  }

  function startRecording() {
    const check = canRecord();
    if (!check.ok) return Promise.reject(new Error(check.why));
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      recChunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = function (e) { if (e.data.size) recChunks.push(e.data); };
      recorder.start();
      return true;
    });
  }

  function stopRecording(cardId) {
    return new Promise(function (resolve, reject) {
      if (!recorder) { reject(new Error("not recording")); return; }
      recorder.onstop = function () {
        const blob = new Blob(recChunks, { type: recorder.mimeType || "audio/webm" });
        recorder.stream.getTracks().forEach(function (t) { t.stop(); });
        recorder = null;
        idbPut(cardId, blob).then(function () {
          if (clipCache[cardId]) URL.revokeObjectURL(clipCache[cardId]);
          clipCache[cardId] = URL.createObjectURL(blob);
          resolve(blob);
        }).catch(reject);
      };
      recorder.stop();
    });
  }

  function isRecording() { return !!recorder; }

  function deleteClip(cardId) {
    return idbDel(cardId).then(function () {
      if (clipCache[cardId]) URL.revokeObjectURL(clipCache[cardId]);
      clipCache[cardId] = null;
    });
  }

  function recordedCount() {
    let n = 0;
    Object.keys(clipCache).forEach(function (k) { if (clipCache[k]) n += 1; });
    return n;
  }

  /* Download every clip, named by card id, so they can be committed to the
     repo's audio/ folder and declared with `audioFile` in cards.js. */
  function exportClips() {
    return idbKeys().then(function (keys) {
      return keys.reduce(function (chain, k) {
        return chain.then(function () {
          return idbGet(k).then(function (blob) {
            if (!blob) return;
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = k + ".webm";
            a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
            return new Promise(function (r) { setTimeout(r, 350); });
          });
        });
      }, Promise.resolve()).then(function () { return keys.length; });
    });
  }

  /* ------------------------------------------------------------------- UI -- */

  /* Speaker button. Renders its own availability: a card with no audio at all
     gets a visibly inactive button with a tooltip, not a button that lies. */
  function button(card, opts) {
    opts = opts || {};
    const b = document.createElement("button");
    b.className = "spk" + (opts.small ? " sm" : "");
    b.type = "button";
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z"/>' +
      '<path class="wave1" d="M15.2 9.1a4 4 0 0 1 0 5.8"/>' +
      '<path class="wave2" d="M17.8 6.4a7.6 7.6 0 0 1 0 11.2"/>' +
      '</svg>';

    function paint() {
      const src = sourceFor(card);
      b.classList.toggle("has-rec", src === "recording" || src === "file");
      b.classList.toggle("off", src === "none");
      b.setAttribute("aria-label", "Éist / listen");
      b.title =
        src === "recording" ? "Your recording" :
        src === "file" ? "Recorded audio" :
        src === "tts" ? "Irish synthetic voice on this device" :
        src === "foreign" ? "STAND-IN VOICE — not Irish, pronunciation will be wrong" :
        "No Irish audio on this device. Record this card on the Lagphointí tab, or see the audio note there.";
    }
    paint();

    b.addEventListener("click", function (e) {
      e.stopPropagation();          // don't trigger the card's reveal-on-tap
      const used = play(card);
      if (used === "none") {
        b.classList.add("shake");
        setTimeout(function () { b.classList.remove("shake"); }, 400);
      }
    });

    b.refresh = paint;
    return b;
  }

  return {
    preload: preload,
    play: play,
    stop: stop,
    button: button,
    sourceFor: sourceFor,
    hasIrishVoice: hasIrishVoice,
    allowForeignVoice: allowForeignVoice,
    setAllowForeignVoice: setAllowForeignVoice,
    canRecord: canRecord,
    startRecording: startRecording,
    stopRecording: stopRecording,
    isRecording: isRecording,
    deleteClip: deleteClip,
    recordedCount: recordedCount,
    exportClips: exportClips
  };
})();
