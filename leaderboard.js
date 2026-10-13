import { auth, db, configured, signInAnonymously, onAuthStateChanged, collection, doc, onSnapshot } from "./firebase.js";
import { fmtTime, ATTACKS } from "./scoring.js";

const $ = id => document.getElementById(id);
const PH = { lobby: "LOBBY", running: "MISIJA U TOKU", ended: "ZAVRŠENO" };
let players = [], phase = "lobby", startedAt = null, attacks = [];

const joinUrl = new URL("index.html", location.href).href;
$("info").textContent = "Priključi se: " + joinUrl;
try { new QRCode($("qr"), { text: joinUrl, width: 140, height: 140 }); $("qr").classList.remove("hidden"); } catch (e) {}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function drawFeed() {
  const last = attacks.slice().sort((a, b) => b.at - a.at).slice(0, 6);
  $("feed").innerHTML = last.length
    ? last.map(a => { const A = ATTACKS[a.type]; if (!A) return "";
        return `<div class="feed-row">${A.icon} <b>${esc(a.fromName)}</b> → <b>${esc(a.toName)}</b> <span class="small">${A.name}</span></div>`; }).join("")
    : '<div class="small">Još nema sabotaža… mir pre oluje.</div>';
}

function draw() {
  $("phase").textContent = PH[phase] || phase;
  const rows = players.filter(p => !p.solo).sort((a, b) =>
    b.score - a.score || (a.finishedAt || Infinity) - (b.finishedAt || Infinity) || a.joinedAt - b.joinedAt);
  if (!rows.length) { $("rows").innerHTML = '<tr><td colspan="6" class="small">Čekamo timove…</td></tr>'; return; }
  $("rows").innerHTML = rows.map((p, i) => {
    const pips = Array.from({ length: p.total }, (_, k) => `<i class="${k < p.solved ? "on" : ""}"></i>`).join("");
    const time = p.finishedAt ? "🔓 " + fmtTime(p.finishedAt - p.joinedAt) : "—";
    const sab = (p.sab ? ` <span class="small">⚔${p.sab}</span>` : "") + (p.mode === "levels" ? ` <span class="small">nivo ${p.level}</span>` : "");
    return `<tr class="${i === 0 ? "r1" : ""}"><td class="rank">${i + 1}</td><td>${esc(p.name)}${sab}</td>` +
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
                 sab: +x.sabotages || 0, joinedAt: x.joinedAt || 0, finishedAt: x.finishedAt || null,
                 total: +x.total || 6, level: +x.level || 1, mode: x.mode || "vault", solo: !!x.solo }; });
      draw();
    });
    onSnapshot(collection(db, "attacks"), s => {
      attacks = s.docs.map(d => d.data()); drawFeed();
    });
    onSnapshot(doc(db, "game", "state"), s => {
      const d = s.exists() ? s.data() : { phase: "lobby" };
      phase = d.phase; startedAt = d.startedAt && d.startedAt.toMillis ? d.startedAt.toMillis() : null; draw();
    });
  });
  signInAnonymously(auth).catch(e => { $("info").textContent = "Greška prijave: " + e.code; });
} else { $("info").textContent = "Firebase nije podešen (firebase.js)."; }
