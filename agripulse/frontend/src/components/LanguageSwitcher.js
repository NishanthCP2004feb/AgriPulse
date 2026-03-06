import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * LanguageSwitcher – dropdown to change the active UI language.
 * Renders in the navbar/header area.
 * Selecting a language instantly updates all UI text (no reload).
 */
function LanguageSwitcher() {
  const { lang, setLang, languages } = useLanguage();

  return (
    <div className="lang-switcher">
      <label htmlFor="lang-select" className="lang-label">
        🌐
      </label>
      <select
        id="lang-select"
        className="lang-dropdown"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        aria-label="Select language"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeLabel} ({l.label})
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSwitcher;
