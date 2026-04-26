"""Standalone script to initialize the database tables."""
from app.database import engine, Base

# Import all models
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.food_log import FoodLog
from app.models.follower import Follower
from app.models.review import Review
from app.models.taste_profile import TasteProfile

if __name__ == "__main__":
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Done!")
