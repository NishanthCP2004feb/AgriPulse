"""
Unit tests for AgriPulse scoring engine (v2 – proportional scoring).
Verifies deterministic score calculation, health classification,
deficiency detection, and fertilizer recommendations.
"""

import pytest
from scoring import (
    calculate_suitability_score,
    classify_health,
    get_critical_deficiencies,
    get_fertilizer_plan,
    analyze_soil_sample,
    _nutrient_sub_score,
    _ph_sub_score,
)


# ════════════════════════════════════════════════════════════════
# SUB-SCORE UNIT TESTS
# ════════════════════════════════════════════════════════════════

class TestNutrientSubScore:
    """Test the proportional nutrient sub-score (0–25)."""

    def test_above_optimal_gives_25(self):
        assert _nutrient_sub_score(40, "nitrogen") == 25.0   # optimal=30

    def test_at_optimal_gives_25(self):
        assert _nutrient_sub_score(30, "nitrogen") == 25.0

    def test_at_min_gives_10(self):
        assert _nutrient_sub_score(20, "nitrogen") == 10.0   # min=20

    def test_midway_between_min_and_optimal(self):
        # nitrogen: min=20, optimal=30.  value=25 → 10 + 15*(5/10) = 17.5
        assert _nutrient_sub_score(25, "nitrogen") == 17.5

    def test_below_min_proportional(self):
        # nitrogen: min=20. value=10 → 10*10/20 = 5.0
        assert _nutrient_sub_score(10, "nitrogen") == 5.0

    def test_zero_gives_zero(self):
        assert _nutrient_sub_score(0, "nitrogen") == 0.0

    def test_phosphorus_at_optimal(self):
        assert _nutrient_sub_score(21, "phosphorus") == 25.0   # optimal=21

    def test_potassium_at_optimal(self):
        assert _nutrient_sub_score(186, "potassium") == 25.0   # optimal=186


class TestPhSubScore:
    """Test the proportional pH sub-score (0–25)."""

    def test_in_range_gives_25(self):
        assert _ph_sub_score(6.5, 6.0, 7.0) == 25.0

    def test_at_boundary_gives_25(self):
        assert _ph_sub_score(6.0, 6.0, 7.0) == 25.0
        assert _ph_sub_score(7.0, 6.0, 7.0) == 25.0

    def test_half_unit_away(self):
        # 0.5 below min → 25 * (1 - 0.5) = 12.5
        assert _ph_sub_score(5.5, 6.0, 7.0) == 12.5

    def test_one_unit_away_gives_zero(self):
        assert _ph_sub_score(5.0, 6.0, 7.0) == 0.0

    def test_far_away_gives_zero(self):
        assert _ph_sub_score(3.0, 6.0, 7.0) == 0.0


# ════════════════════════════════════════════════════════════════
# SUITABILITY SCORE TESTS
# ════════════════════════════════════════════════════════════════

class TestSuitabilityScore:
    """Test the proportional suitability score algorithm."""

    def test_perfect_tomato(self):
        """All nutrients above optimal, pH in range → 100."""
        score = calculate_suitability_score(
            nitrogen=30, phosphorus=21, potassium=210, ph_level=6.5, crop="TOMATO"
        )
        assert score == 100

    def test_perfect_wheat(self):
        score = calculate_suitability_score(
            nitrogen=40, phosphorus=21, potassium=186, ph_level=6.5, crop="WHEAT"
        )
        assert score == 100

    def test_perfect_rice(self):
        score = calculate_suitability_score(
            nitrogen=30, phosphorus=30, potassium=186, ph_level=5.5, crop="RICE"
        )
        assert score == 100

    def test_perfect_maize(self):
        score = calculate_suitability_score(
            nitrogen=40, phosphorus=21, potassium=186, ph_level=6.5, crop="MAIZE"
        )
        assert score == 100

    def test_all_zero_nutrients(self):
        """Worst case: all zeros → score near 0."""
        score = calculate_suitability_score(
            nitrogen=0, phosphorus=0, potassium=0, ph_level=3.0, crop="TOMATO"
        )
        assert score == 0

    def test_score_always_between_0_and_100(self):
        """Score should always be clamped to [0, 100]."""
        for n in [0, 10, 25, 40]:
            for p in [0, 10, 20, 28]:
                for k in [0, 100, 150, 225]:
                    for ph in [4.0, 5.5, 6.5, 8.0]:
                        score = calculate_suitability_score(n, p, k, ph, "TOMATO")
                        assert 0 <= score <= 100, f"Out of range: {score} for {n},{p},{k},{ph}"

    def test_higher_nutrients_give_higher_score(self):
        """More nutrients should always score higher (monotonic) for same crop/pH."""
        s1 = calculate_suitability_score(10, 10, 100, 6.5, "TOMATO")
        s2 = calculate_suitability_score(20, 15, 150, 6.5, "TOMATO")
        s3 = calculate_suitability_score(30, 21, 210, 6.5, "TOMATO")
        assert s1 < s2 < s3

    def test_ph_out_of_range_reduces_score(self):
        """Same nutrients but bad pH → lower score."""
        good_ph = calculate_suitability_score(30, 21, 200, 6.5, "TOMATO")
        bad_ph = calculate_suitability_score(30, 21, 200, 7.5, "TOMATO")
        assert bad_ph < good_ph

    def test_soil_001_tomato(self):
        """SOIL_001: N=25, P=20, K=180, pH=6.5 for TOMATO.
        Proportional score should be in the 70-90 range (good but K < optimal)."""
        score = calculate_suitability_score(
            nitrogen=25, phosphorus=20, potassium=180, ph_level=6.5, crop="TOMATO"
        )
        assert 70 <= score <= 95

    def test_soil_005_wheat_low_everything(self):
        """SOIL_005: N=18, P=14, K=120, pH=5.5 for WHEAT.
        All below thresholds + bad pH → very low score."""
        score = calculate_suitability_score(
            nitrogen=18, phosphorus=14, potassium=120, ph_level=5.5, crop="WHEAT"
        )
        assert score < 50

    def test_case_insensitive_crop(self):
        """Crop name should be case-insensitive."""
        s1 = calculate_suitability_score(
            nitrogen=40, phosphorus=21, potassium=210, ph_level=6.5, crop="tomato"
        )
        s2 = calculate_suitability_score(
            nitrogen=40, phosphorus=21, potassium=210, ph_level=6.5, crop="TOMATO"
        )
        assert s1 == s2


