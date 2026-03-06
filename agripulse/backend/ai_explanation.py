"""
AI Explanation module for AgriPulse.
Uses Google Gemini to generate farmer-friendly explanations.
The AI does NOT calculate scores or deficiencies — it only explains
the pre-computed results in simple language.
Supports multilingual output via the `lang` parameter.
"""

import google.generativeai as genai
from config import GEMINI_API_KEY

# ── Language display names for the prompt ───────────────────────
LANG_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "kn": "Kannada",
    "ta": "Tamil",
    "te": "Telugu",
}


def _build_prompt(result: dict, lang: str = "en") -> str:
    """Build the prompt sent to Gemini from the deterministic analysis result."""
    deficiencies = result["health_metrics"]["critical_deficiencies"]
    def_text = ", ".join(deficiencies) if deficiencies else "None"
    language = LANG_NAMES.get(lang, "English")

    return (
        f"You are a friendly agricultural advisor speaking to a small-scale farmer. "
        f"Respond ONLY in {language} language. "
        f"Based on the soil analysis below, give a SHORT (3-4 sentences), SIMPLE, "
        f"non-technical explanation of what the results mean and what the farmer should do.\n\n"
        f"Soil ID: {result['soil_id']}\n"
        f"Target Crop: {result['target_crop']}\n"
        f"Suitability Score: {result['recommendation']['suitability_score']}/100\n"
        f"Health Status: {result['health_metrics']['overall_health']}\n"
        f"Deficiencies: {def_text}\n"
        f"Fertilizer Plan: {result['recommendation']['fertilizer_plan']}\n\n"
        f"Write a simple explanation in {language} that a farmer with no science "
        f"background can understand. Do NOT repeat the exact numbers. "
        f"Focus on what is wrong and what to do."
    )


def generate_explanation(result: dict, lang: str = "en") -> str:
    """
    Call Gemini API to produce a plain-language explanation.
    Falls back to a rule-based explanation if the API key is missing or the call fails.

    Args:
        result: The deterministic analysis result dict.
        lang:   Language code (en, hi, kn, ta, te). AI will respond in this language.
    """
    # ── Fallback explanation (no API key or error) ──────────────
    def _fallback() -> str:
        deficiencies = result["health_metrics"]["critical_deficiencies"]
        crop = result["target_crop"].capitalize()
        if not deficiencies:
            return (
                f"Your soil is in good shape for growing {crop}. "
                "Continue with your current soil management practices and monitor regularly."
            )
        def_text = " and ".join([d.lower() for d in deficiencies])
        plan = result["recommendation"]["fertilizer_plan"]
        return (
            f"Your soil is low in {def_text}, which are important for growing {crop}. "
            f"{plan} "
            "This will help your plants grow stronger and produce a better harvest."
        )

    # Gemini API removed from analysis for instant results.
    # Chatbot still uses Gemini independently.
    return _fallback()
