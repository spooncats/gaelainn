# Gaelainn — Corca Dhuibhne (pilot v1)

A local-first Irish practice app built around generative themes and problem-posing
rather than fixed decks and grammar drills. Munster Irish, Corca Dhuibhne variety.

**The seed content is placeholder and unreviewed.** It is not to go near learners
until every phrase has been checked. See *Content review* below.

## Running it

Open `index.html`. No build, no server, no dependencies.

For GitHub Pages: push this folder to a repo, enable Pages on the branch, done —
same shape as Hafıza. Note that the Google Fonts link needs a network connection;
without one it falls back to Georgia and a narrow sans, which is legible but not
the house style. If you want it fully offline on the iPad like Hafıza, swap the
`<link>` in `index.html` for base64-embedded woff2 files.

## Layout

```
index.html          shell, nav, script order
css/style.css       Hafıza's paper palette, green as the primary accent
data/cards.js       ALL card content. The only file you edit for content.
js/store.js         localStorage persistence
js/engine.js        SRS + error weighting + card selection    <- the core
js/fuaim.js         audio: recordings, IndexedDB, TTS fallback
js/ui.js            shared rendering helpers
js/flashcards.js    Module A
js/minigh.js        Module B
js/dashboard.js     weak points, content review, recording
js/app.js           routing, boot
```

Script and stylesheet tags carry a `?v=` cache-buster. **Bump it whenever you
deploy** — otherwise a returning learner's browser pairs new HTML with cached JS
and the app half-loads silently. This bit me while building it.

## The data model

There are **no decks**. A card carries two independent tag categories:

```js
{
  id: "cd-024",
  ga: "Bhíomar ag an dtrá inné.",
  en: "We were at the beach yesterday.",
  themeTags:   ["place", "travel"],
  grammarTags: ["synthetic-verb-form", "past-tense", "dative-after-an"],
  dialectNote: "...",          // optional, where Munster differs from the Caighdeán
  note:        "...",          // optional
  model:       "...",          // model circumlocution for Mínigh É
  flag: "UNCERTAIN",           // optional
  flagNote:    "..."           // what specifically is uncertain
}
```

