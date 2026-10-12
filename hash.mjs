// Koristi: node tools/hash.mjs <id> <odgovor>
//   node tools/hash.mjs q1 64        -> heš za pitanje q1
//   node tools/hash.mjs vault 739148 -> heš za šifru trezora
// Rezultat nalepi u questions.js (polje hash, odnosno VAULT_HASH).
import { createHash } from "node:crypto";
const [id, ...rest] = process.argv.slice(2);
if (!id || !rest.length) { console.log("Upotreba: node tools/hash.mjs <id|vault> <odgovor>"); process.exit(1); }
const t = rest.join("").replace(/[\s.,]/g, "");
const ans = /^\d+$/.test(t) ? String(parseInt(t, 10)) : t.toLowerCase();
console.log(createHash("sha256").update(`kombo|${id}|${ans}`).digest("hex"));
