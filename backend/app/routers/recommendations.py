from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.recommendation import RecommendationResponse
from app.services.recommendation_service import get_recommendations

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/", response_model=RecommendationResponse)
def recommendations(
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get personalized restaurant recommendations based on taste profile and social graph."""
    items = get_recommendations(db, current_user.id, limit=limit)
    return RecommendationResponse(recommendations=items)
