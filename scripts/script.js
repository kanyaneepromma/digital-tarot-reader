// --- ETHEREAL AUDIO ENGINE ---
const AudioParams = {
  synth: null,
  noise: null,
  filter: null,
};

function initAudio() {
  if (!AudioParams.synth) {
    AudioParams.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 1.5 },
    }).toDestination();
    AudioParams.synth.volume.value = -12;

    AudioParams.noise = new Tone.Noise("brown").start();
    AudioParams.filter = new Tone.Filter(400, "lowpass").toDestination();
    AudioParams.noise.connect(AudioParams.filter);
    AudioParams.noise.volume.value = -Infinity; // Muted by default
  }
}

function playHoverSound() {
  if (!AudioParams.synth || Tone.context.state !== "running") return;
  AudioParams.synth.triggerAttackRelease("C6", "32n", "+0", 0.1);
}

function playDrawSound() {
  if (!AudioParams.synth) return;
  AudioParams.synth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n");
}

function playClickSound() {
  if (!AudioParams.synth) return;
  AudioParams.synth.triggerAttackRelease("G5", "16n");
  setTimeout(() => AudioParams.synth.triggerAttackRelease("C6", "16n"), 100);
}

function playShuffleSound() {
  if (!AudioParams.noise) return;

  // 3 Gentle Swooshes
  AudioParams.noise.volume.rampTo(-10, 0.1);
  AudioParams.noise.volume.rampTo(-Infinity, 0.4, "+0.1");

  setTimeout(() => {
    AudioParams.noise.volume.rampTo(-10, 0.1);
    AudioParams.noise.volume.rampTo(-Infinity, 0.4, "+0.1");
  }, 300);

  setTimeout(() => {
    AudioParams.noise.volume.rampTo(-10, 0.1);
    AudioParams.noise.volume.rampTo(-Infinity, 0.5, "+0.1");
  }, 600);

  // Magical Harp Glissando
  const now = Tone.now();
  const notes = ["C4", "E4", "G4", "C5", "E5"];
  notes.forEach((note, i) => {
    AudioParams.synth.triggerAttackRelease(note, "8n", now + i * 0.15);
  });
}

// Require user interaction to start audio (browser policy)
document.body.addEventListener(
  "click",
  async () => {
    await Tone.start();
    initAudio();
  },
  { once: true },
);

// --- BILINGUAL ENGINE ---
let currentLang = "en";

const translations = {
  en: {
    title: "✧ DIGITAL TAROT ✧",
    spread: "Spread",
    status: "Status",
    focus: "Focus",
    customPlaceholder: "Type your question...",
    set: "Set",
    modern: "MODERN",
    classic: "CLASSIC",
    historyBtn: "History",
    shuffleBtn: "Shuffle",
    resetBtn: "Reset",
    summoning: "Summoning Ancient Visions",
    historyTitle: "Reading History",
    thDate: "Date & Time",
    thType: "Spread & Focus",
    thCards: "Cards Drawn",
    thSnap: "Records",
    thAction: "Action",
    noHistory: "No readings recorded yet.",
    snapshotTitle: "Spread Snapshot",
    revealBtn: "Reveal the Meaning",
    insightTitle: "Spiritual Insight",
    lockedStr: "Locked",
    drawnStr: "Drawn:",
    completeStr: "Reading Complete",
    waitStr: "Wait till",
    viewBtn: "View Image",
    readBtn: "Read",
    errStyleLock:
      "You can't change the deck mid-reading! Finish or Reset first.",
  },
  th: {
    title: "✧ ไพ่ทาโรต์ดิจิทัล ✧",
    spread: "รูปแบบไพ่",
    status: "สถานะ",
    focus: "คำถาม",
    customPlaceholder: "พิมพ์คำถามของคุณ...",
    set: "ตั้งค่า",
    modern: "สมัยใหม่",
    classic: "คลาสสิก",
    historyBtn: "ประวัติ",
    shuffleBtn: "สับไพ่",
    resetBtn: "เริ่มใหม่",
    summoning: "กำลังอัญเชิญไพ่โบราณ",
    historyTitle: "ประวัติการอ่านไพ่",
    thDate: "วันเวลา",
    thType: "รูปแบบ & คำถาม",
    thCards: "ไพ่ที่ได้",
    thSnap: "บันทึก",
    thAction: "ลบ",
    noHistory: "ยังไม่มีประวัติการอ่านไพ่",
    snapshotTitle: "ภาพรวมไพ่",
    revealBtn: "อ่านความหมาย",
    insightTitle: "คำทำนาย",
    lockedStr: "ยืนยันแล้ว",
    drawnStr: "เลือกแล้ว:",
    completeStr: "เลือกไพ่ครบแล้ว",
    waitStr: "รอจนถึง",
    viewBtn: "ดูรูป",
    readBtn: "คำทำนาย",
    errStyleLock:
      "ไม่สามารถเปลี่ยนรูปแบบไพ่ระหว่างการเลือกได้! กรุณาเลือกให้เสร็จหรือเริ่มใหม่",
  },
};

