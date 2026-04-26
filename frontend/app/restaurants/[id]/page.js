"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import RatingDots from "@/components/RatingDots";
import CuisineTag from "@/components/CuisineTag";

export default function RestaurantDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newReview, setNewReview] = useState({ rating: 5, text: "" });
    const [reviewError, setReviewError] = useState("");

    useEffect(() => {
        Promise.all([api.getRestaurant(id), api.getReviews(id)])
            .then(([r, revs]) => { setRestaurant(r); setReviews(revs); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setReviewError("");
        try {
            const review = await api.createReview(id, newReview);
            setReviews([review, ...reviews]);
            setNewReview({ rating: 5, text: "" });
        } catch (err) { setReviewError(err.message); }
    };

    if (loading) return (
        <div className="container">
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="skeleton" style={{ width: "50%", height: 22, marginBottom: 10 }} />
                <div className="skeleton" style={{ width: "30%", height: 13 }} />
            </div>
        </div>
    );
    if (!restaurant) return <div className="container"><div className="alert alert-error">Restaurant not found</div></div>;

    return (
        <div className="container">
            <div className="card" style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>{restaurant.name}</h1>
                <div className="restaurant-meta">
                    {restaurant.cuisine && <CuisineTag label={restaurant.cuisine} />}
                    {restaurant.location && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>📍 {restaurant.location}</span>}
                    {restaurant.phone && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>📞 {restaurant.phone}</span>}
                </div>
                {restaurant.description && (
                    <p style={{ color: "var(--text-secondary)", marginTop: 12, fontSize: 15 }}>{restaurant.description}</p>
                )}
                {restaurant.website && (
                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer"
                        style={{ color: "var(--accent)", fontSize: 14, marginTop: 8, display: "inline-block" }}>
                        Visit website →
                    </a>
                )}
            </div>

            {user && (
                <div className="card" style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 14, color: "var(--text)" }}>Write a Review</h2>
                    {reviewError && <div className="alert alert-error">{reviewError}</div>}
                    <form className="form" onSubmit={handleSubmitReview}>
                        <div className="form-group">
                            <label className="form-label">Rating</label>
                            <RatingDots rating={newReview.rating} onChange={(r) => setNewReview({ ...newReview, rating: r })} interactive />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Review</label>
                            <textarea className="form-textarea" placeholder="Share your experience..."
                                value={newReview.text} onChange={(e) => setNewReview({ ...newReview, text: e.target.value })} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm">Post Review</button>
                    </form>
                </div>
            )}

            <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 14, color: "var(--text)" }}>
                Reviews ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-text">No reviews yet</div>
                    <div className="empty-state-sub">Be the first to leave a review</div>
                </div>
            ) : (
                <div className="card-grid">
                    {reviews.map((r) => (
                        <div key={r.id} className="card review-card">
                            <div className="review-header">
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                                        {(r.username || "?")[0].toUpperCase()}
                                    </div>
                                    <span style={{ fontWeight: 500, fontSize: 14 }}>{r.username}</span>
                                </div>
                                <RatingDots rating={Math.round(r.rating)} />
                            </div>
                            {r.text && <p className="review-text">{r.text}</p>}
                            {r.owner_reply && (
                                <div className="review-reply">
                                    <div className="review-reply-label">Owner Response</div>
                                    <div className="review-reply-text">{r.owner_reply}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