# ════════════════════════════════════════════════════════════════
# HEALTH CLASSIFICATION TESTS
# ════════════════════════════════════════════════════════════════

class TestHealthClassification:

    def test_optimal(self):
        assert classify_health(100) == "Optimal"
        assert classify_health(80) == "Optimal"

    def test_deficient(self):
        assert classify_health(79) == "Deficient"
        assert classify_health(50) == "Deficient"

    def test_critical(self):
        assert classify_health(49) == "Critical"
        assert classify_health(0) == "Critical"


# ════════════════════════════════════════════════════════════════
# DEFICIENCY DETECTION TESTS
# ════════════════════════════════════════════════════════════════

class TestDeficiencies:

    def test_no_deficiencies(self):
        result = get_critical_deficiencies(25, 20, 160)
        assert result == []

    def test_nitrogen_only(self):
        result = get_critical_deficiencies(10, 20, 160)
        assert result == ["Nitrogen"]

    def test_phosphorus_only(self):
        result = get_critical_deficiencies(25, 10, 160)
        assert result == ["Phosphorus"]

    def test_potassium_only(self):
        result = get_critical_deficiencies(25, 20, 100)
        assert result == ["Potassium"]

    def test_multiple_deficiencies(self):
        result = get_critical_deficiencies(10, 10, 100)
        assert "Nitrogen" in result
        assert "Phosphorus" in result
        assert "Potassium" in result

    def test_boundary_values(self):
        """Exactly at threshold → NOT deficient."""
        result = get_critical_deficiencies(20, 15, 150)
        assert result == []

    def test_just_below_boundary(self):
        """One below threshold → deficient."""
        result = get_critical_deficiencies(19, 14, 149)
        assert "Nitrogen" in result
        assert "Phosphorus" in result
        assert "Potassium" in result


# ════════════════════════════════════════════════════════════════
# FERTILIZER PLAN TESTS
# ════════════════════════════════════════════════════════════════

class TestFertilizerPlan:

    def test_no_deficiency(self):
        plan = get_fertilizer_plan([])
        assert "No fertilizer" in plan

    def test_single_nitrogen(self):
        plan = get_fertilizer_plan(["Nitrogen"])
        assert "Urea" in plan

    def test_single_phosphorus(self):
        plan = get_fertilizer_plan(["Phosphorus"])
        assert "DAP" in plan

    def test_single_potassium(self):
        plan = get_fertilizer_plan(["Potassium"])
        assert "MOP" in plan

    def test_combined(self):
        plan = get_fertilizer_plan(["Nitrogen", "Potassium"])
        assert "Urea" in plan
        assert "MOP" in plan


# ════════════════════════════════════════════════════════════════
# FULL ANALYSIS INTEGRATION TESTS
# ════════════════════════════════════════════════════════════════

class TestAnalyzeSoilSample:

    def test_full_analysis_optimal_tomato(self):
        result = analyze_soil_sample("SOIL_IDEAL", 30, 21, 210, 6.5, "TOMATO")
        assert result["soil_id"] == "SOIL_IDEAL"
        assert result["target_crop"] == "TOMATO"
        assert result["recommendation"]["suitability_score"] == 100
        assert result["health_metrics"]["overall_health"] == "Optimal"
        assert result["health_metrics"]["critical_deficiencies"] == []

    def test_full_analysis_deficient_sample(self):
        """Low P and K → deficiencies detected, lower score."""
        result = analyze_soil_sample("SOIL_003", 30, 10, 140, 7.2, "TOMATO")
        assert result["recommendation"]["suitability_score"] <= 60
        assert "Phosphorus" in result["health_metrics"]["critical_deficiencies"]
        assert "Potassium" in result["health_metrics"]["critical_deficiencies"]
        assert "DAP" in result["recommendation"]["fertilizer_plan"]
        assert "MOP" in result["recommendation"]["fertilizer_plan"]

    def test_output_format_keys(self):
        """Verify all required keys exist in the output."""
        result = analyze_soil_sample("SOIL_001", 25, 20, 180, 6.5, "TOMATO")
        assert "soil_id" in result
        assert "target_crop" in result
        assert "health_metrics" in result
        assert "overall_health" in result["health_metrics"]
        assert "critical_deficiencies" in result["health_metrics"]
        assert "recommendation" in result
        assert "fertilizer_plan" in result["recommendation"]
        assert "suitability_score" in result["recommendation"]
        assert "ai_explanation" in result

    def test_score_reflects_severity(self):
        """A severely deficient sample should score much lower than a mildly deficient one."""
        mild = analyze_soil_sample("MILD", 20, 15, 150, 6.5, "TOMATO")
        severe = analyze_soil_sample("SEVERE", 5, 5, 50, 4.0, "TOMATO")
        assert mild["recommendation"]["suitability_score"] > severe["recommendation"]["suitability_score"]
