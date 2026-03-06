import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Fertilizer map for deficient nutrients.
 */
const FERTILIZER_MAP = {
  Nitrogen: 'Urea',
  Phosphorus: 'DAP',
  Potassium: 'MOP',
};

/**
 * Panel showing deficiency alert cards with recommended fertilizer.
 */
function DeficiencyWarningPanel({ deficiencies }) {
  const { t } = useLanguage();

  if (!deficiencies || deficiencies.length === 0) {
    return (
      <div className="deficiency-panel">
        <h3 className="deficiency-panel-title">🛡️ {t('deficiency_alerts')}</h3>
        <div className="deficiency-none-card">
          <span className="deficiency-none-icon">✅</span>
          <p>{t('no_deficiencies')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="deficiency-panel">
      <h3 className="deficiency-panel-title">⚠️ {t('deficiency_alerts')}</h3>
      <div className="deficiency-cards">
        {deficiencies.map((nutrient, idx) => (
          <div key={idx} className="deficiency-alert-card">
            <div className="deficiency-alert-header">
              <span className="deficiency-alert-icon">⚠️</span>
              <span className="deficiency-alert-name">
                {t(nutrient.toLowerCase())} {t('deficiency_warning')}
              </span>
            </div>
            <div className="deficiency-alert-body">
              <span className="deficiency-alert-label">
                {t('recommended_fertilizer')}:
              </span>
              <span className="deficiency-alert-fertilizer">
                {FERTILIZER_MAP[nutrient] || nutrient}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DeficiencyWarningPanel;
