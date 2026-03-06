"""
AgriPulse – Precision Agriculture Assistant
FastAPI backend server.

Endpoints:
    POST /analyze-soil   – Upload CSV + crop type → run analysis
    GET  /result          – Return the latest analysis results
    POST /chatbot         – Multilingual agricultural chatbot
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
from pydantic import BaseModel

from csv_parser import parse_soil_csv
from scoring import analyze_soil_sample
from ai_explanation import generate_explanation
from chatbot import chat_response

# ── App setup ───────────────────────────────────────────────────
app = FastAPI(
    title="AgriPulse – Precision Agriculture Assistant",
    version="1.0.0",
)

# Allow React dev server on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for latest analysis results
latest_results: List[Dict] = []

VALID_CROPS = {"TOMATO", "WHEAT", "RICE", "MAIZE"}
VALID_LANGS = {"en", "hi", "kn", "ta", "te"}


# ── POST /analyze-soil ─────────────────────────────────────────
@app.post("/analyze-soil")
async def analyze_soil(
    file: UploadFile = File(...),
    crop: str = Form(...),
    lang: str = Form("en"),
):
    """
    Accept a soil CSV upload, crop type, and language code.
    Parse, score deterministically, generate AI explanations, and return results.
    The lang parameter controls the language of AI-generated explanations.
    """
    global latest_results

    crop = crop.strip().upper()
    if crop not in VALID_CROPS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid crop. Choose from: {', '.join(sorted(VALID_CROPS))}",
        )

    # Validate and default language
    lang = lang.strip().lower()
    if lang not in VALID_LANGS:
        lang = "en"

    # Read and parse CSV
    try:
        contents = await file.read()
        records = parse_soil_csv(contents)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")

    if not records:
        raise HTTPException(status_code=400, detail="CSV contains no valid soil records.")

    # Analyze each soil sample
    results: List[Dict] = []
    for rec in records:
        result = analyze_soil_sample(
            soil_id=str(rec["soil_id"]),
            nitrogen=float(rec["nitrogen"]),
            phosphorus=float(rec["phosphorus"]),
            potassium=float(rec["potassium"]),
            ph_level=float(rec["ph_level"]),
            crop=crop,
        )
        # Generate AI explanation (LLM only explains, never scores)
        result["ai_explanation"] = generate_explanation(result, lang=lang)
        results.append(result)

    # Print results to console as well
    import json
    print("\n" + "=" * 60)
    print("AgriPulse Analysis Results")
    print("=" * 60)
    for r in results:
        print(json.dumps(r, indent=2))
    print("=" * 60 + "\n")

    latest_results = results
    return {"status": "success", "count": len(results), "results": results}


# ── GET /result ────────────────────────────────────────────────
@app.get("/result")
async def get_result():
    """Return the latest analysis results."""
    if not latest_results:
        raise HTTPException(status_code=404, detail="No analysis results available. Upload a CSV first.")
    return {"status": "success", "count": len(latest_results), "results": latest_results}


# ── Health check ───────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "AgriPulse API is running."}


# ══════════════════════════════════════════════════════════════
# CHATBOT ENDPOINT
# ══════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    """Request body for the chatbot endpoint."""
    language: str = "en"
    message: str
    soil_context: Optional[Dict] = None  # optional soil result to explain


class ChatResponse(BaseModel):
    """Response body from the chatbot endpoint."""
    response: str


@app.post("/chatbot", response_model=ChatResponse)
async def chatbot_endpoint(req: ChatRequest):
    """
    Multilingual agricultural chatbot powered by Gemini.
    Accepts a message and language code, returns a farmer-friendly answer.
    Optionally receives soil_context to explain analysis results.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Validate language
    lang = req.language.strip().lower()
    if lang not in VALID_LANGS:
        lang = "en"

    # Generate response via Gemini (or fallback)
    reply = chat_response(
        message=req.message.strip(),
        lang=lang,
        soil_context=req.soil_context,
    )

    return ChatResponse(response=reply)
