/**
 * Preloaded translations for synchronous i18n initialization
 * Supports hybrid i18n system: Chrome official + custom translations
 * This file imports all translation JSON files and exports them
 * to avoid async loading delays during component rendering
 */

// Import translation files directly (with JSON import assertions)
import enUS from '../assets/locales/en-us.json' with { type: 'json' };
import zhCN from '../assets/locales/zh-cn.json' with { type: 'json' };
import zhTW from '../assets/locales/zh-tw.json' with { type: 'json' };
import ja from '../assets/locales/ja.json' with { type: 'json' };
import de from '../assets/locales/de.json' with { type: 'json' };
import fr from '../assets/locales/fr.json' with { type: 'json' };
import ko from '../assets/locales/ko.json' with { type: 'json' };

// Export translations object for immediate access
export const translations = {
  'en-us': enUS,
  'zh-cn': zhCN,
  'zh-tw': zhTW,
  'ja': ja,
  'de': de,
  'fr': fr,
  'ko': ko
};

// Export supported languages
export const supportedLanguages = Object.keys(translations);

// Export language display names
export const languageDisplayNames = {
  'en-us': 'English',
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
  'ja': '日本語',
  'de': 'Deutsch',
  'fr': 'Français',
  'ko': '한국어'
};

// Chrome locale mapping (for Chrome API mode)
export const chromeLocaleMapping = {
  'en-us': 'en',
  'zh-cn': 'zh_CN',
  'zh-tw': 'zh_TW',
  'ja': 'ja',
  'de': 'de',
  'fr': 'fr',
  'ko': 'ko'
};

// Reverse mapping (Chrome locale -> flat locale)
export const reverseChromeMapping = {
  'en': 'en-us',
  'zh_CN': 'zh-cn',
  'zh_TW': 'zh-tw',
  'ja': 'ja',
  'de': 'de',
  'fr': 'fr',
  'ko': 'ko',
  'en-US': 'en-us',
  'zh-CN': 'zh-cn',
  'zh': 'zh-cn'
};

/**
 * Detect if Chrome i18n API is currently supported
 */
export const isChromeI18nSupported = () => {
  try {
    return typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage;
  } catch (error) {
    return false;
  }
};

/**
 * Get flat format language code corresponding to Chrome UI language
 */
export const getChromeUILanguageFlat = () => {
  if (!isChromeI18nSupported()) return null;
  
  try {
    const chromeLocale = chrome.i18n.getUILanguage();
    return reverseChromeMapping[chromeLocale] || 'en-us';
  } catch (error) {
    return null;
  }
}; 