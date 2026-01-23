// Dexie.js を使った IndexedDB データベース
const db = new Dexie("CardDB");

db.version(1).stores({
  cards: "++id, q, a, learned, reviewCount, nextReview"
});

async function dbAddCard(card) {
  return await db.cards.add(card);
}

async function dbGetAll() {
  return await db.cards.toArray();
}

async function dbUpdate(id, data) {
  return await db.cards.update(id, data);
}

async function dbBulkAdd(cards) {
  return await db.cards.bulkAdd(cards);
}

async function dbClear() {
  return await db.cards.clear();
}