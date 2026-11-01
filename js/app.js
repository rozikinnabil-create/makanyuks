/**
 * MealMate – Main Application Controller
 * Manages clocks, real-time schedule alarms, countdowns, UI interactions, and state sync.
 */

class MealMateApp {
  constructor() {
    this.currentTab = 'dashboard';
    this.activeAlarmMeal = null;
    this.checkTimer = null;
    this.clockTimer = null;
    
    this.init();
  }

  init() {
    this.initTheme();
    this.initAudioState();
    this.bindEvents();
    this.populateVoiceSelect();
    
    // Start real-time clock (every 1 sec)
    this.updateClockAndGreeting();
    this.clockTimer = setInterval(() => this.updateClockAndGreeting(), 1000);

    // Initial renders
    this.renderDashboard();
    this.renderHistory();
    this.renderSettings();
    this.checkNotificationStatus();

    // Start background schedule monitor (every 2.5 seconds)
    this.startScheduleChecker();

    // Listen for voices loaded event
    window.addEventListener('voicesLoaded', () => {
      this.populateVoiceSelect();
    });
  }

  // ================= 1. THEME & AUDIO GLOBAL CONTROLS =================
  initTheme() {
    const settings = window.storageService.getSettings();
    const currentTheme = settings.theme || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    this.updateThemeIcon(currentTheme);
  }

  toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'light';
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', nextTheme);
    window.storageService.saveSettings({ theme: nextTheme });
    this.updateThemeIcon(nextTheme);

    const settingThemeSelect = document.getElementById('settingThemeSelect');
    if (settingThemeSelect) {
      settingThemeSelect.value = nextTheme;
    }

