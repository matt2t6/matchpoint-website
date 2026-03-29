// 🏆 MatchPoint Scoreboard
const SCORE_SEQUENCE = ["0", "15", "30", "40"];
let ourPoints = 0;
let oppPoints = 0;
let ourGames = 0;
let oppGames = 0;
let server = "us";

export function updateScore(winner) {
  if (winner === "us") ourPoints += 1;
  else oppPoints += 1;

  if (isGameWon(ourPoints, oppPoints)) {
    ourGames += 1;
    resetPoints();
    swapServer();
  } else if (isGameWon(oppPoints, ourPoints)) {
    oppGames += 1;
    resetPoints();
    swapServer();
  }
  renderScore();
}

export function setScoreState({ points = {}, games = {}, server: srv } = {}) {
  if (typeof points.us === "number") ourPoints = points.us;
  if (typeof points.opp === "number") oppPoints = points.opp;
  if (typeof games.us === "number") ourGames = games.us;
  if (typeof games.opp === "number") oppGames = games.opp;
  if (srv) server = srv;
  renderScore();
}

export function setScoreScript({ a, b, games, leader, server: srv } = {}) {
  if (typeof games?.us === "number") ourGames = games.us;
  if (typeof games?.opp === "number") oppGames = games.opp;
  if (srv) server = srv;

  const aEl = document.getElementById("score-a");
  const bEl = document.getElementById("score-b");
  if (aEl && a) aEl.textContent = a;
  if (bEl && b) bEl.textContent = b;

  const matchScoreEl = document.getElementById("match-score");
  if (matchScoreEl) {
    matchScoreEl.textContent = `${ourGames}-${oppGames}`;
  }

  const phaseEl = document.getElementById("match-phase");
  if (phaseEl) {
    const serving = leader === "a" ? "us" : leader === "b" ? "opponent" : server;
    phaseEl.dataset.server = serving;
  }
  const summaryEl = document.getElementById("match-summary");
  if (summaryEl) {
    if (a && b) summaryEl.textContent = `${a} vs ${b}`;
    else if (summaryEl.dataset.defaultText) summaryEl.textContent = summaryEl.dataset.defaultText;
  }
}

export function getScore() {
  return {
    points: { us: ourPoints, opp: oppPoints },
    games: { us: ourGames, opp: oppGames },
    server
  };
}

export function resetScore() {
  ourPoints = 0;
  oppPoints = 0;
  ourGames = 0;
  oppGames = 0;
  renderScore();
}

function resetPoints() {
  ourPoints = 0;
  oppPoints = 0;
}

function swapServer() {
  server = server === "us" ? "opponent" : "us";
}

function isGameWon(points, otherPoints) {
  return points >= 4 && points - otherPoints >= 2;
}

function renderScore() {
  const aEl = document.getElementById("score-a");
  const bEl = document.getElementById("score-b");
  const matchScoreEl = document.getElementById("match-score");
  const bannerEl = document.getElementById("match-summary"); // optional if we want to append info

  if (aEl) aEl.textContent = resolveDisplayPoints("us");
  if (bEl) bEl.textContent = resolveDisplayPoints("opp");

  if (matchScoreEl) {
    matchScoreEl.textContent = `${ourGames}-${oppGames}`;
  }

  const serverIndicator = document.getElementById("match-phase");
  if (serverIndicator) {
    serverIndicator.dataset.server = server;
  }
  const summaryEl = document.getElementById("match-summary");
  if (summaryEl && !summaryEl.dataset.defaultText) {
    summaryEl.dataset.defaultText = summaryEl.textContent || "";
  }
}

function resolveDisplayPoints(side) {
  const points = side === "us" ? ourPoints : oppPoints;
  const other = side === "us" ? oppPoints : ourPoints;

  if (points >= 3 && other >= 3) {
    if (points === other) return "40";
    return points > other ? "AD" : "40";
  }

  return SCORE_SEQUENCE[Math.min(points, SCORE_SEQUENCE.length - 1)] ?? "0";
}
