import favoritesService from "./favoritesService";

// Global favorites functionality
class GlobalFavorites {
  constructor() {
    this.tabSwitchCallbacks = new Set();
  }

  // Add tab switch callback
  addTabSwitchCallback(callback) {
    this.tabSwitchCallbacks.add(callback);
    return () => this.tabSwitchCallbacks.delete(callback);
  }

  // Notify all tab switch callbacks
  notifyTabSwitch() {
    this.tabSwitchCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
      }
    });
  }

  // Quick add favorite (used for adding from editor)
  quickAdd(messageData, options = {}) {

    const defaultOptions = {
      switchToFavoritesTab: true,
      generateName: true,
      autoEdit: true,
      showNotification: true,
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Decide name
    let name = "";
    if (finalOptions.generateName) {
      // Changed to not generate name by default, let user fill it in
      name = "";
    } else {
      name = ""; // Empty name, user needs to fill in
    }

    //   "🌟 GlobalFavorites: calling favoritesService.addFavorite with name:",
    //   name
    const result = favoritesService.addFavorite(
      {
        name,
        data: messageData,
      },
      finalOptions
    );

    if (result && result.id) {
      if (finalOptions.switchToFavoritesTab) {
        this.notifyTabSwitch();
      }

      if (finalOptions.showNotification) {
      }
    }
    // Error cases (like LIMIT_EXCEEDED) are handled by the service's listener system

    return result;
  }

  // Add favorite from message list (no auto tab switch, no auto edit)
  addFromMessageList(messageData, options = {}) {
    const defaultOptions = {
      switchToFavoritesTab: false,
      generateName: true,
      autoEdit: false,
      showNotification: true,
    };

    return this.quickAdd(messageData, { ...defaultOptions, ...options });
  }

  // Add favorite from editor (auto tab switch, auto edit)
  addFromEditor(messageData, options = {}) {
    const defaultOptions = {
      switchToFavoritesTab: true,
      generateName: true,
      autoEdit: true,
      showNotification: true,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    return this.quickAdd(messageData, mergedOptions);
  }

  // Add favorite silently (no tab switch, no edit, no notification)
  addSilently(messageData, options = {}) {
    const defaultOptions = {
      switchToFavoritesTab: false,
      generateName: true,
      autoEdit: false,
      showNotification: false,
    };

    return this.quickAdd(messageData, { ...defaultOptions, ...options });
  }

  // Get all favorites
  getAll() {
    return favoritesService.getFavorites();
  }

  // Delete favorite
  delete(id) {
    return favoritesService.deleteFavorite(id);
  }

  // Update favorite
  update(id, updates) {
    return favoritesService.updateFavorite(id, updates);
  }

  // Add listener
  addListener(listener) {
    return favoritesService.addListener(listener);
  }
}

// Create global instance
const globalFavorites = new GlobalFavorites();

// Export singleton and class
export default globalFavorites;
export { GlobalFavorites };

// For backward compatibility, also export some shortcut methods
export const quickAddFavorite = (messageData, options) =>
  globalFavorites.quickAdd(messageData, options);
export const addFromMessageList = (messageData, options) =>
  globalFavorites.addFromMessageList(messageData, options);
export const addFromEditor = (messageData, options) =>
  globalFavorites.addFromEditor(messageData, options);
export const addSilently = (messageData, options) =>
  globalFavorites.addSilently(messageData, options);