`themeTags` and `grammarTags` are never merged, in the data or in the store — the
Dashboard, the filter bar and the tag-error store all keep the two apart. Every
mode selects cards by tag combination (themes OR'd, grammar OR'd, the two AND'd),
never by membership of a list.

Adding a new tag anywhere in `cards.js` makes it filterable and rankable
automatically; nothing else needs touching.

**One deviation from your brief worth knowing about:** you gave
`"tá-present-copula"` as an example grammar tag. I split it into `tá-present` and
`copula-is`, because the substantive verb and the copula are the exact contrast
several of these cards exist to teach (`Is múinteoir mé` vs `tá mé i mo mhúinteoir`),
and one tag would have hidden which of the two a learner is actually failing at.
If you'd rather have it your way it's a find-and-replace in `cards.js` and nowhere
else.

## The error-weighting engine

This is the part to scrutinise. All of it is in `js/engine.js`.

A wrong answer increments an error weight on **every tag the card carries**, theme
and grammar alike, not just on the card. Tag error rates are then smoothed
(`errors / (attempts + 2)`) so one slip on a fresh tag doesn't rocket it to the top
of the ranking.

Card priority is:

```
dueness  +  1.8 x tagWeight  +  0.5 x ownErrorRate  +  jitter
```

- **dueness** — unseen card 1.0; due or overdue 1.5–2.5 rising with days overdue;
  not yet due 0–0.4, rising as its due date approaches. The deliberate part is that
  a not-yet-due card scores *above zero*: that headroom is what lets tag weight pull
  a card forward before the SRS would ask for it.
- **tagWeight** — `0.65 x worst tag + 0.35 x mean of tags`. Weighted towards the
  worst tag so that a card which is the learner's only exposure to a badly broken
  grammar point still surfaces.
- Net effect, which is verified behaviour and not just intent: with weather cards
  failed repeatedly and greetings cards passed, a fresh queue drawn when *nothing*
  is due comes back weather-heavy.

Tuning lives in the `W` constants at the top of `engine.js`. Change it there.

### Adding a third mode later

Every mode goes through exactly two calls:

```js
Engine.queue({ themes, grammar, limit, source, requireModel })  // -> ordered cards
Engine.record({ cardId, quality, source })                      // -> writes everything
```

`quality` is `1` / `0.5` / `0` on a scale shared by all modes (flashcards uses only
1 and 0; Mínigh É uses all three). `record()` is the single write path — it updates
the card's Leitner box and due date, every tag's error weight, and the attempt log,
tagged with which mode it came from. A new mode adds a `source` string and no
scheduling or tagging logic at all.

### Multiplayer seam in Mínigh É

`Minigh.makeRound()` returns a DOM-free round object:

```js
{ card, taboo, seconds, roles: [{id, part}], source, resolve(quality) }
```

Solo is one describer. A two-player version passes two roles and
`source: "minigh-mp"`, renders its own view over the same object, and inherits card
selection and tagging unchanged. It is not built and nothing in v1 assumes one
player — see the header comment in `js/minigh.js`.

## Audio

Hafıza's approach — `speechSynthesis` with a `tr-TR` voice — doesn't transfer.
Every platform ships Turkish; almost none ship Irish. On the machine this was
built on, the browser offered 8 voices and **not one** was `ga-*`. Asking it for
Irish anyway doesn't fail, it reads Munster Irish in an English voice, which for
a Corca Dhuibhne app is worse than silence.

So a speaker button resolves in this order:

1. **A clip you recorded**, in IndexedDB on that device.
2. **A file shipped with the repo**, if the card declares `audioFile: "audio/cd-001.webm"`.
3. **Real Irish TTS**, only where the device genuinely has a `ga-*` voice.
4. **Nothing** — the button renders visibly inactive and its tooltip says why.

A card backed by your own voice shows a green speaker; TTS shows a plain one;
nothing available shows a faded one. The button never plays something other than
what it appears to promise.

**Recording** is on the Lagphointí tab under *Fuaim / Audio* — deliberately on the
teacher's side, not in the learner flow. Record straight onto the iPad, one card
at a time. Clips live in IndexedDB (not localStorage — audio blobs would blow the
5MB quota). *Export clips* downloads them all named by card id, so you can commit
them to an `audio/` folder and add `audioFile` to those cards to ship them with
the app instead of leaving them on one device.

Two things to know:

- **Recording needs a secure context.** It works on GitHub Pages and localhost.
  It does *not* work when you open `index.html` straight off the disk — the panel
  says so rather than throwing a bare permission error.
- There is an opt-in **stand-in voice** toggle, off by default, labelled as
  producing wrong pronunciation. It exists so you can check the app works on a
  device with no recordings. Don't leave it on for learners.

Verified end to end here except the microphone capture itself, which this machine
has no device for: the IndexedDB write, resolution order, green/plain/faded button
states, playback, delete, and the opt-in toggle were all exercised directly.

## Content review — the part that blocks the pilot

`data/cards.js` holds 24 phrases covering greetings, identity, basic needs,
weather and a little past tense. **Every one was generated, not sourced from a
native informant.** While `CARD_SET.reviewed === false` the masthead carries one
quiet line — "24 phrases, unreviewed draft" — linking to the review panel, and
individual doubtful cards get a small gold mark on reveal. Set `reviewed` to
`true` once you've signed off and both disappear. The disclosure is deliberately
understated rather than a warning box: it should read as a draft, not a scaffold,
but it shouldn't hide what it is either.

Two cards carry a specific `UNCERTAIN` flag and are listed together on the
Dashboard so review is one sitting rather than a hunt through the file:

- **cd-010 `Cá bhfuil tú id' chónaí?`** — Ó Sé documents a present `fuileann` in
  Corca Dhuibhne. I don't know whether `Cá bhfuileann tú id' chónaí?` is the more
  idiomatic local form in this construction. Your call.
- **cd-018 `Ní fheadar`** — confident it's Munster, not confident how to gloss its
  range for a beginner (flat "I don't know" vs "I wonder").

Forms I've deliberately used as Munster markers, all of which need your eye:
`táim` / `táimid` / `bhíomar` (synthetic), `taoi`, `dhuit`, `cad`, `Gaelainn` (not
Gaeilge), `ag cur fearthainne` (not báistí), `ní fheadar`, `más é do thoil é`,
`ag an dtrá` (t-prefix after the article), `id' chónaí`, `ná` for `nach` in the
model descriptions.

Also worth a decision from you rather than from me: `Conas taoi?` vs `Conas tánn
tú?` as the one the learners actually get first.

## Not in this pass

Multiplayer, exam prep, any of the other games, accounts, backend, monetization.

From your activity bank, the mechanics that would port most cleanly onto this
engine when you're ready — noted, not built:

- **Bounty Board** — your note says it should sit in the corner of every game.
  It maps almost exactly onto the tag store: target tags visible with point
  values, lighting up when used. Would need a "produced correctly" signal, which
  neither current mode generates.
- **Ranking Game / Statement Attack** — need cards to carry a stance or a claim,
  which is a content-model addition, not an engine one.
- **Cultural Interpreter** — closest sibling to Mínigh É; could share the round
  object.
