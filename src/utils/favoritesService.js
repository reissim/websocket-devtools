// Favorites service for managing WebSocket message favorites
class FavoritesService {
  constructor() {
    this.storageKey = "websocket-favorites";
    this.listeners = new Set();
    this.notificationTimeoutId = null;
    // New: Debounce batch updates to reduce frequent triggers
    this.batchUpdateTimeoutId = null;
    this.pendingUpdates = [];
  }

  // Get all favorites
  getFavorites() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  }

  // Get favorites count
  getFavoritesCount() {
    return this.getFavorites().length;
  }

  // Save favorites to localStorage
  saveFavorites(favorites) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(favorites));
      this.notifyListeners(favorites);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Add new favorite
  addFavorite(favoriteData, options = {}) {
    const {
      name = "",
      data = "{}",
      tags = [],
      autoEdit = true,
      switchToFavoritesTab = true,
    } = { ...favoriteData, ...options };

    // Validate data
    if (!data || !data.trim()) {
      return null;
    }

    const currentFavorites = this.getFavorites();
    
    // Always switch to favorites tab regardless of limit
    if (switchToFavoritesTab) {
      this.notifyListeners(currentFavorites, { 
        type: "navigate_to_favorites", 
        switchToFavoritesTab: true 
      });
    }

    // Check favorites limit (maximum 5) - this is the final interception point
    if (currentFavorites.length >= 5) {
      // Trigger limit exceeded notification but don't save
      this.notifyListeners(currentFavorites, { type: "limit_exceeded", count: currentFavorites.length });
      return { error: 'LIMIT_EXCEEDED', message: 'Maximum 5 favorites allowed' };
    }

    const newFavorite = {
      id: Date.now().toString(),
      name: name.trim(),
      data: data.trim(),
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    //   id: newFavorite.id,
    //   name: newFavorite.name,
    //   nameLength: newFavorite.name.length,
    // }); Removed for clean up.

    const newFavorites = [newFavorite, ...currentFavorites];

    if (this.saveFavorites(newFavorites)) {
      // Optimization: use a longer debounce delay to reduce frequent notifications
      this.debouncedNotify(newFavorites, {
        type: "add",
        favorite: newFavorite,
        autoEdit,
        switchToFavoritesTab,
      });

      return newFavorite;
    }

    return null;
  }

  // Update favorite
  updateFavorite(id, updates) {
    const favorites = this.getFavorites();
    const favoriteIndex = favorites.findIndex((fav) => fav.id === id);

    if (favoriteIndex === -1) {
      return null;
    }

    const updatedFavorites = [...favorites];
    updatedFavorites[favoriteIndex] = {
      ...updatedFavorites[favoriteIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (this.saveFavorites(updatedFavorites)) {
      const updatedFavorite = updatedFavorites[favoriteIndex];
      this.debouncedNotify(updatedFavorites, {
        type: "update",
        favorite: updatedFavorite,
      });
      return updatedFavorite;
    }

    return null;
  }

  // Delete favorite
  deleteFavorite(id) {
    const favorites = this.getFavorites();
    const favoriteToDelete = favorites.find((f) => f.id === id);

    if (!favoriteToDelete) {
      return false;
    }

    const newFavorites = favorites.filter((fav) => fav.id !== id);

    if (this.saveFavorites(newFavorites)) {
      this.debouncedNotify(newFavorites, {
        type: "delete",
        favorite: favoriteToDelete,
      });
      return true;
    }

    return false;
  }

  // Find if similar favorite already exists based on content
  findSimilarFavorite(data) {
    const favorites = this.getFavorites();
    const normalizedData = data.trim();
    return favorites.find((fav) => fav.data.trim() === normalizedData);
  }

  // Add listener
  addListener(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }

    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Optimization: add debounce delay, reduce frequent notifications
  debouncedNotify(favorites, eventData = {}) {
    if (this.notificationTimeoutId) {
      clearTimeout(this.notificationTimeoutId);
    }

    this.notificationTimeoutId = setTimeout(() => {
      this.notifyListeners(favorites, eventData);
    }, 100); // Increased to 100ms debounce to reduce frequent notifications
  }

  // Notify all listeners
  notifyListeners(favorites, eventData = {}) {
    if (this.listeners.size === 0) return;

    this.listeners.forEach((listener) => {
      try {
        listener(favorites, eventData);
      } catch (error) {
      }
    });
  }

  // Convenience method for quick add favorite
  quickAddFavorite(messageData, options = {}) {
    const {
      switchToFavoritesTab = true,
      generateName = true,
      ...otherOptions
    } = options;

    // Check if similar favorite already exists
    const existingFavorite = this.findSimilarFavorite(messageData);
    if (existingFavorite) {
      return existingFavorite;
    }

    // Generate favorite name
    let favoriteName = "";
    if (generateName) {
      favoriteName = this.generateFavoriteName(messageData);
    }

    return this.addFavorite(
      {
        name: favoriteName,
        data: messageData,
      },
      {
        switchToFavoritesTab,
        ...otherOptions,
      }
    );
  }

  // Generate favorite name
  generateFavoriteName(messageData) {
    try {
      const parsed = JSON.parse(messageData);

      // Try to generate name from common fields
      if (parsed.type) {
        return `${parsed.type} Message`;
      }
      if (parsed.action) {
        return `${parsed.action} Action`;
      }
      if (parsed.event) {
        return `${parsed.event} Event`;
      }
      if (parsed.command) {
        return `${parsed.command} Command`;
      }
      if (parsed.message) {
        const msg = String(parsed.message).substring(0, 20);
        return `Message: ${msg}${msg.length >= 20 ? "..." : ""}`;
      }

      // Use first property name
      const keys = Object.keys(parsed);
      if (keys.length > 0) {
        return `${keys[0]} Data`;
      }
    } catch (error) {
    }
    return `Unnamed Message - ${Date.now().toString().slice(-4)}`;
  }

  // Clean up resources
  cleanup() {
    if (this.notificationTimeoutId) {
      clearTimeout(this.notificationTimeoutId);
    }
    if (this.batchUpdateTimeoutId) {
      clearTimeout(this.batchUpdateTimeoutId);
    }
    this.listeners.clear();
  }
}

const favoritesService = new FavoritesService();
export default favoritesService;
