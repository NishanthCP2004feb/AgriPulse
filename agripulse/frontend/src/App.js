import React, { useState } from 'react';
import Header from './components/Header';
import UploadForm from './components/UploadForm';
import ResultCards from './components/ResultCards';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import { useLanguage } from './context/LanguageContext';
import './App.css';

/**
 * AgriPulse – Precision Agriculture Assistant
 * Main application component.
 */
function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'cards'
  const { t } = useLanguage();

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <UploadForm
          setResults={setResults}
          setLoading={setLoading}
          setError={setError}
        />
        {error && <div className="error-banner">{error}</div>}
        {loading && (
          <div className="loading-container">
            <div className="spinner" />
            <p>{t('analyzing')}</p>
          </div>
        )}
        {!loading && results.length > 0 && (
          <>
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
                onClick={() => setViewMode('dashboard')}
              >
                📊 {t('view_dashboard')}
              </button>
              <button
                className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
              >
                🗂️ {t('view_cards')}
              </button>
            </div>
            {viewMode === 'dashboard' ? (
              <Dashboard results={results} />
            ) : (
              <ResultCards results={results} />
            )}
          </>
        )}
      </main>
      <footer className="footer">
        <p>{t('footer')}</p>
      </footer>
      <ChatBot latestResults={results} />
    </div>
  );
}

export default App;
