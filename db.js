const db = new Dexie("ankiDB");
db.version(1).stores({
  cards: "++id,q,a,learned,reviewCount,nextReview"
});

async function dbGetAll() {
  return await db.cards.toArray();
}

async function dbAddCard(card) {
  return await db.cards.add(card);
}

async function dbUpdate(id, changes) {
  return await db.cards.update(id, changes);
}

async function dbBulkAdd(list) {
  return await db.cards.bulkAdd(list);
}