// Système de notifications complet
class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 5;
    this.defaultDuration = 5000;
    this.container = null;
    this.center = null;
    this.isInitialized = false;
    this.unreadCount = 0;
    
    // Load notifications from localStorage
    this.loadNotificationsFromStorage();
  }

  init() {
    if (this.isInitialized) return;
    
    this.createNotificationContainer();
    this.createNotificationCenter();
    this.isInitialized = true;
  }

  createNotificationContainer() {
    // Container for toast notifications
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = 'notification-container';
    document.body.appendChild(this.container);
  }

  createNotificationCenter() {
    // Notification center overlay
    const centerOverlay = document.createElement('div');
    centerOverlay.id = 'notification-center-overlay';
    centerOverlay.className = 'notification-center-overlay';
    centerOverlay.style.display = 'none';
    
    centerOverlay.innerHTML = `
      <div class="notification-center">
        <div class="notification-center-header">
          <h3>Centre de notifications</h3>
          <div class="notification-center-actions">
            <button class="btn-clear-all" onclick="notificationSystem.clearAllNotifications()">Tout effacer</button>
            <button class="btn-close" onclick="notificationSystem.closeNotificationCenter()">&times;</button>
          </div>
        </div>
        <div class="notification-center-content" id="notification-center-content">
          <!-- Notifications will be populated here -->
        </div>
      </div>
    `;
    
    document.body.appendChild(centerOverlay);
    this.center = centerOverlay;
  }

  show(type, message, options = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      type: type,
      message: message,
      timestamp: new Date(),
      read: false,
      persistent: options.persistent || false,
      duration: options.duration || this.defaultDuration,
      actions: options.actions || []
    };

    // Add to notifications array
    this.notifications.unshift(notification);
    this.unreadCount++;
    
    // Limit notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    // Save to localStorage
    this.saveNotificationsToStorage();
    
    // Update notification badge
    this.updateNotificationBadge();
    
    // Show toast notification
    this.showToast(notification);
    
    // Update notification center
    this.updateNotificationCenter();

    return notification.id;
  }

  showToast(notification) {
    if (!this.container) return;

    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${notification.type}`;
    toast.dataset.id = notification.id;
    
    const icon = this.getNotificationIcon(notification.type);
    
    toast.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-content">
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
      </div>
      <button class="notification-close" onclick="notificationSystem.dismissToast('${notification.id}')">&times;</button>
      ${notification.actions.length > 0 ? `
        <div class="notification-actions">
          ${notification.actions.map(action => `
            <button class="notification-action-btn" onclick="${action.callback}">${action.label}</button>
          `).join('')}
        </div>
      ` : ''}
    `;

    // Add animation
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    
    this.container.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    }, 10);

    // Auto dismiss if not persistent
    if (!notification.persistent) {
      setTimeout(() => {
        this.dismissToast(notification.id);
      }, notification.duration);
    }

    // Limit visible toasts
    const visibleToasts = this.container.querySelectorAll('.notification-toast');
    if (visibleToasts.length > this.maxNotifications) {
      const oldestToast = visibleToasts[visibleToasts.length - 1];
      this.dismissToast(oldestToast.dataset.id);
    }
  }

  dismissToast(notificationId) {
    const toast = this.container.querySelector(`[data-id="${notificationId}"]`);
    if (!toast) return;

    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      event: '📅',
      member: '👤',
      attendance: '📊',
      system: '⚙️'
    };
    return icons[type] || 'ℹ️';
  }

  formatTime(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    
    return timestamp.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }

  openNotificationCenter() {
    if (!this.center) return;
    
    this.center.style.display = 'flex';
    this.updateNotificationCenter();
    
    // Mark all as read
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
    this.updateNotificationBadge();
    this.saveNotificationsToStorage();
  }

  closeNotificationCenter() {
    if (!this.center) return;
    this.center.style.display = 'none';
  }

  updateNotificationCenter() {
    const content = document.getElementById('notification-center-content');
    if (!content) return;

    if (this.notifications.length === 0) {
      content.innerHTML = `
        <div class="notification-center-empty">
          <div class="empty-icon">🔔</div>
          <p>Aucune notification</p>
        </div>
      `;
      return;
    }

    content.innerHTML = this.notifications.map(notification => `
      <div class="notification-center-item ${notification.read ? 'read' : 'unread'}">
        <div class="notification-center-icon">${this.getNotificationIcon(notification.type)}</div>
        <div class="notification-center-content">
          <div class="notification-center-message">${notification.message}</div>
          <div class="notification-center-time">${this.formatTime(notification.timestamp)}</div>
        </div>
        <button class="notification-center-remove" onclick="notificationSystem.removeNotification('${notification.id}')">&times;</button>
      </div>
    `).join('');
  }

  removeNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id != notificationId);
    this.saveNotificationsToStorage();
    this.updateNotificationCenter();
    this.updateNotificationBadge();
  }

  clearAllNotifications() {
    this.notifications = [];
    this.unreadCount = 0;
    this.saveNotificationsToStorage();
    this.updateNotificationCenter();
    this.updateNotificationBadge();
  }

  updateNotificationBadge() {
    const badges = document.querySelectorAll('.notification-badge');
    badges.forEach(badge => {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  saveNotificationsToStorage() {
    try {
      localStorage.setItem('app_notifications', JSON.stringify({
        notifications: this.notifications,
        unreadCount: this.unreadCount
      }));
    } catch (e) {
      console.warn('Could not save notifications to localStorage:', e);
    }
  }

  loadNotificationsFromStorage() {
    try {
      const stored = localStorage.getItem('app_notifications');
      if (stored) {
        const data = JSON.parse(stored);
        this.notifications = data.notifications || [];
        this.unreadCount = data.unreadCount || 0;
        
        // Convert timestamp strings back to Date objects
        this.notifications.forEach(n => {
          if (typeof n.timestamp === 'string') {
            n.timestamp = new Date(n.timestamp);
          }
        });
      }
    } catch (e) {
      console.warn('Could not load notifications from localStorage:', e);
      this.notifications = [];
      this.unreadCount = 0;
    }
  }

  // Convenience methods for different notification types
  success(message, options = {}) {
    return this.show('success', message, options);
  }

  error(message, options = {}) {
    return this.show('error', message, { ...options, persistent: true });
  }

  warning(message, options = {}) {
    return this.show('warning', message, options);
  }

  info(message, options = {}) {
    return this.show('info', message, options);
  }

  event(message, options = {}) {
    return this.show('event', message, options);
  }

  member(message, options = {}) {
    return this.show('member', message, options);
  }

  attendance(message, options = {}) {
    return this.show('attendance', message, options);
  }

  system(message, options = {}) {
    return this.show('system', message, options);
  }
}

// Global notification system instance
window.notificationSystem = new NotificationSystem();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.notificationSystem.init();
});

// Expose global functions for onclick handlers
window.openNotificationCenter = () => window.notificationSystem.openNotificationCenter();
window.closeNotificationCenter = () => window.notificationSystem.closeNotificationCenter();