    this.showToast(nextTheme === 'dark' ? 'Mode gelap diaktifkan 🌙' : 'Mode terang diaktifkan ☀️');
  }

  updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;

    if (theme === 'dark') {
      btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      btn.title = "Ganti ke Mode Terang";
    } else {
      btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
      btn.title = "Ganti ke Mode Gelap";
    }
  }

  initAudioState() {
    const settings = window.storageService.getSettings();
    this.updateAudioButtonState(settings.soundEnabled);
  }

  toggleMasterSound() {
    const settings = window.storageService.getSettings();
    const newState = !settings.soundEnabled;
    window.storageService.saveSettings({ soundEnabled: newState });
    this.updateAudioButtonState(newState);

    const settingSoundToggle = document.getElementById('settingSoundToggle');
    if (settingSoundToggle) {
      settingSoundToggle.checked = newState;
    }

    if (newState) {
      this.showToast('Suara alarm diaktifkan 🔊');
      window.audioService.playGentleChime(settings.volume);
    } else {
      this.showToast('Suara alarm dinonaktifkan 🔇');
      window.audioService.stopAlarm();
    }
  }

  updateAudioButtonState(enabled) {
    const btn = document.getElementById('headerAudioToggle');
    if (!btn) return;

    if (enabled) {
      btn.classList.add('active-audio');
      btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
      btn.title = "Suara Alarm Aktif (Klik untuk matikan)";
    } else {
      btn.classList.remove('active-audio');
      btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
      btn.title = "Suara Alarm Mati (Klik untuk aktifkan)";
    }
  }

  // ================= 2. NAVIGATION =================
  switchTab(tabId) {
    this.currentTab = tabId;

    // Update nav buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Update tab views
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${tabId}`);
    });

    if (tabId === 'history') {
      this.renderHistory();
    } else if (tabId === 'dashboard') {
      this.renderDashboard();
    } else if (tabId === 'settings') {
      this.renderSettings();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ================= 3. REALTIME CLOCK & GREETING =================
  updateClockAndGreeting() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    // Update Clock
    const clockEl = document.getElementById('digitalClock');
    if (clockEl) {
      clockEl.innerHTML = `${hh}<span class="colon">:</span>${mm}<span class="colon">:</span>${ss}`;
    }

    // Indonesian Date String
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateFormatted = now.toLocaleDateString('id-ID', options);
    const dateEl = document.getElementById('currentDateStr');
    if (dateEl) {
      dateEl.textContent = dateFormatted;
    }

    // Dynamic Greetings
    const greetingEl = document.getElementById('heroGreeting');
    const subtextEl = document.getElementById('heroSubtext');
    const heroPill = document.getElementById('heroPill');

    if (greetingEl && subtextEl) {
      if (hours >= 4 && hours < 11) {
        greetingEl.textContent = 'Selamat Pagi! 🌅';
        subtextEl.textContent = 'Awali harimu dengan sarapan sehat dan air mineral cukup.';
        if (heroPill) heroPill.innerHTML = `<span>🌅</span> Jadwal Sarapan Siap`;
      } else if (hours >= 11 && hours < 15) {
        greetingEl.textContent = 'Selamat Siang! ☀️';
        subtextEl.textContent = 'Waktunya istirahat sejenak dan santap siang untuk mengisi energi tubuh.';
        if (heroPill) heroPill.innerHTML = `<span>☀️</span> Waktu Makan Siang`;
      } else if (hours >= 15 && hours < 18) {
        greetingEl.textContent = 'Selamat Sore! 🌇';
        subtextEl.textContent = 'Jangan lewatkan makan sore agar asam lambung tetap terkontrol baik.';
        if (heroPill) heroPill.innerHTML = `<span>🌇</span> Waktu Makan Sore`;
      } else {
        greetingEl.textContent = 'Selamat Malam! 🌙';
        subtextEl.textContent = 'Pilih camilan malam yang ringan dan sehat sebelum beristirahat tidur.';
        if (heroPill) heroPill.innerHTML = `<span>🌙</span> Camilan & Istirahat`;
      }
    }

    // Live update next meal countdown
    this.updateNextMealWidget();
  }

  // ================= 4. DASHBOARD & COUNTDOWN =================
  renderDashboard() {
    this.renderMealCards();
    this.updateDailyProgress();
    this.updateNextMealWidget();
  }

  renderMealCards() {
    const container = document.getElementById('mealsGrid');
    if (!container) return;

    const schedules = window.storageService.getSchedules();
    const now = new Date();
    const currentMinutesOfDay = now.getHours() * 60 + now.getMinutes();

    container.innerHTML = '';

    schedules.forEach(schedule => {
      const isCompleted = window.storageService.isMealCompleted(schedule.id);
      const [schedH, schedM] = schedule.time.split(':').map(Number);
      const schedMinutes = schedH * 60 + schedM;
      
      const snoozedUntil = window.storageService.getSnoozedMeal(schedule.id);
      const isSnoozed = Boolean(snoozedUntil);

      // Status determination
      let statusClass = 'status-upcoming';
      let statusText = 'Belum Waktunya';
      let isActiveTime = false;

      if (isCompleted) {
        statusClass = 'status-done';
        statusText = '✓ Sudah Selesai';
      } else if (isSnoozed) {
        statusClass = 'status-ready';
        const remSnoozeSec = Math.max(0, Math.ceil((snoozedUntil - Date.now()) / 1000));
        const remMin = Math.ceil(remSnoozeSec / 60);
        statusText = `⏰ Ditunda (${remMin} mnt)`;
        isActiveTime = true;
      } else if (currentMinutesOfDay >= schedMinutes && currentMinutesOfDay <= schedMinutes + 35) {
        statusClass = 'status-ready';
        statusText = '🔥 Saatnya Makan!';
        isActiveTime = true;
      } else if (currentMinutesOfDay > schedMinutes + 35) {
        statusClass = 'status-upcoming';
        statusText = '⚠️ Terlewat (Yuk Makan)';
      }

      const card = document.createElement('div');
      card.className = `meal-card ${isCompleted ? 'is-completed' : ''} ${isActiveTime ? 'is-active-time' : ''}`;
      card.id = `meal-card-${schedule.id}`;

      card.innerHTML = `
        <div class="meal-card-top">
          <div class="meal-icon-badge">${schedule.icon || '🍽️'}</div>
          <div class="meal-card-menu">
            <button class="card-action-icon" data-action="test-speech" data-id="${schedule.id}" title="Dengarkan Suara Pengingat">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            </button>
            <button class="card-action-icon" data-action="edit" data-id="${schedule.id}" title="Edit Jadwal">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          </div>
        </div>

        <div class="meal-time-tag">${schedule.time}</div>
        <h4 class="meal-title">${schedule.name}</h4>
        <p class="meal-desc">${schedule.description || 'Pola makan teratur adalah kunci tubuh bugar.'}</p>

        <div class="meal-status-pill ${statusClass}">${statusText}</div>

        <div class="meal-actions-bottom">
          <button class="btn-complete ${isCompleted ? 'completed-state' : ''}" data-action="toggle-complete" data-id="${schedule.id}">
            ${isCompleted ? '✓ Selesai (Batal)' : '🍽️ Sudah Makan'}
          </button>
        </div>
      `;

      container.appendChild(card);
    });
  }

  updateDailyProgress() {
    const schedules = window.storageService.getSchedules().filter(s => s.enabled);
    const total = schedules.length || 1;
    let completedCount = 0;

    schedules.forEach(s => {
      if (window.storageService.isMealCompleted(s.id)) {
        completedCount++;
      }
    });

    const pct = Math.round((completedCount / total) * 100);

    const fractionEl = document.getElementById('progressFraction');
    const pctEl = document.getElementById('progressPercentage');
    const fillEl = document.getElementById('progressFillBar');
    const badgeEl = document.getElementById('dailyStatusBadge');

    if (fractionEl) fractionEl.textContent = `${completedCount} / ${total}`;
    if (pctEl) pctEl.textContent = `${pct}% Selesai`;
    if (fillEl) fillEl.style.width = `${pct}%`;

    if (badgeEl) {
      if (pct === 100) {
        badgeEl.textContent = '🎉 Semua Selesai!';
        badgeEl.style.backgroundColor = 'var(--sage-200)';
      } else if (pct > 0) {
        badgeEl.textContent = 'Sedang Berjalan';
        badgeEl.style.backgroundColor = 'var(--sage-100)';
      } else {
        badgeEl.textContent = 'Belum Dimulai';
        badgeEl.style.backgroundColor = 'var(--bg-secondary)';
      }
    }
  }

  updateNextMealWidget() {
    const schedules = window.storageService.getSchedules().filter(s => s.enabled);
    if (!schedules.length) return;

    const now = new Date();
    const currentMs = now.getTime();

    // Find the next incomplete meal
    let upcomingMeal = null;
    let minDiffMs = Infinity;

    schedules.forEach(s => {
      const isCompleted = window.storageService.isMealCompleted(s.id);
      if (isCompleted) return;

      const [hh, mm] = s.time.split(':').map(Number);
      const targetDate = new Date(now);
      targetDate.setHours(hh, mm, 0, 0);

      // If already passed today, consider tomorrow for countdown
      let diff = targetDate.getTime() - currentMs;
      if (diff < -30 * 60 * 1000) {
        // More than 30 mins late, target tomorrow's cycle
        targetDate.setDate(targetDate.getDate() + 1);
        diff = targetDate.getTime() - currentMs;
      }

      if (diff >= -30 * 60 * 1000 && diff < minDiffMs) {
        minDiffMs = diff;
        upcomingMeal = { schedule: s, diffMs: diff };
      }
    });

    const badgeEl = document.getElementById('nextMealBadge');
    const countdownEl = document.getElementById('nextMealCountdown');
    const subEl = document.getElementById('nextMealSub');

    if (!upcomingMeal) {
      if (badgeEl) badgeEl.textContent = 'Selesai Semua';
      if (countdownEl) countdownEl.textContent = 'Hebat! 🎉';
      if (subEl) subEl.textContent = 'Semua jadwal makan hari ini sudah terpenuhi.';
      return;
    }

    if (badgeEl) badgeEl.textContent = `${upcomingMeal.schedule.name} (${upcomingMeal.schedule.time})`;

    if (upcomingMeal.diffMs <= 0 && upcomingMeal.diffMs >= -30 * 60 * 1000) {
      if (countdownEl) countdownEl.textContent = 'Saatnya Makan!';
      if (subEl) subEl.textContent = 'Waktu makan sedang berlangsung sekarang';
    } else {
      const totalSec = Math.max(0, Math.floor(upcomingMeal.diffMs / 1000));
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      if (countdownEl) countdownEl.textContent = formatted;
      if (subEl) subEl.textContent = `Menuju waktu ${upcomingMeal.schedule.name.toLowerCase()}`;
    }
  }

  // ================= 5. AUTOMATIC SCHEDULE CHECKER (ALARM) =================
  startScheduleChecker() {
    if (this.checkTimer) clearInterval(this.checkTimer);

    // Run check immediately then every 2 seconds
    this.checkSchedulesForAlarm();
    this.checkTimer = setInterval(() => {
      this.checkSchedulesForAlarm();
    }, 2500);
  }

  checkSchedulesForAlarm() {
    const now = new Date();
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHH}:${currentMM}`;
    const currentTimestamp = now.getTime();

    const schedules = window.storageService.getSchedules().filter(s => s.enabled);

    for (const schedule of schedules) {
      // 1. If already completed today, skip alarm
      if (window.storageService.isMealCompleted(schedule.id)) {
        continue;
      }

      // 2. Check snooze state
      const snoozeUntil = window.storageService.getSnoozedMeal(schedule.id);
      if (snoozeUntil && currentTimestamp >= snoozeUntil) {
        // Snooze time arrived!
        window.storageService.clearSnooze(schedule.id);
        this.triggerAlarm(schedule, true);
        return;
      }

      // 3. Normal schedule time check
      if (schedule.time === currentTimeStr) {
        // Prevent re-triggering repeatedly in the same minute/day
        if (!window.storageService.hasMealTriggeredToday(schedule.id)) {
          window.storageService.markMealTriggered(schedule.id);
          this.triggerAlarm(schedule, false);
          return;
        }
      }
    }
  }

  triggerAlarm(schedule, isSnoozed = false) {
    this.activeAlarmMeal = schedule;
    const settings = window.storageService.getSettings();

    // Open Alarm Modal
    this.openAlarmModal(schedule);

    // Audio & TTS Speech
    window.audioService.triggerMealAlarm(schedule, settings);

    // Browser Notification
    window.notificationService.showMealNotification(schedule);

    // Refresh dashboard UI state
    this.renderDashboard();
  }

  openAlarmModal(schedule) {
    this.activeAlarmMeal = schedule;
    const modal = document.getElementById('alarmModalBackdrop');
    const iconEl = document.getElementById('alarmModalIcon');
    const timeEl = document.getElementById('alarmModalTime');
    const titleEl = document.getElementById('alarmModalTitle');
    const phraseEl = document.getElementById('alarmModalPhrase');

    if (iconEl) iconEl.textContent = schedule.icon || '🍽️';
    if (timeEl) timeEl.textContent = `Pukul ${schedule.time}`;
    if (titleEl) titleEl.textContent = `Saatnya ${schedule.name}!`;
    if (phraseEl) phraseEl.textContent = `"${schedule.speechPhrase || schedule.description || 'Saatnya makan teratur untuk kesehatan optimal.'}"`;

    if (modal) modal.classList.add('active');
  }

  closeAlarmModal() {
    const modal = document.getElementById('alarmModalBackdrop');
    if (modal) modal.classList.remove('active');
    window.audioService.stopAlarm();
    this.activeAlarmMeal = null;
  }

  handleAlarmComplete() {
    if (!this.activeAlarmMeal) return;
    const meal = this.activeAlarmMeal;
    
    // Mark as completed
    window.storageService.setMealCompleted(meal.id, true);
    window.storageService.clearSnooze(meal.id);

    this.closeAlarmModal();
    this.renderDashboard();
    this.renderHistory();

    this.showToast(`Bagus sekali! Jadwal ${meal.name} telah diselesaikan. ✨`, 'success');
  }

  handleAlarmSnooze() {
    if (!this.activeAlarmMeal) return;
    const meal = this.activeAlarmMeal;
    const settings = window.storageService.getSettings();
    const minutes = settings.snoozeDurationMinutes || 10;

    window.storageService.setSnooze(meal.id, minutes);
    this.closeAlarmModal();
    this.renderDashboard();

    this.showToast(`Alarm ditunda selama ${minutes} menit. ⏰`, 'warning');
  }

  handleAlarmDismiss() {
    this.closeAlarmModal();
    this.showToast('Alarm telah dimatikan. Jangan lupa makan ya!');
  }

  // ================= 6. HISTORY & STATS =================
  renderHistory() {
    const stats = window.storageService.getWeeklyStats();
    const historyList = window.storageService.getHistory();

    // Stats Boxes
    const streakEl = document.getElementById('statStreak');
    const totalEl = document.getElementById('statTotalCompleted');
    const complianceEl = document.getElementById('statComplianceRate');

    if (streakEl) streakEl.textContent = `${stats.currentStreak} Hari 🔥`;
    if (totalEl) totalEl.textContent = `${stats.totalCompletedAllTime} Kali`;

    // Calculate 7-day compliance average
    const totalPossible7Days = stats.days.reduce((acc, d) => acc + d.total, 0);
    const totalDone7Days = stats.days.reduce((acc, d) => acc + d.completedCount, 0);
    const complianceRate = totalPossible7Days > 0 ? Math.round((totalDone7Days / totalPossible7Days) * 100) : 100;
    if (complianceEl) complianceEl.textContent = `${complianceRate}%`;

    // Render 7-day Bar Chart
    const chartContainer = document.getElementById('chartBarsContainer');
    if (chartContainer) {
      chartContainer.innerHTML = '';
      stats.days.forEach(day => {
        const isFull = day.percentage === 100;
        const col = document.createElement('div');
        col.className = 'chart-col';
        col.innerHTML = `
          <div class="chart-bar-container" title="${day.date}: ${day.completedCount}/${day.total} (${day.percentage}%)">
            <div class="chart-bar-fill ${isFull ? 'bar-full' : ''}" style="height: ${Math.max(6, day.percentage)}%;"></div>
          </div>
          <span class="chart-label">${day.dayName}</span>
          <span class="chart-count">${day.completedCount}/${day.total}</span>
        `;
        chartContainer.appendChild(col);
      });
    }

    // Render History Items List
    const listEl = document.getElementById('historyItemsList');
    if (!listEl) return;

    if (!historyList || historyList.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.9rem;">
          Belum ada riwayat makan yang tercatat. Selesaikan jadwal makan Anda untuk melihat log di sini!
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    const schedules = window.storageService.getSchedules();

    historyList.slice(0, 30).forEach(item => {
      const schedule = schedules.find(s => s.id === item.mealId);
      const icon = schedule ? schedule.icon : '🍽️';

      // Format date
      const dateParts = item.date.split('-');
      const d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const datePretty = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `
        <div class="history-left">
          <div class="history-icon">${icon}</div>
          <div class="history-detail">
            <h5>${item.mealName || 'Jadwal Makan'}</h5>
            <p>${datePretty} • Dijadwalkan: ${item.scheduledTime || '-'} • Selesai: <strong>${item.actualTime || '-'}</strong></p>
          </div>
        </div>
        <div class="history-tag">✓ Selesai Tepat Waktu</div>
      `;
      listEl.appendChild(row);
    });
  }

  // ================= 7. SETTINGS & VOICE SYNTHESIS =================
  renderSettings() {
    const settings = window.storageService.getSettings();

    const soundToggle = document.getElementById('settingSoundToggle');
    const chimeToggle = document.getElementById('settingChimeToggle');
    const volumeRange = document.getElementById('settingVolumeRange');
    const volumeVal = document.getElementById('settingVolumeVal');
    const themeSelect = document.getElementById('settingThemeSelect');

    if (soundToggle) soundToggle.checked = settings.soundEnabled;
    if (chimeToggle) chimeToggle.checked = settings.chimeSound !== false;
    if (volumeRange) volumeRange.value = settings.volume || 0.85;
    if (volumeVal) volumeVal.textContent = `${Math.round((settings.volume || 0.85) * 100)}%`;
    if (themeSelect) themeSelect.value = settings.theme || 'light';

    this.checkNotificationStatus();
    this.populateVoiceSelect();
  }

  populateVoiceSelect() {
    const select = document.getElementById('settingVoiceSelect');
    if (!select) return;

    const voices = window.audioService.getAvailableVoices();
    const settings = window.storageService.getSettings();

    select.innerHTML = '<option value="">Otomatis (Paling Cocok - Bahasa Indonesia)</option>';

    if (!voices || voices.length === 0) return;

    // Sort to bring Indonesian / Malay / Natural voices to top
    const sorted = [...voices].sort((a, b) => {
      const aIsId = a.lang && a.lang.toLowerCase().startsWith('id');
      const bIsId = b.lang && b.lang.toLowerCase().startsWith('id');
      if (aIsId && !bIsId) return -1;
      if (!aIsId && bIsId) return 1;
      return a.name.localeCompare(b.name);
    });

    sorted.forEach(voice => {
      const opt = document.createElement('option');
      opt.value = voice.voiceURI;
      const isId = voice.lang && voice.lang.toLowerCase().startsWith('id');
      opt.textContent = `${isId ? '🇮🇩 ' : ''}${voice.name} (${voice.lang})`;
      
      if (settings.voiceURI && voice.voiceURI === settings.voiceURI) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  }

  checkNotificationStatus() {
    const btn = document.getElementById('settingRequestNotifBtn');
    const bannerBtn = document.getElementById('bannerEnableNotifBtn');
    const exp = document.getElementById('notifStatusExplanation');
    const safetyBanner = document.getElementById('safetyBanner');

    const perm = window.notificationService.getPermissionState();

    if (perm === 'granted') {
      if (btn) {
        btn.textContent = '✓ Izin Diberikan';
        btn.disabled = true;
        btn.style.opacity = '0.7';
      }
      if (bannerBtn) bannerBtn.style.display = 'none';
      if (safetyBanner) {
        safetyBanner.innerHTML = `
          <div class="banner-left">
            <span class="banner-icon">✨</span>
            <div class="banner-text">
              <h4 style="color: var(--sage-700);">Pengingat Siap & Notifikasi Aktif</h4>
              <p>MealMate siap bersuara mengingatkan jadwal makan Anda. Tetap buka tab ini di browser ya!</p>
            </div>
          </div>
        `;
        safetyBanner.style.background = 'linear-gradient(135deg, var(--sage-50), var(--bg-card))';
        safetyBanner.style.borderColor = 'var(--sage-200)';
      }
      if (exp) exp.textContent = 'Izin notifikasi browser telah aktif. Pop-up alarm siap muncul di layar Anda.';
    } else if (perm === 'denied') {
      if (btn) {
        btn.textContent = 'Diblokir oleh Browser';
        btn.disabled = true;
      }
      if (exp) exp.textContent = 'Izin notifikasi diblokir pada setelan browser Anda. Buka ikon gembok di address bar untuk mengizinkan.';
    } else {
      if (btn) {
        btn.textContent = 'Izinkan Notifikasi';
        btn.disabled = false;
      }
      if (bannerBtn) bannerBtn.style.display = 'inline-block';
      if (exp) exp.textContent = 'Izin notifikasi belum diaktifkan. Klik tombol di kanan untuk mengizinkan notifikasi browser.';
    }
  }

  // ================= 8. EDIT & ADD MEAL MODALS =================
  openEditModal(mealId) {
    const meal = window.storageService.getScheduleById(mealId);
    if (!meal) return;

    document.getElementById('editMealId').value = meal.id;
    document.getElementById('editMealName').value = meal.name;
    document.getElementById('editMealTime').value = meal.time;
    document.getElementById('editMealIcon').value = meal.icon || '🍽️';
    document.getElementById('editMealDesc').value = meal.description || '';
    document.getElementById('editMealSpeech').value = meal.speechPhrase || '';
    document.getElementById('editModalHeaderIcon').textContent = meal.icon || '✏️';

    const modal = document.getElementById('editMealModalBackdrop');
    if (modal) modal.classList.add('active');
  }

  closeEditModal() {
    const modal = document.getElementById('editMealModalBackdrop');
    if (modal) modal.classList.remove('active');
  }

  handleEditMealSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editMealId').value;
    const name = document.getElementById('editMealName').value.trim();
    const time = document.getElementById('editMealTime').value;
    const icon = document.getElementById('editMealIcon').value;
    const description = document.getElementById('editMealDesc').value.trim();
    const speechPhrase = document.getElementById('editMealSpeech').value.trim();

    window.storageService.updateSchedule(id, {
      name,
      time,
      icon,
      description,
      speechPhrase
    });

    this.closeEditModal();
    this.renderDashboard();
    this.showToast(`Jadwal ${name} berhasil diperbarui! 📅`, 'success');
  }

  openAddModal() {
    document.getElementById('addMealForm').reset();
    const modal = document.getElementById('addMealModalBackdrop');
    if (modal) modal.classList.add('active');
  }

  closeAddModal() {
    const modal = document.getElementById('addMealModalBackdrop');
    if (modal) modal.classList.remove('active');
  }

  handleAddMealSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('addMealName').value.trim();
    const time = document.getElementById('addMealTime').value;
    const icon = document.getElementById('addMealIcon').value;
    const description = document.getElementById('addMealDesc').value.trim();
    const speechPhrase = document.getElementById('addMealSpeech').value.trim();

    const newId = 'custom_' + Date.now();
    window.storageService.addSchedule({
      id: newId,
      name,
      time,
      icon,
      description,
      speechPhrase: speechPhrase || `Saatnya ${name}. Jangan lupa makan ya!`,
      enabled: true
    });

    this.closeAddModal();
    this.renderDashboard();
    this.showToast(`Jadwal baru "${name}" berhasil ditambahkan! ✨`, 'success');
  }

  // ================= 9. EVENT BINDING =================
  bindEvents() {
    // Header navigation clicks
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Brand logo returns to dashboard
    const brandBtn = document.getElementById('brandHomeBtn');
    if (brandBtn) {
      brandBtn.addEventListener('click', () => this.switchTab('dashboard'));
    }

    // Header toggles
    const headerAudioToggle = document.getElementById('headerAudioToggle');
    if (headerAudioToggle) {
      headerAudioToggle.addEventListener('click', () => this.toggleMasterSound());
    }

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Dashboard Meal Cards Event Delegation
    const mealsGrid = document.getElementById('mealsGrid');
    if (mealsGrid) {
      mealsGrid.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-action="toggle-complete"]');
        if (toggleBtn) {
          const id = toggleBtn.getAttribute('data-id');
          const isCurrentlyCompleted = window.storageService.isMealCompleted(id);
          window.storageService.setMealCompleted(id, !isCurrentlyCompleted);
          this.renderDashboard();
          this.renderHistory();
          
          if (!isCurrentlyCompleted) {
            const meal = window.storageService.getScheduleById(id);
            this.showToast(`Mantap! ${meal ? meal.name : 'Jadwal'} selesai dicatat. 🥗`, 'success');
          } else {
            this.showToast('Status makan dibatalkan.');
          }
          return;
        }

        const editBtn = e.target.closest('[data-action="edit"]');
        if (editBtn) {
          const id = editBtn.getAttribute('data-id');
          this.openEditModal(id);
          return;
        }

        const speechBtn = e.target.closest('[data-action="test-speech"]');
        if (speechBtn) {
          const id = speechBtn.getAttribute('data-id');
          const meal = window.storageService.getScheduleById(id);
          if (meal) {
            const settings = window.storageService.getSettings();
            window.audioService.testVoice(meal.speechPhrase || `Saatnya ${meal.name}!`, settings);
            this.showToast(`Memutar contoh suara: "${meal.name}" 🔊`);
          }
          return;
        }
      });
    }

    // Add Schedule Modal
    const openAddMealBtn = document.getElementById('openAddMealModalBtn');
    if (openAddMealBtn) {
      openAddMealBtn.addEventListener('click', () => this.openAddModal());
    }
    const closeAddModalBtn = document.getElementById('closeAddModalBtn');
    if (closeAddModalBtn) {
      closeAddModalBtn.addEventListener('click', () => this.closeAddModal());
    }
    const cancelAddModalBtn = document.getElementById('cancelAddModalBtn');
    if (cancelAddModalBtn) {
      cancelAddModalBtn.addEventListener('click', () => this.closeAddModal());
    }
    const addMealForm = document.getElementById('addMealForm');
    if (addMealForm) {
      addMealForm.addEventListener('submit', (e) => this.handleAddMealSubmit(e));
    }

    // Edit Schedule Modal
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    if (closeEditModalBtn) {
      closeEditModalBtn.addEventListener('click', () => this.closeEditModal());
    }
    const cancelEditModalBtn = document.getElementById('cancelEditModalBtn');
    if (cancelEditModalBtn) {
      cancelEditModalBtn.addEventListener('click', () => this.closeEditModal());
    }
    const editMealForm = document.getElementById('editMealForm');
    if (editMealForm) {
      editMealForm.addEventListener('submit', (e) => this.handleEditMealSubmit(e));
    }

    // Alarm Modal Actions
    const alarmBtnComplete = document.getElementById('alarmBtnComplete');
    if (alarmBtnComplete) {
      alarmBtnComplete.addEventListener('click', () => this.handleAlarmComplete());
    }
    const alarmBtnSnooze = document.getElementById('alarmBtnSnooze');
    if (alarmBtnSnooze) {
      alarmBtnSnooze.addEventListener('click', () => this.handleAlarmSnooze());
    }
    const alarmBtnDismiss = document.getElementById('alarmBtnDismiss');
    if (alarmBtnDismiss) {
      alarmBtnDismiss.addEventListener('click', () => this.handleAlarmDismiss());
    }

    // Settings Controls
    const settingSoundToggle = document.getElementById('settingSoundToggle');
    if (settingSoundToggle) {
      settingSoundToggle.addEventListener('change', (e) => {
        window.storageService.saveSettings({ soundEnabled: e.target.checked });
        this.updateAudioButtonState(e.target.checked);
      });
    }

    const settingChimeToggle = document.getElementById('settingChimeToggle');
    if (settingChimeToggle) {
      settingChimeToggle.addEventListener('change', (e) => {
        window.storageService.saveSettings({ chimeSound: e.target.checked });
      });
    }

    const settingVolumeRange = document.getElementById('settingVolumeRange');
    const settingVolumeVal = document.getElementById('settingVolumeVal');
    if (settingVolumeRange) {
      settingVolumeRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (settingVolumeVal) settingVolumeVal.textContent = `${Math.round(val * 100)}%`;
        window.storageService.saveSettings({ volume: val });
      });
    }

    const settingVoiceSelect = document.getElementById('settingVoiceSelect');
    if (settingVoiceSelect) {
      settingVoiceSelect.addEventListener('change', (e) => {
        window.storageService.saveSettings({ voiceURI: e.target.value });
      });
    }

    const testVoiceBtn = document.getElementById('testVoiceBtn');
    if (testVoiceBtn) {
      testVoiceBtn.addEventListener('click', () => {
        const settings = window.storageService.getSettings();
        window.audioService.testVoice('Halo! Suara pengingat makan MealMate siap menemani pola makan sehat Anda.', settings);
      });
    }

    // Notification Permissions
    const bannerEnableNotifBtn = document.getElementById('bannerEnableNotifBtn');
    if (bannerEnableNotifBtn) {
      bannerEnableNotifBtn.addEventListener('click', async () => {
        const res = await window.notificationService.requestPermission();
        this.checkNotificationStatus();
        if (res.success) {
          this.showToast('Izin notifikasi browser berhasil diaktifkan! 🔔', 'success');
        }
      });
    }

    const settingRequestNotifBtn = document.getElementById('settingRequestNotifBtn');
    if (settingRequestNotifBtn) {
      settingRequestNotifBtn.addEventListener('click', async () => {
        const res = await window.notificationService.requestPermission();
        this.checkNotificationStatus();
        if (res.success) {
          this.showToast('Izin notifikasi berhasil diberikan! 🔔', 'success');
        }
      });
    }

    const settingTestNotifBtn = document.getElementById('settingTestNotifBtn');
    if (settingTestNotifBtn) {
      settingTestNotifBtn.addEventListener('click', () => {
        window.notificationService.showTestNotification();
      });
    }

    const settingThemeSelect = document.getElementById('settingThemeSelect');
    if (settingThemeSelect) {
      settingThemeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        document.documentElement.setAttribute('data-theme', theme);
        window.storageService.saveSettings({ theme });
        this.updateThemeIcon(theme);
      });
    }

    // Clear History Button
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin menghapus semua riwayat catatan makan?')) {
          window.storageService.clearAllHistory();
          this.renderHistory();
          this.showToast('Seluruh riwayat berhasil dibersihkan.');
        }
      });
    }

    // Reset Data Button
    const settingResetDataBtn = document.getElementById('settingResetDataBtn');
    if (settingResetDataBtn) {
      settingResetDataBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin mengembalikan seluruh jadwal dan pengaturan ke kondisi awal default?')) {
          window.storageService.resetAllData();
          this.initTheme();
          this.initAudioState();
          this.renderDashboard();
          this.renderHistory();
          this.renderSettings();
          this.showToast('Aplikasi berhasil di-reset ke kondisi default.');
        }
      });
    }

    // Close modal on escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeEditModal();
        this.closeAddModal();
      }
    });

    // Close modals on clicking backdrop
    ['editMealModalBackdrop', 'addMealModalBackdrop'].forEach(id => {
      const modal = document.getElementById(id);
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('active');
          }
        });
      }
    });
  }

  // ================= 10. TOAST NOTIFICATIONS =================
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'warning' ? 'toast-warning' : ''}`;
    
    let icon = '🔔';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⏰';

    toast.innerHTML = `
      <span>${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MealMateApp();
});
