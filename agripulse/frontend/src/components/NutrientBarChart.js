import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

/**
 * Nutrient thresholds from backend config.
 */
const THRESHOLDS = {
  Nitrogen: 20,
  Phosphorus: 15,
  Potassium: 150,
};

/**
 * Bar chart comparing soil nutrients with threshold reference lines.
 * Bars below threshold appear in red.
 */
function NutrientBarChart({ result }) {
  const { t } = useLanguage();

  // Extract nutrient values from the fertilizer plan or use defaults.
  // The backend doesn't send raw nutrient values in the result,
  // so we estimate from deficiency list + score. If we have raw values
  // attached to the result we use those; otherwise we derive a display.
  const nitrogen = result.nutrient_values?.nitrogen ?? (
    result.health_metrics.critical_deficiencies.includes('Nitrogen') ? 10 : 35
  );
  const phosphorus = result.nutrient_values?.phosphorus ?? (
    result.health_metrics.critical_deficiencies.includes('Phosphorus') ? 8 : 25
  );
  const potassium = result.nutrient_values?.potassium ?? (
    result.health_metrics.critical_deficiencies.includes('Potassium') ? 80 : 200
  );

  const data = [
    {
      name: t('nitrogen'),
      value: nitrogen,
      threshold: THRESHOLDS.Nitrogen,
      belowThreshold: nitrogen < THRESHOLDS.Nitrogen,
    },
    {
      name: t('phosphorus'),
      value: phosphorus,
      threshold: THRESHOLDS.Phosphorus,
      belowThreshold: phosphorus < THRESHOLDS.Phosphorus,
    },
    {
      name: t('potassium'),
      value: potassium,
      threshold: THRESHOLDS.Potassium,
      belowThreshold: potassium < THRESHOLDS.Potassium,
    },
  ];

  const maxValue = Math.max(
    ...data.map((d) => d.value),
    ...data.map((d) => d.threshold),
    200
  ) * 1.15;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="nutrient-tooltip">
          <p className="nutrient-tooltip-name">{d.name}</p>
          <p>{t('nutrient_value')}: <strong>{d.value}</strong></p>
          <p>{t('nutrient_threshold_line')}: <strong>{d.threshold}</strong></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="nutrient-chart-container">
      <h3 className="nutrient-chart-title">📊 {t('nutrient_levels')}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#374151' }} />
          <YAxis domain={[0, maxValue]} tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={() => t('nutrient_value')} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.belowThreshold ? '#ef4444' : '#22c55e'}
              />
            ))}
          </Bar>
          {/* Threshold reference lines */}
          {data.map((entry, i) => (
            <ReferenceLine
              key={`ref-${i}`}
              y={entry.threshold}
              stroke="#f59e0b"
              strokeDasharray="5 3"
              strokeWidth={2}
              label=""
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="nutrient-legend-custom">
        <span className="nutrient-legend-item">
          <span className="nutrient-legend-dot" style={{ background: '#22c55e' }} />
          {t('score_optimal')}
        </span>
        <span className="nutrient-legend-item">
          <span className="nutrient-legend-dot" style={{ background: '#ef4444' }} />
          {t('score_critical')}
        </span>
        <span className="nutrient-legend-item">
          <span className="nutrient-legend-line" />
          {t('nutrient_threshold_line')}
        </span>
      </div>
    </div>
  );
}

export default NutrientBarChart;
