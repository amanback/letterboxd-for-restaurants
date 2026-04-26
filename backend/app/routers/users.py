from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.follower import Follower
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.username is not None:
        current_user.username = payload.username
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/search", response_model=List[UserOut])
def search_users(
    q: str = "",
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search users by username (case-insensitive prefix/contains match)."""
    if not q.strip():
        return []
    users = (
        db.query(User)
        .filter(User.username.ilike(f"%{q.strip()}%"), User.id != current_user.id)
        .limit(limit)
        .all()
    )
    return users


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/{user_id}/follow", status_code=status.HTTP_201_CREATED)
def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = (
        db.query(Follower)
        .filter(Follower.follower_id == current_user.id, Follower.following_id == user_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already following")

    follow = Follower(follower_id=current_user.id, following_id=user_id)
    db.add(follow)
    db.commit()
    return {"message": f"Now following {target.username}"}


@router.delete("/{user_id}/unfollow")
def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    follow = (
        db.query(Follower)
        .filter(Follower.follower_id == current_user.id, Follower.following_id == user_id)
        .first()
    )
    if not follow:
        raise HTTPException(status_code=404, detail="Not following this user")

    db.delete(follow)
    db.commit()
    return {"message": "Unfollowed successfully"}


@router.get("/{user_id}/followers", response_model=List[UserOut])
def get_followers(user_id: int, db: Session = Depends(get_db)):
    follower_ids = [
        f.follower_id
        for f in db.query(Follower).filter(Follower.following_id == user_id).all()
    ]
    users = db.query(User).filter(User.id.in_(follower_ids)).all() if follower_ids else []
    return users


@router.get("/{user_id}/following", response_model=List[UserOut])
def get_following(user_id: int, db: Session = Depends(get_db)):
    following_ids = [
        f.following_id
        for f in db.query(Follower).filter(Follower.follower_id == user_id).all()
    ]
    users = db.query(User).filter(User.id.in_(following_ids)).all() if following_ids else []
    return users
