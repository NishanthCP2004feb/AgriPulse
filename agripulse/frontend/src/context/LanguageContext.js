import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── Import all locale JSON files ────────────────────────────────
// To add a new language: 1) create /src/locales/xx.json  2) add entry to LANGUAGES below
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import kn from '../locales/kn.json';
import ta from '../locales/ta.json';
import te from '../locales/te.json';

/**
 * Supported languages registry.
 * To add a new language, just add { code, label, data } here
 * and create the corresponding JSON file in /src/locales/.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English',  nativeLabel: 'English',  data: en },
  { code: 'hi', label: 'Hindi',    nativeLabel: 'हिन्दी',    data: hi },
  { code: 'kn', label: 'Kannada',  nativeLabel: 'ಕನ್ನಡ',    data: kn },
  { code: 'ta', label: 'Tamil',    nativeLabel: 'தமிழ்',     data: ta },
  { code: 'te', label: 'Telugu',   nativeLabel: 'తెలుగు',    data: te },
];

// Build a quick lookup map: { en: {...}, hi: {...}, ... }
const LOCALE_MAP = {};
LANGUAGES.forEach((lang) => {
  LOCALE_MAP[lang.code] = lang.data;
});

const STORAGE_KEY = 'agripulse_lang';
const DEFAULT_LANG = 'en';

// ── Context ─────────────────────────────────────────────────────
const LanguageContext = createContext();

/**
 * LanguageProvider – wraps the app and provides:
 *   - lang        : current language code (e.g. "en")
 *   - setLang     : function to change language
 *   - t(key)      : translation function — returns translated string for key
 *   - languages   : list of available languages for the switcher UI
 */
export function LanguageProvider({ children }) {
  // Read saved language from localStorage, fall back to English
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && LOCALE_MAP[saved] ? saved : DEFAULT_LANG;
    } catch {
      return DEFAULT_LANG;
    }
  });

  // Persist language choice to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage unavailable — ignore silently
    }
  }, [lang]);

  /**
   * Change the active language.
   * @param {string} code – language code (e.g. "hi")
   */
  const setLang = useCallback((code) => {
    if (LOCALE_MAP[code]) {
      setLangState(code);
    }
  }, []);

  /**
   * Translation function.
   * @param {string} key – translation key from the JSON files
   * @returns {string} translated text, or the key itself as fallback
   */
  const t = useCallback(
    (key) => {
      // Try current language first, fall back to English, then return key
      return LOCALE_MAP[lang]?.[key] || LOCALE_MAP[DEFAULT_LANG]?.[key] || key;
    },
    [lang]
  );

  const value = { lang, setLang, t, languages: LANGUAGES };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Custom hook to access the language context from any component.
 * Usage:  const { t, lang, setLang } = useLanguage();
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage() must be used inside <LanguageProvider>');
  }
  return context;
}
