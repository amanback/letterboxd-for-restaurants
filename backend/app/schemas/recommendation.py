from pydantic import BaseModel
from typing import List, Optional


class RecommendationItem(BaseModel):
    restaurant_id: Optional[int] = None
    restaurant_name: str = ""
    dish_name: str = ""
    cuisine: str = ""
    score: float = 0.0
    reason: str = ""


class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem] = []
