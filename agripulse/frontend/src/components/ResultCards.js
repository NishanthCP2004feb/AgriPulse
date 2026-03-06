import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Displays analysis result cards with color-coded health status.
 * All labels are translated via the useLanguage() hook.
 */
function ResultCards({ results }) {
  const { t } = useLanguage();

  /**
   * Map backend health status to CSS class name.
   */
  const getStatusClass = (health) => {
    switch (health) {
      case 'Optimal':   return 'optimal';
      case 'Deficient': return 'deficient';
      case 'Critical':  return 'critical';
      default:          return '';
    }
  };

  /**
   * Translate the health status label.
   */
  const translateHealth = (health) => {
    switch (health) {
      case 'Optimal':   return t('health_optimal');
      case 'Deficient': return t('health_deficient');
      case 'Critical':  return t('health_critical');
      default:          return health;
    }
  };

  const count = results.length;
  const sampleWord = count > 1 ? t('samples') : t('sample');

  return (
    <section className="results-section">
      <h2>📊 {t('results_title')} ({count} {sampleWord})</h2>
      {results.map((r, idx) => {
        const health = r.health_metrics.overall_health;
        const statusClass = getStatusClass(health);
        const score = r.recommendation.suitability_score;

        return (
          <div key={idx} className={`result-card ${statusClass}`}>
            {/* Card Header */}
            <div className="card-header">
              <h3>{r.soil_id} — {r.target_crop}</h3>
              <span className={`badge ${statusClass}`}>{translateHealth(health)}</span>
            </div>

            {/* Score Bar */}
            <div className="score-bar-container">
              <div className="score-bar-bg">
                <div
                  className={`score-bar-fill ${statusClass}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="score-label">{t('suitability_score')}: <strong>{score}/100</strong></p>
            </div>

            {/* Detail Row */}
            <div className="detail-row">
              <div className="detail-item">
                <strong>{t('deficiencies')}</strong>
                {r.health_metrics.critical_deficiencies.length > 0 ? (
                  <div className="deficiency-tags">
                    {r.health_metrics.critical_deficiencies.map((d, i) => (
                      <span key={i} className="def-tag">{d}</span>
                    ))}
                  </div>
                ) : (
                  <span className="no-def">✅ {t('none')}</span>
                )}
              </div>
              <div className="detail-item">
                <strong>{t('fertilizer_plan')}</strong>
                <p>{r.recommendation.fertilizer_plan}</p>
              </div>
            </div>

            {/* AI Explanation */}
            <div className="ai-box">
              <strong>🤖 {t('ai_explanation')}</strong>
              {r.ai_explanation}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default ResultCards;
