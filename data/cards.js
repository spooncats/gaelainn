/* ============================================================================
   GAEILGE CHORCA DHUIBHNE — SEED CARD SET

   >>> STATUS: PLACEHOLDER. NOT REVIEWED. NOT FOR LEARNERS. <<<

   Every phrase below was generated, not sourced from a native informant.
   Ciara reviews and signs off on each one before this goes near a pilot group.
   The app displays a persistent PLACEHOLDER banner while
   CARD_SET.reviewed === false. Set it to true only after review.

   Target variety: Munster Irish, Corca Dhuibhne (West Kerry) — NOT An
   Caighdeán Oifigiúil. Reference grammar: Diarmuid Ó Sé, "Gaeilge Chorca
   Dhuibhne" (2000).

   FLAGGING CONVENTION
   -------------------
   flag: "UNCERTAIN"  — I am not confident this form is the Corca Dhuibhne
                        one, or not confident it is preferred over the
                        Caighdeán form. flagNote says exactly what the doubt
                        is. These render with a marker in the UI and are
                        listed together on the Dashboard for review.
   No flag             — I am reasonably confident, but it still needs your eye.

   FIELD REFERENCE
   ---------------
   id           stable string id. Never reuse an id — learner progress is keyed
                to it. Safe to add, risky to renumber.
   ga           Irish text, Munster/Corca Dhuibhne form.
   en           English gloss.
   themeTags    generative-theme tags. A card may carry several.
   grammarTags  form-focused tags. SEPARATE category — never merged with themes.
   dialectNote  how the Munster form differs from the Caighdeán, where that
                difference is worth teaching explicitly.
   note         anything else (register, usage, pragmatics).
   model        model circumlocution for Mínigh É, in Irish, which must NOT
                contain the target word or phrase.
   flag         "UNCERTAIN" or absent.
   flagNote     what specifically is uncertain.

   TO BULK-EDIT: this file only. Nothing in js/ hardcodes card content.
   ============================================================================ */

const CARD_SET = {
  reviewed: false,
  label: "PLACEHOLDER SEED SET — awaiting dialect review",
  variety: "Gaeilge Chorca Dhuibhne (Munster)",
  reference: "Diarmuid Ó Sé, Gaeilge Chorca Dhuibhne"
};

