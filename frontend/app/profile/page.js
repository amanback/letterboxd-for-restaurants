"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

function LogCard({ log }) {
    return (
        <div className="card profile-log-card">
            {log.photos && log.photos.length > 0 && (
                <div style={{ margin: "-20px -20px 14px", borderRadius: "16px 16px 0 0", overflow: "hidden" }}>
                    <img
                        src={log.photos[0].startsWith("http") ? log.photos[0] : `http://localhost:8000${log.photos[0]}`}
                        alt={log.dish_name}
                        style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }}
                    />
                </div>
            )}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div>
                    <div className="food-card-dish" style={{ marginBottom: 4 }}>{log.dish_name}</div>
                    <CuisineTag label={log.cuisine_tag} />
                    <div style={{ margin: "8px 0" }}>
                        <RatingDots rating={Math.round(log.rating)} />
                    </div>
                    {log.review_text && (
                        <p className="food-card-review">{log.review_text}</p>
                    )}
                </div>
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {log.restaurant_name || "Unknown place"}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{timeAgo(log.created_at)}</span>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [stats, setStats] = useState({ following: 0, followers: 0 });

    useEffect(() => {
        if (!user) return;
        Promise.all([
            api.getUserFoodLogs(user.id).catch(() => []),
            api.getFollowing(user.id).catch(() => []),
            api.getFollowers(user.id).catch(() => []),
        ]).then(([logList, followingList, followerList]) => {
            setLogs(logList);
            setStats({ following: followingList.length, followers: followerList.length });
        }).finally(() => setLoadingLogs(false));
    }, [user]);

    if (authLoading) return <div className="container"><div className="loading"><div className="spinner" /></div></div>;

    if (!user) {
        router.push("/login");
        return null;
    }

    return (
        <div className="container">
            {/* Profile Header */}
            <div className="profile-header">
                <div className="profile-avatar-lg">
                    {(user.username || "?")[0].toUpperCase()}
                </div>
                <h1 className="profile-username">@{user.username}</h1>
                {user.bio && <p className="profile-bio">{user.bio}</p>}

                <div className="profile-stats">
                    <div className="profile-stat">
                        <span className="profile-stat-value">{logs.length}</span>
                        <span className="profile-stat-label">Logs</span>
                    </div>
                    <div className="profile-stat-divider" />
                    <div className="profile-stat">
                        <span className="profile-stat-value">{stats.following}</span>
                        <span className="profile-stat-label">Following</span>
                    </div>
                    <div className="profile-stat-divider" />
                    <div className="profile-stat">
                        <span className="profile-stat-value">{stats.followers}</span>
                        <span className="profile-stat-label">Followers</span>
                    </div>
                </div>

                <div className="profile-actions">
                    <Link href="/food-logs/new" className="btn btn-primary btn-sm">+ New Log</Link>
                    <button onClick={logout} className="btn btn-secondary btn-sm">Sign Out</button>
                </div>
            </div>

            {/* Logs */}
            <div style={{ marginTop: 32 }}>
                <div className="profile-section-title">Your Food Logs</div>
                {loadingLogs ? (
                    <div className="loading"><div className="spinner" /></div>
                ) : logs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🍽️</div>
                        <div className="empty-state-text">No logs yet</div>
                        <div className="empty-state-sub">Start by logging your first meal</div>
                        <Link href="/food-logs/new" className="btn btn-primary">Create Food Log</Link>
                    </div>
                ) : (
                    <div className="card-grid">
                        {logs.map((log) => <LogCard key={log.id} log={log} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