const spreadsData = {
  1: {
    count: 1,
    cooldown: 24 * 60 * 60 * 1000,
    classes: ["cc-1-center"],
    label_en: "1 Card (Daily Draw)",
    label_th: "1 ใบ (ไพ่ประจำวัน)",
    names_en: ["Focus / Outcome"],
    names_th: ["จุดสนใจ / ผลลัพธ์"],
  },
  3: {
    count: 3,
    cooldown: 0,
    classes: ["cc-3-left", "cc-3-center", "cc-3-right"],
    label_en: "3 Cards (Past/Present/Future)",
    label_th: "3 ใบ (อดีต/ปัจจุบัน/อนาคต)",
    names_en: ["Past", "Present", "Future"],
    names_th: ["อดีต", "ปัจจุบัน", "อนาคต"],
  },
  5: {
    count: 5,
    cooldown: 0,
    classes: [
      "cc-5-left",
      "cc-5-center",
      "cc-5-right",
      "cc-5-top",
      "cc-5-bottom",
    ],
    label_en: "5 Cards (Story Cross)",
    label_th: "5 ใบ (เรื่องราว)",
    names_en: ["Past", "Present", "Future", "Reason", "Potential"],
    names_th: ["อดีต", "ปัจจุบัน", "อนาคต", "สาเหตุ", "ความเป็นไปได้"],
  },
  10: {
    count: 10,
    cooldown: 7 * 24 * 60 * 60 * 1000,
    classes: [
      "cc-1",
      "cc-2",
      "cc-3",
      "cc-4",
      "cc-5",
      "cc-6",
      "cc-7",
      "cc-8",
      "cc-9",
      "cc-10",
    ],
    label_en: "10 Cards (Celtic Cross)",
    label_th: "10 ใบ (เซลติกครอส)",
    names_en: [
      "Heart",
      "Crossing",
      "Root",
      "Past",
      "Crown",
      "Future",
      "Self",
      "Environment",
      "Hopes/Fears",
      "Outcome",
    ],
    names_th: [
      "หัวใจ",
      "อุปสรรค",
      "รากฐาน",
      "อดีต",
      "มงกุฎ",
      "อนาคต",
      "ตนเอง",
      "สิ่งแวดล้อม",
      "ความหวัง/กลัว",
      "ผลลัพธ์",
    ],
  },
};

const intentionsData = {
  General: {
    label_th: "ทั่วไป",
    questions: [
      {
        id: "gen_1",
        en: "What do I need to know right now?",
        th: "สิ่งที่ฉันต้องรู้ในตอนนี้คืออะไร?",
      },
      {
        id: "gen_2",
        en: "What energy is surrounding me?",
        th: "พลังงานรอบตัวฉันเป็นอย่างไร?",
      },
    ],
  },
  "Career & Work": {
    label_th: "การงาน & อาชีพ",
    questions: [
      { id: "work_1", en: "Current Job Situation", th: "สถานการณ์งานปัจจุบัน" },
      { id: "work_2", en: "Finding a New Job", th: "การหางานใหม่" },
      { id: "work_3", en: "Work from Home (WFH)", th: "การทำงานที่บ้าน (WFH)" },
      {
        id: "work_4",
        en: "Forced Return to Office (RTO)",
        th: "ถูกบังคับให้กลับเข้าออฟฟิศ (RTO)",
      },
      {
        id: "work_5",
        en: "Negotiating Working Conditions",
        th: "การเจรจาต่อรองเรื่องงาน",
      },
      {
        id: "work_6",
        en: "Freelance / Business",
        th: "งานอิสระ / ธุรกิจส่วนตัว",
      },
      { id: "work_7", en: "Should I quit my job?", th: "ฉันควรลาออกดีไหม?" },
    ],
  },
  "Love & Relationships": {
    label_th: "ความรัก & ความสัมพันธ์",
    questions: [
      { id: "love_1", en: "Current Relationship", th: "ความสัมพันธ์ปัจจุบัน" },
      { id: "love_2", en: "Looking for Love", th: "การตามหารักแท้" },
      { id: "love_3", en: "Ex-partner", th: "คนรักเก่า" },
    ],
  },
  "Money & Finances": {
    label_th: "การเงิน",
    questions: [
      { id: "money_1", en: "Financial Outlook", th: "แนวโน้มการเงิน" },
      {
        id: "money_2",
        en: "A Big Purchase / Investment",
        th: "การซื้อของชิ้นใหญ่ / การลงทุน",
      },
    ],
  },
  Custom: {
    label_th: "คำถามกำหนดเอง",
    questions: [
      { id: "custom", en: "Custom Question", th: "พิมพ์คำถามของคุณเอง" },
    ],
  },
};

function updateLanguageUI() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[currentLang][key]) {
      if (el.tagName === "INPUT" && el.type === "button")
        el.value = translations[currentLang][key];
      else el.innerText = translations[currentLang][key];
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations[currentLang][key])
      el.placeholder = translations[currentLang][key];
  });

  const select = document.getElementById("spread-select");
  const val = select.value || "1";
  select.innerHTML = "";
  Object.keys(spreadsData).forEach((key) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.text = spreadsData[key][`label_${currentLang}`];
    select.appendChild(opt);
  });
  select.value = val;

  renderFocusMenus();
  if (drawnCards.length === 0) renderPlaceholders();
  updateStatus();
  renderHistory();
  checkCooldowns();

  const langToggle = document.getElementById("toggle-lang");
  const lblEn = document.getElementById("lbl-en");
  const lblTh = document.getElementById("lbl-th");
  if (currentLang === "th") {
    langToggle.checked = true;
    lblTh.classList.add("text-amber-400");
    lblEn.classList.remove("text-amber-400");
  } else {
    langToggle.checked = false;
    lblEn.classList.add("text-amber-400");
    lblTh.classList.remove("text-amber-400");
  }
}

