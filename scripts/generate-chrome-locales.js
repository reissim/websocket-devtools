#!/usr/bin/env node

/**
 * Generate Chrome standard format locale files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Converter class (simplified version)
class I18nConverter {
  static flatKeyToChromeKey(flatKey) {
    return flatKey.replace(/\./g, '_').replace(/[^a-zA-Z0-9_]/g, '_');
  }

  static flatToChromeFormat(flatTranslations) {
    const chromeFormat = {};
    
    Object.entries(flatTranslations).forEach(([key, value]) => {
      const chromeKey = this.flatKeyToChromeKey(key);
      chromeFormat[chromeKey] = {
        message: value,
        description: `Translation for ${key}`
      };
    });
    
    return chromeFormat;
  }

  static extractExtensionInfo(flatTranslations) {
    const info = {};
    
    if (flatTranslations['app.title']) {
      info.extensionName = {
        message: flatTranslations['app.title'],
        description: 'Extension name'
      };
    }

    if (flatTranslations['app.description']) {
      info.extensionDescription = {
        message: flatTranslations['app.description'], 
        description: 'Extension description'
      };
    }

    if (flatTranslations['popup.title']) {
      info.popupTitle = {
        message: flatTranslations['popup.title'],
        description: 'Popup title'
      };
    }

    return info;
  }
}

// Language mapping
const localeMapping = {
  'en-us': 'en',
  'zh-cn': 'zh_CN'
};

async function generateChromeLocales() {
  try {
    console.log('🔄 Generating Chrome format locale files...');

    // Ensure directories exist
    for (const chromeLocale of Object.values(localeMapping)) {
      const dir = path.join(projectRoot, 'src', '_locales', chromeLocale);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }

    // Process each language
    for (const [flatLocale, chromeLocale] of Object.entries(localeMapping)) {
      const flatPath = path.join(projectRoot, 'src', 'assets', 'locales', `${flatLocale}.json`);
      const chromePath = path.join(projectRoot, 'src', '_locales', chromeLocale, 'messages.json');

      if (fs.existsSync(flatPath)) {
        console.log(`🔄 Processing ${flatLocale} -> ${chromeLocale}`);
        
        // Read flat format
        const flatContent = fs.readFileSync(flatPath, 'utf8');
        const flatTranslations = JSON.parse(flatContent);
        
        // Convert to Chrome format
        const chromeFormat = I18nConverter.flatToChromeFormat(flatTranslations);
        const extensionInfo = I18nConverter.extractExtensionInfo(flatTranslations);
        
        // Merge extension info
        const finalFormat = { ...chromeFormat, ...extensionInfo };
        
        // Write Chrome format file
        fs.writeFileSync(chromePath, JSON.stringify(finalFormat, null, 2));
        console.log(`✅ Generated ${chromePath}`);
        console.log(`   📊 Converted ${Object.keys(flatTranslations).length} translation items`);
      } else {
        console.log(`⚠️  File not found: ${flatPath}`);
      }
    }

    // Generate mapping table
    const firstFlatPath = path.join(projectRoot, 'src', 'assets', 'locales', 'en-us.json');
    if (fs.existsSync(firstFlatPath)) {
      const flatContent = fs.readFileSync(firstFlatPath, 'utf8');
      const flatTranslations = JSON.parse(flatContent);
      
      const mapping = {};
      Object.keys(flatTranslations).forEach(flatKey => {
        const chromeKey = I18nConverter.flatKeyToChromeKey(flatKey);
        mapping[chromeKey] = flatKey;
      });

      const mappingPath = path.join(projectRoot, 'src', 'utils', 'i18n-key-mapping.json');
      fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
      console.log(`✅ Generated key mapping table: ${mappingPath}`);
    }

    console.log('🎉 Chrome locale file generation completed!');
    
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

generateChromeLocales(); 