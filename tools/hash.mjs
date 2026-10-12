import { createHash } from "node:crypto";
const [id, ...rest] = process.argv.slice(2);
if (!id || !rest.length) { console.log("Upotreba: node tools/hash.mjs <id|vault> <odgovor>"); process.exit(1); }
const t = rest.join("").replace(/[\s.,]/g, "");
const ans = /^\d+$/.test(t) ? String(parseInt(t, 10)) : t.toLowerCase();
console.log(createHash("sha256").update(`kombo|${id}|${ans}`).digest("hex"));
