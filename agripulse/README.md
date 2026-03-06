# 🌱 AgriPulse – Precision Agriculture Assistant

A full-stack, **multilingual chatbot application** for soil analysis and crop recommendations, built with **React** (frontend) and **Python FastAPI** (backend), powered by **Google Gemini AI**.

Supports **5 languages**: English, Hindi, Kannada, Tamil, Telugu — with instant UI switching and AI responses in the selected language.

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18, Axios, CSS |
| Backend | Python, FastAPI, Pydantic, Pandas |
| AI | Google Gemini 2.5 Flash |
| i18n | Custom React Context + JSON locale files |
| State | React useState/useContext + localStorage |
| Testing | pytest (36 unit tests) |

---

## 📁 Project Structure

```
agripulse/
├── backend/                          # Python FastAPI server
│   ├── venv/                         # Python virtual environment
│   ├── .env                          # GEMINI_API_KEY=your_key_here
│   ├── main.py                       # FastAPI app – routes & endpoints
│   ├── chatbot.py                    # Gemini chatbot module (multilingual)
│   ├── ai_explanation.py             # Gemini soil explanation generator
│   ├── scoring.py                    # Deterministic soil scoring engine
│   ├── csv_parser.py                 # CSV file parser for soil data
│   ├── config.py                     # Constants, thresholds, crop profiles
│   ├── test_scoring.py               # 36 unit tests (pytest)
│   └── requirements.txt              # Python dependencies
│
├── frontend/                         # React 18 application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBot.js            # 🤖 Floating chatbot widget (multilingual)
│   │   │   ├── Header.js             # App header with language switcher
│   │   │   ├── LanguageSwitcher.js   # Global language dropdown component
│   │   │   ├── UploadForm.js         # CSV upload + crop selection form
│   │   │   └── ResultCards.js        # Soil analysis result cards
│   │   ├── context/
│   │   │   └── LanguageContext.js     # i18n context provider + useLanguage() hook
│   │   ├── locales/                  # 📌 Translation JSON files
│   │   │   ├── en.json               # English
│   │   │   ├── hi.json               # Hindi (हिन्दी)
│   │   │   ├── kn.json               # Kannada (ಕನ್ನಡ)
│   │   │   ├── ta.json               # Tamil (தமிழ்)
│   │   │   └── te.json               # Telugu (తెలుగు)
│   │   ├── App.js                    # Root component
│   │   ├── App.css                   # All styles (including chatbot)
│   │   └── index.js                  # Entry point (wraps LanguageProvider)
│   └── package.json
│
└── README.md
```

---

## 🌐 Multilingual System Architecture

### How It Works

```
┌─────────────┐    setLang()    ┌──────────────────┐
│  Language    │ ──────────────▶ │  LanguageContext  │
│  Switcher   │                 │  (React Context)  │
│  (Dropdown) │ ◀────────────── │  lang, t(), ...   │
└─────────────┘    re-render    └──────────────────┘
                                        │
                    t('key') ───────────▼
                                ┌──────────────────┐
                                │  locales/xx.json  │
                                │  (JSON key-value) │
                                └──────────────────┘
```

1. **`LanguageContext.js`** — React Context providing `lang`, `setLang()`, `t()`, and `languages` to all components.
2. **`locales/*.json`** — One JSON file per language, all with identical keys.
3. **`LanguageSwitcher.js`** — Global dropdown in the header for the main app.
4. **`ChatBot.js`** — Has its own **in-chat language switcher** so users can change language without closing the chat.
5. **Backend** — Receives `language` code with every request; Gemini prompt includes `"Respond ONLY in {language}"`.

### Translation Flow

| Layer | How language is used |
|-------|---------------------|
| **React UI** | `t('chat_send')` → reads from `locales/{lang}.json` → instantly updates |
| **Chatbot API** | `POST /chatbot { language: "hi" }` → Gemini prompt: "Respond in Hindi" |
| **Soil Analysis** | `POST /analyze-soil { lang: "kn" }` → AI explanation in Kannada |
| **Fallback** | If Gemini fails, backend returns pre-written responses in the user's language |

---

## 🤖 Chatbot Features