const suits = [
  { name: "Wands", icon: "🔥" },
  { name: "Cups", icon: "🌊" },
  { name: "Swords", icon: "⚔️" },
  { name: "Pentacles", icon: "🪙" },
];
const ranks = [
  "Ace",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "Page",
  "Knight",
  "Queen",
  "King",
];
const majors = [
  { name: "The Fool", icon: "🃏" },
  { name: "The Magician", icon: "🪄" },
  { name: "The High Priestess", icon: "🌙" },
  { name: "The Empress", icon: "👑" },
  { name: "The Emperor", icon: "🛡️" },
  { name: "The Hierophant", icon: "🗝️" },
  { name: "The Lovers", icon: "💖" },
  { name: "The Chariot", icon: "🛷" },
  { name: "Strength", icon: "🦁" },
  { name: "The Hermit", icon: "🏮" },
  { name: "Wheel of Fortune", icon: "🎡" },
  { name: "Justice", icon: "⚖️" },
  { name: "The Hanged Man", icon: "🕸️" },
  { name: "Death", icon: "💀" },
  { name: "Temperance", icon: "🏺" },
  { name: "The Devil", icon: "🐐" },
  { name: "The Tower", icon: "⚡" },
  { name: "The Star", icon: "🌟" },
  { name: "The Moon", icon: "🐺" },
  { name: "The Sun", icon: "🌞" },
  { name: "Judgement", icon: "🎺" },
  { name: "The World", icon: "🌍" },
];

const tarotDeck = [];
majors.forEach((m, idx) =>
  tarotDeck.push({
    name: m.name,
    suit: "",
    icon: m.icon,
    theme: "theme-major",
    classicId: `ar${String(idx).padStart(2, "0")}`,
  }),
);
suits.forEach((s, sIdx) => {
  const suitCodes = ["wa", "cu", "sw", "pe"];
  ranks.forEach((r, rIdx) => {
    let num = String(rIdx + 1).padStart(2, "0");
    if (r === "Page") num = "pa";
    if (r === "Knight") num = "kn";
    if (r === "Queen") num = "qu";
    if (r === "King") num = "ki";
    tarotDeck.push({
      name: `${r} of ${s.name}`,
      suit: s.name,
      rank: r,
      icon: s.icon,
      theme: `theme-${s.name.toLowerCase()}`,
      classicId: `${suitCodes[sIdx]}${num}`,
    });
  });
});

// --- STATE ---
let activeDeck = [...tarotDeck];
let drawnCards = [];
let readingHistory = JSON.parse(localStorage.getItem("tarotHistory")) || [];
let currentSpreadSize = "1";
let isClassicStyle = false;
let customQuestionString = "";

// --- DOM ELEMENTS ---
const spreadSelect = document.getElementById("spread-select");
const statusText = document.getElementById("status-text");
const spreadArea = document.getElementById("spread-area");
const fanContainer = document.getElementById("fan-container");
const catSelect = document.getElementById("focus-category");
const specSelect = document.getElementById("focus-specific");
const customContainer = document.getElementById("custom-question-container");
const customInput = document.getElementById("custom-question-input");

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function renderFocusMenus() {
  // Hide focus for 1-Card and 10-Card spreads
  if (currentSpreadSize === "1" || currentSpreadSize === "10") {
    document.getElementById("focus-container").classList.add("hidden");
    return;
  }
  document.getElementById("focus-container").classList.remove("hidden");

  const currentCat = catSelect.value;
  const currentSpec = specSelect.value;

  catSelect.innerHTML = "";
  Object.keys(intentionsData).forEach((catKey) => {
    const opt = document.createElement("option");
    opt.value = catKey;
    opt.text = currentLang === "th" ? intentionsData[catKey].label_th : catKey;
    catSelect.appendChild(opt);
  });

  if (currentCat && intentionsData[currentCat]) catSelect.value = currentCat;
  updateSpecificMenu(currentSpec);
}

function updateSpecificMenu(preserveVal = null) {
  const cat = catSelect.value;
  specSelect.innerHTML = "";

  if (cat === "Custom") {
    specSelect.classList.add("hidden");
    customContainer.classList.remove("hidden");
    customContainer.classList.add("flex");
    return;
  } else {
    specSelect.classList.remove("hidden");
    customContainer.classList.add("hidden");
    customContainer.classList.remove("flex");
    customQuestionString = "";
  }

  intentionsData[cat].questions.forEach((q) => {
    const opt = document.createElement("option");
    opt.value = q.id;
    opt.text = currentLang === "th" ? q.th : q.en;
    specSelect.appendChild(opt);
  });

  if (
    preserveVal &&
    Array.from(specSelect.options).some((o) => o.value === preserveVal)
  ) {
    specSelect.value = preserveVal;
  }
}

catSelect.addEventListener("change", () => updateSpecificMenu());

document.getElementById("btn-set-custom").addEventListener("click", () => {
  playClickSound();
  const val = customInput.value.trim();
  if (val) {
    customQuestionString = val;
    const btn = document.getElementById("btn-set-custom");
    btn.innerHTML = `✓ ${translations[currentLang].lockedStr}`;
    btn.classList.add("bg-green-600", "text-white", "border-green-600");
    btn.classList.remove(
      "bg-amber-600/20",
      "text-amber-400",
      "border-amber-600",
    );
    setTimeout(() => {
      btn.innerHTML = translations[currentLang].set;
      btn.classList.remove("bg-green-600", "text-white", "border-green-600");
      btn.classList.add(
        "bg-amber-600/20",
        "text-amber-400",
        "border-amber-600",
      );
    }, 2000);
  }
});

function getCurrentFocusString() {
  if (currentSpreadSize === "1" || currentSpreadSize === "10") return "";
  if (catSelect.value === "Custom")
    return customQuestionString || "General Guidance";
  const cat = catSelect.value;
  const qId = specSelect.value;
  const qObj = intentionsData[cat].questions.find((q) => q.id === qId);
  return qObj ? qObj[currentLang] : "";
}

