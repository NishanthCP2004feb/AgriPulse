import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Displays the AI explanation in a highlighted card.
 */
function AIExplanationPanel({ explanation }) {
  const { t } = useLanguage();

  if (!explanation) return null;

  return (
    <div className="ai-explanation-panel">
      <div className="ai-explanation-header">
        <span className="ai-explanation-icon">🤖</span>
        <h3 className="ai-explanation-title">{t('ai_explanation')}</h3>
      </div>
      <div className="ai-explanation-body">
        <p>{explanation}</p>
      </div>
    </div>
  );
}

export default AIExplanationPanel;
