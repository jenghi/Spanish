import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const DB_NAME = "spanisch-lernen";
const STORE_NAME = "daten";
const DB_VERSION = 1;

function web(): boolean {
  return Platform.OS === "web" && typeof window !== "undefined";
}

function indexedDbAvailable(): boolean {
  return web() && typeof window.indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB konnte nicht geöffnet werden."));
  });
}

async function indexedDbGet(key: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : null);
    request.onerror = () => reject(request.error ?? new Error("Daten konnten nicht gelesen werden."));
  }).finally(() => db.close());
}

async function indexedDbSet(key: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Daten konnten nicht gespeichert werden."));
  }).finally(() => db.close());
}

async function indexedDbRemove(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Daten konnten nicht gelöscht werden."));
  }).finally(() => db.close());
}

export async function getItem(key: string): Promise<string | null> {
  if (!web()) return AsyncStorage.getItem(key);

  // IndexedDB is more reliable than localStorage for the web app.
  if (indexedDbAvailable()) {
    try {
      const value = await indexedDbGet(key);
      if (value !== null) return value;

      // Migrate an older localStorage value automatically.
      try {
        const oldValue = window.localStorage.getItem(key);
        if (oldValue !== null) {
          await indexedDbSet(key, oldValue);
          return oldValue;
        }
      } catch {
        // Ignore localStorage migration errors.
      }

      return null;
    } catch (error) {
      console.error("IndexedDB Lesen fehlgeschlagen:", key, error);
    }
  }

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error("Web-Speicher Lesen fehlgeschlagen:", key, error);
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (!web()) {
    await AsyncStorage.setItem(key, value);
    return;
  }

  if (indexedDbAvailable()) {
    try {
      await indexedDbSet(key, value);
      return;
    } catch (error) {
      console.error("IndexedDB Schreiben fehlgeschlagen:", key, error);
    }
  }

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.error("Web-Speicher Schreiben fehlgeschlagen:", key, error);
    throw error;
  }
}

export async function removeItem(key: string): Promise<void> {
  if (!web()) {
    await AsyncStorage.removeItem(key);
    return;
  }

  if (indexedDbAvailable()) {
    try {
      await indexedDbRemove(key);
      return;
    } catch (error) {
      console.error("IndexedDB Löschen fehlgeschlagen:", key, error);
    }
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error("Web-Speicher Löschen fehlgeschlagen:", key, error);
    throw error;
  }
}
