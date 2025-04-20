import { IDBPDatabase, openDB } from 'idb';

let db: IDBPDatabase;
let table = 'metadata'; // currently using indexedDB for storing metadata
async function initDB() {
  if (typeof window !== 'undefined') {
    db = await openDB('metadata', 1, {
      upgrade(db) {
        db.createObjectStore('metadata', {
          keyPath: 'id',
          autoIncrement: true,
        });
      },
    });
  }
}

initDB();

async function setItemToIndexedDB(key: string, value: any) {
  try {
    if (!db) {
      await initDB();
    }
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await store.put({ id: key, value });
    await tx.done;
  } catch (error) {
    console.error('Error setting item to IndexedDB:', error);
    throw error;
  }
}

async function setFileToIndexedDB(key: string, file: File) {
  try {
    if (!db) {
      await initDB();
    }

    const fileContent = await file.text();

    const fileData = {
      id: key,
      content: fileContent,
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
    };

    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await store.put(fileData);
    await tx.done;
  } catch (error) {
    console.error('Error setting file to IndexedDB:', error);
    throw error;
  }
}

async function getItemFromIndexedDB(key: string) {
  if (!db) {
    await initDB();
  }
  return (await db.get(table, key))?.value;
}

async function getFileFromIndexedDB(key: string) {
  if (!db) {
    await initDB();
  }

  const tx = db.transaction(table, 'readonly');
  const store = tx.objectStore(table);
  const fileData = await store.get(key);

  if (!fileData) return null;

  return new File([fileData.content], fileData.name, {
    type: fileData.type,
    lastModified: fileData.lastModified,
  });
}

async function deleteItemFromIndexedDB(key: string) {
  if (!db) {
    await initDB();
  }
  const tx = db.transaction(table, 'readwrite');
  const store = tx.objectStore(table);
  await store.delete(key);
  await tx.done;
}

async function deleteFileFromIndexedDB(key: string): Promise<void> {
  if (!db) {
    await initDB();
  }

  try {
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    await store.delete(key);
    await tx.done;
    console.log(`Successfully deleted item with key: ${key}`);
  } catch (error) {
    console.error(`Failed to delete item with key: ${key}`, error);
    throw error;
  }
}

async function clearIndexedDB() {
  if (!db) {
    await initDB();
  }
  const tx = db.transaction(table, 'readwrite');
  const store = tx.objectStore(table);
  await store.clear();
  await tx.done;
}
export {
  setItemToIndexedDB,
  setFileToIndexedDB,
  getItemFromIndexedDB,
  getFileFromIndexedDB,
  deleteItemFromIndexedDB,
  deleteFileFromIndexedDB,
  clearIndexedDB,
};
