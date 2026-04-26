"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import CuisineTag from "@/components/CuisineTag";
import RatingDots from "@/components/RatingDots";

function StatusBadge({ isOpen }) {
    if (isOpen === null || isOpen === undefined) return null;
    return <span className={`nearby-status ${isOpen ? "open" : "closed"}`}>{isOpen ? "Open" : "Closed"}</span>;
}

function distance(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    const R = 6371e3;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(m) {
    if (m === null) return "";
    return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

const RADIUS_OPTIONS = [
    { label: "500m", value: 500 }, { label: "1 km", value: 1000 },
    { label: "2 km", value: 2000 }, { label: "5 km", value: 5000 }, { label: "10 km", value: 10000 },
];

export default function NearbyPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState("");
    const [locating, setLocating] = useState(false);
    const [manualLocation, setManualLocation] = useState("");
    const [radius, setRadius] = useState(2000);
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    const requestGeolocation = useCallback(() => {
        if (!navigator.geolocation) { setLocationError("Geolocation not supported."); return; }
        setLocating(true); setLocationError("");
        navigator.geolocation.getCurrentPosition(
            (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
            (err) => { setLocationError(err.code === 1 ? "Location access denied." : "Could not get location."); setLocating(false); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    useEffect(() => { requestGeolocation(); }, [requestGeolocation]);

    const searchNearby = useCallback(async () => {
        if (!location) return;
        setLoading(true); setSearched(true);
        try { const data = await api.searchNearby(location.lat, location.lng, radius, 20); setRestaurants(data.results || []); }
        catch { setRestaurants([]); }
        finally { setLoading(false); }
    }, [location, radius]);

    useEffect(() => { if (location) searchNearby(); }, [location, searchNearby]);

    const handleManualSearch = (e) => {
        e.preventDefault();
        const parts = manualLocation.split(",").map((s) => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) setLocation({ lat: parts[0], lng: parts[1] });
        else setLocationError("Enter coordinates as: lat, lng");
    };

    const openDetails = async (placeId) => {
        setDetailLoading(true); setSelectedPlace(null);
        try { setSelectedPlace(await api.getPlaceDetails(placeId)); } catch { }
        finally { setDetailLoading(false); }
    };

    const handleImport = async (placeId) => {
        if (!user) { router.push("/login"); return; }
        setImporting(true);
        try { const result = await api.importPlace(placeId); router.push(`/food-logs/new?restaurant_id=${result.restaurant_id}`); }
        catch (err) { alert(err.message || "Failed to import"); }
        finally { setImporting(false); }
    };

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Nearby</h1>
                <p className="page-subtitle">Find restaurants around you</p>
            </div>

            {!location && (
                <div className="location-prompt">
                    <div className="location-prompt-icon">📍</div>
                    {locating ? (
                        <><div className="location-prompt-text">Finding your location...</div><div className="spinner" style={{ margin: "14px auto" }} /></>
                    ) : (
                        <>
                            {locationError && <div className="location-prompt-error">{locationError}</div>}
                            <button onClick={requestGeolocation} className="btn btn-primary" style={{ marginBottom: 14 }}>Enable Location</button>
                            <div className="location-divider"><span>or enter manually</span></div>
                            <form onSubmit={handleManualSearch} className="location-manual">
                                <input id="manual-location-input" className="form-input" placeholder="e.g. 12.97, 77.59" value={manualLocation} onChange={(e) => setManualLocation(e.target.value)} />
                                <button type="submit" className="btn btn-secondary btn-sm">Go</button>
                            </form>
                        </>
                    )}
                </div>
            )}

            {location && (
                <div className="nearby-controls">
                    <div className="nearby-radius-group">
                        <label className="form-label">Radius</label>
                        <div className="radius-pills">
                            {RADIUS_OPTIONS.map((opt) => (
                                <button key={opt.value} className={`radius-pill ${radius === opt.value ? "active" : ""}`} onClick={() => setRadius(opt.value)}>{opt.label}</button>
                            ))}
                        </div>
                    </div>
                    <button onClick={searchNearby} className="btn btn-primary btn-sm" disabled={loading}>{loading ? "..." : "Refresh"}</button>
                </div>
            )}

            {loading && <div className="loading"><div className="spinner" /></div>}

            {!loading && searched && restaurants.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-text">No restaurants nearby</div>
                    <div className="empty-state-sub">Try increasing the search radius</div>
                </div>
            )}

            {!loading && restaurants.length > 0 && (
                <div className="nearby-grid">
                    {restaurants.map((r) => (
                        <div key={r.place_id} className="nearby-card" onClick={() => openDetails(r.place_id)}>
                            <div className="nearby-card-photo">
                                {r.photo_url ? <img src={r.photo_url} alt={r.name} loading="lazy" /> : <div className="nearby-card-no-photo">🍽️</div>}
                                <div className="nearby-card-overlay"><StatusBadge isOpen={r.is_open_now} /></div>
                            </div>
                            <div className="nearby-card-body">
                                <div className="nearby-card-name">{r.name}</div>
                                <div className="nearby-card-meta">
                                    <CuisineTag label={r.cuisine_type} />
                                    {r.price_level && <span className="nearby-price">{r.price_level}</span>}
                                </div>
                                <div className="nearby-card-detail-row">
                                    {r.rating && (
                                        <div className="nearby-rating-row">
                                            <RatingDots rating={Math.round(r.rating)} />
                                            <span className="nearby-rating-count">{r.rating}</span>
                                        </div>
                                    )}
                                    {location && r.lat && <span className="nearby-distance">{formatDist(distance(location.lat, location.lng, r.lat, r.lng))}</span>}
                                </div>
                                <div className="nearby-card-address">{r.address}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(selectedPlace || detailLoading) && (
                <div className="detail-backdrop" onClick={() => !detailLoading && setSelectedPlace(null)}>
                    <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
                        {detailLoading ? (
                            <div className="loading" style={{ padding: 40 }}><div className="spinner" /></div>
                        ) : selectedPlace && (
                            <>
                                <button className="detail-close" onClick={() => setSelectedPlace(null)} aria-label="Close">✕</button>
                                {selectedPlace.photos?.length > 0 && (
                                    <div className="detail-photos">
                                        {selectedPlace.photos.slice(0, 3).map((url, i) => <img key={i} src={url} alt={`${selectedPlace.name} ${i + 1}`} loading="lazy" />)}
                                    </div>
                                )}
                                <div className="detail-body">
                                    <h2 className="detail-name">{selectedPlace.name}</h2>
                                    <div className="detail-badges">
                                        <StatusBadge isOpen={selectedPlace.is_open_now} />
                                        {selectedPlace.rating && <div className="nearby-rating-row"><RatingDots rating={Math.round(selectedPlace.rating)} /><span className="nearby-rating-count">{selectedPlace.rating} ({selectedPlace.user_rating_count})</span></div>}
                                    </div>
                                    {selectedPlace.description && <p className="detail-desc">{selectedPlace.description}</p>}
                                    <div className="detail-info-grid">
                                        {selectedPlace.address && <div className="detail-info-item"><span className="detail-info-icon">📍</span><span>{selectedPlace.address}</span></div>}
                                        {selectedPlace.phone && <div className="detail-info-item"><span className="detail-info-icon">📞</span><a href={`tel:${selectedPlace.phone}`}>{selectedPlace.phone}</a></div>}
                                        {selectedPlace.website && <div className="detail-info-item"><span className="detail-info-icon">🌐</span><a href={selectedPlace.website} target="_blank" rel="noopener noreferrer">Website</a></div>}
                                    </div>
                                    {selectedPlace.opening_hours?.length > 0 && (
                                        <div className="detail-hours">
                                            <h3 className="detail-section-title">Hours</h3>
                                            <ul className="detail-hours-list">{selectedPlace.opening_hours.map((line, i) => <li key={i}>{line}</li>)}</ul>
                                        </div>
                                    )}
                                    {selectedPlace.reviews?.length > 0 && (
                                        <div className="detail-reviews">
                                            <h3 className="detail-section-title">Reviews</h3>
                                            {selectedPlace.reviews.map((rev, i) => (
                                                <div key={i} className="detail-review-item">
                                                    <div className="detail-review-header"><strong style={{ fontWeight: 500 }}>{rev.author}</strong><span className="detail-review-time">{rev.time}</span></div>
                                                    {rev.rating && <RatingDots rating={Math.round(rev.rating)} />}
                                                    <p className="detail-review-text">{rev.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="detail-actions">
                                        <button className="btn btn-primary" onClick={() => handleImport(selectedPlace.place_id)} disabled={importing}>{importing ? "Importing..." : "Import & Review"}</button>
                                        {selectedPlace.website && <a href={selectedPlace.website} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Website</a>}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
