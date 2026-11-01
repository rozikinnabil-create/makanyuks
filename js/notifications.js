/* ==========================================================================
   MEALMATE - NOTIFICATION SYSTEM ENGINE
   ========================================================================== */

const NotificationEngine = {
  // Cek apakah browser mendukung Web Notification API
  isSupported() {
    return 'Notification' in window;
  },

  // Dapatkan status izin saat ini
  getPermissionStatus() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  // Minta izin notifikasi dari pengguna
  async requestPermission() {
    if (!this.isSupported()) {
      alert('Browser Anda tidak mendukung Web Notification API.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.updateUIStatus();
      
      if (permission === 'granted') {
        this.showToast('Izin notifikasi berhasil diberikan! 🔔');
        return true;
      } else if (permission === 'denied') {
        alert('Izin notifikasi ditolak. Harap izinkan notifikasi di Pengaturan Browser HP Anda.');
        return false;
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
    return false;
  },

  // Kirim notifikasi desktop / HP
  sendNotification(title, options = {}) {
    // 1. Jika izin diberikan, tampilkan notifikasi sistem OS
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const notifOptions = {
          icon: 'favicon.svg',
          badge: 'favicon.svg',
          vibrate: [200, 100, 200],
          tag: 'mealmate-notification',
          renotify: true,
          ...options
        };

        const notification = new Notification(title, notifOptions);
        
        notification.onclick = function() {
          window.focus();
          notification.close();
        };
      } catch (e) {
        console.warn('Native notification failed, falling back to toast:', e);
        this.showToast(`${title} - ${options.body || ''}`);
      }
    } else {
      // 2. Fallback jika notifikasi OS diblokir HP: Tampilkan Toast Banner di layar
      this.showToast(`${title} - ${options.body || ''}`);
    }
  },

  // Tes kirim notifikasi
  testNotification() {
    if (this.getPermissionStatus() !== 'granted') {
      this.requestPermission().then(granted => {
        if (granted) {
          this.sendNotification('Tes Notifikasi MealMate 🥗', {
            body: 'Notifikasi berhasil diaktifkan! Pengingat makan Anda akan muncul tepat waktu.'
          });
        }
      });
    } else {
      this.sendNotification('Tes Notifikasi MealMate 🥗', {
        body: 'Notifikasi berhasil diaktifkan! Pengingat makan Anda akan muncul tepat waktu.'
      });
    }
  },

  // Memperbarui UI tombol status notifikasi
  updateUIStatus() {
    const statusText = document.getElementById('notifStatusExplanation');
    const reqBtn = document.getElementById('settingRequestNotifBtn');
    const bannerBtn = document.getElementById('bannerEnableNotifBtn');

    const status = this.getPermissionStatus();

    if (status === 'granted') {
      if (statusText) statusText.innerText = 'Status: Izin Notifikasi Aktif (Disetujui) ✅';
      if (reqBtn) {
        reqBtn.innerText = 'Notifikasi Aktif';
        reqBtn.disabled = true;
        reqBtn.style.opacity = '0.6';
      }
      if (bannerBtn) bannerBtn.style.display = 'none';
    } else if (status === 'denied') {
      if (statusText) statusText.innerText = 'Status: Ditolak oleh Browser ❌ (Aktifkan di Pengaturan HP)';
    } else {
      if (statusText) statusText.innerText = 'Minta izin browser untuk memunculkan notifikasi di layar HP.';
    }
  },

  // Toast Notification internal (Banner Muncul di Layar HP)
  showToast(message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); z-index:9999; display:flex; flex-direction:column; gap:8px; width:90%; max-width:400px; pointer-events:none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = 'background:var(--sage-500, #55856F); color:#fff; padding:12px 16px; border-radius:12px; font-size:0.85rem; font-weight:600; box-shadow:0 4px 12px rgba(0,0,0,0.15); text-align:center; transition:all 0.3s ease; pointer-events:auto;';
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};