/* ==========================================================================
   MAKANYUKS - MAIN APP ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  init() {
    this.bindNavigation();
    this.bindNotificationButtons();
    this.bindHistoryEvents();
    this.renderDashboard();
    this.renderHistory();
    NotificationEngine.updateUIStatus();
  },

  // Event Navigasi Tab
  bindNavigation() {
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        document.querySelectorAll('.nav-tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));

        tab.classList.add('active');
        const activeView = document.getElementById(`view-${target}`);
        if (activeView) activeView.classList.add('active');
      });
    });
  },

  // Event Listener Tombol Notifikasi (Izinkan & Tes)
  bindNotificationButtons() {
    const reqBtn = document.getElementById('settingRequestNotifBtn');
    const testBtn = document.getElementById('settingTestNotifBtn');
    const bannerBtn = document.getElementById('bannerEnableNotifBtn');

    if (reqBtn) {
      reqBtn.addEventListener('click', () => {
        NotificationEngine.requestPermission();
      });
    }

    if (bannerBtn) {
      bannerBtn.addEventListener('click', () => {
        NotificationEngine.requestPermission();
      });
    }

    if (testBtn) {
      testBtn.addEventListener('click', () => {
        NotificationEngine.testNotification();
      });
    }
  },

  // Event Listener Bersihkan Riwayat (Tanpa Pop-up Confirm Browser)
  bindHistoryEvents() {
    const clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        // Langsung hapus riwayat dari LocalStorage tanpa confirm() dialog
        StorageEngine.clearHistory();
        this.renderHistory();
        NotificationEngine.showToast('Riwayat catatan makan berhasil dibersihkan! ✨');
      });
    }
  },

  renderDashboard() {
    // Render jadwal makan default/custom jika ada
  },

  renderHistory() {
    const list = document.getElementById('historyItemsList');
    if (!list) return;

    const history = StorageEngine.getHistory();
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