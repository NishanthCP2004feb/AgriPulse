import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Nutrient-to-fertilizer details mapping.
 */
const FERTILIZER_DETAILS = {
  Nitrogen: { fertilizer: 'Urea', icon: '🌱' },
  Phosphorus: { fertilizer: 'DAP', icon: '🌿' },
  Potassium: { fertilizer: 'MOP', icon: '🌾' },
};

/**
 * Displays fertilizer recommendation clearly with icons.
 */
function FertilizerRecommendation({ result }) {
  const { t } = useLanguage();
  const deficiencies = result.health_metrics.critical_deficiencies;
  const plan = result.recommendation.fertilizer_plan;

  return (
    <div className="fertilizer-rec-container">
      <h3 className="fertilizer-rec-title">🧪 {t('fertilizer_recommendation')}</h3>
      {deficiencies.length === 0 ? (
        <div className="fertilizer-rec-ok">
          <span className="fertilizer-rec-ok-icon">✅</span>
          <p>{plan}</p>
        </div>
      ) : (
        <div className="fertilizer-rec-cards">
          {deficiencies.map((nutrient, idx) => {
            const info = FERTILIZER_DETAILS[nutrient] || {
              fertilizer: nutrient,
              icon: '💊',
            };
            return (
              <div key={idx} className="fertilizer-rec-card">
                <div className="fertilizer-rec-card-icon">{info.icon}</div>
                <div className="fertilizer-rec-card-body">
                  <p className="fertilizer-rec-card-action">
                    {info.icon} Apply {info.fertilizer} Fertilizer
                  </p>
                  <p className="fertilizer-rec-card-purpose">
                    <strong>{t('purpose')}:</strong>{' '}
                    {t('improve_levels').replace('{nutrient}', t(nutrient.toLowerCase()))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FertilizerRecommendation;
