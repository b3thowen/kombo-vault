import { auth, db, configured, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
         doc, setDoc, onSnapshot, collection, getDocs, deleteDoc, serverTimestamp, writeBatch } from "./firebase.js";
import { fmtTime } from "./scoring.js";

const $ = id => document.getElementById(id);
const PH = { lobby: "LOBBY (čeka se start)", running: "MISIJA U TOKU", ended: "ZAVRŠENO" };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const say = (t, bad) => { $("msg").textContent = t; $("msg").style.color = bad ? "var(--red)" : "var(--muted)"; };

let unsubs = [];

async function setPhase(phase) {
  try {
    const data = { phase, updatedAt: serverTimestamp() };
    if (phase === "running") data.startedAt = serverTimestamp();
    if (phase === "lobby") data.startedAt = null;
    await setDoc(doc(db, "game", "state"), data, { merge: true });
    say("OK: " + phase);
  } catch (e) {
    say("Greška: " + e.code + " — da li je tvoj email upisan u firestore.rules?", true);
  }
}

$("gBtn").onclick = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e) {
    say("Greška pri prijavi: " + e.message, true);
  }
};

$("bLobby").onclick = () => setPhase("lobby");
$("bStart").onclick = () => setPhase("running");
$("bStop").onclick = () => setPhase("ended");

let hist = [], openId = null;
const KIND = { group: "grupna", solo: "solo", test: "test" };
const fmtDate = ms => ms ? new Date(ms).toLocaleString("sr-Latn-RS") : "-";

function detail(h) {
  const wrong = h.attempts - h.solved - (h.vaultWrong || 0);
  const head = `<div class="small">Pogrešni pokušaji: ${wrong} · Pogrešna šifra: ${h.vaultWrong || 0} · Hintovi: ${h.hints} · ` +
               `Sabotaže: ${h.sabotages} · Potrošeno na napade: ${h.spent}</div>`;
  const qs = (h.qs || []).map(q =>
    `<div style="margin-top:8px"><b>${esc(q.t)}</b> ${q.s ? "✓" : "✗ nije rešen"} · pogrešnih: ${q.w} · hint: ${q.h ? "da" : "ne"} · poena: ${q.p}` +
    `<div class="small">${esc(q.x)} (tačan odgovor: ${esc(q.a)})</div></div>`).join("");
  return head + qs;
}

function drawHist() {
  const f = $("hf").value;
  const rows = hist.filter(h => !f || h.kind === f).sort((a, b) => b.joinedAt - a.joinedAt);
  $("hn").textContent = rows.length;
  $("hrows").innerHTML = rows.length ? rows.map(h => {
    const status = h.finishedAt ? "završeno " + fmtTime(h.finishedAt - h.joinedAt) : "nije završeno";
    let r = `<tr class="hrow" data-h="${h.id}" style="cursor:pointer"><td>${esc(h.name)}</td>` +
            `<td>${KIND[h.kind] || h.kind} · ${h.mode === "levels" ? "nivoi" : "trezor"}</td><td>${fmtDate(h.joinedAt)}</td>` +
            `<td>${h.score}</td><td>${h.solved}/${h.total}</td><td>${status}</td>` +
            `<td><button class="danger" data-hdel="${h.id}" style="padding:6px 10px">✕</button></td></tr>`;
    if (h.id === openId) r += `<tr><td colspan="7">${detail(h)}</td></tr>`;
    return r;
  }).join("") : '<tr><td colspan="7" class="small">Još nema zabeleženih igara.</td></tr>';
}

$("hf").onchange = drawHist;
$("hrows").addEventListener("click", async e => {
  const del = e.target.dataset && e.target.dataset.hdel;
  if (del) {
    if (!confirm("Obrisati ovaj zapis iz istorije?")) return;
    try { await deleteDoc(doc(db, "history", del)); } catch (er) { say("Greška pri brisanju: " + er.code, true); }
    return;
  }
  const tr = e.target.closest("tr.hrow");
  if (tr) { openId = openId === tr.dataset.h ? null : tr.dataset.h; drawHist(); }
});