function renderPlaceholders() {
  spreadArea.innerHTML = "";
  spreadArea.className = `spread-layout spread-${currentSpreadSize}`;
  const spread = spreadsData[currentSpreadSize];

  for (let i = 0; i < spread.count; i++) {
    const slot = document.createElement("div");
    slot.className = `card-placeholder ${spread.classes[i]}`;
    slot.id = `slot-${i}`;

    const label = document.createElement("div");
    label.className =
      "font-semibold text-amber-200/50 mb-1 tracking-wider uppercase text-[0.65rem]";
    label.innerText = `Card ${i + 1}`;

    const meaning = document.createElement("div");
    meaning.className = "text-slate-400 mt-2 font-bold";
    meaning.innerText = spread[`names_${currentLang}`][i];

    slot.appendChild(label);
    slot.appendChild(meaning);
    spreadArea.appendChild(slot);
  }
}

function renderFan() {
  fanContainer.innerHTML = "";
  const cardsRemaining = activeDeck.length;
  if (cardsRemaining === 0) return;

  const containerWidth = window.innerWidth;
  const spreadWidth = Math.min(containerWidth - 40, 1100);

  for (let i = 0; i < cardsRemaining; i++) {
    const card = document.createElement("div");
    card.className = "fan-card";

    let normalized = 0;
    if (cardsRemaining > 1) {
      normalized = (i / (cardsRemaining - 1)) * 2 - 1;
    }

    const translateX = normalized * (spreadWidth / 2);
    const translateY = normalized * normalized * 60;
    const angle = normalized * 35;

    const baseTransform = `translate(${translateX}px, ${translateY}px) rotate(${angle}deg)`;
    card.style.setProperty("--base-transform", baseTransform);
    card.style.transform = baseTransform;
    card.style.zIndex = i;

    card.addEventListener("mouseenter", () => playHoverSound());
    card.onclick = () => drawCard(i);

    fanContainer.appendChild(card);
  }
  checkCompletionState();
}

async function getClassicImage(classicId) {
  const url = `https://wsrv.nl/?url=sacred-texts.com/tarot/pkt/img/${classicId}.jpg&w=400&output=webp`;
  try {
    const cache = await caches.open("tarot-deck-cache");
    const cachedRes = await cache.match(url);
    if (cachedRes) {
      const blob = await cachedRes.blob();
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.error(e);
  }
  return url;
}

async function downloadDeck() {
  const modal = document.getElementById("download-modal");
  const bar = document.getElementById("download-progress-bar");
  const text = document.getElementById("download-text");

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  try {
    const cache = await caches.open("tarot-deck-cache");
    let loaded = 0;

    for (let i = 0; i < tarotDeck.length; i++) {
      const card = tarotDeck[i];
      const url = `https://wsrv.nl/?url=sacred-texts.com/tarot/pkt/img/${card.classicId}.jpg&w=400&output=webp`;

      const exists = await cache.match(url);
      if (!exists) {
        await cache.add(url);
        await new Promise((r) => setTimeout(r, 50));
      }

      loaded++;
      const pct = Math.round((loaded / tarotDeck.length) * 100);
      bar.style.width = `${pct}%`;
      text.innerText = `${pct}%`;
      if (i % 3 === 0) playHoverSound();
    }

    playClickSound();
    confetti({
      particleCount: 100,
      spread: 160,
      origin: { y: 0.5 },
      shapes: ["emoji"],
      shapeOptions: { emoji: { value: ["✨", "🌟", "🔮"] } },
    });
  } catch (e) {
    console.error("Download failed:", e);
  }

  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    localStorage.setItem("classicArtEnabled", "true");
  }, 1500);
}

document.getElementById("toggle-art").addEventListener("change", async (e) => {
  if (drawnCards.length > 0) {
    e.preventDefault();
    e.target.checked = !e.target.checked;
    triggerFunnyWarning(translations[currentLang].errStyleLock);
    return;
  }

  playClickSound();
  isClassicStyle = e.target.checked;

  if (isClassicStyle && !localStorage.getItem("classicArtEnabled")) {
    await downloadDeck();
  }
});

function updateArtLockUI() {
  const wrapper = document.getElementById("art-toggle-wrapper");
  const toggle = document.getElementById("toggle-art");
  if (drawnCards.length > 0) {
    wrapper.classList.add("art-locked");
    toggle.disabled = true;
  } else {
    wrapper.classList.remove("art-locked");
    toggle.disabled = false;
  }
}

async function drawCard(deckIndex) {
  if (drawnCards.length >= parseInt(currentSpreadSize)) return;

  playDrawSound();
  const drawnCardData = activeDeck.splice(deckIndex, 1)[0];
  drawnCards.push(drawnCardData);
  updateArtLockUI();

  const slotIndex = drawnCards.length - 1;
  const slot = document.getElementById(`slot-${slotIndex}`);

  // Place a magical card back instead of immediately revealing
  slot.innerHTML = `
    <div class="drawn-card glow-pulse" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); border: 1px solid rgba(251, 191, 36, 0.3); display: flex; align-items: center; justify-content: center;">
        <div class="text-4xl md:text-5xl animate-pulse">🌌</div>
    </div>`;

  renderFan();
  updateStatus();

  // Trigger reveal animation only after the final card is placed
  if (drawnCards.length >= parseInt(currentSpreadSize)) {
    setTimeout(() => {
      revealAllCards();
    }, 600);
  }
}

async function revealAllCards() {
  const preparedFaces = await Promise.all(
    drawnCards.map((data, i) => {
      return new Promise((resolve) => {
        const face = document.createElement("div");
        face.className = "drawn-card glow-pulse";

        if (isClassicStyle) {
          getClassicImage(data.classicId)
            .then((imgUrl) => {
              const img = new Image();
              img.src = imgUrl;
              img.onload = () => {
                face.innerHTML = `
                <div class="classic-art-bg" style="background-image: url('${imgUrl}');"></div>
                <div class="classic-foil"></div>
                `;
                resolve({ slotIndex: i, faceElement: face });
              };
              img.onerror = () => {
                renderModernFace(face, data);
                resolve({ slotIndex: i, faceElement: face });
              };
            })
            .catch(() => {
              renderModernFace(face, data);
              resolve({ slotIndex: i, faceElement: face });
            });
        } else {
          renderModernFace(face, data);
          resolve({ slotIndex: i, faceElement: face });
        }
      });
    }),
  );

  if (AudioParams.synth) {
    AudioParams.synth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n");
  }

  preparedFaces.forEach((prepared) => {
    const slot = document.getElementById(`slot-${prepared.slotIndex}`);
    finalizeCardRender(slot, prepared.faceElement);
  });

  setTimeout(() => {
    saveToHistory();
  }, 1000);
}

