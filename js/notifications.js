/**
 * MealMate - Browser Notification Service
 * Manages the Web Notification API, permissions, and desktop alerts.
 */

class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
  }

  getPermissionState() {
    if (!this.isSupported) return 'unsupported';
    return Notification.permission; // 'default', 'granted', 'denied'
  }

  async requestPermission() {
    if (!this.isSupported) {
      return { success: false, reason: 'unsupported' };
    }

    try {
      const permission = await Notification.requestPermission();
      return { success: permission === 'granted', permission };
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return { success: false, reason: err.message };
    }
  }

  showMealNotification(schedule) {
    if (!this.isSupported || Notification.permission !== 'granted') {
      return null;
    }

    try {
      const title = `MealMate: Waktunya ${schedule.name}! ${schedule.icon || '🍽️'}`;
      const options = {
        body: `${schedule.description || 'Saatnya makan teratur untuk menjaga kesehatan tubuh.'}\nKetuk untuk mencatat sudah makan.`,
        icon: 'favicon.svg',
        badge: 'favicon.svg',
        tag: `mealmate-${schedule.id}-${Date.now()}`,
        requireInteraction: true,
        vibrate: [200, 100, 200]
      };

      const notif = new Notification(title, options);

      notif.onclick = () => {
        window.focus();
        if (window.app && window.app.openAlarmModal) {
          window.app.openAlarmModal(schedule);
        }
        notif.close();
      };

      return notif;
    } catch (err) {
      console.warn('Could not display system notification:', err);
      return null;
    }
  }

  showTestNotification() {
    if (!this.isSupported) {
      alert('Browser Anda tidak mendukung Web Notification API.');
      return;
    }

    if (Notification.permission === 'granted') {
      const notif = new Notification('MealMate – Notifikasi Berfungsi! ✨', {
        body: 'Notifikasi browser Anda sudah aktif dan siap mengingatkan jadwal makan harian.',
        icon: 'favicon.svg'
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } else {
      this.requestPermission().then(res => {
        if (res.success) {
          this.showTestNotification();
        } else {
          alert('Izin notifikasi belum diberikan atau diblokir pada browser.');
        }
      });
    }
  }
}

window.notificationService = new NotificationService();
