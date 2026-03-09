"""
Chatbot module for AgriPulse.
Uses NVIDIA AI (OpenAI-compatible) to answer farmer questions on all agriculture topics
including soil health, crop diseases, pest management, irrigation,
fertilizers, weather impact, farming techniques, and more — in multiple languages.
"""

from openai import OpenAI
from config import NVIDIA_API_KEY, NVIDIA_BASE_URL

# ── Language display names ──────────────────────────────────────
LANG_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "kn": "Kannada",
    "ta": "Tamil",
    "te": "Telugu",
}

# ── System prompt (broad agriculture scope + safety) ────────────
SYSTEM_PROMPT = (
    "You are AgriPulse Assistant, a friendly and knowledgeable agricultural advisor chatbot.\n"
    "You help farmers with ALL agriculture-related topics, including but not limited to:\n"
    "  - Soil health, nutrients (N, P, K, pH, organic carbon, micronutrients)\n"
    "  - Fertilizer recommendations (urea, DAP, MOP, organic, bio-fertilizers)\n"
    "  - Crop suitability, crop rotation, and intercropping\n"
    "  - Crop diseases, symptoms, prevention, and treatment\n"
    "  - Pest and weed management (integrated pest management, organic methods)\n"
    "  - Irrigation techniques (drip, sprinkler, flood, scheduling)\n"
    "  - Weather impact on farming, seasonal planning\n"
    "  - Seed selection, sowing, harvesting best practices\n"
    "  - Organic farming, sustainable agriculture\n"
    "  - Government schemes, market prices, and farming economics\n"
    "  - Livestock and dairy management basics\n"
    "  - Post-harvest storage, food processing, and supply chain\n\n"
    "RULES:\n"
    "1. Give clear, helpful, and accurate answers.\n"
    "2. Keep answers farmer-friendly — avoid excessive jargon, explain simply.\n"
    "3. For disease/pest questions, describe symptoms, causes, and remedies.\n"
    "4. If soil analysis data is provided in the conversation, explain it simply.\n"
    "5. Never generate harmful, political, or inappropriate content.\n"
    "6. If a question is completely unrelated to agriculture, farming, or rural life, "
    "politely steer the conversation back to agriculture.\n"
)


def _build_chat_prompt(message: str, lang: str, soil_context: dict = None) -> str:
    """
    Build the full prompt for the chatbot.

    Args:
        message:       The farmer's question.
        lang:          Language code for response.
        soil_context:  Optional soil analysis result to explain.
    """
    language = LANG_NAMES.get(lang, "English")

    prompt_parts = [SYSTEM_PROMPT]
    prompt_parts.append(f"\nRespond ONLY in {language} language.\n")

    # If soil analysis context is provided, include it
    if soil_context:
        prompt_parts.append(
            "\n--- SOIL ANALYSIS CONTEXT ---\n"
            f"Soil ID: {soil_context.get('soil_id', 'N/A')}\n"
            f"Target Crop: {soil_context.get('target_crop', 'N/A')}\n"
            f"Suitability Score: {soil_context.get('recommendation', {}).get('suitability_score', 'N/A')}/100\n"
            f"Health Status: {soil_context.get('health_metrics', {}).get('overall_health', 'N/A')}\n"
            f"Deficiencies: {', '.join(soil_context.get('health_metrics', {}).get('critical_deficiencies', [])) or 'None'}\n"
            f"Fertilizer Plan: {soil_context.get('recommendation', {}).get('fertilizer_plan', 'N/A')}\n"
            "--- END CONTEXT ---\n"
        )

    prompt_parts.append(f"\nFarmer's question: {message}\n")
    prompt_parts.append(f"\nAnswer in {language}:")

    return "\n".join(prompt_parts)


def chat_response(message: str, lang: str = "en", soil_context: dict = None) -> str:
    """
    Generate a chatbot response using Gemini.

    Args:
        message:       The user's message/question.
        lang:          Language code (en, hi, kn, ta, te).
        soil_context:  Optional dict of soil analysis results to explain.

    Returns:
        A farmer-friendly response string.
    """
    # ── Fallback when no API key ────────────────────────────────
    if not NVIDIA_API_KEY:
        return _fallback_response(message, lang)

    try:
        client = OpenAI(base_url=NVIDIA_BASE_URL, api_key=NVIDIA_API_KEY)
        prompt = _build_chat_prompt(message, lang, soil_context)
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        text = response.choices[0].message.content.strip()
        return text if text else _fallback_response(message, lang)
    except Exception as exc:
        print(f"[AgriPulse Chatbot] NVIDIA API error: {exc}")
        return _fallback_response(message, lang)


