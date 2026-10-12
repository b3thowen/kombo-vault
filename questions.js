export const VAULT_HASH = "7d9f72009fa3335fbfbf940822a2883f5a25681df1e48ab6f6776be7e161619b";

export const Q = [
  {
    id: "q1",
    topic: "UREĐENI IZBOR SA PONAVLJANJEM",
    title: "01 // PIN KOD",
    text: "PIN ima 3 cifre, a cifre se biraju iz skupa {1, 2, 3, 4}. Cifre SMEJU da se ponavljaju. Koliko različitih PIN-ova postoji?",
    hint: "Svaka od 3 pozicije ima isti broj mogućnosti, jer se ništa ne 'troši'. Ovo je 3-permutacija multiskupa u kome se svaki element javlja 3 puta.",
    hash: "3a36d555299856c7b6545fcb0a5a2bba868f3c571fc8f9143d875046e0f47ea6",
    digit: "7",
    explain: "Svaka od m = 3 komponente se bira iz skupa od l = 4 elementa, uz dozvoljeno ponavljanje. Broj m-permutacija multiskupa je P̄(l; m) = l^m = 4³ = 64.",
    formula: "P̄(4; 3) = 4³ = 64"
  },
  {
    id: "q2",
    topic: "m-PERMUTACIJE SKUPA",
    title: "02 // PODIJUM",
    text: "Na takmičenju učestvuje 8 različitih trkača. Na koliko načina mogu biti raspoređena prva tri mesta (zlato, srebro, bronza)?",
    hint: "Redosled je bitan, a ista osoba ne može osvojiti dve medalje. Prvo mesto: 8 mogućnosti, zatim koliko ostaje?",
    hash: "35b0c68e00e888a39417b453de99428c841c15dc40687404ea7ea6ab7ea90c0b",
    digit: "3",
    explain: "Biramo uređenu trojku međusobno različitih elemenata iz skupa od n = 8 elemenata, to je m-permutacija skupa. P(n; m) = n(n−1)…(n−m+1) = 8·7·6 = 336.",
    formula: "P(8; 3) = 8·7·6 = 336"
  },
  {
    id: "q3",
    topic: "PERMUTACIJE MULTISKUPA",
    title: "03 // PETOCIFRENI KOD",
    text: "Koliko različitih petocifrenih kodova se dobija premeštanjem cifara 1, 1, 2, 2, 3 (svaku cifru koristimo tačno onoliko puta koliko je data)?",
    hint: "Kad bi sve cifre bile različite, bilo bi 5! rasporeda. Ali zamena dve jedinice (ili dve dvojke) ne daje novi kod.",
    hash: "bbd518c7ab3a44a16229b24e7f36bc77f02d3cd6fc134d665dee06f85ff0a818",
    digit: "9",
    explain: "M = [1, 2, 3] sa višestrukostima 2, 2, 1, pa je n = 5. Broj permutacija multiskupa je P̄(m₁, …, m_l) = n!/(m₁!·…·m_l!) = 5!/(2!·2!·1!) = 30.",
    formula: "P̄(2, 2, 1) = 5!/(2!·2!·1!) = 30"
  },
  {
    id: "q4",
    topic: "PODSKUPOVI",
    title: "04 // SKUP OD 7 ELEMENATA",
    text: "Koliko ukupno podskupova (uključujući prazan skup i ceo skup) ima skup B od 7 elemenata?",
    hint: "Za svaki element biramo: ulazi u podskup (1) ili ne ulazi (0). Postoji bijekcija P(B) → {0, 1}^7.",
    hash: "3f283e5aa6f6d066b1b624df53417d2c9efc1e0b4cfca033e22597452a0b8b2c",
    digit: "1",
    explain: "Preslikavanje φ: P(B) → {0, 1}^l koje elementu pridružuje nulu ili jedinicu je bijekcija, pa je broj podskupova jednak |{0, 1}^l| = 2^l. Za l = 7: 2⁷ = 128.",
    formula: "|P(B)| = 2⁷ = 128"
  },
  {
    id: "q5",
    topic: "m-KOMBINACIJE SKUPA",
    title: "05 // TIM OD TROJE",
    text: "Iz grupe od 7 studenata biramo tim od 3 osobe. Redosled nije bitan. Koliko različitih timova postoji?",
    hint: "Broj 3-permutacija je P(7; 3) = 7·6·5. Svaki tim je pritom prebrojan onoliko puta koliko ima načina da se uredi 3 osobe.",
    hash: "98738934d5b523c74a8b4f11dec69da1ac57f4c46386154bc0385ddb1b72a48b",
    digit: "4",
    explain: "Broj m-kombinacija skupa je C(n; m) = n(n−1)…(n−m+1)/m!. Za n = 7, m = 3: C(7; 3) = 7·6·5/3! = 35.",
    formula: "C(7; 3) = (7·6·5)/6 = 35"
  },
  {
    id: "q6",
    topic: "m-KOMBINACIJE MULTISKUPA // ZVEZDE I PREGRADE",
    title: "06 // JEDNAČINA",
    text: "Koliko rešenja u skupu nenegativnih celih brojeva ima jednačina x₁ + x₂ + x₃ = 4?",
    hint: "Rešenje se kodira nizom od n = 4 jedinice i m − 1 = 2 nule (nule su pregrade). Broji se koliko takvih nizova ima.",
    hash: "6a83a086eb632556831f1a98d407ba17cd229bcb48ef3176e2a91aea7c7e7ca8",
    digit: "8",
    explain: "Svako rešenje odgovara jednoj reči dužine n + m − 1 = 6 sa 4 jedinice i 2 nule. Njihov broj je P̄(n, m−1) = (n+m−1)!/(n!(m−1)!) = 6!/(4!·2!) = 15.",
    formula: "P̄(4, 2) = 6!/(4!·2!) = 15"
  }
];

export function norm(s) {
  const t = String(s).replace(/[\s.,]/g, "");
  return /^\d+$/.test(t) ? String(parseInt(t, 10)) : t.toLowerCase();
}

export async function sha(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export const checkAnswer = async (q, input) => (await sha(`kombo|${q.id}|${norm(input)}`)) === q.hash;

export const checkVault = async (input) => (await sha(`kombo|vault|${norm(input)}`)) === VAULT_HASH;
