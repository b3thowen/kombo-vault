export const VAULT_HASH = "7d9f72009fa3335fbfbf940822a2883f5a25681df1e48ab6f6776be7e161619b";
const VAULT_DIGITS = ["7", "3", "9", "1", "4", "8"];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const fact = n => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
const C = (n, k) => { let c = 1; for (let i = 1; i <= k; i++) c = c * (n - k + i) / i; return Math.round(c); };
const seq = n => Array.from({ length: n }, (_, i) => i + 1).join(", ");
const rec = counts => counts.map(c => c + "!").join("·");
const WORD3 = { 2: "dve", 3: "tri", 4: "četiri" };

const GEN = {
  pin: { topic: "UREĐENI IZBOR SA PONAVLJANJEM", title: "PIN KOD", gen(r) {
    const l = ri(r, 3, 6), m = ri(r, 3, 4), a = l ** m;
    return { text: `PIN ima ${m} cifre, a cifre se biraju iz skupa {${seq(l)}}. Cifre SMEJU da se ponavljaju. Koliko različitih PIN-ova postoji?`,
      hint: `Svaka od ${m} pozicija ima isti broj mogućnosti (${l}), jer se ništa ne 'troši'. Ovo je ${m}-permutacija multiskupa u kome se svaki element javlja ${m} puta.`,
      answer: a, explain: `Svaka od m = ${m} komponenti se bira iz skupa od l = ${l} elemenata, uz ponavljanje. Broj m-permutacija multiskupa je P̄(l; m) = l^m = ${l}^${m} = ${a}.`,
      formula: `P̄(${l}; ${m}) = ${l}^${m} = ${a}` };
  } },
  podium: { topic: "m-PERMUTACIJE SKUPA", title: "PODIJUM", gen(r) {
    const n = ri(r, 6, 12), a = n * (n - 1) * (n - 2);
    return { text: `Na takmičenju učestvuje ${n} različitih trkača. Na koliko načina mogu biti raspoređena prva tri mesta (zlato, srebro, bronza)?`,
      hint: `Redosled je bitan, a ista osoba ne može osvojiti dve medalje. Prvo mesto: ${n} mogućnosti, zatim koliko ostaje?`,
      answer: a, explain: `Biramo uređenu trojku međusobno različitih elemenata iz skupa od n = ${n} elemenata, to je m-permutacija skupa. P(n; m) = n(n−1)…(n−m+1) = ${n}·${n - 1}·${n - 2} = ${a}.`,
      formula: `P(${n}; 3) = ${n}·${n - 1}·${n - 2} = ${a}` };
  } },
  digits: { topic: "PERMUTACIJE MULTISKUPA", title: "KOD OD CIFARA", gen(r) {
    let counts, n, k, tries = 0;
    do { k = ri(r, 3, 4); counts = Array.from({ length: k }, () => ri(r, 1, 3)); n = counts.reduce((x, y) => x + y, 0); }
    while (++tries < 50 && !(n >= 5 && n <= 8 && counts.some(c => c > 1)));
    if (tries >= 50) { counts = [2, 2, 1]; n = 5; k = 3; }
    const list = counts.map((c, i) => Array(c).fill(i + 1).join(", ")).join(", ");
    const a = fact(n) / counts.reduce((p, c) => p * fact(c), 1);
    return { text: `Koliko različitih kodova od ${n} cifara se dobija premeštanjem cifara ${list} (svaku cifru koristimo tačno onoliko puta koliko je data)?`,
      hint: `Kad bi sve cifre bile različite, bilo bi ${n}! rasporeda. Ali zamena istih cifara ne daje novi kod.`,
      answer: a, explain: `M je multiskup sa višestrukostima ${counts.join(", ")}, pa je n = ${n}. Broj permutacija multiskupa je n!/(m₁!·…·m_l!) = ${n}!/(${rec(counts)}) = ${a}.`,
      formula: `P̄(${counts.join(", ")}) = ${n}!/(${rec(counts)}) = ${a}` };
  } },
  word: { topic: "PERMUTACIJE MULTISKUPA", title: "REČ", gen(r) {
    const W = ["MAMA", "BABA", "BANANA", "ANANAS", "ABRAKADABRA", "MATEMATIKA", "KOKOŠKA"];
    const w = W[ri(r, 0, W.length - 1)], cnt = {};
    for (const ch of w) cnt[ch] = (cnt[ch] || 0) + 1;
    const counts = Object.values(cnt), n = w.length, a = fact(n) / counts.reduce((p, c) => p * fact(c), 1);
    return { text: `Koliko različitih reči (nizova slova, ne moraju imati smisla) se može napisati premeštanjem slova reči ${w}?`,
      hint: `Kad bi sva slova bila različita, bilo bi ${n}! rasporeda. Zamena istih slova ne daje novu reč, pa podeli za svako slovo koje se ponavlja.`,
      answer: a, explain: `Slova reči ${w} čine multiskup sa višestrukostima ${counts.join(", ")}, n = ${n}. P̄ = n!/(m₁!·…·m_l!) = ${n}!/(${rec(counts)}) = ${a}.`,
      formula: `${n}!/(${rec(counts)}) = ${a}` };
  } },
  books: { topic: "PERMUTACIJE SKUPA", title: "KNJIGE NA POLICI", gen(r) {
    const n = ri(r, 4, 8), a = fact(n);
    return { text: `Na koliko načina se ${n} različitih knjiga može rasporediti na polici?`,
      hint: `Redosled je bitan i svaka knjiga se koristi tačno jednom.`,
      answer: a, explain: `Raspored n različitih elemenata je permutacija skupa: P(n) = n! = ${n}! = ${a}.`, formula: `P(${n}) = ${n}! = ${a}` };
  } },
  subsets: { topic: "PODSKUPOVI", title: "PODSKUPOVI", gen(r) {
    const n = ri(r, 5, 12), a = 2 ** n;
    return { text: `Koliko ukupno podskupova (uključujući prazan skup i ceo skup) ima skup B od ${n} elemenata?`,
      hint: `Za svaki element biramo: ulazi u podskup (1) ili ne ulazi (0). Postoji bijekcija P(B) → {0, 1}^${n}.`,
      answer: a, explain: `Preslikavanje φ: P(B) → {0, 1}^l je bijekcija, pa je broj podskupova |{0, 1}^l| = 2^l. Za l = ${n}: 2^${n} = ${a}.`, formula: `|P(B)| = 2^${n} = ${a}` };
  } },
  team: { topic: "m-KOMBINACIJE SKUPA", title: "TIM", gen(r) {
    const n = ri(r, 6, 12), m = ri(r, 2, 4), a = C(n, m);
    return { text: `Iz grupe od ${n} studenata biramo tim od ${m} osobe. Redosled nije bitan. Koliko različitih timova postoji?`,
      hint: `Broj ${m}-permutacija je P(${n}; ${m}). Svaki tim je prebrojan onoliko puta koliko ima načina da se uredi ${m} osobe, tj. ${m}! puta.`,
      answer: a, explain: `Broj m-kombinacija skupa je C(n; m) = n(n−1)…(n−m+1)/m!. Za n = ${n}, m = ${m}: C(${n}; ${m}) = ${a}.`, formula: `C(${n}; ${m}) = P(${n}; ${m})/${m}! = ${a}` };
  } },
  diag: { topic: "m-KOMBINACIJE SKUPA", title: "DIJAGONALE", gen(r) {
    const n = ri(r, 6, 12), a = n * (n - 3) / 2;
    return { text: `Koliko dijagonala ima konveksni mnogougao sa ${n} stranica?`,
      hint: `Svaki par temena određuje jednu duž. Sve duži osim stranica su dijagonale.`,
      answer: a, explain: `Broj duži je C(n; 2). Oduzimamo n stranica: C(${n}; 2) − ${n} = ${C(n, 2)} − ${n} = ${a}, tj. n(n−3)/2.`, formula: `C(${n}; 2) − ${n} = ${a}` };
  } },
  eq: { topic: "ZVEZDE I PREGRADE", title: "JEDNAČINA", gen(r) {
    const m = ri(r, 3, 5), n = ri(r, 4, 9), a = C(n + m - 1, m - 1);
    const vars = Array.from({ length: m }, (_, i) => "x" + "₁₂₃₄₅₆₇₈₉"[i]).join(" + ");
    return { text: `Koliko rešenja u skupu nenegativnih celih brojeva ima jednačina ${vars} = ${n}?`,
      hint: `Rešenje se kodira nizom od n = ${n} jedinice i m − 1 = ${m - 1} nula (nule su pregrade). Broji se koliko takvih nizova ima.`,
      answer: a, explain: `Svako rešenje odgovara jednoj reči dužine n + m − 1 = ${n + m - 1} sa ${n} jedinica i ${m - 1} nula. Njihov broj je (n+m−1)!/(n!(m−1)!) = ${n + m - 1}!/(${n}!·${m - 1}!) = ${a}.`,
      formula: `P̄(${n}, ${m - 1}) = ${n + m - 1}!/(${n}!·${m - 1}!) = ${a}` };
  } },
  ice: { topic: "m-KOMBINACIJE MULTISKUPA", title: "SLADOLED", gen(r) {
    const l = ri(r, 3, 5), m = ri(r, 3, 6), a = C(m + l - 1, m);
    return { text: `Biramo ${m} kugl${m < 5 ? "e" : "i"} sladoleda od ${l} ukusa. Ukusi mogu da se ponavljaju, a redosled kugli nije bitan. Koliko različitih izbora postoji?`,
      hint: `Izbor sa ponavljanjem: C̄(l; m) = (m + l − 1)! / (m!(l − 1)!).`,
      answer: a, explain: `Biramo m = ${m} kugli od l = ${l} ukusa, uz ponavljanje i bez značaja redosleda. C̄(l; m) = (m+l−1)!/(m!(l−1)!) = ${m + l - 1}!/(${m}!·${l - 1}!) = ${a}.`,
      formula: `C̄(${l}; ${m}) = C(${m + l - 1}; ${m}) = ${a}` };
  } }
};