# ── Multilingual fallback response templates ────────────────────
_FALLBACKS = {
    "en": {
        "nitrogen": "Nitrogen helps plants grow leaves and stems. If your soil is low in nitrogen, apply Urea fertilizer. This will make your crops greener and healthier.",
        "phosphorus": "Phosphorus helps plants develop strong roots and flowers. If your soil is low in phosphorus, apply DAP fertilizer. This will help your crops produce better fruit.",
        "potassium": "Potassium makes plants stronger and more resistant to disease. If your soil is low in potassium, apply MOP fertilizer. This will improve crop quality and yield.",
        "ph": "Soil pH tells you if your soil is acidic or alkaline. Most crops grow best in pH 6.0 to 7.0. If pH is too low, add lime. If too high, add sulfur.",
        "default": "I can help with all agriculture topics — soil health, crop diseases, pest control, fertilizers, irrigation, farming techniques, and more. Ask me anything about farming!",
    },
    "hi": {
        "nitrogen": "नाइट्रोजन पौधों को पत्तियाँ और तना बढ़ाने में मदद करता है। अगर मिट्टी में नाइट्रोजन कम है, तो यूरिया खाद डालें। इससे फसल हरी-भरी और स्वस्थ होगी।",
        "phosphorus": "फॉस्फोरस पौधों की जड़ों और फूलों को मजबूत बनाता है। अगर मिट्टी में फॉस्फोरस कम है, तो DAP खाद डालें।",
        "potassium": "पोटैशियम पौधों को मजबूत और बीमारियों से बचाव करता है। अगर मिट्टी में पोटैशियम कम है, तो MOP खाद डालें।",
        "ph": "मिट्टी का pH बताता है कि मिट्टी अम्लीय है या क्षारीय। ज्यादातर फसलें pH 6.0 से 7.0 में अच्छी उगती हैं।",
        "default": "मैं खेती से जुड़े सभी विषयों में मदद कर सकता हूँ — मिट्टी, फसल रोग, कीट नियंत्रण, उर्वरक, सिंचाई, और बहुत कुछ। खेती के बारे में कुछ भी पूछें!",
    },
    "kn": {
        "nitrogen": "ಸಾರಜನಕ ಸಸ್ಯಗಳ ಎಲೆಗಳು ಮತ್ತು ಕಾಂಡ ಬೆಳೆಯಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಮಣ್ಣಿನಲ್ಲಿ ಸಾರಜನಕ ಕಡಿಮೆಯಿದ್ದರೆ, ಯೂರಿಯಾ ಗೊಬ್ಬರ ಬಳಸಿ.",
        "phosphorus": "ರಂಜಕ ಸಸ್ಯಗಳ ಬೇರುಗಳು ಮತ್ತು ಹೂವುಗಳನ್ನು ಬಲಪಡಿಸುತ್ತದೆ. ಮಣ್ಣಿನಲ್ಲಿ ರಂಜಕ ಕಡಿಮೆಯಿದ್ದರೆ, DAP ಗೊಬ್ಬರ ಬಳಸಿ.",
        "potassium": "ಪೊಟ್ಯಾಶಿಯಂ ಸಸ್ಯಗಳನ್ನು ಬಲಪಡಿಸುತ್ತದೆ ಮತ್ತು ರೋಗ ನಿರೋಧಕತೆ ಹೆಚ್ಚಿಸುತ್ತದೆ. ಮಣ್ಣಿನಲ್ಲಿ ಪೊಟ್ಯಾಶಿಯಂ ಕಡಿಮೆಯಿದ್ದರೆ, MOP ಗೊಬ್ಬರ ಬಳಸಿ.",
        "ph": "ಮಣ್ಣಿನ pH ಮಣ್ಣು ಆಮ್ಲೀಯವಾ ಅಥವಾ ಕ್ಷಾರೀಯವಾ ಎಂದು ತಿಳಿಸುತ್ತದೆ. ಬಹುತೇಕ ಬೆಳೆಗಳು pH 6.0 ರಿಂದ 7.0 ರಲ್ಲಿ ಚೆನ್ನಾಗಿ ಬೆಳೆಯುತ್ತವೆ.",
        "default": "ಕೃಷಿ ಸಂಬಂಧಿತ ಎಲ್ಲಾ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಸಹಾಯ ಮಾಡಬಹುದು — ಮಣ್ಣಿನ ಆರೋಗ್ಯ, ಬೆಳೆ ರೋಗಗಳು, ಕೀಟ ನಿಯಂತ್ರಣ, ಗೊಬ್ಬರ, ನೀರಾವರಿ ಮತ್ತು ಇನ್ನಷ್ಟು. ಕೃಷಿ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ!",
    },
    "ta": {
        "nitrogen": "நைட்ரஜன் தாவரங்கள் இலைகள் மற்றும் தண்டுகளை வளர்க்க உதவுகிறது. மண்ணில் நைட்ரஜன் குறைவாக இருந்தால், யூரியா உரம் பயன்படுத்துங்கள்.",
        "phosphorus": "பாஸ்பரஸ் தாவரங்களின் வேர்கள் மற்றும் பூக்களை வலுப்படுத்துகிறது. மண்ணில் பாஸ்பரஸ் குறைவாக இருந்தால், DAP உரம் பயன்படுத்துங்கள்.",
        "potassium": "பொட்டாசியம் தாவரங்களை வலுவாக்குகிறது மற்றும் நோய் எதிர்ப்பை அதிகரிக்கிறது. மண்ணில் பொட்டாசியம் குறைவாக இருந்தால், MOP உரம் பயன்படுத்துங்கள்.",
        "ph": "மண் pH மண் அமிலமா அல்லது காரமா என்று தெரிவிக்கிறது. பெரும்பாலான பயிர்கள் pH 6.0 முதல் 7.0 வரை நன்றாக வளரும்.",
        "default": "விவசாயம் தொடர்பான அனைத்து தலைப்புகளிலும் நான் உதவ முடியும் — மண் ஆரோக்கியம், பயிர் நோய்கள், பூச்சி கட்டுப்பாடு, உரங்கள், நீர்ப்பாசனம் மற்றும் பல. விவசாயம் பற்றி எதையும் கேளுங்கள்!",
    },
    "te": {
        "nitrogen": "నైట్రోజన్ మొక్కల ఆకులు మరియు కాండాలను పెంచడంలో సహాయపడుతుంది. నేలలో నైట్రోజన్ తక్కువగా ఉంటే, యూరియా ఎరువు వాడండి.",
        "phosphorus": "భాస్వరం మొక్కల వేర్లు మరియు పూలను బలపరుస్తుంది. నేలలో భాస్వరం తక్కువగా ఉంటే, DAP ఎరువు వాడండి.",
        "potassium": "పొటాషియం మొక్కలను బలంగా చేస్తుంది మరియు వ్యాధి నిరోధకతను పెంచుతుంది. నేలలో పొటాషియం తక్కువగా ఉంటే, MOP ఎరువు వాడండి.",
        "ph": "నేల pH నేల ఆమ్లమా లేదా క్షారమా అని తెలియజేస్తుంది. చాలా పంటలు pH 6.0 నుండి 7.0 లో బాగా పెరుగుతాయి.",
        "default": "వ్యవసాయానికి సంబంధించిన అన్ని అంశాలలో నేను సహాయం చేయగలను — నేల ఆరోగ్యం, పంట వ్యాధులు, పురుగు నియంత్రణ, ఎరువులు, నీటిపారుదల మరియు మరిన్ని. వ్యవసాయం గురించి ఏదైనా అడగండి!",
    },
}


def _fallback_response(message: str, lang: str) -> str:
    """
    Simple rule-based fallback when Gemini is unavailable.
    Returns responses in the user's selected language.
    """
    msg_lower = message.lower()
    responses = _FALLBACKS.get(lang, _FALLBACKS["en"])

    # Basic keyword matching for common questions
    if any(w in msg_lower for w in ["nitrogen", "urea", "नाइट्रोजन", "ಸಾರಜನಕ", "நைட்ரஜன்", "నైట్రోజన్"]):
        return responses["nitrogen"]
    elif any(w in msg_lower for w in ["phosphorus", "dap", "फॉस्फोरस", "ರಂಜಕ", "பாஸ்பரஸ்", "భాస్వరం"]):
        return responses["phosphorus"]
    elif any(w in msg_lower for w in ["potassium", "mop", "पोटैशियम", "ಪೊಟ್ಯಾಶಿಯಂ", "பொட்டாசியம்", "పొటాషియం"]):
        return responses["potassium"]
    elif any(w in msg_lower for w in ["ph", "acid", "alkaline"]):
        return responses["ph"]
    else:
        return responses["default"]
