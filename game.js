import { auth, db, configured, signInAnonymously, onAuthStateChanged, doc, setDoc, getDoc, onSnapshot, serverTimestamp } from "./firebase.js";
import { Q, checkAnswer, checkVault } from "./questions.js";
import { newState, totalScore, attempts, qPoints, RULES, fmtTime } from "./scoring.js";

const $ = id => document.getElementById(id);
const VIEWS = ["load", "join", "wait", "q", "ok", "vault", "done", "end", "cfg"];
const show = v => VIEWS.forEach(x => $("v-" + x).classList.toggle("hidden", x !== v));

let uid = null, st = null, phase = "lobby", startedAt = null, justSolved = null, loaded = false;

async function save() {
  if (!uid || !st) return;
  const data = {
    name: st.name, score: totalScore(st), solved: st.solved, attempts: attempts(st),
    hints: st.hints, joinedAt: st.joinedAt, finishedAt: st.finishedAt, st,
    updatedAt: serverTimestamp()
  };
  try { await setDoc(doc(db, "players", uid), data); }
  catch (e) { console.error(e); $("clock").textContent = "⚠ greška pri slanju rezultata"; }
}

function codeRow(el, total = 6) {
  el.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const d = document.createElement("div");
    d.className = "digit" + (st.digits[i] ? "" : " empty");
    d.textContent = st.digits[i] || "?";
    el.appendChild(d);
  }
}

function render() {
  if (!loaded) return show("load");
  if (!st) return show("join");
  $("team").textContent = "TIM: " + st.name;
  if (st.finishedAt) {
    $("doneTxt").textContent = `Trezor je otključan za ${fmtTime(st.finishedAt - st.joinedAt)}. Konačan rezultat: ${totalScore(st)} poena.`;
    return show("done");
  }
  if (phase === "ended") { $("endTxt").textContent = `Tvoj rezultat: ${totalScore(st)} poena (${st.solved}/6 zadataka).`; return show("end"); }
  if (phase !== "running") return show("wait");
  if (justSolved !== null) return renderOk();
  if (st.solved >= Q.length) { codeRow($("vaultRow")); $("vaultIn").value = ""; $("vfb").classList.add("hidden"); return show("vault"); }
  renderQuestion();
}

function renderQuestion() {
  const i = st.solved, q = Q[i];
  if (!st.qStart) { st.qStart = Date.now(); save(); }
  $("qLabel").textContent = `ZADATAK ${String(i + 1).padStart(2, "0")} / ${String(Q.length).padStart(2, "0")}`;
  $("qInfo").textContent = `Pogrešni pokušaji: ${st.wrong[i]}`;
  $("pips").innerHTML = Q.map((_, k) => `<div class="pip${k < st.solved ? " on" : ""}"></div>`).join("");
  codeRow($("codeRow"));
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
  $("okTitle").textContent = `✓ TAČNO — CIFRA: ${q.digit}  (+${st.pts[i]} poena)`;
  $("okExplain").textContent = q.explain;
  $("okFormula").textContent = q.formula;
  $("nextBtn").textContent = i === Q.length - 1 ? "OTVORI TREZOR →" : "SLEDEĆI ZADATAK →";
  show("ok");
}

$("joinBtn").onclick = async () => {
  const name = $("name").value.trim();
  if (name.length < 2) { $("joinErr").textContent = "Upiši ime tima (bar 2 znaka)."; return; }
  st = newState(name);
  await save();
  render();
};

$("sendBtn").onclick = async () => {
  const v = $("ans").value.trim(); if (!v) return;
  const i = st.solved, q = Q[i];
  $("sendBtn").disabled = true;
  const ok = await checkAnswer(q, v);
  $("sendBtn").disabled = false;
  const fb = $("fb"); fb.classList.remove("hidden");
  if (ok) {
    const secs = (Date.now() - st.qStart) / 1000;
    st.pts[i] = qPoints(st.wrong[i], secs);
    st.digits.push(q.digit); st.solved++; st.qStart = null;
    justSolved = i; await save(); render();
  } else {
    st.wrong[i]++; fb.className = "feedback bad";
    fb.textContent = `✗ Netačno (−${RULES.wrongPenalty} poena). Razmisli da li je redosled bitan i da li se elementi ponavljaju.`;
    $("qInfo").textContent = `Pogrešni pokušaji: ${st.wrong[i]}`; $("ans").value = ""; await save();
  }
};
$("ans").addEventListener("keydown", e => { if (e.key === "Enter") $("sendBtn").click(); });

$("hintBtn").onclick = async () => {
  const i = st.solved; if (st.hintQ.includes(i)) return;
  st.hintQ.push(i); st.hints++; await save(); renderQuestion();
};

$("nextBtn").onclick = () => { justSolved = null; render(); };

$("vaultBtn").onclick = async () => {
  const v = $("vaultIn").value.trim(); if (!v) return;
  if (await checkVault(v)) { st.finishedAt = Date.now(); await save(); render(); }
  else { st.vaultWrong++; const f = $("vfb"); f.classList.remove("hidden");
    f.textContent = `ACCESS DENIED (−${RULES.vaultWrong}). Proveri redosled cifara.`; await save(); }
};
$("vaultIn").addEventListener("keydown", e => { if (e.key === "Enter") $("vaultBtn").click(); });

setInterval(() => {
  if (!st || st.finishedAt) return;
  const base = startedAt || st.joinedAt;
  $("clock").textContent = `VREME ${fmtTime(Date.now() - base)} · POENI ${totalScore(st)}`;
}, 1000);

(async function init() {
  if (!configured) return show("cfg");
  onAuthStateChanged(auth, async user => {
    if (!user) return;
    uid = user.uid;
    const snap = await getDoc(doc(db, "players", uid));
    if (snap.exists() && snap.data().st) st = snap.data().st;
    loaded = true; render();
    onSnapshot(doc(db, "game", "state"), s => {
      const d = s.exists() ? s.data() : { phase: "lobby" };
      phase = d.phase;
      startedAt = d.startedAt && d.startedAt.toMillis ? d.startedAt.toMillis() : null;
      // admin je resetovao igru: igrač koji više ne postoji na serveru kreće ispočetka
      getDoc(doc(db, "players", uid)).then(p => { if (!p.exists() && st && phase === "lobby") { st = null; justSolved = null; } render(); });
    });
  });
  try { await signInAnonymously(auth); }
  catch (e) { show("load"); $("v-load").innerHTML = "<p style='color:var(--red)'>Greška pri prijavi: " + e.code + "<br>Proveri da li je Anonymous prijava uključena (TUTORIAL, korak 4).</p>"; }
})();
