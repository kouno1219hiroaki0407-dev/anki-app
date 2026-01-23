let cards = [];

// 初期ロード
(async () => {
  cards = await dbGetAll();
  render();
})();

function getRandomColorClass() {
  const colors = ["color1", "color2", "color3", "color4"];
  return colors[Math.floor(Math.random() * colors.length)];
}

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
  document.getElementById("question").value = "";
  document.getElementById("answer").value = "";
}

async function toggleLearned(id) {
  const card = cards.find(c => c.id === id);
  if (!card) return;

  card.learned = !card.learned;
  await dbUpdate(id, { learned: card.learned });
  render();
}

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
  const today = new Date().toISOString().split("T")[0];
  const dueCards = cards.filter(c => c.nextReview <= today);

  if (dueCards.length === 0) {
    alert("今日復習するカードはありません");
    return;
  }

  showReviewCard(dueCards, 0);
}

function showReviewCard(list, index) {
  const card = list[index];
  const area = document.getElementById("review-area");

  area.innerHTML = `
    <div class="card">
      <h3>今日の復習 (${index + 1}/${list.length})</h3>
      <b>${card.q}</b><br>
      <span id="rev-answer" style="display:none">${card.a}</span><br>

      <button onclick="document.getElementById('rev-answer').style.display='block'">
        答えを見る
      </button>

      <button onclick="finishReview(${card.id}, ${index}, ${list.length})">
        覚えた！
      </button>
    </div>
  `;
}

async function finishReview(id, index, total) {
  const card = cards.find(c => c.id === id);
  if (!card) return;

  scheduleNextReview(card);
  await dbUpdate(card.id, {
    nextReview: card.nextReview,
    reviewCount: card.reviewCount
  });

  const today = new Date().toISOString().split("T")[0];
  const remaining = cards.filter(c => c.nextReview <= today);

  if (remaining.length > 0 && index + 1 < total) {
    showReviewCard(remaining, 0);
  } else {
    alert("今日の復習は完了しました！");
    document.getElementById("review-area").innerHTML = "";
    cards = await dbGetAll();
    render();
  }
}

/* ランダム出題 */
function randomMode() {
  if (cards.length === 0) return alert("カードがありません");

  const randomIndex = Math.floor(Math.random() * cards.length);
  const card = cards[randomIndex];

  const area = document.getElementById("random-area");
  area.innerHTML = `
    <div class="card">
      <h3>ランダム出題</h3>
      <b>${card.q}</b><br>
      <span id="rand-answer" style="display:none">${card.a}</span><br>
      <button onclick="document.getElementById('rand-answer').style.display='block'">
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
}

/* エクスポート（DexieからJSON） */
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

/* インポート（JSON → Dexie） */
async function importCards() {
  const file = document.getElementById("importFile").files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const imported = JSON.parse(e.target.result);

      // idを消して新規として登録
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