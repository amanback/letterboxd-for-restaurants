from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()
BASE_DIR = Path(__file__).resolve().parent.parent

db_url = settings.DATABASE_URL
# Make SQLite paths absolute relative to the backend dir
if db_url.startswith("sqlite:///./"):
    db_path = BASE_DIR / db_url.replace("sqlite:///./", "")
    db_url = f"sqlite:///{db_path}"

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