const VAULT = ["pin", "podium", "digits", "subsets", "team", "eq"];
export const LEVELS = [
  { name: "Osnove",            qs: ["pin", "subsets"] },
  { name: "Permutacije",       qs: ["books", "podium", "word"] },
  { name: "Kombinacije",       qs: ["team", "diag"] },
  { name: "Zvezde i pregrade", qs: ["eq", "ice"] }
];

export function buildQuestions(mode, seed) {
  const list = mode === "levels"
    ? LEVELS.flatMap((L, li) => L.qs.map(k => ({ k, li })))
    : VAULT.map(k => ({ k, li: 0 }));
  return list.map((o, i) => {
    const d = GEN[o.k], g = d.gen(rng((seed >>> 0) + i * 7919));
    return { id: o.k + i, topic: d.topic, title: String(i + 1).padStart(2, "0") + " // " + d.title,
             digit: mode === "levels" ? null : VAULT_DIGITS[i], level: o.li, ...g };
  });
}

function f(n) { return Number.isInteger(n) && n >= 0 && n <= 30 ? fact(n) : NaN; }
function binom(n, k) { return Number.isInteger(n) && Number.isInteger(k) && k >= 0 && k <= n && n <= 1000 ? C(n, k) : NaN; }
function perm(n, k) { return Number.isInteger(n) && Number.isInteger(k) && k >= 0 && k <= n && n <= 30 ? fact(n) / fact(n - k) : NaN; }
const FN = { c: binom, binom, ncr: binom, p: perm, v: perm, fact: f };

