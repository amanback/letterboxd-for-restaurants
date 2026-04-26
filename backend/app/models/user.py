import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class UserRole(str, enum.Enum):
    user = "user"
    owner = "owner"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.user, nullable=False)
    bio = Column(String(500), default="")
    avatar_url = Column(String(500), default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    food_logs = relationship("FoodLog", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    taste_profile = relationship("TasteProfile", back_populates="user", uselist=False)
    owned_restaurants = relationship("Restaurant", back_populates="owner")
