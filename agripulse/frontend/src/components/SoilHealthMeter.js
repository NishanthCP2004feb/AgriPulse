import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Bonus: Animated soil health progress meter with color transitions.
 */
function SoilHealthMeter({ score }) {
  const { t } = useLanguage();
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    // Animate after mount
    const timer = setTimeout(() => setAnimatedWidth(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getColor = (s) => {
    if (s >= 80) return '#22c55e';
    if (s >= 50) return '#eab308';
    return '#ef4444';
  };

  const getGradient = (s) => {
    if (s >= 80) return 'linear-gradient(90deg, #22c55e, #16a34a)';
    if (s >= 50) return 'linear-gradient(90deg, #eab308, #f59e0b)';
    return 'linear-gradient(90deg, #ef4444, #dc2626)';
  };

  const color = getColor(score);

  return (
    <div className="health-meter-container">
      <h3 className="health-meter-title">💪 {t('soil_health_meter')}</h3>
      <div className="health-meter-track">
        <div
          className="health-meter-fill"
          style={{
            width: `${animatedWidth}%`,
            background: getGradient(score),
          }}
        />
        <div className="health-meter-markers">
          <div className="health-meter-marker" style={{ left: '49%' }}>
            <span className="health-meter-marker-line" />
            <span className="health-meter-marker-label">50</span>
          </div>
          <div className="health-meter-marker" style={{ left: '79%' }}>
            <span className="health-meter-marker-line" />
            <span className="health-meter-marker-label">80</span>
          </div>
        </div>
      </div>
      <div className="health-meter-scale">
        <span style={{ color: '#ef4444' }}>{t('score_critical')}</span>
        <span style={{ color: '#eab308' }}>{t('score_deficient')}</span>
        <span style={{ color: '#22c55e' }}>{t('score_optimal')}</span>
      </div>
      <div className="health-meter-value" style={{ color }}>
        {score}/100
      </div>
    </div>
  );
}

export default SoilHealthMeter;
