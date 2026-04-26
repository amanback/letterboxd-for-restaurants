from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.deps import get_db, get_current_user
from app.models.user import User
from app.models.restaurant import Restaurant
from app.schemas.nearby import NearbyRestaurant, NearbySearchResponse, PlaceDetails
from app.services.places_service import search_nearby_restaurants, get_place_details

router = APIRouter(prefix="/nearby", tags=["Nearby Discovery"])


@router.get("/", response_model=NearbySearchResponse)
async def nearby_restaurants(
    lat: float = Query(..., description="Latitude", ge=-90, le=90),
    lng: float = Query(..., description="Longitude", ge=-180, le=180),
    radius: int = Query(1500, description="Search radius in meters", ge=100, le=50000),
    limit: int = Query(20, description="Max results", ge=1, le=20),
):
    """
    Search for restaurants near a location using Google Places API.
    No authentication required.
    """
    results = await search_nearby_restaurants(lat, lng, radius_m=radius, max_results=limit)
    items = [NearbyRestaurant(**r) for r in results]
    return NearbySearchResponse(results=items, total=len(items))


@router.get("/{place_id}", response_model=PlaceDetails)
async def place_details(place_id: str):
    """
    Get detailed information for a specific Google Place.
    """
    details = await get_place_details(place_id)
    if not details:
        raise HTTPException(status_code=404, detail="Place not found or API error")
    return PlaceDetails(**details)


@router.post("/{place_id}/import")
async def import_place(
    place_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Import a Google Places restaurant into the local database.
    Returns the local restaurant record (creates if not exists).
    """
    # Check if already imported
    existing = db.query(Restaurant).filter(
        Restaurant.description.contains(f"google_place_id:{place_id}")
    ).first()
    if existing:
        return {
            "message": "Restaurant already imported",
            "restaurant_id": existing.id,
            "name": existing.name,
        }

    # Fetch details from Google Places
    details = await get_place_details(place_id)
    if not details:
        raise HTTPException(status_code=404, detail="Could not fetch place details")

    # Create local restaurant
    restaurant = Restaurant(
        name=details["name"],
        cuisine=details.get("cuisine_type", ""),
        location=details.get("address", ""),
        lat=details.get("lat"),
        lng=details.get("lng"),
        description=f"{details.get('description', '')}\n\ngoogle_place_id:{place_id}".strip(),
        phone=details.get("phone", ""),
        website=details.get("website", ""),
    )
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)

    return {
        "message": "Restaurant imported successfully",
        "restaurant_id": restaurant.id,
        "name": restaurant.name,
    }
