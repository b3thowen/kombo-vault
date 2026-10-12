export const RULES = {
  base: 100,          // tačno rešen zadatak
  firstTry: 30,       // bonus ako je prvi pokušaj tačan
  secondTry: 15,      // bonus ako je drugi pokušaj tačan
  wrongPenalty: 5,    // svaki pogrešan pokušaj
  timeMax: 50,        // maksimalni vremenski bonus po zadatku
  timeWindow: 90,     // sekundi u kojima bonus linearno opada na 0
  hintPenalty: 10,    // cena jednog hinta
  vaultWrong: 5,      // pogrešan unos šifre trezora
  vaultBonus: 100     // otključan sef/trezor
};

export function qPoints(wrong, seconds) {
  const R = RULES;
  const tries = wrong === 0 ? R.firstTry : wrong === 1 ? R.secondTry : 0;
  const time = Math.round(R.timeMax * Math.max(0, 1 - seconds / R.timeWindow));
  return Math.max(0, R.base + tries + time - R.wrongPenalty * wrong);
}

export function newState(name) {
  return { name, joinedAt: Date.now(), solved: 0, digits: [], pts: [], wrong: [0, 0, 0, 0, 0, 0],
           hints: 0, hintQ: [], vaultWrong: 0, qStart: null, finishedAt: null };
}

export function totalScore(st) {
  const R = RULES;
  const sum = st.pts.reduce((a, b) => a + b, 0);
  const bonus = st.finishedAt ? R.vaultBonus : 0;
  return Math.max(0, sum - R.hintPenalty * st.hints - R.vaultWrong * st.vaultWrong + bonus);
}

export function attempts(st) {
  return st.wrong.reduce((a, b) => a + b, 0) + st.solved + st.vaultWrong;
}

export function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}
