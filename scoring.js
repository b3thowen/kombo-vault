export const RULES = {
  base: 100,
  firstTry: 30,
  secondTry: 15,
  wrongPenalty: 5,
  timeMax: 50,
  timeWindow: 90,
  hintPenalty: 10,
  vaultWrong: 5,
  vaultBonus: 100
};

export const ATTACKS = {
  freeze: { icon: "❄", name: "ZAMRZNI",        cost: 100, dur: 10, desc: "Protivnik ne može da šalje odgovore 20 s" },
  blur:   { icon: "🌫", name: "ZAMAGLI",        cost: 67, dur: 17, desc: "Tekst zadatka im se zamuti 40 s" },
  fine:   { icon: "🔥", name: "FIREWALL",       cost: 145, dur: 30, extra: 15, desc: "Svaki njihov pogrešan odgovor košta +15 poena, 30 s" },
  lock:   { icon: "🔒", name: "BLOKIRAJ HINT",  cost: 200, dur: 90, desc: "Ne mogu da otvore hint 90 s" }
};
export const SHIELD = { icon: "🛡", name: "ŠTIT", cost: 35, dur: 45, desc: "Poništava sve napade koji stignu u narednih 45 s" };
export const COOLDOWN = 12;

export function qPoints(wrong, seconds) {
  const R = RULES;
  const tries = wrong === 0 ? R.firstTry : wrong === 1 ? R.secondTry : 0;
  const time = Math.round(R.timeMax * Math.max(0, 1 - seconds / R.timeWindow));
  return Math.max(0, R.base + tries + time - R.wrongPenalty * wrong);
}

export function newState(name) {
  return { name, seed: (Math.random() * 2 ** 32) >>> 0, joinedAt: Date.now(), solved: 0, digits: [], pts: [],
           wrong: [0, 0, 0, 0, 0, 0], hints: 0, hintQ: [], vaultWrong: 0, qStart: null, finishedAt: null,
           spent: 0, fine: 0, sabotages: 0, lastAttack: 0, shieldFrom: 0, shieldUntil: 0 };
}

export function totalScore(st) {
  const R = RULES;
  const sum = st.pts.reduce((a, b) => a + b, 0);
  const bonus = st.finishedAt ? R.vaultBonus : 0;
  return Math.max(0, sum - R.hintPenalty * st.hints - R.vaultWrong * st.vaultWrong
                      - (st.spent || 0) - (st.fine || 0) + bonus);
}

export function attempts(st) {
  return st.wrong.reduce((a, b) => a + b, 0) + st.solved + st.vaultWrong;
}

export function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}
