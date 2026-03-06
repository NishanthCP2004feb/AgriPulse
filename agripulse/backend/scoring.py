"""
Deterministic scoring engine for AgriPulse.
Calculates suitability score, health classification,
critical deficiencies, and fertilizer recommendations.

Scoring method (v2 – proportional, data-calibrated):
    Total score = N_score + P_score + K_score + pH_score   (each 0–25, sum 0–100)

    Nutrient sub-score (0–25):
        • value ≥ optimal                → 25
        • min ≤ value < optimal           → 10 + 15 × (value − min) / (optimal − min)
        • value < min                     → 10 × value / min
        Then if the nutrient is the crop's key nutrient and
        value < high_demand_threshold, subtract up to 5 more proportionally.

    pH sub-score (0–25):
        • Inside ideal range              → 25
        • Within 1.0 of nearest bound     → 25 × (1 − distance)
        • Beyond 1.0 from ideal           → 0
"""

from typing import Dict, List, Tuple
from config import UNIVERSAL_THRESHOLDS, CROP_PROFILES


def _nutrient_sub_score(value: float, nutrient: str) -> float:
    """
    Return a sub-score in [0, 25] for one nutrient using proportional math.

    Regions:
        0  ────── min ────── optimal ──────→
        0 … 10    10 … 25      25
    """
    info = UNIVERSAL_THRESHOLDS[nutrient]
    mn = info["min"]
    opt = info["optimal"]

    if value >= opt:
        return 25.0
    elif value >= mn:
        # Above deficiency, below optimal → 10 to 25
        return 10.0 + 15.0 * (value - mn) / (opt - mn)
    else:
        # Below deficiency threshold → 0 to 10
        if mn == 0:
            return 0.0
        return max(0.0, 10.0 * value / mn)


def _ph_sub_score(ph_level: float, ph_min: float, ph_max: float) -> float:
    """
    Return a sub-score in [0, 25] for pH based on distance from ideal range.
    """
    if ph_min <= ph_level <= ph_max:
        return 25.0

    # Distance from nearest ideal bound
    if ph_level < ph_min:
        distance = ph_min - ph_level
    else:
        distance = ph_level - ph_max

    # Gradual decay: full penalty at ≥ 1.0 pH units away
    if distance >= 1.0:
        return 0.0
    return 25.0 * (1.0 - distance)


def calculate_suitability_score(
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    ph_level: float,
    crop: str,
) -> int:
    """
    Calculate the suitability score (0–100) using proportional, data-calibrated rules.

    Score = N_sub + P_sub + K_sub + pH_sub   (each 0–25)
    With an additional crop-specific key-nutrient penalty of up to −5.
    Final result is clamped to [0, 100] and rounded.
    """
    crop = crop.upper()
    profile = CROP_PROFILES[crop]

    nutrient_values = {
        "nitrogen": nitrogen,
        "phosphorus": phosphorus,
        "potassium": potassium,
    }

    # ── Nutrient sub-scores (each 0–25) ────────────────────────
    n_score = _nutrient_sub_score(nitrogen, "nitrogen")
    p_score = _nutrient_sub_score(phosphorus, "phosphorus")
    k_score = _nutrient_sub_score(potassium, "potassium")

    # ── pH sub-score (0–25) ─────────────────────────────────────
    ph_score = _ph_sub_score(ph_level, profile["ph_min"], profile["ph_max"])

    # ── Crop-specific key-nutrient penalty (up to −5) ──────────
    key = profile["key_nutrient"]
    key_val = nutrient_values[key]
    hdt = profile["high_demand_threshold"]
    crop_penalty = 0.0
    if key_val < hdt:
        # Proportional penalty: 0 at threshold, −5 at zero
        crop_penalty = 5.0 * (1.0 - min(key_val / hdt, 1.0))

    # ── Total ───────────────────────────────────────────────────
    raw = n_score + p_score + k_score + ph_score - crop_penalty
    return max(0, min(100, round(raw)))


def classify_health(score: int) -> str:
    """Return health classification string based on score."""
    if score >= 80:
        return "Optimal"
    elif score >= 50:
        return "Deficient"
    else:
        return "Critical"


def get_critical_deficiencies(
    nitrogen: float,
    phosphorus: float,
    potassium: float,
) -> List[str]:
    """
    Return list of nutrient names that fall below universal thresholds.
    """
    nutrient_values = {
        "nitrogen": nitrogen,
        "phosphorus": phosphorus,
        "potassium": potassium,
    }
    deficiencies: List[str] = []
    for nutrient, info in UNIVERSAL_THRESHOLDS.items():
        if nutrient_values[nutrient] < info["min"]:
            deficiencies.append(info["label"])
    return deficiencies


def get_fertilizer_plan(deficiencies: List[str]) -> str:
    """
    Build a human-readable fertilizer recommendation from the deficiency list.
    """
    if not deficiencies:
        return "No fertilizer correction needed. Soil nutrients are adequate."

    # Map deficiency label → fertilizer name
    label_to_fert = {info["label"]: info["fertilizer"] for info in UNIVERSAL_THRESHOLDS.values()}

    fertilizers = []
    nutrients = []
    for d in deficiencies:
        fertilizers.append(label_to_fert[d])
        nutrients.append(d)

    fert_str = " and ".join(fertilizers)
    nut_str = " and ".join(nutrients)
    return f"Apply {fert_str} fertilizer{'s' if len(fertilizers) > 1 else ''} to correct {nut_str} deficiency."


def analyze_soil_sample(
    soil_id: str,
    nitrogen: float,
    phosphorus: float,
    potassium: float,
    ph_level: float,
    crop: str,
) -> Dict:
    """
    Run full deterministic analysis for one soil sample and return
    the structured result dict (without ai_explanation — that is added later).
    """
    crop = crop.upper()
    score = calculate_suitability_score(nitrogen, phosphorus, potassium, ph_level, crop)
    health = classify_health(score)
    deficiencies = get_critical_deficiencies(nitrogen, phosphorus, potassium)
    fertilizer_plan = get_fertilizer_plan(deficiencies)

    return {
        "soil_id": soil_id,
        "target_crop": crop,
        "nutrient_values": {
            "nitrogen": nitrogen,
            "phosphorus": phosphorus,
            "potassium": potassium,
            "ph_level": ph_level,
        },
        "health_metrics": {
            "overall_health": health,
            "critical_deficiencies": deficiencies,
        },
        "recommendation": {
            "fertilizer_plan": fertilizer_plan,
            "suitability_score": score,
        },
        "ai_explanation": "",  # placeholder — filled by AI module
    }
