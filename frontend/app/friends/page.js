"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

function UserCard({ person, currentUserId, isFollowing, onToggleFollow }) {
    const [loading, setLoading] = useState(false);

    const handleFollow = async () => {
        setLoading(true);
        try {
            await onToggleFollow(person.id, isFollowing);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="friend-card">
            <Link href={`/users/${person.id}`} className="friend-card-left">
                <div className="friend-avatar">
                    {(person.username || "?")[0].toUpperCase()}
                </div>
                <div className="friend-info">
                    <div className="friend-username">@{person.username}</div>
                    {person.bio && <div className="friend-bio">{person.bio}</div>}
                </div>
            </Link>
            {person.id !== currentUserId && (
                <button
                    className={`btn btn-sm ${isFollowing ? "btn-secondary" : "btn-primary"}`}
                    onClick={handleFollow}
                    disabled={loading}
                >
                    {loading ? "..." : isFollowing ? "Unfollow" : "Follow"}
                </button>
            )}
        </div>
    );
}

export default function FriendsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const [following, setFollowing] = useState([]);
    const [followingIds, setFollowingIds] = useState(new Set());
    const [loadingFollowing, setLoadingFollowing] = useState(true);

    const [activeTab, setActiveTab] = useState("following"); // "following" | "search"

    // Load who current user is following
    useEffect(() => {
        if (!user) return;
        api.getFollowing(user.id)
            .then((list) => {
                setFollowing(list);
                setFollowingIds(new Set(list.map((u) => u.id)));
            })
            .catch(console.error)
            .finally(() => setLoadingFollowing(false));
    }, [user]);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await api.searchUsers(query);
                setSearchResults(res);
            } catch (e) {
                console.error(e);
            } finally {
                setSearching(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [query]);

    const handleToggleFollow = useCallback(async (targetId, currently) => {
        if (currently) {
            await api.unfollowUser(targetId);
            setFollowingIds((prev) => { const n = new Set(prev); n.delete(targetId); return n; });
            setFollowing((prev) => prev.filter((u) => u.id !== targetId));
        } else {
            await api.followUser(targetId);
            setFollowingIds((prev) => new Set([...prev, targetId]));
            // Add to following list if we have the user object
            const fromSearch = searchResults.find((u) => u.id === targetId);
            if (fromSearch) setFollowing((prev) => [fromSearch, ...prev]);
        }
    }, [searchResults]);

    if (authLoading) return <div className="container"><div className="loading"><div className="spinner" /></div></div>;

    if (!user) {
        router.push("/login");
        return null;
    }

    const displayList = query.trim() ? searchResults : following;
    const isSearchMode = !!query.trim();

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Friends</h1>
                <p className="page-subtitle">Search and connect with other food lovers</p>
            </div>

            {/* Search Bar */}
            <div className="friends-search">
                <div className="friends-search-wrap">
                    <svg className="friends-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" strokeWidth="1.5" />
                        <path d="M21 21l-4.35-4.35" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                        id="friends-search-input"
                        className="form-input friends-search-input"
                        type="text"
                        placeholder="Search by username…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoComplete="off"
                    />
                    {query && (
                        <button className="friends-search-clear" onClick={() => setQuery("")}>✕</button>
                    )}
                </div>
            </div>

            {/* Tab label */}
            {!isSearchMode && (
                <div className="friends-section-label">
                    Following · {following.length}
                </div>
            )}
            {isSearchMode && (
                <div className="friends-section-label">
                    {searching ? "Searching…" : `Results · ${searchResults.length}`}
                </div>
            )}

            {/* List */}
            <div className="friends-list">
                {!isSearchMode && loadingFollowing ? (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="friend-card">
                            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ width: 120, height: 14, marginBottom: 6 }} />
                                <div className="skeleton" style={{ width: 80, height: 12 }} />
                            </div>
                        </div>
                    ))
                ) : displayList.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">{isSearchMode ? "🔍" : "👥"}</div>
                        <div className="empty-state-text">
                            {isSearchMode ? "No users found" : "You're not following anyone yet"}
                        </div>
                        <div className="empty-state-sub">
                            {isSearchMode
                                ? "Try a different username"
                                : "Search for food lovers above to get started"}
                        </div>
                    </div>
                ) : (
                    displayList.map((person) => (
                        <UserCard
                            key={person.id}
                            person={person}
                            currentUserId={user.id}
                            isFollowing={followingIds.has(person.id)}
                            onToggleFollow={handleToggleFollow}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
