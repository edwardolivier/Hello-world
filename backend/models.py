from pydantic import BaseModel
from typing import Optional
from datetime import date

class UserRegister(BaseModel):
    username: str
    password: str
    secret_word: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class BillData(BaseModel):
    id: Optional[str] = None
    retailer: str
    billing_period_start: str
    billing_period_end: str
    total_kwh: float
    peak_rate_cents: float
    offpeak_rate_cents: Optional[float] = None
    shoulder_rate_cents: Optional[float] = None
    daily_supply_charge_cents: float
    total_amount_dollars: float
    avg_daily_usage_kwh: float
    avg_daily_cost_dollars: float
    controlled_load_rate_cents: Optional[float] = None
    controlled_load_2_kwh: Optional[float] = None
    daily_supply_controlled_cents: Optional[float] = None
    uploaded_at: Optional[str] = None
