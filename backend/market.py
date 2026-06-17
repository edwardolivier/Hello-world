from fastapi import APIRouter, Depends, HTTPException
import anthropic
import httpx
import os
from auth import get_current_user
from firebase_client import db

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def fetch_energymadeeasy_data() -> str:
    """Try to scrape Energy Made Easy for QLD offers. Falls back gracefully."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as http:
            resp = await http.get(
                "https://www.energymadeeasy.gov.au/api/offers",
                params={"postcode": "4000", "fuelType": "electricity"},
                headers={"User-Agent": "Mozilla/5.0"}
            )
            if resp.status_code == 200:
                return f"Energy Made Easy API data: {resp.text[:3000]}"
    except Exception:
        pass
    return ""

MARKET_PROMPT = """You are an expert on the Australian electricity retail market, specifically South East Queensland (Brisbane, Energex network, ENERGEX distribution).

The user is currently paying these rates (extracted from their bills):
{user_rates}

Your task:
1. List the top 5 electricity retailers currently available in Brisbane SEQ, with their typical residential tariff rates (usage rate in c/kWh and daily supply charge in c/day). Use your knowledge of AGL, Origin Energy, EnergyAustralia, Alinta Energy, Ergon Energy (residential), Red Energy, Lumo Energy, Dodo Power & Gas, and any other active SEQ retailers.

2. For each retailer, calculate the estimated monthly cost based on the user's average daily usage of {avg_daily_kwh} kWh.

3. Identify if the user could save money by switching, and calculate the estimated annual savings.

4. Give a clear recommendation.

5. Add a disclaimer that rates should be verified directly with retailers as they change frequently.

Return a JSON object with this structure:
{{
  "current_retailer": "string",
  "current_estimated_annual_cost": 0.00,
  "offers": [
    {{
      "retailer": "string",
      "usage_rate_cents": 0.00,
      "daily_supply_cents": 0.00,
      "estimated_monthly_cost": 0.00,
      "estimated_annual_cost": 0.00,
      "potential_annual_saving": 0.00,
      "notes": "string"
    }}
  ],
  "recommendation": "string",
  "best_offer_retailer": "string",
  "max_annual_saving": 0.00,
  "disclaimer": "string",
  "data_freshness": "string"
}}
{market_data}
"""

@router.get("/compare")
async def compare_market(current_user: str = Depends(get_current_user)):
    docs = list(
        db.collection("users").document(current_user)
          .collection("bills").order_by("billing_period_start", direction="DESCENDING")
          .limit(6).stream()
    )

    if not docs:
        raise HTTPException(status_code=400, detail="Upload at least one bill before comparing")

    bills = [doc.to_dict() for doc in docs]

    avg_peak_rate = sum(b.get("peak_rate_cents", 0) for b in bills) / len(bills)
    avg_supply = sum(b.get("daily_supply_charge_cents", 0) for b in bills) / len(bills)
    avg_daily_kwh = sum(b.get("avg_daily_usage_kwh", 0) for b in bills) / len(bills)
    current_retailer = bills[0].get("retailer", "Unknown")

    user_rates = (
        f"- Retailer: {current_retailer}\n"
        f"- Peak/flat usage rate: {avg_peak_rate:.2f} c/kWh\n"
        f"- Daily supply charge: {avg_supply:.2f} c/day\n"
        f"- Average daily usage: {avg_daily_kwh:.2f} kWh\n"
        f"- Based on {len(bills)} bill(s)"
    )

    market_data = await fetch_energymadeeasy_data()
    market_note = f"\n\nAdditional market data:\n{market_data}" if market_data else ""

    prompt = MARKET_PROMPT.format(
        user_rates=user_rates,
        avg_daily_kwh=round(avg_daily_kwh, 2),
        market_data=market_note
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    import json
    result = json.loads(raw.strip())
    return result
