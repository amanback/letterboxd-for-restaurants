from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.review import Review
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate, RestaurantOut
from app.schemas.review import ReviewCreate, ReviewOut, ReviewReply

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.post("/", response_model=RestaurantOut, status_code=status.HTTP_201_CREATED)
def create_restaurant(
    payload: RestaurantCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    restaurant = Restaurant(**payload.model_dump())
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return restaurant


@router.get("/", response_model=List[RestaurantOut])
def search_restaurants(
    q: Optional[str] = None,
    cuisine: Optional[str] = None,
    location: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(Restaurant)
    if q:
        query = query.filter(
            or_(
                Restaurant.name.ilike(f"%{q}%"),
                Restaurant.cuisine.ilike(f"%{q}%"),
                Restaurant.location.ilike(f"%{q}%"),
            )
        )
    if cuisine:
        query = query.filter(Restaurant.cuisine.ilike(f"%{cuisine}%"))
    if location:
        query = query.filter(Restaurant.location.ilike(f"%{location}%"))

    return query.offset(skip).limit(limit).all()


@router.get("/{restaurant_id}", response_model=RestaurantOut)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


# — Restaurant Owner Endpoints —

@router.post("/{restaurant_id}/claim")
def claim_restaurant(
    restaurant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if restaurant.claimed:
        raise HTTPException(status_code=400, detail="Restaurant already claimed")

    restaurant.owner_id = current_user.id
    restaurant.claimed = 1
    # Update user role to owner
    current_user.role = "owner"
    db.commit()
    return {"message": f"Restaurant '{restaurant.name}' claimed successfully"}


@router.put("/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant(
    restaurant_id: int,
    payload: RestaurantUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if restaurant.owner_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(restaurant, field, value)
    db.commit()
    db.refresh(restaurant)
    return restaurant


# — Reviews —

@router.post("/{restaurant_id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    restaurant_id: int,
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    review = Review(
        user_id=current_user.id,
        restaurant_id=restaurant_id,
        rating=payload.rating,
        text=payload.text,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    out = ReviewOut.model_validate(review)
    out.username = current_user.username
    return out


@router.get("/{restaurant_id}/reviews", response_model=List[ReviewOut])
def list_reviews(restaurant_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.restaurant_id == restaurant_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    results = []
    for r in reviews:
        out = ReviewOut.model_validate(r)
        user = db.query(User).filter(User.id == r.user_id).first()
        out.username = user.username if user else "Unknown"
        results.append(out)
    return results


@router.put("/{restaurant_id}/reviews/{review_id}/reply", response_model=ReviewOut)
def reply_to_review(
    restaurant_id: int,
    review_id: int,
    payload: ReviewReply,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if restaurant.owner_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only the restaurant owner can reply")

    review = db.query(Review).filter(Review.id == review_id, Review.restaurant_id == restaurant_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.owner_reply = payload.reply
    db.commit()
    db.refresh(review)

    out = ReviewOut.model_validate(review)
    user = db.query(User).filter(User.id == review.user_id).first()
    out.username = user.username if user else "Unknown"
    return out
