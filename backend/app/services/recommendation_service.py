import math
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.food_log import FoodLog
from app.models.restaurant import Restaurant
from app.models.taste_profile import TasteProfile
from app.models.follower import Follower


def build_taste_vector(db: Session, user_id: int) -> Dict[str, float]:
    """Build a taste preference vector from user's food logs.
    
    Vector keys are cuisine tags, values are average ratings.
    """
    logs = db.query(FoodLog).filter(FoodLog.user_id == user_id).all()
    cuisine_ratings: Dict[str, List[float]] = {}

    for log in logs:
        tag = (log.cuisine_tag or "").strip().lower()
        if not tag:
            continue
        if tag not in cuisine_ratings:
            cuisine_ratings[tag] = []
        cuisine_ratings[tag].append(log.rating)

    vector = {}
    for cuisine, ratings in cuisine_ratings.items():
        vector[cuisine] = sum(ratings) / len(ratings)

    # Persist to TasteProfile
    profile = db.query(TasteProfile).filter(TasteProfile.user_id == user_id).first()
    if profile:
        profile.vector = vector
    else:
        profile = TasteProfile(user_id=user_id, vector=vector)
        db.add(profile)
    db.commit()

    return vector


def cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    """Compute cosine similarity between two sparse vectors."""
    all_keys = set(vec_a.keys()) | set(vec_b.keys())
    if not all_keys:
        return 0.0

    dot = sum(vec_a.get(k, 0) * vec_b.get(k, 0) for k in all_keys)
    mag_a = math.sqrt(sum(v ** 2 for v in vec_a.values()))
    mag_b = math.sqrt(sum(v ** 2 for v in vec_b.values()))

    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def build_restaurant_vector(db: Session, restaurant_id: int) -> Dict[str, float]:
    """Build a vector for a restaurant based on its food logs."""
    logs = db.query(FoodLog).filter(FoodLog.restaurant_id == restaurant_id).all()
    cuisine_ratings: Dict[str, List[float]] = {}

    for log in logs:
        tag = (log.cuisine_tag or "").strip().lower()
        if not tag:
            continue
        if tag not in cuisine_ratings:
            cuisine_ratings[tag] = []
        cuisine_ratings[tag].append(log.rating)

    return {c: sum(r) / len(r) for c, r in cuisine_ratings.items()}


def get_social_boost(db: Session, user_id: int, restaurant_id: int) -> float:
    """Compute social influence boost: avg rating from followed users for this restaurant."""
    following_ids = [
        f.following_id
        for f in db.query(Follower).filter(Follower.follower_id == user_id).all()
    ]
    if not following_ids:
        return 0.0

    friend_logs = (
        db.query(FoodLog)
        .filter(
            FoodLog.user_id.in_(following_ids),
            FoodLog.restaurant_id == restaurant_id,
        )
        .all()
    )
    if not friend_logs:
        return 0.0

    avg = sum(l.rating for l in friend_logs) / len(friend_logs)
    return avg / 5.0  # normalize to 0-1


def get_recommendations(
    db: Session, user_id: int, limit: int = 10
) -> List[dict]:
    """Get restaurant recommendations for a user."""
    user_vector = build_taste_vector(db, user_id)

    restaurants = db.query(Restaurant).all()
    scored: List[Tuple[float, Restaurant]] = []

    for rest in restaurants:
        rest_vector = build_restaurant_vector(db, rest.id)
        sim = cosine_similarity(user_vector, rest_vector)
        social = get_social_boost(db, user_id, rest.id)

        # Combine: 70% taste similarity + 30% social influence
        combined = 0.7 * sim + 0.3 * social
        scored.append((combined, rest))

    scored.sort(key=lambda x: x[0], reverse=True)

    results = []
    for score, rest in scored[:limit]:
        if score <= 0:
            continue
        results.append(
            {
                "restaurant_id": rest.id,
                "restaurant_name": rest.name,
                "dish_name": "",
                "cuisine": rest.cuisine or "",
                "score": round(score, 3),
                "reason": f"Taste match: {round(score * 100)}%",
            }
        )

    return results
