from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    cuisine = Column(String(100), index=True)
    location = Column(String(300))
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    description = Column(Text, default="")
    phone = Column(String(20), default="")
    website = Column(String(300), default="")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    claimed = Column(Integer, default=0)  # 0 = unclaimed, 1 = claimed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="owned_restaurants")
    food_logs = relationship("FoodLog", back_populates="restaurant")
    reviews = relationship("Review", back_populates="restaurant")
