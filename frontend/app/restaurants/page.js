"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Link from "next/link";
import CuisineTag from "@/components/CuisineTag";

export default function RestaurantsPage() {
    const { user } = useAuth();
    const [restaurants, setRestaurants] = useState([]);
    const [search, setSearch] = useState("");
    const [cuisine, setCuisine] = useState("");
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newRest, setNewRest] = useState({ name: "", cuisine: "", location: "", description: "" });
    const [addError, setAddError] = useState("");

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.q = search;
            if (cuisine) params.cuisine = cuisine;
            const data = await api.getRestaurants(params);
            setRestaurants(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchRestaurants(); }, []);

    const handleSearch = (e) => { e.preventDefault(); fetchRestaurants(); };

    const handleAdd = async (e) => {
        e.preventDefault();
        setAddError("");
        try {
            await api.createRestaurant(newRest);
            setShowAdd(false);
            setNewRest({ name: "", cuisine: "", location: "", description: "" });
            fetchRestaurants();
        } catch (err) { setAddError(err.message); }
    };

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">Discover</h1>
                <p className="page-subtitle">Find your next favorite dining spot</p>
            </div>

            <form onSubmit={handleSearch} className="search-bar">
                <input id="restaurant-search" className="form-input" placeholder="Search restaurants..."
                    value={search} onChange={(e) => setSearch(e.target.value)} />
                <input className="form-input" placeholder="Cuisine" value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)} style={{ maxWidth: 160 }} />
                <button type="submit" className="btn btn-primary btn-sm">Search</button>
            </form>

            {user && (
                <div style={{ marginBottom: 20 }}>
                    <button onClick={() => setShowAdd(!showAdd)} className="btn btn-secondary btn-sm">
                        {showAdd ? "Cancel" : "+ Add Restaurant"}
                    </button>
                </div>
            )}

            {showAdd && (
                <div className="card" style={{ marginBottom: 20 }}>
                    {addError && <div className="alert alert-error">{addError}</div>}
                    <form className="form" onSubmit={handleAdd}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input className="form-input" placeholder="Restaurant name" value={newRest.name}
                                    onChange={(e) => setNewRest({ ...newRest, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cuisine</label>
                                <input className="form-input" placeholder="e.g. Italian" value={newRest.cuisine}
                                    onChange={(e) => setNewRest({ ...newRest, cuisine: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <input className="form-input" placeholder="e.g. Downtown" value={newRest.location}
                                    onChange={(e) => setNewRest({ ...newRest, location: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input className="form-input" placeholder="Brief description" value={newRest.description}
                                    onChange={(e) => setNewRest({ ...newRest, description: e.target.value })} />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm">Add Restaurant</button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="card-grid">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card" style={{ padding: 16 }}>
                            <div className="skeleton" style={{ width: "50%", height: 16, marginBottom: 6 }} />
                            <div className="skeleton" style={{ width: "30%", height: 12 }} />
                        </div>
                    ))}
                </div>
            ) : restaurants.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-text">No restaurants found</div>
                    <div className="empty-state-sub">Try a different search or add a new restaurant</div>
                </div>
            ) : (
                <div className="card-grid">
                    {restaurants.map((r) => (
                        <Link href={`/restaurants/${r.id}`} key={r.id} style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="card restaurant-card">
                                <div className="restaurant-name">{r.name}</div>
                                <div className="restaurant-meta">
                                    {r.cuisine && <CuisineTag label={r.cuisine} />}
                                    {r.location && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>📍 {r.location}</span>}
                                </div>
                                {r.description && <p className="restaurant-desc">{r.description}</p>}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
