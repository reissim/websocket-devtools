import React, { useState, useEffect, useRef } from 'react';
import { Languages, ChevronDown } from 'lucide-react';
import { 
  getCurrentLanguage, 
  getSupportedLanguages, 
  getLanguageDisplayName, 
  setLanguage, 
  addLanguageChangeListener,
  t
} from '../utils/i18n.js';

const LanguageSelector = () => {
  // Synchronous initialization, avoid delay
  const [currentLanguage, setCurrentLanguage] = useState(() => getCurrentLanguage());
  const [isOpen, setIsOpen] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState(() => getSupportedLanguages());
  const dropdownRef = useRef(null);

  // Initialize component
  useEffect(() => {
    // Listen for language changes
    const unsubscribe = addLanguageChangeListener((newLanguage) => {
      setCurrentLanguage(newLanguage);
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle language change
  const handleLanguageChange = async (languageCode) => {
    try {
      await setLanguage(languageCode);
      setIsOpen(false);
    } catch (error) {
      // console.error('Failed to change language:', error); Removed for clean up.
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // If no supported languages, don't render
  if (!supportedLanguages || supportedLanguages.length === 0) {
    return null;
  }

  // If only one language supported, don't render selector
  if (supportedLanguages.length === 1) {
    return null;
  }

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button 
        className="language-selector-trigger"
        onClick={toggleDropdown}
        aria-label={t("language.selector.change")}
        title={t("language.selector.change")}
      >
        <Languages size={14} />
        <span className="language-selector-current">
          {getLanguageDisplayName(currentLanguage)}
        </span>
        <ChevronDown 
          size={14} 
          className={`language-selector-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="language-selector-dropdown">
          <div className="language-selector-dropdown-content">
            {supportedLanguages.map((languageCode) => (
              <button
                key={languageCode}
                className={`language-selector-option ${
                  languageCode === currentLanguage ? 'active' : ''
                }`}
                onClick={() => handleLanguageChange(languageCode)}
              >
                <span className="language-selector-option-name">
                  {getLanguageDisplayName(languageCode)}
                </span>
                <span className="language-selector-option-code">
                  {languageCode}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 