| Feature | Description |
|---------|-------------|
| **Floating FAB** | 💬 button in bottom-right corner opens the chat |
| **In-chat language switcher** | Change language directly from the chat header |
| **Multilingual Gemini responses** | AI always responds in the selected language |
| **Quick-action buttons** | Pre-built questions (nitrogen, pH, fertilizer, etc.) |
| **Soil context awareness** | "Explain my soil results" sends analysis data to Gemini |
| **Language change notice** | System message appears when language is switched |
| **New Chat** | 🔄 button resets conversation |
| **Multilingual fallback** | If Gemini API fails, returns responses in all 5 languages |
| **Typing indicator** | Animated dots while waiting for Gemini |
| **Voice input (🎤)** | Speak to the chatbot using Web Speech API — supports all 5 languages |
| **Auto-send on speech** | Final speech result is sent automatically to Gemini |
| **Agriculture-only scope** | Gemini deflects non-agriculture questions |

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+**
- **Node.js 18+** and npm
- **Google Gemini API Key** (free at [aistudio.google.com](https://aistudio.google.com/apikey))

### 1. Backend Setup

```bash
cd agripulse/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env with your API key
echo GEMINI_API_KEY=your_key_here > .env

# Run tests
pytest test_scoring.py -v

# Start server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd agripulse/frontend

# Install dependencies
npm install

# Start dev server
npm start
```

Open **http://localhost:3000** — the app is ready!

---

## 🔌 API Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/` | — | Health check |
| `POST` | `/analyze-soil` | `file`, `crop`, `lang` (form data) | Upload CSV, get soil analysis |
| `GET` | `/result` | — | Get latest analysis results |
| `POST` | `/chatbot` | `{ message, language, soil_context? }` (JSON) | Multilingual AI chatbot |

### Chatbot Request Example

```json
POST /chatbot
Content-Type: application/json

{
  "message": "What fertilizer is best for tomatoes?",
  "language": "hi",
  "soil_context": null
}
```

### Response

```json
{
  "response": "टमाटर के लिए DAP और MOP खाद सबसे अच्छी होती है..."
}
```

---

## ➕ Adding a New Language (3 Steps)

The system is designed to scale — add any new language with changes in **3 files only**:

### Step 1: Create translation JSON

Create `frontend/src/locales/mr.json` (e.g., Marathi):

```json
{
  "app_title": "अॅग्रीपल्स",
  "chat_title": "अॅग्रीपल्स सहाय्यक",
  "chat_send": "पाठवा",
  "...": "...copy all keys from en.json and translate..."
}
```

### Step 2: Register in LanguageContext

In `frontend/src/context/LanguageContext.js`:

```javascript
import mr from '../locales/mr.json';  // Add import

export const LANGUAGES = [
  ...existing...,
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', data: mr },
];
```

### Step 3: Add backend support

In `backend/main.py`:
```python
VALID_LANGS = {"en", "hi", "kn", "ta", "te", "mr"}
```

In `backend/chatbot.py`:
```python
LANG_NAMES["mr"] = "Marathi"
# Optionally add fallback responses in _FALLBACKS["mr"] = {...}
```

**Done!** Both dropdowns (header + chatbot), UI text, and Gemini prompts automatically pick up the new language.

---

## 📊 Scoring Algorithm

1. **Base Score** = 100
2. **pH Penalty**: pH outside crop ideal range → −20
3. **Nutrient Deficiency** (universal thresholds):
   - Nitrogen < 20 mg/kg → −15
   - Phosphorus < 15 mg/kg → −15
   - Potassium < 150 mg/kg → −15
4. **Critical Crop Penalty** (key nutrient below high-demand threshold) → −10
5. **Clamp** score to [0, 100]

### Health Classification

| Score | Status |
|-------|--------|
| ≥ 80 | Optimal |
| 50–79 | Deficient |
| < 50 | Critical |

---

## 📝 Translation Key Reference

| Key | Purpose | Example (English) |
|-----|---------|-------------------|
| `app_title` | App name | "AgriPulse" |
| `chat_title` | Chat header | "AgriPulse Assistant" |
| `chat_placeholder` | Input placeholder | "Ask about soil health…" |
| `chat_send` | Send button | "Send" |
| `chat_welcome` | Welcome message | "Hello! I can help you…" |
| `chat_error` | Error text | "Sorry, something went wrong." |
| `chat_thinking` | Loading text | "Thinking…" |
| `chat_lang_changed` | Lang switch notice | "Language changed to English." |
| `chat_quick_nitrogen` | Quick action | "What does nitrogen do?" |
| `chat_quick_phosphorus` | Quick action | "Why is phosphorus important?" |
| `chat_quick_potassium` | Quick action | "How does potassium help?" |
| `chat_quick_ph` | Quick action | "What is ideal soil pH?" |
| `chat_quick_fertilizer` | Quick action | "Best fertilizer for my crop?" |
| `chat_explain` | Quick action | "Explain my soil results" |
| `chat_new` | Reset chat | "New Chat" |
| `chat_close` | Close button | "Close" |
| `chat_powered_by` | Footer | "Powered by Gemini AI" |

---

## 🧪 Running Tests

```bash
cd agripulse/backend
.\venv\Scripts\activate
pytest test_scoring.py -v
```

All 36 tests validate the deterministic scoring engine.

---

## Sample CSV Format

```csv
soil_id,nitrogen,phosphorus,potassium,ph_level
SOIL_001,25,20,180,6.5
SOIL_002,12,18,160,6.2
```

---

*Built for Hackathon 2026 — AgriPulse Precision Agriculture Assistant*
