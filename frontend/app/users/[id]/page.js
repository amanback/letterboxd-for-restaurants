"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
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
            <div className="food-card-dish" style={{ marginBottom: 4 }}>{log.dish_name}</div>
            <CuisineTag label={log.cuisine_tag} />
            <div style={{ margin: "8px 0" }}>
                <RatingDots rating={Math.round(log.rating)} />
            </div>
            {log.review_text && <p className="food-card-review">{log.review_text}</p>}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{log.restaurant_name || "Unknown place"}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{timeAgo(log.created_at)}</span>
            </div>
        </div>
    );
}

export default function UserProfilePage() {
    const { user: me, loading: authLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const userId = parseInt(params.id);

    const [profile, setProfile] = useState(null);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ following: 0, followers: 0 });
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        if (!me || !userId) return;

        // Redirect to own profile
        if (userId === me.id) {
            router.replace("/profile");
            return;
        }

        Promise.all([
            api.getUser(userId),
            api.getUserFoodLogs(userId).catch(() => []),
            api.getFollowing(userId).catch(() => []),
            api.getFollowers(userId).catch(() => []),
            api.getFollowing(me.id).catch(() => []),
        ]).then(([profileData, logList, followingList, followerList, myFollowing]) => {
            setProfile(profileData);
            setLogs(logList);
            setStats({ following: followingList.length, followers: followerList.length });
            setIsFollowing(myFollowing.some((u) => u.id === userId));
        }).catch(console.error).finally(() => setLoading(false));
    }, [me, userId]);

    const handleToggleFollow = async () => {
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await api.unfollowUser(userId);
                setIsFollowing(false);
                setStats((s) => ({ ...s, followers: s.followers - 1 }));
            } else {
                await api.followUser(userId);
                setIsFollowing(true);
                setStats((s) => ({ ...s, followers: s.followers + 1 }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setFollowLoading(false);
        }
    };

    if (authLoading || loading) return <div className="container"><div className="loading"><div className="spinner" /></div></div>;

    if (!profile) return (
        <div className="container">
            <div className="empty-state">
                <div className="empty-state-icon">👤</div>
                <div className="empty-state-text">User not found</div>
                <Link href="/friends" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>← Back to Friends</Link>
            </div>
        </div>
    );

    return (
        <div className="container">
            {/* Back */}
            <Link href="/friends" className="profile-back-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                    <path d="M19 12H5M12 5l-7 7 7 7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to Friends
            </Link>

            {/* Profile Header */}
            <div className="profile-header">
                <div className="profile-avatar-lg">
                    {(profile.username || "?")[0].toUpperCase()}
                </div>
                <h1 className="profile-username">@{profile.username}</h1>
                {profile.bio && <p className="profile-bio">{profile.bio}</p>}

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
                    <button
                        className={`btn btn-sm ${isFollowing ? "btn-secondary" : "btn-primary"}`}
                        onClick={handleToggleFollow}
                        disabled={followLoading}
                        id="follow-toggle-btn"
                    >
                        {followLoading ? "…" : isFollowing ? "Unfollow" : "Follow"}
                    </button>
                </div>
            </div>

            {/* Logs */}
            <div style={{ marginTop: 32 }}>
                <div className="profile-section-title">{profile.username}'s Food Logs</div>
                {logs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🍽️</div>
                        <div className="empty-state-text">No logs yet</div>
                        <div className="empty-state-sub">{profile.username} hasn't logged any meals</div>
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
