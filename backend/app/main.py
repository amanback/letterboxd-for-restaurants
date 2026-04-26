import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.config import get_settings

# Import all models so Base.metadata knows about them
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.food_log import FoodLog
from app.models.follower import Follower
from app.models.review import Review
from app.models.taste_profile import TasteProfile

# Import routers
from app.routers import auth, users, food_logs, restaurants, feed, recommendations, media, nearby

settings = get_settings()

# Resolve uploads dir relative to this file's location (backend/app/main.py -> backend/uploads)
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / settings.UPLOAD_DIR
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Social Food Blog API",
    description="A social platform for food lovers to share dining experiences",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(food_logs.router)
app.include_router(restaurants.router)
app.include_router(feed.router)
app.include_router(recommendations.router)
app.include_router(media.router)
app.include_router(nearby.router)


@app.get("/")
def root():
    return {"message": "Social Food Blog API", "docs": "/docs"}