function renderModernFace(face, data) {
  let artContent = "";
  if (data.suit === "") {
    artContent = `<div class="text-5xl md:text-[5rem] filter drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] relative z-10">${data.icon}</div>`;
  } else {
    let rankValue = ranks.indexOf(data.rank) + 1;
    if (rankValue === 1) {
      artContent = `<div class="text-5xl md:text-[5rem] filter drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] relative z-10">${data.icon}</div>`;
    } else if (rankValue >= 2 && rankValue <= 10) {
      let iconsHtml = "";
      for (let i = 0; i < rankValue; i++)
        iconsHtml += `<span class="filter drop-shadow-md">${data.icon}</span>`;
      artContent = `<div class="flex flex-wrap justify-center items-center content-center gap-1 md:gap-2 w-[85%] h-[85%] text-sm md:text-3xl relative z-10">${iconsHtml}</div>`;
    } else {
      let courtIcon =
        data.rank === "Page"
          ? "🧑‍🎓"
          : data.rank === "Knight"
            ? "🏇"
            : data.rank === "Queen"
              ? "👸"
              : "🤴";
      artContent = `<div class="flex flex-col items-center justify-center gap-1 md:gap-3 relative z-10"><div class="text-3xl md:text-5xl filter drop-shadow-md">${courtIcon}</div><div class="text-xl md:text-4xl filter drop-shadow-md">${data.icon}</div></div>`;
    }
  }

  face.innerHTML = `
            <div class="card-art-frame ${data.theme}">${artContent}</div>
            <div class="card-title-banner"><span class="drawn-card-title">${data.name}</span></div>
        `;
}

function finalizeCardRender(slot, faceElement) {
  slot.innerHTML = "";
  slot.appendChild(faceElement);

  const aura = document.createElement("div");
  aura.className = "aura-ripple";
  slot.appendChild(aura);
  setTimeout(() => {
    if (slot.contains(aura)) slot.removeChild(aura);
  }, 800);
}

function updateStatus() {
  const total = parseInt(currentSpreadSize);
  if (drawnCards.length >= total) {
    statusText.innerText = translations[currentLang].completeStr;
    statusText.classList.add("text-amber-400");
    statusText.classList.remove("text-amber-50");
  } else {
    statusText.innerText = `${translations[currentLang].drawnStr} ${drawnCards.length} / ${total}`;
    statusText.classList.remove("text-amber-400");
    statusText.classList.add("text-amber-50");
  }
  checkCompletionState();
}

function checkCompletionState() {
  const btnInterpret = document.getElementById("btn-interpret");
  if (drawnCards.length >= parseInt(currentSpreadSize)) {
    fanContainer.classList.add("reading-complete-fan");
    btnInterpret.classList.remove("hidden");
    setTimeout(() => {
      btnInterpret.classList.remove(
        "opacity-0",
        "scale-90",
        "pointer-events-none",
      );
      btnInterpret.classList.add(
        "opacity-100",
        "scale-100",
        "animate-pulse",
        "pointer-events-auto",
      );
    }, 50);
  } else {
    fanContainer.classList.remove("reading-complete-fan");
    btnInterpret.classList.remove(
      "opacity-100",
      "scale-100",
      "animate-pulse",
      "pointer-events-auto",
    );
    btnInterpret.classList.add("opacity-0", "scale-90", "pointer-events-none");
    setTimeout(() => {
      if (drawnCards.length < parseInt(currentSpreadSize))
        btnInterpret.classList.add("hidden");
    }, 500);
  }
}

function triggerMagicalShuffle() {
  playClickSound();
  if (
    drawnCards.length > 0 &&
    drawnCards.length < parseInt(currentSpreadSize)
  ) {
    triggerFunnyWarning(translations[currentLang].errStyleLock);
    return;
  }

  const cards = document.querySelectorAll(".fan-card");
  cards.forEach((c) => {
    c.style.transform = "rotate(0deg) scale(0.9)";
    c.classList.add("wiggling");
  });

  statusText.innerText = "Shuffling... ✨";
  playShuffleSound();

  confetti({
    particleCount: 50,
    spread: 120,
    origin: { y: 0.9 },
    colors: ["#fbbf24", "#fef08a", "#818cf8", "#c084fc"],
    shapes: ["star", "circle"],
    scalar: 1.2,
  });

  setTimeout(() => {
    resetReading();
    cards.forEach((c) => c.classList.remove("wiggling"));
  }, 1200);
}

