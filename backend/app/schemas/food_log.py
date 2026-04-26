from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class FoodLogCreate(BaseModel):
    dish_name: str
    restaurant_id: Optional[int] = None
    rating: float
    review_text: str = ""
    photos: List[str] = []
    cuisine_tag: str = ""


class FoodLogUpdate(BaseModel):
    dish_name: Optional[str] = None
    restaurant_id: Optional[int] = None
    rating: Optional[float] = None
    review_text: Optional[str] = None
    photos: Optional[List[str]] = None
    cuisine_tag: Optional[str] = None


class FoodLogOut(BaseModel):
    id: int
    user_id: int
    restaurant_id: Optional[int] = None
    dish_name: str
    rating: float
    review_text: str = ""
    photos: List[str] = []
    cuisine_tag: str = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    username: Optional[str] = None
    restaurant_name: Optional[str] = None

    class Config:
        from_attributes = True
