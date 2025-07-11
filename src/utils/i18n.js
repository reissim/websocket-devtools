/**
 * Internationalization utility for WebSocket Inspector
 * Supports multiple languages with JSON-based translations
 */

// Import preloaded translations for synchronous initialization
import { translations as preloadedTranslations, supportedLanguages as preloadedSupportedLanguages, languageDisplayNames } from '../locales/index.js';

class I18n {
  constructor() {
    this.currentLanguage = 'en-us'; // Set default immediately
    this.translations = new Map();
    this.fallbackLanguage = 'en-us';
    this.supportedLanguages = preloadedSupportedLanguages;
    this.listeners = new Set();
    this.isInitialized = false;
    
    // Synchronously load preloaded translations
    Object.entries(preloadedTranslations).forEach(([lang, data]) => {
      this.translations.set(lang, data);
    });
    
    console.log('🌐 I18n: Synchronously loaded translations for languages:', Object.keys(preloadedTranslations));
    
    // Asynchronously detect and set user preference
    this.initUserPreference();
  }

  /**
   * Initialize user preference asynchronously (called from constructor)
   */
  async initUserPreference() {
    try {
      console.log('🌐 I18n: Detecting user language preference...');
      const preferredLanguage = await this.detectLanguage();
      console.log('🌐 I18n: Detected preferred language:', preferredLanguage);
      
      if (preferredLanguage !== this.currentLanguage) {
        await this.setLanguage(preferredLanguage);
      }
      
      this.isInitialized = true;
      console.log('🌐 I18n: User preference initialization complete, current language:', this.currentLanguage);
    } catch (error) {
      console.warn('🌐 I18n: Failed to initialize user preference, using default:', error);
      this.isInitialized = true;
    }
  }

  /**
   * Legacy init method for backward compatibility
   */
  async init() {
    // This method is now a no-op since we initialize synchronously
    // Kept for backward compatibility
    return Promise.resolve();
  }

  /**
   * Detect the user's preferred language
   * Priority: 1. Saved preference 2. Browser language 3. Fallback
   */
  async detectLanguage() {
    try {
      // Check saved preference first
      const saved = await this.getSavedLanguage();
      console.log('🌐 I18n: Saved language:', saved);
      if (saved && this.supportedLanguages.includes(saved)) {
        return saved;
      }

      // Check browser language
      const browserLang = this.getBrowserLanguage();
      console.log('🌐 I18n: Browser language:', browserLang);
      if (browserLang && this.supportedLanguages.includes(browserLang)) {
        return browserLang;
      }

      // Return fallback
      console.log('🌐 I18n: Using fallback language:', this.fallbackLanguage);
      return this.fallbackLanguage;
    } catch (error) {
      console.warn('🌐 I18n: Failed to detect language:', error);
      return this.fallbackLanguage;
    }
  }

  /**
   * Get browser language preference
   */
  getBrowserLanguage() {
    try {
      const lang = navigator.language || navigator.userLanguage;
      if (!lang) return null;

      // Normalize language code (e.g., 'en-US' -> 'en-us', 'zh-CN' -> 'zh-cn')
      const normalized = lang.toLowerCase();
      
      // Check for exact match
      if (this.supportedLanguages.includes(normalized)) {
        return normalized;
      }

      // Check for language family match (e.g., 'en-gb' -> 'en-us')
      const family = normalized.split('-')[0];
      const familyMatch = this.supportedLanguages.find(lang => 
        lang.startsWith(family + '-')
      );
      
      return familyMatch || null;
    } catch (error) {
      console.warn('Failed to get browser language:', error);
      return null;
    }
  }

