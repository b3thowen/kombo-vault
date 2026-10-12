import { auth, db, configured, signInAnonymously, onAuthStateChanged, collection, doc, onSnapshot } from "./firebase.js";
import { fmtTime } from "./scoring.js";

const $ = id => document.getElementById(id);
const PH = { lobby: "LOBBY", running: "MISIJA U TOKU", ended: "ZAVRŠENO" };
let players = [], phase = "lobby", startedAt = null;

// QR kod koji vodi na igru (index.html u istom folderu)
const joinUrl = new URL("index.html", location.href).href;
$("info").textContent = "Priključi se: " + joinUrl;
try { new QRCode($("qr"), { text: joinUrl, width: 140, height: 140 }); $("qr").classList.remove("hidden"); } catch (e) {}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function draw() {
  $("phase").textContent = PH[phase] || phase;
  const rows = players.slice().sort((a, b) =>
    b.score - a.score || (a.finishedAt || Infinity) - (b.finishedAt || Infinity) || a.joinedAt - b.joinedAt);
  if (!rows.length) { $("rows").innerHTML = '<tr><td colspan="6" class="small">Čekamo timove…</td></tr>'; return; }
  $("rows").innerHTML = rows.map((p, i) => {
    const pips = Array.from({ length: 6 }, (_, k) => `<i class="${k < p.solved ? "on" : ""}"></i>`).join("");
    const time = p.finishedAt ? "🔓 " + fmtTime(p.finishedAt - p.joinedAt) : "—";
    return `<tr class="${i === 0 ? "r1" : ""}"><td class="rank">${i + 1}</td><td>${esc(p.name)}</td>` +
      `<td><div class="bar">${pips}</div></td><td>${p.score}</td><td>${time}</td><td>${p.attempts}</td></tr>`;
  }).join("");
}

setInterval(() => {
  const base = startedAt;
  $("clock").textContent = base && phase === "running" ? fmtTime(Date.now() - base) : "--:--";
}, 1000);

if (configured) {
  onAuthStateChanged(auth, user => {
    if (!user) return;
    onSnapshot(collection(db, "players"), s => {
      players = s.docs.map(d => { const x = d.data();
        return { name: x.name || "?", score: +x.score || 0, solved: +x.solved || 0, attempts: +x.attempts || 0,
                 joinedAt: x.joinedAt || 0, finishedAt: x.finishedAt || null }; });
      draw();
    });
    onSnapshot(doc(db, "game", "state"), s => {
      const d = s.exists() ? s.data() : { phase: "lobby" };
      phase = d.phase; startedAt = d.startedAt && d.startedAt.toMillis ? d.startedAt.toMillis() : null; draw();
    });
  });
  signInAnonymously(auth).catch(e => { $("info").textContent = "Greška prijave: " + e.code; });
} else { $("info").textContent = "Firebase nije podešen (firebase.js)."; }
