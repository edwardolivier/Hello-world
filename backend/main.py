from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Energy Tracker", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from auth import router as auth_router
from bills import router as bills_router
from market import router as market_router

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(bills_router, prefix="/api/bills", tags=["bills"])
app.include_router(market_router, prefix="/api/market", tags=["market"])

STATIC_DIR = "static"
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=f"{STATIC_DIR}/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        return FileResponse(f"{STATIC_DIR}/index.html")