const CARDS = [

  /* ---------------------------------------------------------------- BEANNÚ */
  {
    id: "cd-001",
    ga: "Dia dhuit.",
    en: "Hello. (lit. God to you)",
    themeTags: ["greetings"],
    grammarTags: ["fixed-formula", "prepositional-pronoun"],
    dialectNote: "Munster has 'dhuit' where the Caighdeán writes 'duit' — the lenited form reflects the West Kerry pronunciation. Worth teaching the contrast, since learners will meet 'duit' in every printed textbook.",
    note: "The standard opening. The expected reply is card cd-002, not a repetition.",
    model: "An chéad rud a deireann tú le duine nuair a bhuaileann tú leis ar an mbóthar. Tá ainm an Chruthaitheora sa bhfrása."
  },
  {
    id: "cd-002",
    ga: "Dia is Muire dhuit.",
    en: "Hello (reply). (lit. God and Mary to you)",
    themeTags: ["greetings"],
    grammarTags: ["fixed-formula", "prepositional-pronoun"],
    dialectNote: "Again 'dhuit' for Caighdeán 'duit'.",
    note: "Only ever used as the answer to cd-001. A third speaker joining may add 'is Pádraig'.",
    model: "An freagra a thugann tú ar an mbeannú tosaigh. Cuireann tú máthair Íosa leis an méid a dúirt an duine eile."
  },
  {
    id: "cd-003",
    ga: "Conas taoi?",
    en: "How are you?",
    themeTags: ["greetings"],
    grammarTags: ["wh-question", "synthetic-verb-form", "tá-present"],
    dialectNote: "'Taoi' is the Munster synthetic 2sg present of 'bí'. The Caighdeán has only the analytic 'Conas atá tú?'. This is one of the clearest Munster markers in everyday speech.",
    note: "'Conas tánn tú?' is also heard in Corca Dhuibhne and is arguably more common in casual speech than 'taoi'.",
    model: "An cheist a chuireann tú ar dhuine díreach tar éis an bheannaithe, chun a fháil amach an bhfuil sé go maith nó go dona."
  },
  {
    id: "cd-004",
    ga: "Táim go maith, go raibh maith agat.",
    en: "I'm well, thank you.",
    themeTags: ["greetings"],
    grammarTags: ["synthetic-verb-form", "tá-present", "prepositional-pronoun"],
    dialectNote: "'Táim' (synthetic) rather than 'tá mé'. Munster strongly prefers the synthetic 1sg here; 'tá mé' sounds Connacht/Ulster or bookish.",
    note: "",
    model: "An freagra dearfach a thugann tú nuair a fhiafraítear díot conas atá an saol agat, agus buíochas ina dhiaidh."
  },
  {
    id: "cd-005",
    ga: "Slán agat.",
    en: "Goodbye. (said by the one leaving)",
    themeTags: ["greetings"],
    grammarTags: ["fixed-formula", "prepositional-pronoun"],
    dialectNote: "",
    note: "The person LEAVING says 'Slán agat'; the person STAYING says 'Slán leat'. Learners reliably get this backwards — possibly worth an explicit contrast pair in class.",
    model: "An rud a deireann an duine atá ag imeacht leis an duine atá ag fanacht sa tigh."
  },

  /* -------------------------------------------------------------- AITHEANTAS */
  {
    id: "cd-006",
    ga: "Cad is ainm dhuit?",
    en: "What is your name?",
    themeTags: ["identity", "greetings"],
    grammarTags: ["wh-question", "copula-is", "prepositional-pronoun"],
    dialectNote: "Munster uses 'cad' where Connacht uses 'céard' and Ulster 'caidé'. Also 'dhuit' for 'duit'.",
    note: "",
    model: "An cheist a chuireann tú ar strainséir chun a fháil amach conas a ghlaotar air."
  },
  {
    id: "cd-007",
    ga: "Séamas is ainm dom.",
    en: "My name is Séamas.",
    themeTags: ["identity"],
    grammarTags: ["copula-is", "prepositional-pronoun"],
    dialectNote: "",
    note: "Fronting the name is the natural order. Swap in the learner's own name when using this card in class.",
    model: "An freagra a thugann tú nuair a fhiafraítear díot cad a thugtar ort. Cuireann tú an focal atá agat ó do thuismitheoirí ar dtús."
  },
  {
    id: "cd-008",
    ga: "Is as Corca Dhuibhne mé.",
    en: "I'm from Corca Dhuibhne / the Dingle Peninsula.",
    themeTags: ["identity", "place"],
    grammarTags: ["copula-is"],
    dialectNote: "",
    note: "Copula of origin. Substitute any placename; useful as a frame rather than a fixed item.",
    model: "An tslí ina n-insíonn tú do dhuine cén áit inar rugadh agus inar tógadh tú."
  },
  {
    id: "cd-009",
    ga: "Is múinteoir mé.",
    en: "I'm a teacher.",
    themeTags: ["identity", "work"],
    grammarTags: ["copula-is"],
    dialectNote: "",
    note: "Classification with the copula, as against 'tá mé i mo mhúinteoir' which frames it as a current role rather than an identity. The contrast is a good problem-posing prompt: which one would you use about yourself, and why?",
    model: "An tslí ina n-insíonn tú do dhuine cén sórt oibre a dheineann tú, agus tú ag obair le páistí i scoil."
  },
  {
    id: "cd-010",
    ga: "Cá bhfuil tú id' chónaí?",
    en: "Where do you live?",
    themeTags: ["identity", "place"],
    grammarTags: ["wh-question", "tá-present"],
    dialectNote: "'id' chónaí' is the Munster contraction of 'i do chónaí'. The Caighdeán writes it in full.",
    note: "",
    model: "An cheist a chuireann tú chun eolas a fháil ar an mbaile nó ar an áit ina gcodlaíonn duine gach oíche.",
    flag: "UNCERTAIN",
    flagNote: "Ó Sé documents a present form 'fuileann' in Corca Dhuibhne (e.g. 'an bhfuileann tú?'). I am not confident whether 'Cá bhfuileann tú id' chónaí?' is the more idiomatic local form here, or whether 'Cá bhfuil' is normal in this construction. Please decide which one the learners get."
  },
  {
    id: "cd-011",
    ga: "Táim ag foghlaim na Gaelainne.",
    en: "I'm learning Irish.",
    themeTags: ["identity", "learning"],
    grammarTags: ["synthetic-verb-form", "ag+VN-progressive", "genitive"],
    dialectNote: "MUNSTER MARKER: 'Gaelainn' is the Corca Dhuibhne word for the language; 'Gaeilge' is the Caighdeán (and Connacht) form. Genitive 'na Gaelainne'. This one is worth teaching explicitly on day one — it tells learners immediately which Irish they are in.",
    note: "",
    model: "An rud a deireann tú faoi féin agus tú ag freastal ar rang chun teanga na tíre seo a phiocadh suas."
  },

  /* ----------------------------------------------------------------- RIACHTANAIS */
  {
    id: "cd-012",
    ga: "Tá ocras orm.",
    en: "I'm hungry. (lit. hunger is on me)",
    themeTags: ["needs", "body"],
    grammarTags: ["tá-present", "prepositional-pronoun"],
    dialectNote: "",
    note: "The 'state as a thing sitting on you' pattern. Once learners have this frame they get tart, tuirse, deifir, brón, áthas free — good candidate for a generative-theme cluster rather than isolated items.",
    model: "An rud a bhíonn ort nuair ná fuil aon rud ite agat ó mhaidin, agus teastaíonn bia uait go géar."
  },
  {
    id: "cd-013",
    ga: "Tá tart orm.",
    en: "I'm thirsty. (lit. thirst is on me)",
    themeTags: ["needs", "body"],
    grammarTags: ["tá-present", "prepositional-pronoun"],
    dialectNote: "",
    note: "Same frame as cd-012.",
    model: "An rud a bhíonn ort tar éis siúlóid fhada faoin ngrian, agus gloine uisce uait."
  },
  {
    id: "cd-014",
    ga: "Tá deifir orm.",
    en: "I'm in a hurry. (lit. hurry is on me)",
    themeTags: ["needs", "time"],
    grammarTags: ["tá-present", "prepositional-pronoun"],
    dialectNote: "",
    note: "Same frame again. Munster also has 'tá práinn orm' in some registers.",
    model: "An rud a bhíonn ort nuair ná fuil aon nóiméad agat chun cainte, mar go gcaithfidh tú a bheith in áit eile láithreach."
  },
  {
    id: "cd-015",
    ga: "Cá bhfuil an leithreas, más é do thoil é?",
    en: "Where is the toilet, please?",
    themeTags: ["needs", "place"],
    grammarTags: ["wh-question", "tá-present", "fixed-formula"],
    dialectNote: "Munster commonly uses the full 'más é do thoil é' where the Caighdeán and other dialects shorten to 'le do thoil'.",
    note: "",
    model: "An cheist a chuireann tú i dtigh tábhairne nuair a theastaíonn uait an seomra beag a aimsiú."
  },
  {
    id: "cd-016",
    ga: "Gabh mo leithscéal.",
    en: "Excuse me. / Sorry.",
    themeTags: ["needs", "greetings"],
    grammarTags: ["fixed-formula", "imperative"],
    dialectNote: "",
    note: "Both for getting attention and for apologising, as in English.",
    model: "An rud a deireann tú sula gcuireann tú isteach ar chomhrá duine eile, nó nuair a bhuaileann tú i gcoinne duine sa tsráid."
  },
  {
    id: "cd-017",
    ga: "Ní thuigim.",
    en: "I don't understand.",
    themeTags: ["needs", "learning"],
    grammarTags: ["synthetic-verb-form", "negative-form"],
    dialectNote: "Synthetic 1sg 'thuigim' rather than 'ní thuigeann mé'.",
    note: "Arguably the single most useful phrase in the set for a beginner. Consider front-loading it.",
    model: "An rud a deireann tú nuair a labhrann duine ró-thapaidh agus ná fuil aon tuairim agat cad tá á rá aige."
  },
  {
    id: "cd-018",
    ga: "Ní fheadar.",
    en: "I don't know. / I wonder.",
    themeTags: ["needs", "learning"],
    grammarTags: ["negative-form", "synthetic-verb-form"],
    dialectNote: "MUNSTER MARKER: 'ní fheadar' is characteristically Munster where other dialects say 'níl a fhios agam'. Carries a shade of 'I wonder' as well as flat 'I don't know'.",
    note: "",
    model: "An rud a deireann tú nuair a chuirtear ceist ort agus ná fuil an freagra agat in aon chor.",
    flag: "UNCERTAIN",
    flagNote: "Confident that 'ní fheadar' is Munster. Less confident about how a beginner should be taught its range — in Corca Dhuibhne does it read as neutral 'I don't know', or does it lean towards 'I wonder' enough that a learner would misuse it? Your call on the gloss."
  },

  /* --------------------------------------------------------------------- AIMSIR */
  {
    id: "cd-019",
    ga: "Tá sé ag cur fearthainne.",
    en: "It's raining.",
    themeTags: ["weather"],
    grammarTags: ["tá-present", "ag+VN-progressive", "genitive"],
    dialectNote: "MUNSTER MARKER: 'fearthainn' is the Munster word for rain; the Caighdeán/Connacht form is 'ag cur báistí'. Both will be understood, but 'fearthainne' is the local form.",
    note: "",
    model: "An rud a deireann tú nuair a thagann uisce anuas ón spéir agus a chaitheann tú do chóta a chur ort."
  },
  {
    id: "cd-020",
    ga: "Tá sé fuar amuigh inniu.",
    en: "It's cold out today.",
    themeTags: ["weather"],
    grammarTags: ["tá-present"],
    dialectNote: "",
    note: "",
    model: "An rud a deireann tú i mí Eanáir nuair a chaitheann tú do lámha a chur i do phócaí chomh luath is a fhágann tú an tigh."
  },
  {
    id: "cd-021",
    ga: "Tá an ghrian ag taitneamh.",
    en: "The sun is shining.",
    themeTags: ["weather"],
    grammarTags: ["tá-present", "ag+VN-progressive"],
    dialectNote: "",
    note: "",
    model: "An rud a deireann tú nuair a bhíonn an spéir glan agus solas te ag teacht anuas ort."
  },
  {
    id: "cd-022",
    ga: "Aimsir bhreá, buíochas le Dia.",
    en: "Fine weather, thank God.",
    themeTags: ["weather", "greetings"],
    grammarTags: ["fixed-formula", "lenition-after-fem-noun"],
    dialectNote: "",
    note: "Weather talk as social ritual rather than information — a good problem-posing hook: what does a community talk about when it is not talking about anything?",
    model: "An rud a deireann seanfhear leat ag an bpost nuair atá an lá go hálainn, agus a chuireann sé altú beag leis."
  },

  /* ------------------------------------------------------- SIÚL / AN AIMSIR CHAITE */
  {
    id: "cd-023",
    ga: "Táimid ag dul go dtí an Daingean.",
    en: "We're going to Dingle.",
    themeTags: ["place", "travel"],
    grammarTags: ["synthetic-verb-form", "ag+VN-progressive"],
    dialectNote: "'Táimid' (synthetic 1pl) rather than 'tá muid'. Munster does not use 'tá muid'.",
    note: "The town's full official name is Daingean Uí Chúis; 'an Daingean' is what people say.",
    model: "An rud a deireann tú agus tú féin agus do chairde ag tabhairt aghaidh ar an mbaile mór is mó ar an leithinis seo."
  },
  {
    id: "cd-024",
    ga: "Bhíomar ag an dtrá inné.",
    en: "We were at the beach yesterday.",
    themeTags: ["place", "travel"],
    grammarTags: ["synthetic-verb-form", "past-tense", "dative-after-an"],
    dialectNote: "Two Munster features in one short sentence: synthetic past 1pl 'bhíomar' (not 'bhí muid'), and the t-prefix in 'ag an dtrá' after the article — a hallmark of Munster which the Caighdeán does not write.",
    note: "Probably the highest-value single card in the set for showing learners what dialect actually means.",
    model: "An rud a deireann tú faoi lá a chaith sibh cois farraige, áit a bhfuil gaineamh agus tonnta, agus é imithe tharainn cheana féin."
  }

];

/* Sanity: ids must be unique. Fails loudly in the console during editing
   rather than silently corrupting progress keyed to a duplicated id. */
(function checkIds() {
  const seen = new Set();
  for (const c of CARDS) {
    if (seen.has(c.id)) console.error("Duplicate card id in cards.js:", c.id);
    seen.add(c.id);
  }
})();