  /**
   * Get saved language preference from storage
   */
  async getSavedLanguage() {
    try {
      // Use chrome.storage.local for persistent storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['ws_inspector_language']);
        return result.ws_inspector_language || null;
      }

      // Fallback to localStorage for testing
      return localStorage.getItem('ws_inspector_language');
    } catch (error) {
      console.warn('Failed to get saved language:', error);
      return null;
    }
  }

  /**
   * Save language preference to storage
   */
  async saveLanguage(language) {
    try {
      // Use chrome.storage.local for persistent storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ ws_inspector_language: language });
      } else {
        // Fallback to localStorage for testing
        localStorage.setItem('ws_inspector_language', language);
      }
    } catch (error) {
      console.warn('Failed to save language:', error);
    }
  }

  /**
   * Load translation data for a language (now returns preloaded data)
   */
  async loadTranslations(language) {
    if (this.translations.has(language)) {
      console.log('🌐 I18n: Using preloaded translations for', language);
      return this.translations.get(language);
    }

    // If language is not preloaded, fall back to the default language
    if (language !== this.fallbackLanguage) {
      console.warn(`🌐 I18n: Language '${language}' not preloaded, falling back to '${this.fallbackLanguage}'`);
      return this.translations.get(this.fallbackLanguage) || {};
    }

    // This should not happen since we preload all supported languages
    console.error(`🌐 I18n: Fallback language '${this.fallbackLanguage}' not found in preloaded translations`);
    return {};
  }

  /**
   * Set the current language and load its translations
   */
  async setLanguage(language) {
    if (!this.supportedLanguages.includes(language)) {
      console.warn(`🌐 I18n: Unsupported language: ${language}, using fallback`);
      language = this.fallbackLanguage;
    }

    console.log('🌐 I18n: Setting language to:', language);

    // Load translations for the language
    await this.loadTranslations(language);
    
    // Update current language
    const oldLanguage = this.currentLanguage;
    this.currentLanguage = language;

    // Save preference
    await this.saveLanguage(language);

    // Notify listeners
    if (oldLanguage !== language) {
      console.log('🌐 I18n: Language changed from', oldLanguage, 'to', language, '- notifying', this.listeners.size, 'listeners');
      this.notifyLanguageChange(language, oldLanguage);
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.currentLanguage || this.fallbackLanguage;
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages() {
    return [...this.supportedLanguages];
  }

  /**
   * Translate a key to the current language
   */
  t(key, params = {}) {
    const language = this.getCurrentLanguage();
    const translations = this.translations.get(language) || {};
    
    // Get translation from current language
    let translation = this.getNestedValue(translations, key);
    
    // Fallback to default language if translation not found
    if (translation === undefined && language !== this.fallbackLanguage) {
      const fallbackTranslations = this.translations.get(this.fallbackLanguage) || {};
      translation = this.getNestedValue(fallbackTranslations, key);
    }
    
    // If still no translation, return the key itself
    if (translation === undefined) {
      console.warn(`🌐 I18n: Translation missing for key: ${key} (current lang: ${language}, available translations:`, Object.keys(translations), ')');
      return key;
    }

    // Replace parameters in translation
    return this.replaceParams(translation, params);
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
  }

  /**
   * Replace parameters in translation string
   */
  replaceParams(translation, params) {
    if (typeof translation !== 'string' || Object.keys(params).length === 0) {
      return translation;
    }

    return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Add listener for language changes
   */
  addLanguageChangeListener(listener) {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of language change
   */
  notifyLanguageChange(newLanguage, oldLanguage) {
    this.listeners.forEach(listener => {
      try {
        listener(newLanguage, oldLanguage);
      } catch (error) {
        console.error('Error in language change listener:', error);
      }
    });
  }

  /**
   * Get language display name
   */
  getLanguageDisplayName(language) {
    return languageDisplayNames[language] || language;
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language) {
    return this.supportedLanguages.includes(language);
  }

  /**
   * Get translation data for debugging
   */
  getTranslationData(language = null) {
    const lang = language || this.getCurrentLanguage();
    return this.translations.get(lang) || {};
  }

  /**
   * Reload translations for current language
   */
  async reloadTranslations() {
    const language = this.getCurrentLanguage();
    this.translations.delete(language);
    await this.loadTranslations(language);
    this.notifyLanguageChange(language, language);
  }
}

// Create and export singleton instance
const i18n = new I18n();

// Export commonly used functions for convenience
export const t = (key, params) => i18n.t(key, params);
export const setLanguage = (language) => i18n.setLanguage(language);
export const getCurrentLanguage = () => i18n.getCurrentLanguage();
export const getSupportedLanguages = () => i18n.getSupportedLanguages();
export const getLanguageDisplayName = (language) => i18n.getLanguageDisplayName(language);
export const addLanguageChangeListener = (listener) => i18n.addLanguageChangeListener(listener);

// Export the main instance
export default i18n; 