from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FoodLog(Base):
    __tablename__ = "food_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)
    dish_name = Column(String(200), nullable=False)
    rating = Column(Float, nullable=False)  # 1-5
    review_text = Column(Text, default="")
    photos = Column(JSON, default=[])  # list of photo URLs
    cuisine_tag = Column(String(100), default="")  # for taste profiling
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="food_logs")
    restaurant = relationship("Restaurant", back_populates="food_logs")
