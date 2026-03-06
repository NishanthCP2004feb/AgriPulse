import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { useLanguage } from '../context/LanguageContext';

/**
 * Circular gauge chart showing the suitability score.
 * Color mapping: 0–49 Red, 50–79 Yellow, 80–100 Green.
 * Animated score counter on mount.
 */
function SuitabilityGauge({ score }) {
  const { t } = useLanguage();
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score from 0 to target
  useEffect(() => {
    let current = 0;
    const step = Math.max(1, Math.floor(score / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= score) {
        current = score;
        clearInterval(timer);
      }
      setAnimatedScore(current);
    }, 20);
    return () => clearInterval(timer);
  }, [score]);

  const getColor = (s) => {
    if (s >= 80) return '#22c55e'; // green
    if (s >= 50) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  const getLabel = (s) => {
    if (s >= 80) return t('score_optimal');
    if (s >= 50) return t('score_deficient');
    return t('score_critical');
  };

  const getBgColor = (s) => {
    if (s >= 80) return '#dcfce7';
    if (s >= 50) return '#fef9c3';
    return '#fee2e2';
  };

  const color = getColor(score);
  const bgTrack = '#e5e7eb';
  const gaugeData = [
    { value: animatedScore },
    { value: 100 - animatedScore },
  ];

  return (
    <div className="gauge-container">
      <h3 className="gauge-title">{t('suitability_score')}</h3>
      <div className="gauge-chart-wrapper">
        <PieChart width={200} height={120}>
          <Pie
            data={gaugeData}
            cx={100}
            cy={110}
            startAngle={180}
            endAngle={0}
            innerRadius={65}
            outerRadius={90}
            dataKey="value"
            stroke="none"
            cornerRadius={5}
          >
            <Cell fill={color} />
            <Cell fill={bgTrack} />
          </Pie>
        </PieChart>
        <div className="gauge-score-overlay">
          <span className="gauge-score-number" style={{ color }}>
            {animatedScore}
          </span>
          <span className="gauge-score-max">/100</span>
        </div>
      </div>
      <div
        className="gauge-label-badge"
        style={{ background: getBgColor(score), color }}
      >
        {getLabel(score)}
      </div>
    </div>
  );
}

export default SuitabilityGauge;
