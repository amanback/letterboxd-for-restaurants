from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.food_log import FoodLog
from app.models.follower import Follower
from app.schemas.food_log import FoodLogCreate, FoodLogUpdate, FoodLogOut
from app.services.feed_service import manager

router = APIRouter(prefix="/food-logs", tags=["Food Logs"])


@router.post("/", response_model=FoodLogOut, status_code=status.HTTP_201_CREATED)
async def create_food_log(
    payload: FoodLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = FoodLog(
        user_id=current_user.id,
        restaurant_id=payload.restaurant_id,
        dish_name=payload.dish_name,
        rating=payload.rating,
        review_text=payload.review_text,
        photos=payload.photos,
        cuisine_tag=payload.cuisine_tag,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    # Notify followers via WebSocket
    follower_ids = [
        f.follower_id
        for f in db.query(Follower).filter(Follower.following_id == current_user.id).all()
    ]
    if follower_ids:
        await manager.broadcast_to_followers(
            follower_ids,
            {
                "type": "new_food_log",
                "data": {
                    "id": log.id,
                    "user_id": log.user_id,
                    "username": current_user.username,
                    "dish_name": log.dish_name,
                    "rating": log.rating,
                    "review_text": log.review_text,
                    "photos": log.photos or [],
                    "created_at": str(log.created_at),
                },
            },
        )

    result = FoodLogOut.model_validate(log)
    result.username = current_user.username
    if log.restaurant_id:
        from app.models.restaurant import Restaurant
        rest = db.query(Restaurant).filter(Restaurant.id == log.restaurant_id).first()
        if rest:
            result.restaurant_name = rest.name
    return result


@router.get("/", response_model=List[FoodLogOut])
def list_food_logs(
    skip: int = 0,
    limit: int = 20,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(FoodLog)
    if user_id:
        query = query.filter(FoodLog.user_id == user_id)
    logs = query.order_by(FoodLog.created_at.desc()).offset(skip).limit(limit).all()

    results = []
    for log in logs:
        out = FoodLogOut.model_validate(log)
        user = db.query(User).filter(User.id == log.user_id).first()
        out.username = user.username if user else "Unknown"
        if log.restaurant:
            out.restaurant_name = log.restaurant.name
        results.append(out)
    return results


@router.get("/{log_id}", response_model=FoodLogOut)
def get_food_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(FoodLog).filter(FoodLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Food log not found")
    out = FoodLogOut.model_validate(log)
    user = db.query(User).filter(User.id == log.user_id).first()
    out.username = user.username if user else "Unknown"
    if log.restaurant:
        out.restaurant_name = log.restaurant.name
    return out


@router.put("/{log_id}", response_model=FoodLogOut)
def update_food_log(
    log_id: int,
    payload: FoodLogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(FoodLog).filter(FoodLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Food log not found")
    if log.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)

    out = FoodLogOut.model_validate(log)
    out.username = current_user.username
    return out


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(FoodLog).filter(FoodLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Food log not found")
    if log.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(log)
    db.commit()
