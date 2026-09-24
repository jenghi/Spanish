import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/**
 * Zentraler Speicher für die App.
 *
 * Im Browser verwenden wir direkt localStorage. Das ist bei einer statisch
 * auf GitHub Pages ausgelieferten Expo-Web-App zuverlässig und unabhängig
 * von der AsyncStorage-Web-Implementierung.
 *
 * Auf Android/iOS bleibt AsyncStorage erhalten.
 */
function webStorageAvailable(): boolean {
  if (Platform.OS !== "web") return false;

  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (webStorageAvailable()) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error("Fehler beim Lesen aus localStorage:", key, error);
      throw error;
    }
  }

  return AsyncStorage.getItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (webStorageAvailable()) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch (error) {
      console.error("Fehler beim Schreiben in localStorage:", key, error);
      throw error;
    }
  }

  await AsyncStorage.setItem(key, value);
}

export async function removeItem(key: string): Promise<void> {
  if (webStorageAvailable()) {
    try {
      window.localStorage.removeItem(key);
      return;
    } catch (error) {
      console.error("Fehler beim Löschen aus localStorage:", key, error);
      throw error;
    }
  }

  await AsyncStorage.removeItem(key);
}