$("hClear").onclick = async () => {
  if (!confirm("Ovo trajno briše CELU istoriju igara. Nastaviti?")) return;
  try {
    const snap = await getDocs(collection(db, "history"));
    for (let i = 0; i < snap.docs.length; i += 400) {
      const b = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach(d => b.delete(d.ref));
      await b.commit();
    }
    say("Istorija obrisana.");
  } catch (e) { say("Greška: " + e.code, true); }
};

$("hCsv").onclick = () => {
  const q = v => '"' + String(v).replace(/"/g, '""') + '"';
  const lines = [["tim", "vrsta", "nacin", "pocetak", "trajanje_s", "poeni", "reseno", "ukupno", "pokusaji", "hintovi", "sabotaze", "zavrseno"].join(",")]
    .concat(hist.slice().sort((a, b) => a.joinedAt - b.joinedAt).map(h => [
      q(h.name), h.kind, h.mode, q(fmtDate(h.joinedAt)), h.finishedAt ? Math.round((h.finishedAt - h.joinedAt) / 1000) : "",
      h.score, h.solved, h.total, h.attempts, h.hints, h.sabotages, h.finishedAt ? "da" : "ne"].join(",")));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  a.download = "istorija-igara.csv"; a.click();
};

function listen() {
  unsubs.push(onSnapshot(collection(db, "history"), s => { hist = s.docs.map(d => ({ id: d.id, ...d.data() })); drawHist(); }));
  unsubs.push(onSnapshot(doc(db, "game", "state"), s => {
    const d = s.exists() ? s.data() : { phase: "lobby" };
    $("phase").textContent = PH[d.phase] || d.phase;
  }));
  unsubs.push(onSnapshot(collection(db, "players"), s => {
    const rows = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.score || 0) - (a.score || 0));
    $("n").textContent = rows.length;
    $("rows").innerHTML = rows.length ? rows.map(p => {
      const fin = p.finishedAt ? " 🔓 " + fmtTime(p.finishedAt - p.joinedAt) : "";
      return `<tr><td>${esc(p.name || "?")}${fin}</td><td>${p.score || 0}</td><td>${p.solved || 0}/${p.total || 6}</td>` +
             `<td><button class="danger" data-id="${p.id}" style="padding:6px 10px">✕</button></td></tr>`;
    }).join("") : '<tr><td colspan="4" class="small">Nema timova.</td></tr>';
  }));
}

$("rows").addEventListener("click", async e => {
  const id = e.target.dataset && e.target.dataset.id;
  if (!id || !confirm("Ukloniti ovaj tim?")) return;
  try { await deleteDoc(doc(db, "players", id)); }
  catch (er) { say("Greška pri brisanju: " + er.code + " — email u pravilima se ne poklapa sa prijavljenim nalogom.", true); }
});

$("bReset").onclick = async () => {
  if (!confirm("Ovo briše SVE timove i vraća igru u lobby (istorija igara ostaje sačuvana). Nastaviti?")) return;
  const errs = [];
  let removed = 0;
  for (const name of ["players", "attacks"]) {
    try {
      const snap = await getDocs(collection(db, name));
      if (name === "players") removed = snap.size;
      for (let i = 0; i < snap.docs.length; i += 400) {
        const b = writeBatch(db);
        snap.docs.slice(i, i + 400).forEach(d => b.delete(d.ref));
        await b.commit();
      }
    } catch (e) { errs.push(name + ": " + e.code); }
  }
  await setPhase("lobby");
  if (errs.length) say("Delimična greška → " + errs.join(", "), true);
  else say("Igra resetovana. Obrisano timova: " + removed);
};

if (!configured) {
  $("who").textContent = "Firebase nije podešen (firebase.js)";
} else {
  onAuthStateChanged(auth, user => {
    unsubs.forEach(u => u()); unsubs = [];
    const real = user && !user.isAnonymous;
    $("login").classList.toggle("hidden", !!real);
    $("panel").classList.toggle("hidden", !real);
    $("who").textContent = real ? user.email : "nisi prijavljen";
    if (real) listen();
  });
}