function triggerResetSweep() {
  playClickSound();
  if (drawnCards.length === 0) {
    resetReading();
    return;
  }

  const broom = document.getElementById("sweeping-broom");
  const broomContainer = document.getElementById("broom-container");

  broomContainer.classList.remove("hidden");
  void broom.offsetWidth;
  broom.classList.add("animate-sweep");

  const poofDust = () => {
    playShuffleSound();
    confetti({
      particleCount: 30,
      spread: 120,
      origin: { y: 0.6, x: 0.5 },
      colors: ["#cbd5e1", "#94a3b8", "#64748b"],
      shapes: ["circle"],
      scalar: 1.2,
    });
  };

  setTimeout(poofDust, 240);
  setTimeout(poofDust, 480);
  setTimeout(poofDust, 720);
  setTimeout(poofDust, 960);

  setTimeout(() => {
    document.querySelectorAll(".drawn-card").forEach((card) => {
      card.style.setProperty(
        "--fly-x",
        `${(Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 60)}vw`,
      );
      card.style.setProperty("--fly-y", `${-20 - Math.random() * 60}vh`);
      card.style.setProperty(
        "--fly-rot",
        `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720)}deg`,
      );
      card.classList.add("fly-away");
    });
  }, 240);

  setTimeout(() => {
    resetReading();
    broom.classList.remove("animate-sweep");
    broomContainer.classList.add("hidden");
  }, 1600);
}

function resetReading() {
  const select = document.getElementById("spread-select");
  if (
    select.options[select.selectedIndex] &&
    select.options[select.selectedIndex].disabled
  ) {
    for (let i = 0; i < select.options.length; i++) {
      if (!select.options[i].disabled) {
        select.selectedIndex = i;
        currentSpreadSize = select.options[i].value;
        break;
      }
    }
  }

  activeDeck = [...tarotDeck];
  drawnCards = [];
  shuffleArray(activeDeck);
  renderFocusMenus();
  renderPlaceholders();
  renderFan();
  updateStatus();
  updateArtLockUI();
}

async function saveToHistory() {
  const spreadName = spreadsData[currentSpreadSize][`label_${currentLang}`];
  const focusStr = getCurrentFocusString();
  const fullTypeStr = focusStr
    ? `${spreadName}<br><span class="text-amber-400 text-xs">Focus: ${focusStr}</span>`
    : spreadName;
  const cardNames = drawnCards.map((c) => c.name).join(", ");
  const timestamp = new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let imgData = "";
  try {
    const spreadEl = document.getElementById("spread-area");

    // THE HACK: Temporarily hide problem CSS elements (like foil gradients) just for the photo
    const problemElements = spreadEl.querySelectorAll(
      ".classic-foil, .aura-ripple",
    );
    problemElements.forEach((el) => (el.style.opacity = "0"));

    const canvas = await html2canvas(spreadEl, {
      backgroundColor: null,
      scale: 1.5,
      useCORS: true, // THE FIX: Forces the browser to allow the classic art images!
      allowTaint: true,
      logging: false,
    });

    // Put them back instantly
    problemElements.forEach((el) => (el.style.opacity = "1"));

    imgData = canvas.toDataURL("image/jpeg", 0.7);
  } catch (e) {
    console.error("Snapshot fail", e);
  }

  readingHistory.unshift({
    id: Date.now(),
    timestamp: Date.now(),
    spreadId: currentSpreadSize,
    date: timestamp,
    type: fullTypeStr,
    cards: cardNames,
    image: imgData,
    prediction: "",
  });

  while (JSON.stringify(readingHistory).length > 4000000) {
    readingHistory.pop();
  }

  try {
    localStorage.setItem("tarotHistory", JSON.stringify(readingHistory));
  } catch (e) {
    console.error("Storage full, dropping images");
    readingHistory.forEach((h) => (h.image = ""));
    localStorage.setItem("tarotHistory", JSON.stringify(readingHistory));
  }

  renderHistory();
  checkCooldowns();
}

