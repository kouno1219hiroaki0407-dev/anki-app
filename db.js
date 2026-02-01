// Dexie.js を使った IndexedDB データベース
let db = null;

try {
  if (typeof Dexie !== 'undefined') {
    db = new Dexie("CardDB");
    db.version(1).stores({
      cards: "++id, q, a, learned, reviewCount, nextReview"
    });
  } else {
    console.warn('Dexie not loaded. IndexedDB functions will be no-ops.');
  }
} catch (e) {
  console.warn('Failed to initialize Dexie:', e);
}

async function dbAddCard(card) {
  if (!db) return null;
  return await db.cards.add(card);
}

async function dbGetAll() {
  if (!db) return [];
  return await db.cards.toArray();
}

async function dbUpdate(id, data) {
  if (!db) return null;
  return await db.cards.update(id, data);
}

async function dbBulkAdd(cards) {
  if (!db) return null;
  return await db.cards.bulkAdd(cards);
}

async function dbClear() {
  if (!db) return null;
  return await db.cards.clear();
}