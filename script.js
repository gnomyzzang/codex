const boardEl = document.getElementById("board");
const moveCountEl = document.getElementById("move-count");
const elapsedTimeEl = document.getElementById("elapsed-time");
const restartBtn = document.getElementById("restart-btn");
const resultDialog = document.getElementById("result-dialog");
const resultTimeEl = document.getElementById("result-time");
const resultMovesEl = document.getElementById("result-moves");
const dialogRestartBtn = document.getElementById("dialog-restart");

const SYMBOL_POOL = [
  "🐶",
  "🐱",
  "🦊",
  "🐼",
  "🐯",
  "🦁",
  "🐮",
  "🐵",
  "🐧",
  "🐸",
  "🐙",
  "🐬",
  "🦉",
  "🦄",
  "🐢",
  "🐞",
  "🦋",
  "🌸",
  "🌼",
  "🍀",
  "🍎",
  "🍇",
  "🍋",
  "🍉",
  "⚽",
  "🏀",
  "🎲",
  "🎵",
  "🎧",
  "💎",
  "🚀",
  "🛸",
  "🌈",
  "⭐",
  "🔥",
  "❄️"
];

const TOTAL_PAIRS = 18;

let deck = [];
let flippedCards = [];
let matchedCount = 0;
let moves = 0;
let timerInterval = null;
let startTimestamp = null;

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDeck() {
  const availableSymbols = shuffle(SYMBOL_POOL).slice(0, TOTAL_PAIRS);
  const paired = availableSymbols.flatMap((symbol) => [symbol, symbol]);
  deck = shuffle(paired).map((symbol, index) => ({
    id: index,
    symbol,
    matched: false
  }));
}

function createCardElement(card) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "card";
  button.dataset.id = String(card.id);
  button.setAttribute("aria-label", "숨겨진 카드");

  const inner = document.createElement("div");
  inner.className = "card__inner";

  const frontFace = document.createElement("div");
  frontFace.className = "card__face card__face--front";
  frontFace.textContent = "?";

  const backFace = document.createElement("div");
  backFace.className = "card__face card__face--back";
  backFace.textContent = card.symbol;

  inner.append(frontFace, backFace);
  button.append(inner);
  return button;
}

function resetState() {
  flippedCards = [];
  matchedCount = 0;
  moves = 0;
  moveCountEl.textContent = "0";
  stopTimer();
  updateElapsedTime(0);
}

function renderBoard() {
  boardEl.innerHTML = "";
  const fragment = document.createDocumentFragment();
  deck.forEach((card) => {
    const cardEl = createCardElement(card);
    fragment.appendChild(cardEl);
  });
  boardEl.appendChild(fragment);
}

function startTimer() {
  startTimestamp = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
    updateElapsedTime(elapsed);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  startTimestamp = null;
}

function updateElapsedTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  elapsedTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function handleCardClick(event) {
  const target = event.currentTarget;
  const cardId = Number(target.dataset.id);
  const card = deck[cardId];

  if (!card || card.matched || flippedCards.some((item) => item.id === cardId)) {
    return;
  }

  if (flippedCards.length === 2) {
    return;
  }

  if (!timerInterval) {
    startTimer();
  }

  flipCard(target, card);
  flippedCards.push({ id: cardId, element: target });

  if (flippedCards.length === 2) {
    moves += 1;
    moveCountEl.textContent = String(moves);
    checkForMatch();
  }
}

function flipCard(cardElement, card) {
  cardElement.classList.add("card--flipped");
  cardElement.classList.remove("card--locked");
  cardElement.setAttribute("aria-label", `${card.symbol} 카드`);
}

function unflipCards(cards) {
  cards.forEach(({ element }) => {
    element.classList.remove("card--flipped");
    element.setAttribute("aria-label", "숨겨진 카드");
  });
}

function lockMatchedCards(cards) {
  cards.forEach(({ id, element }) => {
    deck[id].matched = true;
    element.classList.add("card--matched", "card--locked");
    element.setAttribute("aria-label", `${deck[id].symbol} 카드 - 완료`);
  });
}

function checkForMatch() {
  const [first, second] = flippedCards;
  const firstSymbol = deck[first.id].symbol;
  const secondSymbol = deck[second.id].symbol;

  if (firstSymbol === secondSymbol) {
    lockMatchedCards(flippedCards);
    flippedCards = [];
    matchedCount += 2;
    if (matchedCount === deck.length) {
      handleGameComplete();
    }
  } else {
    boardEl.classList.add("board--locked");
    setTimeout(() => {
      unflipCards(flippedCards);
      flippedCards = [];
      boardEl.classList.remove("board--locked");
    }, 900);
  }
}

function handleGameComplete() {
  stopTimer();
  const finalTime = elapsedTimeEl.textContent;
  resultTimeEl.textContent = finalTime;
  resultMovesEl.textContent = String(moves);

  if (typeof resultDialog.showModal === "function") {
    resultDialog.showModal();
  } else {
    resultDialog.setAttribute("open", "true");
  }
}

function attachEventListeners() {
  boardEl.querySelectorAll(".card").forEach((cardEl) => {
    cardEl.addEventListener("click", handleCardClick);
  });
}

function startGame() {
  if (typeof resultDialog.close === "function") {
    if (resultDialog.open) {
      resultDialog.close();
    }
  } else {
    resultDialog.removeAttribute("open");
  }
  boardEl.classList.remove("board--locked");
  resetState();
  buildDeck();
  renderBoard();
  attachEventListeners();
}

restartBtn.addEventListener("click", startGame);
dialogRestartBtn.addEventListener("click", startGame);

resultDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  startGame();
});

startGame();
