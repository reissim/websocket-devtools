/**
 * Preloaded translations for synchronous i18n initialization
 * This file imports all translation JSON files and exports them
 * to avoid async loading delays during component rendering
 */

// Import translation files directly (with JSON import assertions)
import enUS from '../../public/locales/en-us.json' with { type: 'json' };
import zhCN from '../../public/locales/zh-cn.json' with { type: 'json' };

// Export translations object for immediate access
export const translations = {
  'en-us': enUS,
  'zh-cn': zhCN
};

// Export supported languages
export const supportedLanguages = Object.keys(translations);

// Export language display names
export const languageDisplayNames = {
  'en-us': 'English',
  'zh-cn': '中文'
}; 