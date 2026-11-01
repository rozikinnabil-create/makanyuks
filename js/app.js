/* ==========================================================================
   MAKANYUKS - APP ENGINE (FULL FIX)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  meals: [
    { id: 1, name: 'Sarapan Pagi', time: '07:00', icon: '🌅', desc: 'Menu seimbang tinggi protein.', completed: false },
    { id: 2, name: 'Makan Siang', time: '12:00', icon: '☀️', desc: 'Santap siang sehat & bernutrisi.', completed: false },
    { id: 3, name: 'Makan Sore', time: '16:00', icon: '🌇', desc: 'Camilan sehat & buah segar.', completed: false },
    { id: 4, name: 'Camilan Malam', time: '20:00', icon: '🌙', desc: 'Menu ringan malam hari.', completed: false }
  ],

  init() {
    this.bindNavigation();
    this.bindHeaderActions();
    this.bindNotificationButtons();
    this.bindHistoryEvents();
    this.bindModalEvents();
    this.startClock();
    this.renderDashboard();
    this.renderHistory();
    if (window.NotificationEngine) NotificationEngine.updateUIStatus();
  },

  // Switch Navigasi & Logo Home Click
  bindNavigation() {
    const tabs = document.querySelectorAll('.nav-tab-btn');
    const brandBtn = document.getElementById('brandHomeBtn');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        this.switchTab(target);
      });
    });

    if (brandBtn) {
      brandBtn.addEventListener('click', () => {
        this.switchTab('dashboard');
      });
    }
  },

  switchTab(target) {
    document.querySelectorAll('.nav-tab-btn').forEach(t => {
      if (t.getAttribute('data-tab') === target) t.classList.add('active');
      else t.classList.remove('active');
    });

    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    const activeView = document.getElementById(`view-${target}`);
    if (activeView) activeView.classList.add('active');
  },

  // Header Actions: Mode Gelap / Terang & Quick Mute
  bindHeaderActions() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeSelect = document.getElementById('settingThemeSelect');
    const audioBtn = document.getElementById('headerAudioToggle');

    // Load saved theme
    const savedTheme = localStorage.getItem('makanyuks_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeSelect) themeSelect.value = savedTheme;

    // Toggle Theme Click
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('makanyuks_theme', next);
        if (themeSelect) themeSelect.value = next;
        if (window.NotificationEngine) NotificationEngine.showToast(`Mode ${next === 'dark' ? 'Gelap' : 'Terang'} Diaktifkan ✨`);
      });
    }

    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        const next = e.target.value;
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('makanyuks_theme', next);
      });
    }

    // Toggle Audio Mute
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = localStorage.getItem('makanyuks_sound_enabled') === 'false';
        localStorage.setItem('makanyuks_sound_enabled', isMuted ? 'true' : 'false');
        if (window.NotificationEngine) {
          NotificationEngine.showToast(isMuted ? 'Suara Alarm Aktif 🔊' : 'Suara Alarm Dimatikan 🔇');
        }
      });
    }
  },

  bindNotificationButtons() {
    const reqBtn = document.getElementById('settingRequestNotifBtn');
    const testBtn = document.getElementById('settingTestNotifBtn');
    const bannerBtn = document.getElementById('bannerEnableNotifBtn');

    if (reqBtn) reqBtn.addEventListener('click', () => NotificationEngine.requestPermission());
    if (bannerBtn) bannerBtn.addEventListener('click', () => NotificationEngine.requestPermission());
    if (testBtn) testBtn.addEventListener('click', () => NotificationEngine.testNotification());
  },

  bindHistoryEvents() {
    const clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (window.StorageEngine) StorageEngine.clearHistory();
        this.renderHistory();
        if (window.NotificationEngine) NotificationEngine.showToast('Riwayat catatan makan berhasil dibersihkan! ✨');
      });
    }
  },

  bindModalEvents() {
    const openAddBtn = document.getElementById('openAddMealModalBtn');
    const closeAddBtn = document.getElementById('cancelAddModalBtn');
    const addBackdrop = document.getElementById('addMealModalBackdrop');
    const addForm = document.getElementById('addMealForm');
    const alarmBackdrop = document.getElementById('alarmModalBackdrop');
    const alarmDismiss = document.getElementById('alarmBtnDismiss');

    if (openAddBtn && addBackdrop) openAddBtn.addEventListener('click', () => addBackdrop.classList.add('active'));
    if (closeAddBtn && addBackdrop) closeAddBtn.addEventListener('click', () => addBackdrop.classList.remove('active'));
    if (alarmDismiss && alarmBackdrop) alarmDismiss.addEventListener('click', () => alarmBackdrop.classList.remove('active'));

    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('addMealName').value;
        const time = document.getElementById('addMealTime').value;
        this.meals.push({ id: Date.now(), name, time, icon: '🥗', desc: 'Jadwal makan kustom', completed: false });
        if (addBackdrop) addBackdrop.classList.remove('active');
        this.renderDashboard();
        if (window.NotificationEngine) NotificationEngine.showToast('Jadwal baru berhasil ditambahkan! 🥗');
      });
    }
  },

  startClock() {
    const clockEl = document.getElementById('digitalClock');
    const dateEl = document.getElementById('currentDateStr');
    
    const update = () => {
      const now = new Date();
      if (clockEl) clockEl.innerText = now.toLocaleTimeString('id-ID');
      if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.innerText = now.toLocaleDateString('id-ID', options);
      }
    };
    update();
    setInterval(update, 1000);
  },

  renderDashboard() {
    const grid = document.getElementById('mealsGrid');
    if (!grid) return;

    const completedCount = this.meals.filter(m => m.completed).length;
    const pct = Math.round((completedCount / this.meals.length) * 100) || 0;

    const fracEl = document.getElementById('progressFraction');
    const pctEl = document.getElementById('progressPercentage');
    const fillEl = document.getElementById('progressFillBar');

    if (fracEl) fracEl.innerText = `${completedCount} / ${this.meals.length}`;
    if (pctEl) pctEl.innerText = `${pct}% Selesai`;
    if (fillEl) fillEl.style.width = `${pct}%`;

    grid.innerHTML = this.meals.map(m => `
      <div class="meal-card ${m.completed ? 'completed' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:1.5rem;">${m.icon}</span>
          <span style="font-weight:800; font-size:1rem; color:var(--sage-500);">${m.time}</span>
        </div>
        <div>
          <h4 style="font-weight:700; font-size:0.95rem;">${m.name}</h4>
          <p style="font-size:0.78rem; color:var(--text-muted);">${m.desc}</p>
        </div>
        <button class="btn-complete" onclick="App.toggleMeal(${m.id})">
          ${m.completed ? 'Selesai ✅' : 'Sudah Makan'}
        </button>
      </div>
    `).join('');
  },

  toggleMeal(id) {
    const meal = this.meals.find(m => m.id === id);
    if (meal) {
      meal.completed = !meal.completed;
      this.renderDashboard();
      if (window.NotificationEngine) {
        NotificationEngine.showToast(meal.completed ? `Selamat! ${meal.name} telah selesai ✨` : `Jadwal ${meal.name} dibatalkan.`);
      }
    }
  },

  renderHistory() {
    const list = document.getElementById('historyItemsList');
    if (!list) return;
    const history = window.StorageEngine ? StorageEngine.getHistory() : [];
    if (!history || history.length === 0) {
      list.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:16px 0;">Belum ada catatan riwayat makan.</p>`;
      return;
    }

    list.innerHTML = history.map(item => `
      <div style="padding:10px 0; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="font-size:0.88rem;">${item.name || 'Jadwal Makan'}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">${item.date || ''} - ${item.time || ''}</div>
        </div>
        <span style="font-size:0.75rem; background:var(--sage-100); color:var(--sage-500); padding:2px 8px; border-radius:10px; font-weight:700;">Selesai ✅</span>
      </div>
    `).join('');
  }
};