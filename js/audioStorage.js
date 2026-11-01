/**
 * MealMate - IndexedDB Storage for Custom Voice Recordings
 * Allows users to record or upload their own voice alarms without storage limits.
 */

class AudioStorage {
  constructor() {
    this.dbName = 'MealMateAudioDB';
    this.dbVersion = 1;
    this.storeName = 'customRecordings';
    this.db = null;
    this.initPromise = this.initDB();
  }

  initDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to LocalStorage');
        resolve(null);
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('IndexedDB error:', e);
        resolve(null);
      };
    });
  }

  async saveAudio(key, dataUrl) {
    await this.initPromise;
    if (this.db) {
      return new Promise((resolve, reject) => {
        try {
          const tx = this.db.transaction([this.storeName], 'readwrite');
          const store = tx.objectStore(this.storeName);
          const req = store.put(dataUrl, key);
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        } catch (e) {
          reject(e);
        }
      });
    } else {
      // LocalStorage fallback
      try {
        localStorage.setItem(`mealmate_audio_${key}`, dataUrl);
        return true;
      } catch (e) {
        console.error('Failed to save audio to LocalStorage', e);
        return false;
      }
    }
  }

  async getAudio(key) {
    await this.initPromise;
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction([this.storeName], 'readonly');
          const store = tx.objectStore(this.storeName);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    } else {
      return localStorage.getItem(`mealmate_audio_${key}`);
    }
  }

  async deleteAudio(key) {
    await this.initPromise;
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction([this.storeName], 'readwrite');
          const store = tx.objectStore(this.storeName);
          const req = store.delete(key);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    } else {
      localStorage.removeItem(`mealmate_audio_${key}`);
      return true;
    }
  }

  async hasAudio(key) {
    const audio = await this.getAudio(key);
    return Boolean(audio);
  }
}

window.audioStorage = new AudioStorage();
