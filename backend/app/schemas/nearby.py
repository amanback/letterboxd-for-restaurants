from pydantic import BaseModel
from typing import List, Optional


class NearbyRestaurant(BaseModel):
    """A restaurant result from the Google Places API."""
    place_id: str
    name: str
    address: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    rating: Optional[float] = None
    user_rating_count: int = 0
    price_level: str = ""
    cuisine_type: str = "Restaurant"
    photo_url: Optional[str] = None
    is_open_now: Optional[bool] = None
    phone: str = ""
    website: str = ""


class NearbySearchResponse(BaseModel):
    """Response for nearby restaurant search."""
    results: List[NearbyRestaurant]
    total: int
    cached: bool = False


class PlaceReview(BaseModel):
    author: str = ""
    rating: Optional[float] = None
    text: str = ""
    time: str = ""


class PlaceDetails(BaseModel):
    """Full details for a specific place."""
    place_id: str
    name: str
    address: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    rating: Optional[float] = None
    user_rating_count: int = 0
    price_level: str = ""
    cuisine_type: str = "Restaurant"
    photo_url: Optional[str] = None
    photos: List[str] = []
    is_open_now: Optional[bool] = None
    phone: str = ""
    website: str = ""
    description: str = ""
    opening_hours: List[str] = []
    reviews: List[PlaceReview] = []