function renderHistory() {
  const tbody = document.getElementById("history-table-body");
  const emptyMsg = document.getElementById("empty-history");
  tbody.innerHTML = "";

  if (readingHistory.length === 0) {
    emptyMsg.classList.remove("hidden");
  } else {
    emptyMsg.classList.add("hidden");
    readingHistory.forEach((item) => {
      const tr = document.createElement("tr");
      tr.className =
        "border-b border-slate-800 hover:bg-slate-800/50 transition-colors";
      const viewBtnTxt = translations[currentLang].viewBtn;
      const readBtnTxt = translations[currentLang].readBtn;

      tr.innerHTML = `
                    <td class="py-4 pr-4 whitespace-nowrap text-amber-200/80">${item.date}</td>
                    <td class="py-4 pr-4 font-medium text-slate-300">${item.type}</td>
                    <td class="py-4 pr-4 text-slate-400 italic text-xs leading-relaxed max-w-[200px] truncate" title="${item.cards}">${item.cards}</td>
                    <td class="py-4 pr-4 text-center">
                        <div class="flex justify-center gap-2">
                            ${item.image ? `<button onclick="viewSnapshot('${item.id}')" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md text-amber-300 text-xs tracking-wider uppercase transition-colors shadow-lg">${viewBtnTxt}</button>` : ""}
                            ${item.prediction ? `<button onclick="viewReading('${item.id}')" class="px-3 py-1 bg-purple-900/50 hover:bg-purple-800/50 border border-purple-500/50 rounded-md text-purple-300 text-xs tracking-wider uppercase transition-colors shadow-lg">${readBtnTxt}</button>` : ""}
                            ${!item.image && !item.prediction ? '<span class="text-slate-600 text-xs">N/A</span>' : ""}
                        </div>
                    </td>
                    <td class="py-4 text-center">
                        <button onclick="deleteHistoryItem(${item.id})" class="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded-full transition-all" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </td>
                `;
      tbody.appendChild(tr);
    });
  }
}

window.viewSnapshot = function (id) {
  playClickSound();
  const item = readingHistory.find((r) => r.id == id);
  if (item && item.image) {
    document.getElementById("snapshot-image").src = item.image;
    document.getElementById("snapshot-modal").classList.remove("hidden");
    document.getElementById("snapshot-modal").classList.add("flex");
  }
};

window.viewReading = function (id) {
  playClickSound();
  const item = readingHistory.find((r) => r.id == id);
  if (item && item.prediction) {
    const modal = document.getElementById("interpret-modal");
    const content = document.getElementById("interpret-content");
    content.innerHTML = item.prediction;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
};

window.deleteHistoryItem = function (id) {
  readingHistory = readingHistory.filter((item) => item.id !== id);
  localStorage.setItem("tarotHistory", JSON.stringify(readingHistory));
  renderHistory();
  checkCooldowns();
};

function triggerFunnyWarning(customText = null) {
  playClickSound();
  const warningEl = document.getElementById("funny-warning");
  const textEl = document.getElementById("warning-text");

  if (customText) {
    textEl.innerText = customText;
  } else {
    const funnyWarnings = [
      "Hold your horses! 🐎",
      "Greedy! 🙅‍♀️",
      "Spirits are tired! 👻",
      "Stop clicking! 😂",
    ];
    textEl.innerText =
      funnyWarnings[Math.floor(Math.random() * funnyWarnings.length)];
  }

  warningEl.classList.remove("warning-active");
  document.body.classList.remove("flash-screen");
  void warningEl.offsetWidth;
  warningEl.classList.add("warning-active");
  document.body.classList.add("flash-screen");

  setTimeout(() => {
    warningEl.classList.remove("warning-active");
    document.body.classList.remove("flash-screen");
  }, 1000);
}

document.addEventListener(
  "click",
  (e) => {
    const fanArea = document.getElementById("deck-area");
    if (
      e.target.closest(".fan-card") ||
      (fanArea && fanArea.contains(e.target))
    ) {
      if (drawnCards.length >= parseInt(currentSpreadSize)) {
        e.preventDefault();
        e.stopPropagation();
        triggerFunnyWarning();
      }
    }
  },
  true,
);

document.getElementById("btn-interpret").addEventListener("click", async () => {
  playClickSound();
  const modal = document.getElementById("interpret-modal");
  const content = document.getElementById("interpret-content");

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  content.innerHTML = `
            <div class="flex flex-col items-center justify-center h-48 gap-6">
                <div class="text-5xl animate-spin" style="animation-duration: 3s;">🔮</div>
                <div class="tarot-font text-amber-200/80 tracking-widest animate-pulse text-center">
                    Consulting the Akashic Records...<br>
                    <span class="text-sm text-slate-400 font-sans mt-2 block" id="model-status">Finding available AI models...</span>
                </div>
            </div>
        `;

  const spreadInfo = spreadsData[currentSpreadSize];
  const readingContext = drawnCards
    .map(
      (card, i) => `"${card.name}" in the "${spreadInfo.names_en[i]}" position`,
    )
    .join(", ");
  const focusStr = getCurrentFocusString();

  const langInstruction =
    currentLang === "th"
      ? "CRITICAL INSTRUCTION: You MUST write the ENTIRE response in Thai language."
      : "";
  const focusInstruction = focusStr
    ? `The user is specifically asking about: "${focusStr}". Heavily tailor the reading to this topic.`
    : "";

  const prompt = `Act as an expert, mystical Tarot reader. I have just drawn a ${spreadInfo.label_en} spread. 
        Here are the cards I pulled: ${readingContext}. 
        ${focusInstruction}
        Please provide a highly detailed, comprehensive, and beautifully written interpretation of this reading. Analyze the specific meaning of each card in its designated position, and then weave them together into a deep, empowering story. 
        Format the response using simple HTML tags like <h3>, <p>, <ul>, and <strong> so it displays beautifully on a webpage. 
        Make the headers amber colored using inline CSS (e.g. <h3 style="color: #fbbf24; margin-top: 15px; margin-bottom: 5px;">).
        Do not use markdown wrappers like \`\`\`html. Make the tone mysterious but empowering.
        ${langInstruction}`;

  try {
    const apiKey = window.geminiApiKey || "";
    if (!apiKey)
      throw new Error(
        "API Key not found in Firebase Remote Config. Please verify settings.",
      );

    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listResponse = await fetch(listUrl);
    if (!listResponse.ok) {
      const errData = await listResponse.json();
      throw new Error(
        errData.error?.message || "Failed to fetch model list from Google.",
      );
    }
    const listData = await listResponse.json();

    let modelPath = "";
    if (listData.models && listData.models.length > 0) {
      const validModels = listData.models.filter(
        (m) =>
          m.supportedGenerationMethods &&
          m.supportedGenerationMethods.includes("generateContent") &&
          m.name.includes("gemini"),
      );

      const exactFlash = validModels.find(
        (m) => m.name === "models/gemini-1.5-flash",
      );
      const anyFlash = validModels.find(
        (m) => m.name.includes("flash") && !m.name.includes("latest"),
      );
      const fallbackModel = validModels.find((m) => !m.name.includes("latest"));

      if (exactFlash) {
        modelPath = exactFlash.name;
      } else if (anyFlash) {
        modelPath = anyFlash.name;
      } else if (fallbackModel) {
        modelPath = fallbackModel.name;
      } else if (validModels.length > 0) {
        modelPath = validModels[0].name;
      }
    }

    if (!modelPath)
      throw new Error(
        "No valid text generation models found for this API key.",
      );

    document.getElementById("model-status").innerText =
      `Using ${modelPath.replace("models/", "")}...`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`;

    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(
        errData.error?.message || "Google API Rejected the request.",
      );
    }

    const result = await response.json();

    if (result.candidates && result.candidates[0].content.parts[0].text) {
      let htmlText = result.candidates[0].content.parts[0].text;
      htmlText = htmlText.replace(/```html/gi, "").replace(/```/g, "");
      content.innerHTML = htmlText;

      // SAVE PREDICTION TO HISTORY
      if (readingHistory.length > 0) {
        readingHistory[0].prediction = htmlText;
        localStorage.setItem("tarotHistory", JSON.stringify(readingHistory));
        renderHistory();
      }
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error) {
    console.error("AI Reading Failed:", error);
    const errHtml = `<div class="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm font-mono overflow-x-auto">${error.message}</div>`;

    const simTitle =
      currentLang === "th"
        ? "เบื้องบนได้รับรู้แล้ว"
        : "THE SPIRITS HAVE ANSWERED";
    const simPara =
      currentLang === "th"
        ? `จักรวาลได้นำทางคุณในวันนี้ คุณจับได้ไพ่ <strong>${readingContext}</strong> พลังงานบ่งบอกว่าคุณกำลังเข้าสู่ช่วงเวลาแห่งการเปลี่ยนแปลงที่ลึกซึ้งเกี่ยวกับเรื่อง "${focusStr || "ทั่วไป"}" จงเชื่อมั่นในสัญชาตญาณของคุณ`
        : `The universe has guided your hand today. You drew <strong>${readingContext}</strong>. The energies indicate a profound transition regarding "${focusStr || "your current path"}". Trust your intuition right now.`;
    const simQuote =
      currentLang === "th"
        ? `"จักรวาลกำลังจัดสรรสิ่งดีๆ ให้คุณ จงก้าวต่อไปด้วยความมั่นใจ"`
        : `"The cosmos are aligning in your favor. Proceed with confidence."`;

    setTimeout(() => {
      const finalHtml = `
                    <div class="flex flex-col items-center justify-center gap-4 text-center">
                        ${errHtml}
                        <h3 style="color: #fbbf24; margin-top: 15px; margin-bottom: 5px; font-size: 1.5rem; letter-spacing: 0.1em;" class="tarot-font">${simTitle}</h3>
                        <p class="text-slate-300 mt-2">${simPara}</p>
                        <p style="color: #c084fc; font-style: italic; margin-top: 15px;" class="text-lg">${simQuote}</p>
                    </div>
                `;
      content.innerHTML = finalHtml;

      // SAVE SIMULATED PREDICTION TO HISTORY
      if (readingHistory.length > 0) {
        readingHistory[0].prediction = finalHtml;
        localStorage.setItem("tarotHistory", JSON.stringify(readingHistory));
        renderHistory();
      }
    }, 1000);
  }
});

document.getElementById("close-interpret").addEventListener("click", () => {
  playClickSound();
  document.getElementById("interpret-modal").classList.add("hidden");
  document.getElementById("interpret-modal").classList.remove("flex");
});

function checkCooldowns() {
  const select = document.getElementById("spread-select");
  let needsToSwitch = false;

  Object.keys(spreadsData).forEach((key) => {
    const spread = spreadsData[key];
    const option = select.querySelector(`option[value="${key}"]`);
    if (!option) return;

    if (spread.cooldown > 0) {
      const lastReading = readingHistory.find((r) => r.spreadId === key);

      if (lastReading && lastReading.timestamp) {
        const timeSince = Date.now() - lastReading.timestamp;
        if (timeSince < spread.cooldown) {
          const unlockTime = new Date(lastReading.timestamp + spread.cooldown);
          const timeStr = unlockTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const dateStr = unlockTime.toLocaleDateString([], {
            month: "short",
            day: "numeric",
          });

          option.disabled = true;
          option.innerText = `${spread[`label_${currentLang}`]} [${translations[currentLang].waitStr} ${dateStr} ${timeStr}]`;

          if (currentSpreadSize === key) needsToSwitch = true;
        } else {
          option.disabled = false;
          option.innerText = spread[`label_${currentLang}`];
        }
      } else {
        option.disabled = false;
        option.innerText = spread[`label_${currentLang}`];
      }
    }
  });

  if (
    (needsToSwitch || select.options[select.selectedIndex].disabled) &&
    drawnCards.length === 0
  ) {
    for (let i = 0; i < select.options.length; i++) {
      if (!select.options[i].disabled) {
        select.selectedIndex = i;
        currentSpreadSize = select.options[i].value;
        resetReading();
        break;
      }
    }
  }
}

setInterval(checkCooldowns, 60000);

spreadSelect.addEventListener("change", (e) => {
  playClickSound();
  currentSpreadSize = e.target.value;
  resetReading();
});

document.getElementById("toggle-lang").addEventListener("change", (e) => {
  playClickSound();
  currentLang = e.target.checked ? "th" : "en";
  updateLanguageUI();
});

document.getElementById("btn-history").addEventListener("click", () => {
  playClickSound();
  renderHistory();
  document.getElementById("history-modal").classList.remove("hidden");
  document.getElementById("history-modal").classList.add("flex");
});

document.getElementById("close-history").addEventListener("click", () => {
  playClickSound();
  document.getElementById("history-modal").classList.add("hidden");
  document.getElementById("history-modal").classList.remove("flex");
});

document.getElementById("close-snapshot").addEventListener("click", () => {
  playClickSound();
  document.getElementById("snapshot-modal").classList.add("hidden");
  document.getElementById("snapshot-modal").classList.remove("flex");
});

document
  .getElementById("btn-shuffle")
  .addEventListener("click", triggerMagicalShuffle);
document
  .getElementById("btn-reset")
  .addEventListener("click", triggerResetSweep);

window.addEventListener("resize", () => {
  if (drawnCards.length < parseInt(currentSpreadSize)) renderFan();
});

// --- INITIALIZATION ---
if (!spreadSelect.value) {
  spreadSelect.innerHTML = `<option value="1">1 Card (Daily Draw)</option>`;
  spreadSelect.value = "1";
}

if (localStorage.getItem("classicArtEnabled") === "true") {
  isClassicStyle = true;
  document.getElementById("toggle-art").checked = true;
}

updateLanguageUI();
resetReading();
