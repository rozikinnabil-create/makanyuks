/* ==========================================================================
   MAKANYUKS - NOTIFICATION ENGINE
   ========================================================================== */

const NotificationEngine = {
  isSupported() {
    return 'Notification' in window;
  },

  getPermissionStatus() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  async requestPermission() {
    if (!this.isSupported()) {
      this.showToast('Browser Anda tidak mendukung Web Notification API.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.updateUIStatus();

      if (permission === 'granted') {
        this.showToast('Izin notifikasi berhasil diaktifkan! 🔔');
        return true;
      } else if (permission === 'denied') {
        this.showToast('Izin notifikasi ditolak di browser Anda.');
        return false;
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
    return false;
  },

  sendNotification(title, options = {}) {
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const notifOptions = {
          icon: 'favicon.svg',
          badge: 'favicon.svg',
          vibrate: [200, 100, 200],
          tag: 'makanyuks-notification',
          renotify: true,
          body: options.body || ''
        };

        const notification = new Notification(title, notifOptions);
        notification.onclick = function() {
          window.focus();
          notification.close();
        };
      } catch (e) {
        this.showToast(`${title} - ${options.body || ''}`);
      }
    } else {
      // Fallback Notifikasi Toast jika notifikasi OS HP diblokir
      this.showToast(`${title} - ${options.body || ''}`);
    }
  },

  testNotification() {
    const status = this.getPermissionStatus();
    if (status !== 'granted') {
      this.requestPermission().then(granted => {
        this.sendNotification('Tes Notifikasi Makanyuks 🥗', {
          body: 'Notifikasi berhasil! Pengingat makan Anda akan muncul tepat waktu.'
        });
      });
    } else {
      this.sendNotification('Tes Notifikasi Makanyuks 🥗', {
        body: 'Notifikasi berhasil! Pengingat makan Anda akan muncul tepat waktu.'
      });
    }
  },

  updateUIStatus() {
    const statusText = document.getElementById('notifStatusExplanation');
    const reqBtn = document.getElementById('settingRequestNotifBtn');
    const bannerBtn = document.getElementById('bannerEnableNotifBtn');

    const status = this.getPermissionStatus();

    if (status === 'granted') {
      if (statusText) statusText.innerText = 'Status: Notifikasi Aktif ✅';
      if (reqBtn) {
        reqBtn.innerText = 'Notifikasi Aktif ✅';
      }
      if (bannerBtn) bannerBtn.style.display = 'none';
    } else if (status === 'denied') {
      if (statusText) statusText.innerText = 'Status: Ditolak oleh Browser ❌';
    }
  },

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
    }, 3500);
  }
};