export function evalExpr(src) {
  let s = String(src).replace(/\*\*/g, "^").replace(/[×·⋅]/g, "*").replace(/[÷:]/g, "/").replace(/[−–]/g, "-")
                     .replace(/\s+/g, "").toLowerCase();
  let i = 0;
  const peek = () => s[i];
  const num = () => { const m = /^\d+/.exec(s.slice(i)); if (!m) throw 0; i += m[0].length; return parseInt(m[0], 10); };
  function expr() { let v = term(); while (peek() === "+" || peek() === "-") { const o = s[i++], t = term(); v = o === "+" ? v + t : v - t; } return v; }
  function term() { let v = unary(); while (peek() === "*" || peek() === "/") { const o = s[i++], t = unary(); v = o === "*" ? v * t : v / t; } return v; }
  function unary() { if (peek() === "-") { i++; return -unary(); } return pow(); }
  function pow() { const b = post(); if (peek() === "^") { i++; return Math.pow(b, unary()); } return b; }
  function post() { let v = prim(); while (peek() === "!") { i++; v = f(v); } return v; }
  function prim() {
    if (peek() === "(") { i++; const v = expr(); if (s[i++] !== ")") throw 0; return v; }
    if (/[a-z]/.test(peek() || "")) {
      const name = /^[a-z]+/.exec(s.slice(i))[0]; i += name.length;
      const fn = FN[name]; if (!fn || s[i++] !== "(") throw 0;
      const args = [expr()];
      while (s[i] === "," || s[i] === ";") { i++; args.push(expr()); }
      if (s[i++] !== ")") throw 0;
      return fn(...args);
    }
    return num();
  }
  try { const v = expr(); return i === s.length ? v : NaN; } catch (e) { return NaN; }
}

export function checkAnswer(q, input) {
  const t = String(input).trim();
  const v = /^[\d\s.,]+$/.test(t) ? Number(t.replace(/[\s.,]/g, "")) : evalExpr(t);
  return Number.isFinite(v) && Math.abs(v - q.answer) <= 1e-9 * Math.max(1, Math.abs(q.answer));
}

export function norm(s) {
  const t = String(s).replace(/[\s.,]/g, "");
  return /^\d+$/.test(t) ? String(parseInt(t, 10)) : t.toLowerCase();
}
export async function sha(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
export const checkVault = async (input) => (await sha(`kombo|vault|${norm(input)}`)) === VAULT_HASH;
