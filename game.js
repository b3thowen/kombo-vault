import { auth, db, configured, signInAnonymously, onAuthStateChanged, doc, setDoc, getDoc, onSnapshot, collection, deleteDoc, serverTimestamp } from "./firebase.js";
import { buildQuestions, checkAnswer, checkVault, LEVELS } from "./questions.js";
import { newState, totalScore, attempts, qPoints, RULES, fmtTime, ATTACKS, SHIELD, COOLDOWN } from "./scoring.js";

const $ = id => document.getElementById(id);
const VIEWS = ["load", "join", "wait", "q", "ok", "vault", "done", "end", "cfg"];
const show = v => VIEWS.forEach(x => $("v-" + x).classList.toggle("hidden", x !== v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let uid = null, st = null, Q = [], phase = "lobby", realPhase = "lobby", startedAt = null, justSolved = null, loaded = false;
let targets = [], incoming = [];
const seen = new Set();

async function save() {
  if (!uid || !st) return;
  const data = {
    name: st.name, score: totalScore(st), solved: st.solved, attempts: attempts(st),
    hints: st.hints, sabotages: st.sabotages || 0, joinedAt: st.joinedAt, finishedAt: st.finishedAt, st,
    total: Q.length, mode: st.mode || "vault", solo: !!st.solo,
    level: Q.length ? Q[Math.min(st.solved, Q.length - 1)].level + 1 : 1,
    updatedAt: serverTimestamp()
  };
  try { await setDoc(doc(db, "players", uid), data); }
  catch (e) { console.error(e); $("clock").textContent = "⚠ greška pri slanju rezultata"; }
}

const BOT_NAMES = ["🤖 Bot Alfa", "🤖 Bot Beta", "🤖 Bot Gama", "🤖 Bot Delta"];
let bots = [], botTimer = null;
const botId = n => "bot_" + uid.slice(0, 6) + "_" + n;

function botSave(b) {
  setDoc(doc(db, "players", b.id), {
    name: b.name, score: b.score, solved: b.solved, total: Q.length, mode: (st && st.mode) || "vault", attempts: b.attempts, hints: 0, sabotages: b.sab,
    joinedAt: b.joinedAt, finishedAt: b.finishedAt, updatedAt: serverTimestamp()
  }).catch(e => console.error("bot", e));
}

function startBots() {
  stopBots();
  const now = Date.now();
  bots = BOT_NAMES.map((name, n) => ({ id: botId(n), name, n, score: 0, solved: 0, attempts: 0, sab: 0,
    joinedAt: now, finishedAt: null, next: now + (10 + n * 6) * 1000 }));
  bots.forEach(botSave);
  botTimer = setInterval(botTick, 1000);
}

function stopBots() {
  clearInterval(botTimer); botTimer = null;
  if (uid) BOT_NAMES.forEach((_, n) => deleteDoc(doc(db, "players", botId(n))).catch(() => {}));
  bots = [];
}

function botTick() {
  const now = Date.now();
  for (const b of bots) {
    if (b.finishedAt || now < b.next) continue;
    b.next = now + (15 + b.n * 7 + Math.random() * 15) * 1000;
    b.attempts++;
    if (Math.random() < 0.25) b.score = Math.max(0, b.score - RULES.wrongPenalty);
    else {
      b.solved++; b.score += RULES.base + (Math.random() < 0.6 ? RULES.firstTry : 0);
      if (b.solved >= Q.length) { b.finishedAt = now; b.score += RULES.vaultBonus; }
    }
    // povremeno bot napadne igrača koji testira
    if (!b.finishedAt && st && !st.finishedAt && Math.random() < 0.2) {
      const types = Object.keys(ATTACKS), type = types[Math.floor(Math.random() * types.length)];
      setDoc(doc(collection(db, "attacks")), { from: b.id, fromName: b.name, to: uid, toName: st.name, type, at: now })
        .catch(e => console.error("bot attack", e));
      b.sab++;
    }
    botSave(b);
  }
}

let toastTimer;
function toast(t) {
  const el = $("toast"); el.textContent = t; el.classList.remove("hidden");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add("hidden"), 4500);
}

function left(type) {
  const now = Date.now(); let m = 0;
  for (const a of incoming) if (a.type === type) m = Math.max(m, a.at + ATTACKS[a.type].dur * 1000 - now);
  return Math.max(0, Math.ceil(m / 1000));
}
const shieldLeft = () => st ? Math.max(0, Math.ceil(((st.shieldUntil || 0) - Date.now()) / 1000)) : 0;
const cooldownLeft = () => st ? Math.max(0, Math.ceil(((st.lastAttack || 0) + COOLDOWN * 1000 - Date.now()) / 1000)) : 0;

function applyEffects() {
  if (!st) return;
  const frozen = left("freeze") > 0;
  ["sendBtn", "ans", "vaultBtn", "vaultIn"].forEach(id => { $(id).disabled = frozen; });$("qText").classList.toggle("blurred", left("blur") > 0);
  $("hintBtn").disabled = st.hintQ.includes(st.solved) || left("lock") > 0;

  const parts = [];
  for (const [k, A] of Object.entries(ATTACKS)) { const s = left(k); if (s) parts.push(`${A.icon} ${A.name} ${s}s`); }
  const sh = shieldLeft(); if (sh) parts.push(`${SHIELD.icon} ŠTIT ${sh}s`);
  $("fx").textContent = parts.join("  ·  ");
  $("fx").classList.toggle("hidden", !parts.length);
}

function buildArsenal() {
  $("atkBtns").innerHTML =
    Object.entries(ATTACKS).map(([k, A]) =>
      `<button class="secondary atk" data-t="${k}" title="${A.desc}">${A.icon} ${A.name}<small>−${A.cost}</small></button>`).join("") +
    `<button class="secondary atk shield" data-t="shield" title="${SHIELD.desc}">${SHIELD.icon} ${SHIELD.name}<small>−${SHIELD.cost}</small></button>`;
}

function renderTargets() {
  const sel = $("target"), prev = sel.value;
  sel.innerHTML = targets.length
    ? '<option value="random">🎲 Nasumičan tim</option>' +
      targets.map(t => `<option value="${t.id}">${esc(t.name)} · ${t.score}p · ${t.solved}/6</option>`).join("")
    : '<option value="">— nema drugih timova —</option>';
  if (prev === "random" || targets.some(t => t.id === prev)) sel.value = prev;
  else if (targets.length) sel.value = "random";
}

function updateArsenal() {
  if (!st) return;
  const score = totalScore(st), cd = cooldownLeft(), hasTarget = !!$("target").value;
  $("atkBtns").querySelectorAll("button").forEach(b => {
    const t = b.dataset.t;
    if (t === "shield") b.disabled = score < SHIELD.cost || shieldLeft() > 0;
    else b.disabled = score < ATTACKS[t].cost || cd > 0 || !hasTarget;
  });
  $("atkInfo").textContent = `Tvoji poeni: ${score}` + (cd ? ` · cooldown ${cd}s` : "");
}

async function doAttack(type) {
  if (!st || phase !== "running" || st.finishedAt) return;
  const now = Date.now(), score = totalScore(st);

  if (type === "shield") {
    if (score < SHIELD.cost) return toast("Nemaš dovoljno poena.");
    if (shieldLeft() > 0) return toast("Štit je već aktivan.");
    st.spent += SHIELD.cost; st.shieldFrom = now; st.shieldUntil = now + SHIELD.dur * 1000;
    toast(`${SHIELD.icon} Štit aktivan ${SHIELD.dur}s`);
    await save(); return;
  }

  const A = ATTACKS[type];
let tid = $("target").value;
const t = tid === "random"
  ? targets[Math.floor(Math.random() * targets.length)]
  : targets.find(x => x.id === tid);
if (t) tid = t.id;
  if (!t) return toast("Izaberi tim.");
  if (score < A.cost) return toast("Nemaš dovoljno poena.");
  if (cooldownLeft() > 0) return toast("Cooldown još traje.");

  try {
    await setDoc(doc(collection(db, "attacks")), {
      from: uid, fromName: st.name, to: tid, toName: t.name, type, at: now
    });
  } catch (e) { console.error(e); return toast("Napad nije poslat (" + (e.code || "greška") + ")."); }

  st.spent += A.cost; st.sabotages = (st.sabotages || 0) + 1; st.lastAttack = now;
  toast(`${A.icon} ${A.name} poslat timu ${t.name}!`);
  await save(); updateArsenal();
}

$("atkBtns").addEventListener("click", e => {
  const b = e.target.closest("button[data-t]");
  if (b && !b.disabled) doAttack(b.dataset.t);
});

function codeRow(el, total = 6) {
  el.innerHTML = "";
  if (st.mode === "levels") return;
  for (let i = 0; i < total; i++) {
    const d = document.createElement("div");
    d.className = "digit" + (st.digits[i] ? "" : " empty");
    d.textContent = st.digits[i] || "?";
    el.appendChild(d);
  }
}

function render() {
  renderView();
  const armed = loaded && st && !st.finishedAt && phase === "running" && !st.solo;
  $("arsenal").classList.toggle("hidden", !armed);
  applyEffects();
}

function renderView() {
  if (!loaded) return show("load");
  if (!st) return show("join");
  $("team").textContent = "TIM: " + st.name;
  if (st.finishedAt) {
    $("doneTxt").textContent = `Trezor je otključan za ${fmtTime(st.finishedAt - st.joinedAt)}. Konačan rezultat: ${totalScore(st)} poena.`;
    return show("done");
  }
  if (phase === "ended") { $("endTxt").textContent = `Tvoj rezultat: ${totalScore(st)} poena (${st.solved}/${Q.length} zadataka).`; return show("end"); }
  if (phase !== "running") return show("wait");
  if (justSolved !== null) return renderOk();
  if (st.solved >= Q.length) { codeRow($("vaultRow")); $("vaultIn").value = ""; $("vfb").classList.add("hidden"); return show("vault"); }
  renderQuestion();
}

function drawLevels(cur) {
  const box = $("lvls");
  box.classList.toggle("hidden", st.mode !== "levels");
  if (st.mode !== "levels") return;
  box.innerHTML = LEVELS.map((L, k) => {
    const all = Q.filter(x => x.level === k), done = all.filter(x => Q.indexOf(x) < st.solved).length;
    const icon = k < cur ? "✅" : k === cur ? "▶" : "🔒";
    return `<span style="margin-right:14px;${k === cur ? "font-weight:bold;" : ""}">${icon} NIVO ${k + 1}: ${esc(L.name)} (${done}/${all.length})</span>`;
  }).join("");
}

function renderQuestion() {
  const i = st.solved, q = Q[i];
  if (!st.qStart) { st.qStart = Date.now(); save(); }
  $("qLabel").textContent = `ZADATAK ${String(i + 1).padStart(2, "0")} / ${String(Q.length).padStart(2, "0")}`;
  $("qInfo").textContent = `Pogrešni pokušaji: ${st.wrong[i]}`;
  $("pips").innerHTML = Q.map((_, k) => `<div class="pip${k < st.solved ? " on" : ""}"></div>`).join("");
  codeRow($("codeRow"));
  drawLevels(q.level);
  $("topic").textContent = q.topic; $("qTitle").textContent = q.title; $("qText").textContent = q.text;
  $("ans").value = ""; $("fb").classList.add("hidden");
  const hinted = st.hintQ.includes(i);
  $("hint").classList.toggle("hidden", !hinted);
  if (hinted) $("hint").textContent = "HINT: " + q.hint;
  $("hintBtn").disabled = hinted;
  show("q");
}

function renderOk() {
  const i = justSolved, q = Q[i];
  const nq = Q[i + 1], lvDone = st.mode === "levels" && (!nq || nq.level !== q.level);
  $("okTitle").textContent = `✓ TAČNO${q.digit ? " — CIFRA: " + q.digit : ""}  (+${st.pts[i]} poena)` + (lvDone ? `  🔓 NIVO ${q.level + 1} ZAVRŠEN` : "");
  $("okExplain").textContent = q.explain;
  $("okFormula").textContent = q.formula;
  $("nextBtn").textContent = i === Q.length - 1 ? (st.mode === "levels" ? "ZAVRŠI IGRU →" : "OTVORI TREZOR →")
    : lvDone ? `OTKLJUČAJ NIVO ${q.level + 2} →` : "SLEDEĆI ZADATAK →";
  show("ok");
}

$("joinBtn").onclick = async () => {
  const name = $("name").value.trim();
  if (name.length < 2) { $("joinErr").textContent = "Upiši ime tima (bar 2 znaka)."; return; }
  st = newState(name);
  st.mode = $("modeLevels").checked ? "levels" : "vault";
  st.solo = $("solo").checked; st.test = $("testMode").checked;
  Q = buildQuestions(st.mode, st.seed);
  if (st.test || st.solo) phase = "running";
  if (st.test && !st.solo) startBots();
  await save();
  render();
};

$("sendBtn").onclick = async () => {
  if (left("freeze") > 0) return;
  const v = $("ans").value.trim(); if (!v) return;
  const i = st.solved, q = Q[i];
  $("sendBtn").disabled = true;
  const ok = await checkAnswer(q, v);
  $("sendBtn").disabled = false;
  const fb = $("fb"); fb.classList.remove("hidden");
  if (ok) {
    const secs = (Date.now() - st.qStart) / 1000;
    st.pts[i] = qPoints(st.wrong[i], secs);
    if (q.digit) st.digits.push(q.digit); st.solved++; st.qStart = null;
    justSolved = i; await save(); render();
  } else {
    st.wrong[i]++; fb.className = "feedback bad";
    let pen = RULES.wrongPenalty, extra = "";
    if (left("fine") > 0) { st.fine += ATTACKS.fine.extra; pen += ATTACKS.fine.extra; extra = " 🔥 FIREWALL!"; }
    fb.textContent = `✗ Netačno (−${pen} poena).${extra} Razmisli da li je redosled bitan i da li se elementi ponavljaju.`;
    $("qInfo").textContent = `Pogrešni pokušaji: ${st.wrong[i]}`; $("ans").value = ""; await save();
  }
};
$("ans").addEventListener("keydown", e => { if (e.key === "Enter") $("sendBtn").click(); });

$("hintBtn").onclick = async () => {
  if (left("lock") > 0) return;
  const i = st.solved; if (st.hintQ.includes(i)) return;
  st.hintQ.push(i); st.hints++; await save(); renderQuestion(); applyEffects();
};

$("nextBtn").onclick = async () => {
  justSolved = null;
  if (st.mode === "levels" && st.solved >= Q.length && !st.finishedAt) { st.finishedAt = Date.now(); await save(); }
  render();
};

$("vaultBtn").onclick = async () => {
  if (left("freeze") > 0) return;
  const v = $("vaultIn").value.trim(); if (!v) return;
  if (await checkVault(v)) { st.finishedAt = Date.now(); await save(); render(); }
  else {
    st.vaultWrong++;
    let pen = RULES.vaultWrong;
    if (left("fine") > 0) { st.fine += ATTACKS.fine.extra; pen += ATTACKS.fine.extra; }
    const f = $("vfb"); f.classList.remove("hidden");
    f.textContent = `ACCESS DENIED (−${pen}). Proveri redosled cifara.`; await save();
  }
};
$("vaultIn").addEventListener("keydown", e => { if (e.key === "Enter") $("vaultBtn").click(); });

setInterval(() => {
  if (!st) return;
  if (!st.finishedAt) {
    const base = startedAt || st.joinedAt;
    $("clock").textContent = `VREME ${fmtTime(Date.now() - base)} · POENI ${totalScore(st)}`;
  }
  incoming = incoming.filter(a => a.at + ATTACKS[a.type].dur * 1000 > Date.now());
  applyEffects(); updateArsenal();
}, 500);

(async function init() {
  if (!configured) return show("cfg");
  buildArsenal();
  onAuthStateChanged(auth, async user => {
    if (!user) return;
    uid = user.uid;
    const snap = await getDoc(doc(db, "players", uid));
    if (snap.exists() && snap.data().st) st = snap.data().st;
    if (st) Q = buildQuestions(st.mode || "vault", st.seed);
    if (st && (st.test || st.solo)) { phase = "running"; if (st.test && !st.solo && !st.finishedAt) startBots(); }
    loaded = true; render();

    onSnapshot(doc(db, "game", "state"), s => {
      const d = s.exists() ? s.data() : { phase: "lobby" };
      realPhase = d.phase;
      phase = st && (st.test || st.solo) ? "running" : realPhase;
      startedAt = d.startedAt && d.startedAt.toMillis ? d.startedAt.toMillis() : null;
      getDoc(doc(db, "players", uid)).then(p => {
        if (!p.exists() && st && realPhase === "lobby") { stopBots(); st = null; phase = "lobby"; Q = []; justSolved = null; incoming = []; seen.clear(); }
        render();
      });
    });

    onSnapshot(collection(db, "players"), s => {
      targets = s.docs.filter(d => d.id !== uid && !d.data().finishedAt && !d.data().solo)
        .map(d => { const x = d.data(); return { id: d.id, name: x.name || "?", score: +x.score || 0, solved: +x.solved || 0 }; })
        .sort((a, b) => b.score - a.score);
      renderTargets(); updateArsenal();
    });

    onSnapshot(collection(db, "attacks"), s => {
      s.docChanges().forEach(ch => {
        if (ch.type !== "added") return;
        const a = { id: ch.doc.id, ...ch.doc.data() };
        if (a.to !== uid || !st || !ATTACKS[a.type] || seen.has(a.id)) return;
        seen.add(a.id);
        const fresh = Date.now() - a.at < 8000;
        if (a.at >= (st.shieldFrom || 0) && a.at <= (st.shieldUntil || 0)) {
          if (fresh) toast(`${SHIELD.icon} Štit je blokirao ${ATTACKS[a.type].name} od tima ${a.fromName}!`);
          return;
        }
        incoming.push(a);
        if (fresh) toast(`${ATTACKS[a.type].icon} ${a.fromName} te napada: ${ATTACKS[a.type].name}!`);
      });
      applyEffects();
    });
  });
  try { await signInAnonymously(auth); }
  catch (e) { show("load"); $("v-load").innerHTML = "<p style='color:var(--red)'>Greška pri prijavi: " + e.code + "<br>Proveri da li je Anonymous prijava uključena (TUTORIAL, korak 4).</p>"; }
})();
