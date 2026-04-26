"""
Google Places API (New) integration service.

Uses the v1 Nearby Search endpoint with FieldMasks
to discover restaurants by location, with TTL caching.
"""

import logging
from typing import List, Optional, Dict, Any
from cachetools import TTLCache
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

# Module-level cache — shared across requests
_nearby_cache: Optional[TTLCache] = None


def _get_cache() -> TTLCache:
    """Lazy-init the TTL cache using config."""
    global _nearby_cache
    if _nearby_cache is None:
        settings = get_settings()
        _nearby_cache = TTLCache(maxsize=256, ttl=settings.PLACES_CACHE_TTL_SECONDS)
    return _nearby_cache


# FieldMask controls which data Google returns (and what we're billed for)
NEARBY_FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.primaryTypeDisplayName",
    "places.photos",
    "places.currentOpeningHours",
    "places.websiteUri",
    "places.nationalPhoneNumber",
])

DETAIL_FIELD_MASK = ",".join([
    "id",
    "displayName",
    "formattedAddress",
    "location",
    "rating",
    "userRatingCount",
    "priceLevel",
    "primaryTypeDisplayName",
    "photos",
    "currentOpeningHours",
    "regularOpeningHours",
    "websiteUri",
    "nationalPhoneNumber",
    "internationalPhoneNumber",
    "editorialSummary",
    "reviews",
])

PLACES_BASE = "https://places.googleapis.com"


def _round_coord(val: float, precision: int = 3) -> float:
    """Round coordinates for cache key grouping (~111m at equator for 3 decimals)."""
    return round(val, precision)


def _build_photo_url(photo_name: str, api_key: str, max_width: int = 400) -> str:
    """Build a Google Places photo URL from the resource name."""
    return (
        f"{PLACES_BASE}/v1/{photo_name}/media"
        f"?maxWidthPx={max_width}&key={api_key}"
    )


PRICE_MAP = {
    "PRICE_LEVEL_FREE": "Free",
    "PRICE_LEVEL_INEXPENSIVE": "$",
    "PRICE_LEVEL_MODERATE": "$$",
    "PRICE_LEVEL_EXPENSIVE": "$$$",
    "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$",
}


def _parse_place(place: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """Normalize a Google Places result into our schema."""
    location = place.get("location", {})
    display_name = place.get("displayName", {})
    photos = place.get("photos", [])
    opening_hours = place.get("currentOpeningHours", {})
    primary_type = place.get("primaryTypeDisplayName", {})

    photo_url = None
    if photos:
        photo_url = _build_photo_url(photos[0].get("name", ""), api_key)

    return {
        "place_id": place.get("id", ""),
        "name": display_name.get("text", "Unknown"),
        "address": place.get("formattedAddress", ""),
        "lat": location.get("latitude"),
        "lng": location.get("longitude"),
        "rating": place.get("rating"),
        "user_rating_count": place.get("userRatingCount", 0),
        "price_level": PRICE_MAP.get(place.get("priceLevel", ""), ""),
        "cuisine_type": primary_type.get("text", "Restaurant"),
        "photo_url": photo_url,
        "is_open_now": opening_hours.get("openNow"),
        "phone": place.get("nationalPhoneNumber", ""),
        "website": place.get("websiteUri", ""),
    }


async def search_nearby_restaurants(
    lat: float,
    lng: float,
    radius_m: int = 1500,
    max_results: int = 20,
) -> List[Dict[str, Any]]:
    """
    Search for restaurants near (lat, lng) using Google Places Nearby Search (New).

    Returns a list of normalized restaurant dicts.
    Falls back to empty list if API key is missing or request fails.
    """
    settings = get_settings()
    api_key = settings.GOOGLE_PLACES_API_KEY

    if not api_key:
        logger.warning("GOOGLE_PLACES_API_KEY not set — returning empty results")
        return []

    # Check cache
    cache = _get_cache()
    cache_key = (_round_coord(lat), _round_coord(lng), radius_m, max_results)
    if cache_key in cache:
        logger.debug("Cache hit for nearby search %s", cache_key)
        return cache[cache_key]

    # Build request
    url = f"{PLACES_BASE}/v1/places:searchNearby"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": NEARBY_FIELD_MASK,
    }
    payload = {
        "includedTypes": ["restaurant"],
        "maxResultCount": min(max_results, 20),  # API max is 20
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": float(radius_m),
            }
        },
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        places = data.get("places", [])
        results = [_parse_place(p, api_key) for p in places]

        # Cache the results
        cache[cache_key] = results
        logger.info("Fetched %d nearby restaurants from Google Places", len(results))
        return results

    except httpx.HTTPStatusError as e:
        logger.error("Google Places API error %s: %s", e.response.status_code, e.response.text)
        return []
    except Exception as e:
        logger.error("Google Places request failed: %s", e)
        return []


async def get_place_details(place_id: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed information for a specific place.
    """
    settings = get_settings()
    api_key = settings.GOOGLE_PLACES_API_KEY

    if not api_key:
        logger.warning("GOOGLE_PLACES_API_KEY not set")
        return None

    url = f"{PLACES_BASE}/v1/places/{place_id}"
    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": DETAIL_FIELD_MASK,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            place = resp.json()

        result = _parse_place(place, api_key)

        # Add extra detail fields
        photos = place.get("photos", [])
        result["photos"] = [
            _build_photo_url(p.get("name", ""), api_key, max_width=800)
            for p in photos[:5]
        ]

        editorial = place.get("editorialSummary", {})
        result["description"] = editorial.get("text", "")

        # Opening hours
        regular_hours = place.get("regularOpeningHours", {})
        result["opening_hours"] = regular_hours.get("weekdayDescriptions", [])

        # Reviews
        raw_reviews = place.get("reviews", [])
        result["reviews"] = [
            {
                "author": r.get("authorAttribution", {}).get("displayName", ""),
                "rating": r.get("rating"),
                "text": r.get("text", {}).get("text", ""),
                "time": r.get("relativePublishTimeDescription", ""),
            }
            for r in raw_reviews[:5]
        ]

        return result

    except httpx.HTTPStatusError as e:
        logger.error("Google Places detail error %s: %s", e.response.status_code, e.response.text)
        return None
    except Exception as e:
        logger.error("Google Places detail request failed: %s", e)
        return None
