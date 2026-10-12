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

// ------ NOVO: DOGAĐAJ ZA GOOGLE PRIJAVU ------
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

function listen() {
  unsubs.push(onSnapshot(doc(db, "game", "state"), s => {
    const d = s.exists() ? s.data() : { phase: "lobby" };
    $("phase").textContent = PH[d.phase] || d.phase;
  }));
  unsubs.push(onSnapshot(collection(db, "players"), s => {
    const rows = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.score || 0) - (a.score || 0));
    $("n").textContent = rows.length;
    $("rows").innerHTML = rows.length ? rows.map(p => {
      const fin = p.finishedAt ? " 🔓 " + fmtTime(p.finishedAt - p.joinedAt) : "";
      return `<tr><td>${esc(p.name || "?")}${fin}</td><td>${p.score || 0}</td><td>${p.solved || 0}/6</td>` +
             `<td><button class="danger" data-id="${p.id}" style="padding:6px 10px">✕</button></td></tr>`;
    }).join("") : '<tr><td colspan="4" class="small">Nema timova.</td></tr>';
  }));
}

$("rows").addEventListener("click", async e => {
  const id = e.target.dataset && e.target.dataset.id;
  if (!id || !confirm("Ukloniti ovaj tim?")) return;
  try { await deleteDoc(doc(db, "players", id)); } catch (er) { say("Greška: " + er.code, true); }
});

$("bReset").onclick = async () => {
  if (!confirm("Ovo briše SVE timove i vraća igru u lobby. Nastaviti?")) return;
  try {
    let removed = 0;
    for (const name of ["players", "attacks"]) {
      const snap = await getDocs(collection(db, name));
      if (name === "players") removed = snap.size;
      for (let i = 0; i < snap.docs.length; i += 400) {
        const b = writeBatch(db);
        snap.docs.slice(i, i + 400).forEach(d => b.delete(d.ref));
        await b.commit();
      }
    }
    await setPhase("lobby");
    say("Igra resetovana. Obrisano timova: " + removed);
  } catch (e) { say("Greška pri resetu: " + e.code, true); }
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
