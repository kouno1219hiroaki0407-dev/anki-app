let cards = [];
let reviewList = [];
let reviewIndex = 0;

/* 表示切り替え */
function showArea(area) {
  const areas = ["list", "review-area", "random-area"];
  areas.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = (id === area) ? "block" : "none";
  });
}

/* 初期ロード */
(async () => {
  try {
    cards = typeof dbGetAll === "function" ? await dbGetAll() : [];
  } catch (err) {
    console.error("DB 初期化エラー:", err);
    cards = [];
  }
  render();
  showArea("list");
})();

/* 色ランダム */
function getRandomColorClass() {
  const colors = ["color1", "color2", "color3", "color4"];
  return colors[Math.floor(Math.random() * colors.length)];
}

/* カード追加 */
async function addCard() {
  const q = document.getElementById("question").value;
  const a = document.getElementById("answer").value;
  if (!q || !a) return alert("問題と答えを入力してください");

  const card = {
    q,
    a,
    learned: false,
    reviewCount: 0,
    nextReview: new Date().toISOString().split("T")[0]
  };

  const id = await dbAddCard(card);
  card.id = id;
  cards.push(card);

  render();
  showArea("list");

  document.getElementById("question").value = "";
  document.getElementById("answer").value = "";
}

/* 覚えた／未学習切り替え */
async function toggleLearned(id) {
  const card = cards.find(c => c.id === id);
  if (!card) return;

  card.learned = !card.learned;
  await dbUpdate(id, { learned: card.learned });
  render();
}

/* 一覧表示 */
function render(list = cards) {
  const container = document.getElementById("list");
  container.innerHTML = "";

  list.forEach(card => {
    const div = document.createElement("div");
    div.className = "card " + getRandomColorClass();

    div.innerHTML = `
      <b>${card.q}</b><br>
      <span style="display:none">${card.a}</span><br>
      <span class="status">
        ${card.learned ? "覚えた ✔" : "未学習"} /
        次回: ${card.nextReview}
      </span><br>
      <button onclick="toggleLearned(${card.id})">
        ${card.learned ? "未学習に戻す" : "覚えた！"}
      </button>
    `;

    div.onclick = (e) => {
      if (e.target.tagName === "BUTTON") return;
      const ans = div.querySelector("span");
      ans.style.display = ans.style.display === "none" ? "block" : "none";
    };

    container.appendChild(div);
  });
}

/* 忘却曲線 */
function scheduleNextReview(card) {
  const intervals = [1, 3, 7, 14, 30];
  const days = intervals[Math.min(card.reviewCount, intervals.length - 1)];

  const next = new Date();
  next.setDate(next.getDate() + days);

  card.nextReview = next.toISOString().split("T")[0];
  card.reviewCount++;
}

/* 今日の復習 */
async function reviewToday() {
  showArea("review-area");

  const area = document.getElementById("review-area");
  area.innerHTML = `<div class="card"><em>処理中...</em></div>`;

  const today = new Date().toISOString().split("T")[0];
  reviewList = cards.filter(c => c.nextReview <= today);
  reviewIndex = 0;

  if (reviewList.length === 0) {
    area.innerHTML = `<div class="card"><em>今日の復習はありません</em></div>`;
    return;
  }

  showReviewCard();
}

/* スワイプ判定 */
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}

function handleSwipe() {
  const diff = touchEndX - touchStartX;

  if (diff < -50) {
    nextReviewCard();
  }
  if (diff > 50) {
    prevReviewCard();
  }
}

function showReviewCard() {
  const card = reviewList[reviewIndex];
  const area = document.getElementById("review-area");
  const uid = `rev-${Date.now()}-${reviewIndex}`;

  area.innerHTML = `
    <div class="card review-card" id="review-card">
      <h3>今日の復習 (${reviewIndex + 1}/${reviewList.length})</h3>
      <b>${card.q}</b><br>
      <span id="${uid}" style="display:none">${card.a}</span><br>

      <button onclick="document.getElementById('${uid}').style.display='block'">
        答えを見る
      </button>

      <button onclick="finishReview(${card.id})">
        覚えた！
      </button>

      <p style="font-size:14px; color:#666; margin-top:10px;">
        ※ 左右スワイプで移動できます
      </p>
    </div>
  `;

  const cardDiv = document.getElementById("review-card");
  cardDiv.addEventListener("touchstart", handleTouchStart);
  cardDiv.addEventListener("touchend", handleTouchEnd);
}

function nextReviewCard() {
  if (reviewIndex < reviewList.length - 1) {
    reviewIndex++;
    showReviewCard();
  }
}

function prevReviewCard() {
  if (reviewIndex > 0) {
    reviewIndex--;
    showReviewCard();
  }
}

async function finishReview(id) {
  const card = cards.find(c => c.id === id);
  if (!card) return;

  scheduleNextReview(card);
  await dbUpdate(card.id, {
    nextReview: card.nextReview,
    reviewCount: card.reviewCount
  });

  reviewIndex++;
  if (reviewIndex < reviewList.length) {
    showReviewCard();
  } else {
    alert("今日の復習は完了しました！");
    document.getElementById("review-area").innerHTML = "";
    cards = await dbGetAll();
    render();
    showArea("list");
  }
}

/* ランダム出題 */
function randomMode() {
  showArea("random-area");

  const area = document.getElementById("random-area");
  area.innerHTML = `<div class="card"><em>処理中...</em></div>`;

  if (cards.length === 0) {
    area.innerHTML = `<div class="card"><em>カードがありません</em></div>`;
    return;
  }

  const randomIndex = Math.floor(Math.random() * cards.length);
  const card = cards[randomIndex];
  const uid = `rand-${Date.now()}-${randomIndex}`;

  area.innerHTML = `
    <div class="card">
      <h3>ランダム出題</h3>
      <b>${card.q}</b><br>
      <span id="${uid}" style="display:none">${card.a}</span><br>

      <button onclick="document.getElementById('${uid}').style.display='block'">
        答えを見る
      </button>

      <button onclick="randomMode()">次の問題</button>
    </div>
  `;
}

/* 検索 */
function searchCards() {
  const keyword = document.getElementById("search").value.toLowerCase();
  const filtered = cards.filter(card =>
    card.q.toLowerCase().includes(keyword) ||
    card.a.toLowerCase().includes(keyword)
  );
  render(filtered);
  showArea("list");
}

/* エクスポート */
async function exportCards() {
  const all = await dbGetAll();
  const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "cards.json";
  a.click();

  URL.revokeObjectURL(url);
}

/* インポート */
async function importCards() {
  const file = document.getElementById("importFile").files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const imported = JSON.parse(e.target.result);

      const normalized = imported.map(c => ({
        q: c.q,
        a: c.a,
        learned: !!c.learned,
        reviewCount: c.reviewCount || 0,
        nextReview: c.nextReview || new Date().toISOString().split("T")[0]
      }));

      await dbBulkAdd(normalized);
      cards = await dbGetAll();
      render();
      alert("インポート完了");
    } catch {
      alert("JSONファイルが不正です");
    }
  };
  reader.readAsText(file);
}

/* グローバル公開 */
if (typeof window !== 'undefined') {
  window.addCard = addCard;
  window.toggleLearned = toggleLearned;
  window.reviewToday = reviewToday;
  window.randomMode = randomMode;
  window.searchCards = searchCards;
  window.exportCards = exportCards;
  window.importCards = importCards;
  window.finishReview = finishReview;
}