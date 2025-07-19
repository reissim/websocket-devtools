/**
 * I18n format converter
 * Convert flat format to Chrome standard nested format with key conversion
 */

class I18nConverter {
  /**
   * Convert flat format to Chrome standard format
   * @param {Object} flatTranslations - flat format translations {"monitor.status.active": "Monitoring Active"}
   * @returns {Object} Chrome format translations {"monitor_status_active": {"message": "Monitoring Active"}}
   */
  static flatToChromeFormat(flatTranslations) {
    const chromeFormat = {};
    
    Object.entries(flatTranslations).forEach(([key, value]) => {
      // Convert key: monitor.status.active -> monitor_status_active
      const chromeKey = this.flatKeyToChromeKey(key);
      
      // Chrome required nested format
      chromeFormat[chromeKey] = {
        message: value,
        description: `Translation for ${key}`
      };
    });
    
    return chromeFormat;
  }

  /**
   * Convert Chrome format to flat format
   * @param {Object} chromeTranslations - Chrome format translations
   * @returns {Object} flat format translations
   */
  static chromeToFlatFormat(chromeTranslations) {
    const flatFormat = {};
    
    Object.entries(chromeTranslations).forEach(([chromeKey, data]) => {
      const flatKey = this.chromeKeyToFlatKey(chromeKey);
      flatFormat[flatKey] = data.message || data;
    });
    
    return flatFormat;
  }

  /**
   * Convert flat key to Chrome key
   * monitor.status.active -> monitor_status_active
   */
  static flatKeyToChromeKey(flatKey) {
    return flatKey.replace(/\./g, '_').replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Convert Chrome key to flat key
   * monitor_status_active -> monitor.status.active
   */
  static chromeKeyToFlatKey(chromeKey) {
    // Due to lossy conversion, we need to maintain a mapping table
    return this.getKeyMapping()[chromeKey] || chromeKey.replace(/_/g, '.');
  }

  /**
   * Key mapping table - for reverse mapping from Chrome key to flat key
   */
  static getKeyMapping() {
    // This mapping table can be automatically generated from existing flat format
    return this._keyMapping || this.generateKeyMapping();
  }

  /**
   * Generate key mapping table
   */
  static generateKeyMapping() {
    this._keyMapping = {};
    
    // Read all keys from existing public/locales files
    // We hardcode some common ones here, actual usage will generate dynamically
    const flatKeys = [
      'app.title',
      'app.description', 
      'monitor.status.active',
      'monitor.status.inactive',
      'monitor.status.paused',
      // ... more keys will be added at runtime
    ];

    flatKeys.forEach(flatKey => {
      const chromeKey = this.flatKeyToChromeKey(flatKey);
      this._keyMapping[chromeKey] = flatKey;
    });

    return this._keyMapping;
  }

  /**
   * Update key mapping table (called at runtime)
   */
  static updateKeyMapping(flatTranslations) {
    if (!this._keyMapping) {
      this._keyMapping = {};
    }

    Object.keys(flatTranslations).forEach(flatKey => {
      const chromeKey = this.flatKeyToChromeKey(flatKey);
      this._keyMapping[chromeKey] = flatKey;
    });
  }

  /**
   * Generate Chrome _locales file content
   */
  static generateChromeLocaleFile(flatTranslations, description = '') {
    const chromeFormat = this.flatToChromeFormat(flatTranslations);
    
    // Add extension basic info translations
    const extInfo = this.extractExtensionInfo(flatTranslations);
    Object.assign(chromeFormat, extInfo);

    return JSON.stringify(chromeFormat, null, 2);
  }

  /**
   * Extract extension basic info translations (for manifest.json)
   */
  static extractExtensionInfo(flatTranslations) {
    const info = {};
    
    // Extension name
    if (flatTranslations['app.title']) {
      info.extensionName = {
        message: flatTranslations['app.title'],
        description: 'Extension name'
      };
    }

    // Extension description
    if (flatTranslations['app.description']) {
      info.extensionDescription = {
        message: flatTranslations['app.description'],
        description: 'Extension description'
      };
    }

    // Popup title
    if (flatTranslations['popup.title']) {
      info.popupTitle = {
        message: flatTranslations['popup.title'],
        description: 'Popup title'
      };
    }

    return info;
  }
}

export default I18nConverter; 