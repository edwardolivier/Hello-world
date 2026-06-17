from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from datetime import datetime
import pdfplumber
import anthropic
import json
import os
import io
from auth import get_current_user
from firebase_client import db
from models import BillData

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

EXTRACT_PROMPT = """You are an expert at reading Australian electricity bills.
Extract the following data from this electricity bill text and return ONLY valid JSON.
If a value is not present, use null.

Return this exact JSON structure:
{
  "retailer": "name of electricity retailer",
  "billing_period_start": "YYYY-MM-DD",
  "billing_period_end": "YYYY-MM-DD",
  "total_kwh": 123.45,
  "peak_rate_cents": 30.00,
  "offpeak_rate_cents": null,
  "shoulder_rate_cents": null,
  "controlled_load_rate_cents": null,
  "controlled_load_2_kwh": null,
  "daily_supply_charge_cents": 100.00,
  "daily_supply_controlled_cents": null,
  "total_amount_dollars": 150.00,
  "avg_daily_usage_kwh": 12.5,
  "avg_daily_cost_dollars": 5.50
}

Notes:
- Rates should be in cents per kWh
- Daily supply charge in cents per day
- controlled_load_2_kwh: total kWh used on Controlled Load 2 tariff (hot water etc), null if not present
- daily_supply_controlled_cents: daily supply charge for controlled load circuit in cents per day, null if not present
- If avg daily values aren't on the bill, calculate them from the billing period
- For flat rate tariffs, put the single rate in peak_rate_cents

Bill text:
"""

def extract_bill_with_claude(text: str) -> dict:
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": EXTRACT_PROMPT + text}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())

@router.post("/upload", response_model=BillData)
async def upload_bill(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    contents = await file.read()

    try:
        text = ""
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {str(e)}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="PDF appears to be empty or image-only")

    try:
        extracted = extract_bill_with_claude(text[:8000])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM extraction failed: {str(e)}")

    bill_id = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    extracted["uploaded_at"] = datetime.utcnow().isoformat()
    extracted["id"] = bill_id

    db.collection("users").document(current_user)\
      .collection("bills").document(bill_id).set(extracted)

    return BillData(**extracted)

@router.get("/", response_model=list[BillData])
async def list_bills(current_user: str = Depends(get_current_user)):
    docs = db.collection("users").document(current_user)\
             .collection("bills").stream()

    bills = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        bills.append(BillData(**data))

    bills.sort(key=lambda b: b.billing_period_start, reverse=True)
    return bills

@router.delete("/{bill_id}")
async def delete_bill(bill_id: str, current_user: str = Depends(get_current_user)):
    ref = db.collection("users").document(current_user).collection("bills").document(bill_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Bill not found")
    ref.delete()
    return {"message": "Deleted"}

@router.get("/stats")
async def get_stats(current_user: str = Depends(get_current_user)):
    docs = list(
        db.collection("users").document(current_user)
          .collection("bills").stream()
    )

    if not docs:
        return {"bills_count": 0, "monthly_data": [], "averages": {}}

    bills = sorted([doc.to_dict() for doc in docs], key=lambda b: b.get("billing_period_start", ""))

    total_kwh = sum(b.get("total_kwh", 0) for b in bills)
    total_spent = sum(b.get("total_amount_dollars", 0) for b in bills)
    avg_daily_cost = sum(b.get("avg_daily_cost_dollars", 0) for b in bills) / len(bills)
    avg_daily_kwh = sum(b.get("avg_daily_usage_kwh", 0) for b in bills) / len(bills)
    avg_peak_rate = sum(b.get("peak_rate_cents", 0) for b in bills) / len(bills)
    avg_supply_charge = sum(b.get("daily_supply_charge_cents", 0) for b in bills) / len(bills)

    monthly_data = []
    for b in bills:
        monthly_data.append({
            "period": b.get("billing_period_end", "")[:7],
            "kwh": b.get("total_kwh", 0),
            "cost": b.get("total_amount_dollars", 0),
            "avg_daily_cost": b.get("avg_daily_cost_dollars", 0),
            "avg_daily_kwh": b.get("avg_daily_usage_kwh", 0),
            "retailer": b.get("retailer", ""),
        })

    return {
        "bills_count": len(bills),
        "total_kwh": round(total_kwh, 2),
        "total_spent": round(total_spent, 2),
        "avg_daily_cost": round(avg_daily_cost, 2),
        "avg_daily_kwh": round(avg_daily_kwh, 2),
        "avg_peak_rate_cents": round(avg_peak_rate, 2),
        "avg_supply_charge_cents": round(avg_supply_charge, 2),
        "monthly_data": monthly_data,
        "current_retailer": bills[-1].get("retailer", "Unknown") if bills else "Unknown",
    }
