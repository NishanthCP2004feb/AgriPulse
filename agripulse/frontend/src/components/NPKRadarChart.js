import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

/**
 * THRESHOLDS matching backend config (used to normalize values to 0–100 scale).
 */
const MAX_VALUES = {
  Nitrogen: 60,
  Phosphorus: 50,
  Potassium: 400,
};

/**
 * Bonus: NPK Radar Chart showing nutrient profile on a normalized scale.
 */
function NPKRadarChart({ result }) {
  const { t } = useLanguage();

  const nitrogen = result.nutrient_values?.nitrogen ?? (
    result.health_metrics.critical_deficiencies.includes('Nitrogen') ? 10 : 35
  );
  const phosphorus = result.nutrient_values?.phosphorus ?? (
    result.health_metrics.critical_deficiencies.includes('Phosphorus') ? 8 : 25
  );
  const potassium = result.nutrient_values?.potassium ?? (
    result.health_metrics.critical_deficiencies.includes('Potassium') ? 80 : 200
  );

  // Normalize to 0–100 scale for better radar visualization
  const data = [
    {
      nutrient: t('nitrogen'),
      value: Math.min(100, Math.round((nitrogen / MAX_VALUES.Nitrogen) * 100)),
      fullMark: 100,
    },
    {
      nutrient: t('phosphorus'),
      value: Math.min(100, Math.round((phosphorus / MAX_VALUES.Phosphorus) * 100)),
      fullMark: 100,
    },
    {
      nutrient: t('potassium'),
      value: Math.min(100, Math.round((potassium / MAX_VALUES.Potassium) * 100)),
      fullMark: 100,
    },
  ];

  return (
    <div className="radar-chart-container">
      <h3 className="radar-chart-title">🎯 {t('npk_profile')}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#d1d5db" />
          <PolarAngleAxis
            dataKey="nutrient"
            tick={{ fontSize: 13, fill: '#374151', fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, t('nutrient_value')]}
            contentStyle={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.85rem',
            }}
          />
          <Radar
            name={t('npk_profile')}
            dataKey="value"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default NPKRadarChart;
