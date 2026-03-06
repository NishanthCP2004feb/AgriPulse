import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Large card showing Soil ID, Crop Type, and Overall Health
 * with color-coded background.
 */
function SoilHealthCard({ result }) {
  const { t } = useLanguage();
  const health = result.health_metrics.overall_health;

  const getColorScheme = (h) => {
    switch (h) {
      case 'Optimal':
        return { bg: '#dcfce7', border: '#22c55e', text: '#15803d', icon: '✅' };
      case 'Deficient':
        return { bg: '#fef9c3', border: '#eab308', text: '#a16207', icon: '⚠️' };
      case 'Critical':
        return { bg: '#fee2e2', border: '#ef4444', text: '#dc2626', icon: '🚨' };
      default:
        return { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280', icon: '❓' };
    }
  };

  const translateHealth = (h) => {
    switch (h) {
      case 'Optimal':   return t('health_optimal');
      case 'Deficient': return t('health_deficient');
      case 'Critical':  return t('health_critical');
      default:          return h;
    }
  };

  const colors = getColorScheme(health);

  return (
    <div
      className="soil-health-card"
      style={{
        background: colors.bg,
        borderLeft: `5px solid ${colors.border}`,
      }}
    >
      <div className="soil-health-header">
        <span className="soil-health-icon">{colors.icon}</span>
        <h3 className="soil-health-title">{t('soil_summary')}</h3>
      </div>
      <div className="soil-health-details">
        <div className="soil-health-row">
          <span className="soil-health-label">{t('soil_id')}</span>
          <span className="soil-health-value">{result.soil_id}</span>
        </div>
        <div className="soil-health-row">
          <span className="soil-health-label">{t('crop_type')}</span>
          <span className="soil-health-value">
            {t(`crop_${result.target_crop.toLowerCase()}`)}
          </span>
        </div>
        <div className="soil-health-row">
          <span className="soil-health-label">{t('overall_health')}</span>
          <span
            className="soil-health-status"
            style={{ color: colors.text, fontWeight: 700 }}
          >
            {translateHealth(health)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default SoilHealthCard;
