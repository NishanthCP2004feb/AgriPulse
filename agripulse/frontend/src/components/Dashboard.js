import React, { useState } from 'react';
import SoilHealthCard from './SoilHealthCard';
import SuitabilityGauge from './SuitabilityGauge';
import NutrientBarChart from './NutrientBarChart';
import NPKRadarChart from './NPKRadarChart';
import SoilHealthMeter from './SoilHealthMeter';
import DeficiencyWarningPanel from './DeficiencyWarningPanel';
import FertilizerRecommendation from './FertilizerRecommendation';
import AIExplanationPanel from './AIExplanationPanel';
import { useLanguage } from '../context/LanguageContext';

/**
 * Dashboard layout component that arranges all visualization widgets.
 * Supports switching between individual samples when multiple results exist.
 *
 * Layout:
 *   Top:    Soil summary card + Suitability gauge
 *   Middle: Nutrient bar chart + NPK Radar chart
 *   Bottom: Deficiency alerts + Fertilizer recommendation + AI explanation
 */
function Dashboard({ results }) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!results || results.length === 0) return null;

  const result = results[activeIndex];
  const score = result.recommendation.suitability_score;

  return (
    <section className="dashboard-section">
      <h2 className="dashboard-title">📊 {t('dashboard_title')}</h2>

      {/* Sample selector for multiple results */}
      {results.length > 1 && (
        <div className="dashboard-sample-selector">
          {results.map((r, idx) => (
            <button
              key={idx}
              className={`dashboard-sample-btn ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(idx)}
            >
              {r.soil_id}
            </button>
          ))}
        </div>
      )}

      {/* ── Top Section ─────────────────────────────────────── */}
      <div className="dashboard-top">
        <SoilHealthCard result={result} />
        <SuitabilityGauge score={score} />
      </div>

      {/* ── Soil Health Progress Meter (Bonus) ────────────── */}
      <SoilHealthMeter score={score} />

      {/* ── Middle Section ──────────────────────────────────── */}
      <div className="dashboard-middle">
        <NutrientBarChart result={result} />
        <NPKRadarChart result={result} />
      </div>

      {/* ── Bottom Section ──────────────────────────────────── */}
      <div className="dashboard-bottom">
        <DeficiencyWarningPanel
          deficiencies={result.health_metrics.critical_deficiencies}
        />
        <FertilizerRecommendation result={result} />
      </div>

      {/* ── AI Explanation ──────────────────────────────────── */}
      <AIExplanationPanel explanation={result.ai_explanation} />
    </section>
  );
}

export default Dashboard;
