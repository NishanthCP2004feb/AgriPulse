import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

/**
 * Header component – displays the app title, tagline, and language switcher.
 */
function Header() {
  const { t } = useLanguage();

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-text">
          <h1>🌱 {t('app_title')}</h1>
          <p>{t('app_tagline')}</p>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

export default Header;
