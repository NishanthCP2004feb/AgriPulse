"""
CSV parsing module for AgriPulse.
Reads uploaded soil CSV files and returns cleaned records.
"""

import io
from typing import List, Dict
import pandas as pd


def parse_soil_csv(file_bytes: bytes) -> List[Dict]:
    """
    Parse a soil CSV file (bytes) and return a list of dicts.
    Handles extra blank header rows gracefully.

    Expected columns: soil_id, nitrogen, phosphorus, potassium, ph_level
    """
    text = file_bytes.decode("utf-8")
    df = pd.read_csv(io.StringIO(text))

    # Drop rows/columns that are entirely empty (handles stray blank rows)
    df = df.dropna(how="all").dropna(axis=1, how="all")

    # If the real header got pushed down, detect and fix
    required = {"soil_id", "nitrogen", "phosphorus", "potassium", "ph_level"}
    if not required.issubset(set(df.columns)):
        # Try re-reading by skipping blank rows at top
        for skip in range(1, 5):
            df = pd.read_csv(io.StringIO(text), skiprows=skip)
            df = df.dropna(how="all").dropna(axis=1, how="all")
            if required.issubset(set(df.columns)):
                break
        else:
            raise ValueError(
                f"CSV must contain columns: {', '.join(sorted(required))}. "
                f"Found: {', '.join(df.columns.tolist())}"
            )

    # Ensure correct types
    df["nitrogen"] = pd.to_numeric(df["nitrogen"], errors="coerce")
    df["phosphorus"] = pd.to_numeric(df["phosphorus"], errors="coerce")
    df["potassium"] = pd.to_numeric(df["potassium"], errors="coerce")
    df["ph_level"] = pd.to_numeric(df["ph_level"], errors="coerce")
    df = df.dropna(subset=["soil_id", "nitrogen", "phosphorus", "potassium", "ph_level"])

    records = df.to_dict(orient="records")
    return records
