/**
 * MealMate - Storage Management (LocalStorage)
 * Handles persistence for schedules, history logs, settings, and streak tracking.
 */

const STORAGE_KEYS = {
  SCHEDULES: 'mealmate_schedules_v1',
  LOGS: 'mealmate_daily_logs_v1',
  HISTORY: 'mealmate_history_v1',
  SETTINGS: 'mealmate_settings_v1',
  SNOOZE: 'mealmate_snooze_v1'
};

const DEFAULT_SCHEDULES = [
  {
    id: 'breakfast',
    name: 'Sarapan Pagi',
    category: 'sarapan',
    time: '07:00',
    icon: '🌅',
    description: 'Awali harimu dengan nutrisi seimbang dan segelas air hangat.',
    speechPhrase: 'Ayo, sudah waktunya sarapan! Berikan energi terbaik untuk tubuhmu hari ini.',
    enabled: true
  },
  {
    id: 'lunch',
    name: 'Makan Siang',
    category: 'siang',
    time: '12:00',
    icon: '☀️',
    description: 'Isi ulang energi dengan menu bergizi agar tetap fokus bekerja.',
    speechPhrase: 'Jangan lupa makan siang, ya! Istirahat sejenak dan nikmati santap siangmu.',
    enabled: true
  },
  {
    id: 'dinner',
    name: 'Makan Sore / Malam',
    category: 'sore',
    time: '16:00',
    icon: '🌇',
    description: 'Makan sore tepat waktu agar pencernaan optimal sebelum malam tiba.',
    speechPhrase: 'Yuk, waktunya makan sore! Jaga kesehatan lambung dengan makan teratur.',
    enabled: true
  },
  {
    id: 'snack',
    name: 'Camilan Malam',
    category: 'camilan',
    time: '20:00',
    icon: '🌙',
    description: 'Pilih camilan ringan seperti buah, yogurt, atau susu hangat.',
    speechPhrase: 'Sudah waktunya ngemil malam. Jangan sampai lupa, pilih camilan yang sehat ya!',
    enabled: true
  }
];

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  volume: 0.85,
  speechRate: 1.0,
  voiceURI: '',
  browserNotifications: true,
  theme: 'light',
  snoozeDurationMinutes: 10,
  chimeSound: true,
  voiceMode: 'tts' // 'tts' or 'custom'
};

class StorageService {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
      this.saveSchedules(DEFAULT_SCHEDULES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.saveSettings(DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
      // Seed some starter demo history if empty so user immediately sees aesthetic stats
      this.seedStarterHistory();
    }
  }

  getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // --- Schedules ---
  getSchedules() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      return data ? JSON.parse(data) : DEFAULT_SCHEDULES;
    } catch (e) {
      console.error('Failed to load schedules', e);
      return DEFAULT_SCHEDULES;
    }
  }

  saveSchedules(schedules) {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }

  getScheduleById(id) {
    const list = this.getSchedules();
    return list.find(s => s.id === id);
  }

  updateSchedule(id, updatedFields) {
    const list = this.getSchedules();
    const index = list.findIndex(s => s.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedFields };
      this.saveSchedules(list);
      return list[index];
    }
    return null;
  }

  addSchedule(schedule) {
    const list = this.getSchedules();
    list.push(schedule);
    this.saveSchedules(list);
    return schedule;
  }

  deleteSchedule(id) {
    let list = this.getSchedules();
    list = list.filter(s => s.id !== id);
    this.saveSchedules(list);
  }

  // --- Today Logs & Completed Status ---
  getTodayLogs() {
    try {
      const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '{}');
      const today = this.getTodayDateString();
      if (!allLogs[today]) {
        allLogs[today] = {
          completedMeals: {},
          triggeredMeals: {}
        };
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(allLogs));
      }
      return allLogs[today];
    } catch (e) {
      return { completedMeals: {}, triggeredMeals: {} };
    }
  }

  saveTodayLogs(todayData) {
    try {
      const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '{}');
      const today = this.getTodayDateString();
      allLogs[today] = todayData;
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(allLogs));
    } catch (e) {
      console.error('Failed to save today logs', e);
    }
  }

  isMealCompleted(mealId) {
    const todayLog = this.getTodayLogs();
    return Boolean(todayLog.completedMeals && todayLog.completedMeals[mealId]);
  }

  setMealCompleted(mealId, completed = true) {
    const todayLog = this.getTodayLogs();
    if (!todayLog.completedMeals) todayLog.completedMeals = {};
    
    const schedule = this.getScheduleById(mealId);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (completed) {
      todayLog.completedMeals[mealId] = {
        completedAt: timeStr,
        timestamp: Date.now()
      };
      // Record into permanent history
      this.addHistoryEntry({
        mealId,
        mealName: schedule ? schedule.name : mealId,
        scheduledTime: schedule ? schedule.time : '',
        actualTime: timeStr,
        status: 'completed',
        date: this.getTodayDateString()
      });
    } else {
      delete todayLog.completedMeals[mealId];
      this.removeTodayHistoryEntry(mealId);
    }

    this.saveTodayLogs(todayLog);
  }

  hasMealTriggeredToday(mealId) {
    const todayLog = this.getTodayLogs();
    return Boolean(todayLog.triggeredMeals && todayLog.triggeredMeals[mealId]);
  }

  markMealTriggered(mealId) {
    const todayLog = this.getTodayLogs();
    if (!todayLog.triggeredMeals) todayLog.triggeredMeals = {};
    todayLog.triggeredMeals[mealId] = Date.now();
    this.saveTodayLogs(todayLog);
  }

  // --- Snooze Tracking ---
  getSnoozedMeal(mealId) {
    try {
      const snoozes = JSON.parse(localStorage.getItem(STORAGE_KEYS.SNOOZE) || '{}');
      const snoozeUntil = snoozes[mealId];
      if (snoozeUntil && Date.now() < snoozeUntil) {
        return snoozeUntil;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  setSnooze(mealId, minutes = 10) {
    try {
      const snoozes = JSON.parse(localStorage.getItem(STORAGE_KEYS.SNOOZE) || '{}');
      snoozes[mealId] = Date.now() + (minutes * 60 * 1000);
      localStorage.setItem(STORAGE_KEYS.SNOOZE, JSON.stringify(snoozes));
    } catch (e) {
      console.error('Error setting snooze', e);
    }
  }

  clearSnooze(mealId) {
    try {
      const snoozes = JSON.parse(localStorage.getItem(STORAGE_KEYS.SNOOZE) || '{}');
      delete snoozes[mealId];
      localStorage.setItem(STORAGE_KEYS.SNOOZE, JSON.stringify(snoozes));
    } catch (e) {
      console.error('Error clearing snooze', e);
    }
  }

  // --- History & Stats ---
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
    } catch (e) {
      return [];
    }
  }

  addHistoryEntry(entry) {
    const history = this.getHistory();
    const newEntry = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: Date.now(),
      ...entry
    };
    history.unshift(newEntry); // newest first
    // keep maximum 150 entries
    if (history.length > 150) history.length = 150;
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    return newEntry;
  }

  removeTodayHistoryEntry(mealId) {
    const today = this.getTodayDateString();
    let history = this.getHistory();
    history = history.filter(h => !(h.date === today && h.mealId === mealId));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  clearAllHistory() {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  }

  // Seed sample past 3 days so the user has beautiful history cards immediately on first launch
  seedStarterHistory() {
    const sampleHistory = [];
    const now = new Date();
    
    // Yesterday & 2 days ago
    for (let dayOffset = 2; dayOffset >= 1; dayOffset--) {
      const d = new Date(now);
      d.setDate(d.getDate() - dayOffset);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      sampleHistory.push(
        {
          id: `hist_init_${dateStr}_1`,
          createdAt: d.getTime() + 7 * 3600000,
          mealId: 'breakfast',
          mealName: 'Sarapan Pagi',
          scheduledTime: '07:00',
          actualTime: '07:12',
          status: 'completed',
          date: dateStr
        },
        {
          id: `hist_init_${dateStr}_2`,
          createdAt: d.getTime() + 12 * 3600000,
          mealId: 'lunch',
          mealName: 'Makan Siang',
          scheduledTime: '12:00',
          actualTime: '12:15',
          status: 'completed',
          date: dateStr
        },
        {
          id: `hist_init_${dateStr}_3`,
          createdAt: d.getTime() + 16 * 3600000,
          mealId: 'dinner',
          mealName: 'Makan Sore / Malam',
          scheduledTime: '16:00',
          actualTime: '16:05',
          status: 'completed',
          date: dateStr
        },
        {
          id: `hist_init_${dateStr}_4`,
          createdAt: d.getTime() + 20 * 3600000,
          mealId: 'snack',
          mealName: 'Camilan Malam',
          scheduledTime: '20:00',
          actualTime: dayOffset === 2 ? '20:25' : '20:10',
          status: 'completed',
          date: dateStr
        }
      );
    }
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(sampleHistory));
  }

  getWeeklyStats() {
    const history = this.getHistory();
    const schedules = this.getSchedules().filter(s => s.enabled);
    const totalPossiblePerDay = schedules.length || 4;

    // Last 7 days
    const daysData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const completedCount = history.filter(h => h.date === dateStr && h.status === 'completed').length;
      
      const percentage = Math.min(100, Math.round((completedCount / totalPossiblePerDay) * 100));

      daysData.push({
        date: dateStr,
        dayName,
        completedCount,
        total: totalPossiblePerDay,
        percentage
      });
    }

    // Streak calculation
    let currentStreak = 0;
    for (let i = daysData.length - 1; i >= 0; i--) {
      if (daysData[i].completedCount > 0) {
        currentStreak++;
      } else if (i === daysData.length - 1) {
        // Today hasn't finished yet, don't break streak if yesterday was completed
        continue;
      } else {
        break;
      }
    }

    return {
      days: daysData,
      currentStreak: Math.max(1, currentStreak),
      totalCompletedAllTime: history.filter(h => h.status === 'completed').length
    };
  }

  // --- Settings ---
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.SNOOZE);
    this.init();
  }
}

window.storageService = new StorageService();
