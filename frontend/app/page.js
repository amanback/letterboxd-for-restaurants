"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Link from "next/link";
import RatingDots from "@/components/RatingDots";
import CuisineTag from "@/components/CuisineTag";

function timeAgo(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function FoodCard({ log, style }) {
    return (
        <div className="card fade-up" style={style}>
            {log.photos && log.photos.length > 0 && (
                <div className="food-card-photos" style={{ margin: "-20px -20px 16px", borderRadius: "16px 16px 0 0", overflow: "hidden" }}>
                    <img
                        src={log.photos[0].startsWith("http") ? log.photos[0] : `http://localhost:8000${log.photos[0]}`}
                        alt={log.dish_name}
                        style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 0 }}
                    />
                </div>
            )}
            <div className="food-card-header">
                <div className="food-card-user">
                    <Link href={log.user_id ? `/users/${log.user_id}` : "#"} className="user-avatar" style={{ textDecoration: "none" }}>
                        {(log.username || "?")[0].toUpperCase()}
                    </Link>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <Link href={log.user_id ? `/users/${log.user_id}` : "#"} className="user-name" style={{ textDecoration: "none" }}>{log.username || "User"}</Link>
                        {log.restaurant_name && (
                            <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{log.restaurant_name}</span>
                        )}
                    </div>
                </div>
                <span className="food-card-time">{timeAgo(log.created_at)}</span>
            </div>
            <div className="food-card-dish">{log.dish_name}</div>
            <CuisineTag label={log.cuisine_tag} />
            <div style={{ margin: "8px 0" }}>
                <RatingDots rating={Math.round(log.rating)} />
            </div>
            {log.review_text && (
                <p className="food-card-review">{log.review_text}</p>
            )}
            <div className="food-card-actions">
                <span>♡ 0</span>
                <span>💬 0</span>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="card">
            <div className="skeleton" style={{ height: 200, margin: "-20px -20px 16px", borderRadius: "16px 16px 0 0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%" }} />
                <div className="skeleton" style={{ width: 100, height: 14 }} />
            </div>
            <div className="skeleton" style={{ width: "60%", height: 18, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: "40%", height: 12 }} />
        </div>
    );
}

export default function FeedPage() {
    const { user, loading: authLoading } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const wsRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        api.getFeed()
            .then(setLogs)
            .catch(console.error)
            .finally(() => setLoading(false));

        const token = localStorage.getItem("token");
        if (token) {
            const wsUrl = `ws://localhost:8000/feed/ws?token=${token}`;
            const ws = new WebSocket(wsUrl);
            ws.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    if (msg.type === "new_food_log") {
                        setLogs((prev) => [msg.data, ...prev]);
                    }
                } catch { }
            };
            wsRef.current = ws;
        }

        return () => { if (wsRef.current) wsRef.current.close(); };
    }, [user]);

    // Scroll animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
            { threshold: 0.1 }
        );
        document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [logs]);

    if (authLoading) return (
        <div className="container">
            <div style={{ marginBottom: 28 }}>
                <div className="skeleton" style={{ width: 120, height: 22, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: 200, height: 13 }} />
            </div>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
    );

    if (!user) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: "center" }}>
                    <h1 className="auth-title">FoodBlog</h1>
                    <p className="auth-subtitle">
                        Share your dining experiences, discover restaurants, and connect with food lovers.
                    </p>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                        <Link href="/login" className="btn btn-secondary">Login</Link>
                        <Link href="/register" className="btn btn-primary">Get Started</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) return (
        <div className="container">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
    );

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Your Feed</h1>
                <p className="page-subtitle">See what your friends have been eating</p>
            </div>

            {logs.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-text">Your feed is empty</div>
                    <div className="empty-state-sub">Follow some foodies or create your first food log</div>
                    <Link href="/food-logs/new" className="btn btn-primary">Create Food Log</Link>
                </div>
            ) : (
                <div className="card-grid">
                    {logs.map((log, i) => (
                        <FoodCard key={log.id} log={log} style={{ transitionDelay: `${i * 60}ms` }} />
                    ))}
                </div>
            )}
        </div>
    );
}
