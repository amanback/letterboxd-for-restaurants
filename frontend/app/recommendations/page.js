"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Link from "next/link";
import ReasonChip from "@/components/ReasonChip";
import CuisineTag from "@/components/CuisineTag";

export default function RecommendationsPage() {
    const { user, loading: authLoading } = useAuth();
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        api.getRecommendations(20)
            .then((data) => setRecs(data.recommendations || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    // Scroll animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
            { threshold: 0.1 }
        );
        document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [recs]);

    if (authLoading) return (
        <div className="container">
            {[1, 2, 3].map((i) => (
                <div key={i} className="card" style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <div className="skeleton" style={{ width: 50, height: 20, borderRadius: 999 }} />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ width: "60%", height: 16, marginBottom: 6 }} />
                            <div className="skeleton" style={{ width: "40%", height: 12 }} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    if (!user) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: "center" }}>
                    <p style={{ marginBottom: 16, color: "var(--text-secondary)" }}>Please log in to see recommendations.</p>
                    <Link href="/login" className="btn btn-primary">Login</Link>
                </div>
            </div>
        );
    }

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">For you</h1>
                <p className="page-subtitle">Personalized recommendations based on your taste profile</p>
            </div>

            {recs.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-text">No recommendations yet</div>
                    <div className="empty-state-sub">
                        Log some meals to help us understand your taste preferences
                    </div>
                    <Link href="/food-logs/new" className="btn btn-primary">Create Food Log</Link>
                </div>
            ) : (
                <div className="card-grid">
                    {recs.map((rec, i) => (
                        <Link
                            key={i}
                            href={rec.restaurant_id ? `/restaurants/${rec.restaurant_id}` : "#"}
                            style={{ textDecoration: "none", color: "inherit" }}
                        >
                            <div className="card rec-card fade-up" style={{ transitionDelay: `${i * 60}ms` }}>
                                <div className="rec-score">
                                    {Math.round(rec.score * 100)}%
                                </div>
                                <div className="rec-info">
                                    <div className="rec-name">{rec.restaurant_name || rec.dish_name}</div>
                                    {rec.cuisine && <CuisineTag label={rec.cuisine} />}
                                    <ReasonChip reason={rec.reason} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
