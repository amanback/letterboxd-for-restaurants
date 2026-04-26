from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from typing import List
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.food_log import FoodLog
from app.models.follower import Follower
from app.schemas.food_log import FoodLogOut
from app.services.feed_service import manager
from app.services.auth_service import decode_token

router = APIRouter(prefix="/feed", tags=["Feed"])


@router.get("/", response_model=List[FoodLogOut])
def get_feed(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get paginated feed of food logs from followed users."""
    following_ids = [
        f.following_id
        for f in db.query(Follower).filter(Follower.follower_id == current_user.id).all()
    ]
    # Include own posts in feed
    following_ids.append(current_user.id)

    logs = (
        db.query(FoodLog)
        .filter(FoodLog.user_id.in_(following_ids))
        .order_by(FoodLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []
    for log in logs:
        out = FoodLogOut.model_validate(log)
        user = db.query(User).filter(User.id == log.user_id).first()
        out.username = user.username if user else "Unknown"
        if log.restaurant:
            out.restaurant_name = log.restaurant.name
        results.append(out)
    return results


@router.websocket("/ws")
async def feed_websocket(websocket: WebSocket, token: str = Query(...)):
    """WebSocket endpoint for real-time feed updates.
    
    Connect with: ws://host/feed/ws?token=<jwt_token>
    """
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = int(payload.get("sub", 0))
    if not user_id:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive, listen for pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
