from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    rating: float
    text: str = ""


class ReviewOut(BaseModel):
    id: int
    user_id: int
    restaurant_id: int
    rating: float
    text: str = ""
    owner_reply: Optional[str] = None
    created_at: Optional[datetime] = None
    username: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewReply(BaseModel):
    reply: str
