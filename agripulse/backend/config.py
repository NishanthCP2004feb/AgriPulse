"""
Configuration module for AgriPulse backend.
Loads environment variables and defines crop/nutrient constants.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── NVIDIA / OpenAI-compatible API Key ──────────────────────────
NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"

# ── Universal Nutrient Deficiency Thresholds ────────────────────
# "min"     = hard deficiency cutoff (below → fertiliser needed)
# "optimal" = ideal minimum from dataset P75 (at/above → full marks)
# Scoring now uses proportional math between min and optimal.
UNIVERSAL_THRESHOLDS = {
    "nitrogen":   {"min": 20, "optimal": 30, "fertilizer": "Urea",  "label": "Nitrogen"},
    "phosphorus": {"min": 15, "optimal": 21, "fertilizer": "DAP",   "label": "Phosphorus"},
    "potassium":  {"min": 150, "optimal": 186, "fertilizer": "MOP",  "label": "Potassium"},
}

# ── Crop-Specific Conditions ───────────────────────────────────
CROP_PROFILES = {
    "TOMATO": {
        "ph_min": 6.0,
        "ph_max": 7.0,
        "key_nutrient": "potassium",
        "high_demand_threshold": 200,
        "key_nutrient_label": "Potassium",
    },
    "WHEAT": {
        "ph_min": 6.0,
        "ph_max": 7.5,
        "key_nutrient": "nitrogen",
        "high_demand_threshold": 30,
        "key_nutrient_label": "Nitrogen",
    },
    "RICE": {
        "ph_min": 5.0,
        "ph_max": 6.5,
        "key_nutrient": "phosphorus",
        "high_demand_threshold": 25,
        "key_nutrient_label": "Phosphorus",
    },
    "MAIZE": {
        "ph_min": 5.8,
        "ph_max": 7.0,
        "key_nutrient": "nitrogen",
        "high_demand_threshold": 35,
        "key_nutrient_label": "Nitrogen",
    },
}
