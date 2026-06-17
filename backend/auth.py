from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from models import UserRegister, UserLogin, Token
from firebase_client import db

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-in-production")
REGISTRATION_SECRET = os.getenv("REGISTRATION_SECRET", "")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

def create_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post("/register", response_model=Token)
async def register(user: UserRegister):
    if len(user.username) < 3 or len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Username min 3 chars, password min 6 chars")

    if not REGISTRATION_SECRET or user.secret_word.lower() != REGISTRATION_SECRET.lower():
        raise HTTPException(status_code=403, detail="Invalid secret word")

    user_ref = db.collection("users").document(user.username)
    if user_ref.get().exists:
        raise HTTPException(status_code=400, detail="Username already taken")

    user_ref.set({
        "username": user.username,
        "password_hash": pwd_context.hash(user.password),
        "created_at": datetime.utcnow().isoformat()
    })

    return Token(access_token=create_token(user.username))

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    user_ref = db.collection("users").document(user.username)
    doc = user_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    data = doc.to_dict()
    if not pwd_context.verify(user.password, data["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return Token(access_token=create_token(user.username))
