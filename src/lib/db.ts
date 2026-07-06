import type { AudioBlobRecord, DailyReview, Material, PracticeRecord, ReviewSchedule } from "../types";

type StoreName = "materials" | "practiceRecords" | "reviewSchedules" | "dailyReviews" | "audioBlobs";
type StoreMap = {
  materials: Material;
  practiceRecords: PracticeRecord;
  reviewSchedules: ReviewSchedule;
  dailyReviews: DailyReview;
  audioBlobs: AudioBlobRecord;
};

const DB_NAME = "speakloop-db";
const DB_VERSION = 1;
const LOCAL_PREFIX = "speakloop:";

let dbPromise: Promise<IDBDatabase | null> | null = null;

export function hasIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function getKeyPath(storeName: StoreName): string {
  if (storeName === "reviewSchedules") {
    return "materialId";
  }
  if (storeName === "dailyReviews") {
    return "date";
  }
  if (storeName === "audioBlobs") {
    return "key";
  }
  return "id";
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!hasIndexedDb()) {
    return Promise.resolve(null);
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        const stores: StoreName[] = [
          "materials",
          "practiceRecords",
          "reviewSchedules",
          "dailyReviews",
          "audioBlobs",
        ];

        stores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: getKeyPath(storeName) });
            if (storeName === "practiceRecords") {
              store.createIndex("materialId", "materialId", { unique: false });
              store.createIndex("date", "date", { unique: false });
            }
          }
        });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("IndexedDB unavailable, using localStorage fallback.", request.error);
        resolve(null);
      };
    });
  }

  return dbPromise;
}

function readLocalArray<T>(storeName: StoreName): T[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_PREFIX}${storeName}`);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocalArray<T>(storeName: StoreName, items: T[]): void {
  localStorage.setItem(`${LOCAL_PREFIX}${storeName}`, JSON.stringify(items));
}

function getRecordKey<T extends StoreName>(storeName: T, item: StoreMap[T]): string {
  return String((item as unknown as Record<string, unknown>)[getKeyPath(storeName)]);
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

async function getAll<T extends StoreName>(storeName: T): Promise<StoreMap[T][]> {
  const db = await openDatabase();
  if (!db) {
    if (storeName === "audioBlobs") {
      const rows = readLocalArray<{ key: string; dataUrl: string; createdAt: string }>(storeName);
      const blobs = await Promise.all(
        rows.map(async (row) => ({
          key: row.key,
          createdAt: row.createdAt,
          blob: await dataUrlToBlob(row.dataUrl),
        })),
      );
      return blobs as StoreMap[T][];
    }

    return readLocalArray<StoreMap[T]>(storeName);
  }

  const transaction = db.transaction(storeName, "readonly");
  return requestToPromise(transaction.objectStore(storeName).getAll());
}

async function getOne<T extends StoreName>(storeName: T, key: string): Promise<StoreMap[T] | undefined> {
  const db = await openDatabase();
  if (!db) {
    const rows = await getAll(storeName);
    return rows.find((row) => getRecordKey(storeName, row) === key);
  }

  const transaction = db.transaction(storeName, "readonly");
  return requestToPromise<StoreMap[T] | undefined>(transaction.objectStore(storeName).get(key));
}

async function putOne<T extends StoreName>(storeName: T, item: StoreMap[T]): Promise<void> {
  const db = await openDatabase();
  if (!db) {
    if (storeName === "audioBlobs") {
      const row = item as AudioBlobRecord;
      const rows = readLocalArray<{ key: string; dataUrl: string; createdAt: string }>(storeName);
      const next = rows.filter((existing) => existing.key !== row.key);
      next.push({ key: row.key, dataUrl: await blobToDataUrl(row.blob), createdAt: row.createdAt });
      writeLocalArray(storeName, next);
      return;
    }

    const rows = readLocalArray<StoreMap[T]>(storeName);
    const key = getRecordKey(storeName, item);
    const next = rows.filter((existing) => getRecordKey(storeName, existing) !== key);
    next.push(item);
    writeLocalArray(storeName, next);
    return;
  }

  const transaction = db.transaction(storeName, "readwrite");
  transaction.objectStore(storeName).put(item);
  await transactionDone(transaction);
}

async function putMany<T extends StoreName>(storeName: T, items: StoreMap[T][]): Promise<void> {
  const db = await openDatabase();
  if (!db) {
    for (const item of items) {
      await putOne(storeName, item);
    }
    return;
  }

  const transaction = db.transaction(storeName, "readwrite");
  const store = transaction.objectStore(storeName);
  items.forEach((item) => store.put(item));
  await transactionDone(transaction);
}

async function deleteOne<T extends StoreName>(storeName: T, key: string): Promise<void> {
  const db = await openDatabase();
  if (!db) {
    const rows = readLocalArray<StoreMap[T]>(storeName);
    writeLocalArray(
      storeName,
      rows.filter((row) => getRecordKey(storeName, row) !== key),
    );
    return;
  }

  const transaction = db.transaction(storeName, "readwrite");
  transaction.objectStore(storeName).delete(key);
  await transactionDone(transaction);
}

export const localDb = {
  getMaterials: () => getAll("materials"),
  saveMaterial: (material: Material) => putOne("materials", material),
  saveMaterials: (materials: Material[]) => putMany("materials", materials),
  getPracticeRecords: () => getAll("practiceRecords"),
  savePracticeRecord: (record: PracticeRecord) => putOne("practiceRecords", record),
  getReviewSchedules: () => getAll("reviewSchedules"),
  getReviewSchedule: (materialId: string) => getOne("reviewSchedules", materialId),
  saveReviewSchedule: (schedule: ReviewSchedule) => putOne("reviewSchedules", schedule),
  getDailyReviews: () => getAll("dailyReviews"),
  getDailyReview: (date: string) => getOne("dailyReviews", date),
  saveDailyReview: (review: DailyReview) => putOne("dailyReviews", review),
  saveAudioBlob: (record: AudioBlobRecord) => putOne("audioBlobs", record),
  getAudioBlob: (key: string) => getOne("audioBlobs", key),
  deleteAudioBlob: (key: string) => deleteOne("audioBlobs", key),
};
