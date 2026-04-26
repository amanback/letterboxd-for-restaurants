from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RestaurantCreate(BaseModel):
    name: str
    cuisine: str = ""
    location: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    description: str = ""
    phone: str = ""
    website: str = ""


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    cuisine: Optional[str] = None
    location: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None


class RestaurantOut(BaseModel):
    id: int
    name: str
    cuisine: str = ""
    location: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    description: str = ""
    phone: str = ""
    website: str = ""
    owner_id: Optional[int] = None
    claimed: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
