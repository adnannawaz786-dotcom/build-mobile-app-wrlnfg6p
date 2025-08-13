// Storage utility for managing grocery items in localStorage
const STORAGE_KEYS = {
  ITEMS: 'grocery_items',
  SETTINGS: 'app_settings',
  NOTIFICATIONS: 'notification_settings'
};

// Generate unique ID for items
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Default item structure
const createDefaultItem = (overrides = {}) => ({
  id: generateId(),
  name: '',
  expiryDate: '',
  category: 'other',
  quantity: 1,
  notes: '',
  isExpired: false,
  isExpiringSoon: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// Storage operations for grocery items
export const itemStorage = {
  // Get all items from storage
  getAll: () => {
    try {
      const items = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (!items) return [];
      
      const parsedItems = JSON.parse(items);
      // Update expiry status when retrieving items
      return parsedItems.map(item => updateExpiryStatus(item));
    } catch (error) {
      console.error('Error getting items from storage:', error);
      return [];
    }
  },

  // Get item by ID
  getById: (id) => {
    try {
      const items = itemStorage.getAll();
      return items.find(item => item.id === id) || null;
    } catch (error) {
      console.error('Error getting item by ID:', error);
      return null;
    }
  },

  // Save single item (create or update)
  save: (itemData) => {
    try {
      const items = itemStorage.getAll();
      const existingIndex = items.findIndex(item => item.id === itemData.id);
      
      const updatedItem = {
        ...itemData,
        updatedAt: new Date().toISOString()
      };

      // Update expiry status
      const itemWithStatus = updateExpiryStatus(updatedItem);
      
      if (existingIndex >= 0) {
        items[existingIndex] = itemWithStatus;
      } else {
        // New item
        const newItem = createDefaultItem(itemWithStatus);
        items.push(newItem);
      }
      
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      return itemWithStatus;
    } catch (error) {
      console.error('Error saving item:', error);
      throw new Error('Failed to save item');
    }
  },

  // Save multiple items
  saveAll: (itemsArray) => {
    try {
      const itemsWithStatus = itemsArray.map(item => {
        const itemWithTimestamp = {
          ...item,
          updatedAt: new Date().toISOString()
        };
        return updateExpiryStatus(itemWithTimestamp);
      });
      
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(itemsWithStatus));
      return itemsWithStatus;
    } catch (error) {
      console.error('Error saving items:', error);
      throw new Error('Failed to save items');
    }
  },

  // Delete item by ID
  delete: (id) => {
    try {
      const items = itemStorage.getAll();
      const filteredItems = items.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(filteredItems));
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  },

  // Delete multiple items by IDs
  deleteMany: (ids) => {
    try {
      const items = itemStorage.getAll();
      const filteredItems = items.filter(item => !ids.includes(item.id));
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(filteredItems));
      return true;
    } catch (error) {
      console.error('Error deleting items:', error);
      return false;
    }
  },

  // Clear all items
  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ITEMS);
      return true;
    } catch (error) {
      console.error('Error clearing items:', error);
      return false;
    }
  },

  // Get items by category
  getByCategory: (category) => {
    try {
      const items = itemStorage.getAll();
      return items.filter(item => item.category === category);
    } catch (error) {
      console.error('Error getting items by category:', error);
      return [];
    }
  },

  // Get expired items
  getExpired: () => {
    try {
      const items = itemStorage.getAll();
      return items.filter(item => item.isExpired);
    } catch (error) {
      console.error('Error getting expired items:', error);
      return [];
    }
  },

  // Get items expiring soon
  getExpiringSoon: () => {
    try {
      const items = itemStorage.getAll();
      return items.filter(item => item.isExpiringSoon && !item.isExpired);
    } catch (error) {
      console.error('Error getting expiring soon items:', error);
      return [];
    }
  }
};

// Update expiry status based on current date
const updateExpiryStatus = (item) => {
  if (!item.expiryDate) {
    return { ...item, isExpired: false, isExpiringSoon: false };
  }

  const today = new Date();
  const expiryDate = new Date(item.expiryDate);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    ...item,
    isExpired: diffDays < 0,
    isExpiringSoon: diffDays >= 0 && diffDays <= 3
  };
};

// Settings storage operations
export const settingsStorage = {
  get: () => {
    try {
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : getDefaultSettings();
    } catch (error) {
      console.error('Error getting settings:', error);
      return getDefaultSettings();
    }
  },

  save: (settings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },

  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  }
};

// Default settings
const getDefaultSettings = () => ({
  theme: 'light',
  notifications: {
    enabled: true,
    expiredItems: true,
    expiringSoon: true,
    reminderDays: 3
  },
  camera: {
    quality: 'medium',
    autoFocus: true
  },
  display: {
    sortBy: 'expiryDate',
    sortOrder: 'asc',
    showExpiredItems: true,
    itemsPerPage: 20
  }
});

// Notification settings storage
export const notificationStorage = {
  get: () => {
    try {
      const notifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  },

  save: (notifications) => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      return true;
    } catch (error) {
      console.error('Error saving notifications:', error);
      return false;
    }
  },

  add: (notification) => {
    try {
      const notifications = notificationStorage.get();
      const newNotification = {
        id: generateId(),
        ...notification,
        createdAt: new Date().toISOString()
      };
      notifications.push(newNotification);
      return notificationStorage.save(notifications);
    } catch (error) {
      console.error('Error adding notification:', error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  }
};

// Export utility functions
export const storageUtils = {
  // Check if localStorage is available
  isStorageAvailable: () => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get storage usage info
  getStorageInfo: () => {
    if (!storageUtils.isStorageAvailable()) {
      return { used: 0, available: 0, total: 0 };
    }

    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    // Rough estimate of localStorage limit (usually 5MB)
    const total = 5 * 1024 * 1024;
    return {
      used,
      available: total - used,
      total,
      usedPercentage: (used / total) * 100
    };
  },

  // Clear all app data
  clearAllData: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  },

  // Export data for backup
  exportData: () => {
    try {
      const data = {
        items: itemStorage.getAll(),
        settings: settingsStorage.get(),
        notifications: notificationStorage.get(),
        exportDate: new Date().toISOString()
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  },

  // Import data from backup
  importData: (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.items && Array.isArray(data.items)) {
        itemStorage.saveAll(data.items);
      }
      
      if (data.settings) {
        settingsStorage.save(data.settings);
      }
      
      if (data.notifications && Array.isArray(data.notifications)) {
        notificationStorage.save(data.notifications);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
};

// Initialize storage with default values if empty
export const initializeStorage = () => {
  if (!storageUtils.isStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    // Initialize items if empty
    if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
      itemStorage.saveAll([]);
    }

    // Initialize settings if empty
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      settingsStorage.save(getDefaultSettings());
    }

    // Initialize notifications if empty
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      notificationStorage.save([]);
    }

    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};