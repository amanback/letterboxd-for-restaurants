"use client";
import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import RatingDots from "@/components/RatingDots";
import ComposerProgress from "@/components/ComposerProgress";

const CUISINE_OPTIONS = ["Italian", "Japanese", "Mexican", "Indian", "Chinese", "Thai", "Korean", "American", "French", "Mediterranean"];

export default function NewFoodLogPage() {
    const { user } = useAuth();
    const router = useRouter();
    const fileRef = useRef(null);

    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        dish_name: "", restaurant_id: "", rating: 5, review_text: "", cuisine_tag: "",
    });
    const [photos, setPhotos] = useState([]);
    const [photoUrls, setPhotoUrls] = useState([]);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            try {
                const res = await api.uploadFile(file);
                setPhotoUrls((prev) => [...prev, res.url]);
                const preview = URL.createObjectURL(file);
                setPhotos((prev) => [...prev, preview]);
                if (!photoPreview) setPhotoPreview(preview);
            } catch (err) {
                setError("Failed to upload photo");
            }
        }
    };

    const handleSubmit = async () => {
        setError("");
        setLoading(true);
        try {
            await api.createFoodLog({
                dish_name: form.dish_name,
                restaurant_id: form.restaurant_id ? parseInt(form.restaurant_id) : null,
                rating: parseFloat(form.rating),
                review_text: form.review_text,
                cuisine_tag: form.cuisine_tag,
                photos: photoUrls,
            });
            router.push("/");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: "center" }}>
                    <p style={{ color: "var(--text-secondary)" }}>Please log in to create a food log.</p>
                </div>
            </div>
        );
    }

    const canNext = step === 0 ? true : step === 1 ? form.dish_name.trim() : true;

    return (
        <div className="composer-overlay">
            <ComposerProgress currentStep={step} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 0" }}>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => step === 0 ? router.back() : setStep(step - 1)}
                    style={{ minWidth: 60 }}
                >
                    {step === 0 ? "Cancel" : "Back"}
                </button>
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 400 }}>
                    {step === 0 ? "Photo" : step === 1 ? "Details" : "Review"}
                </span>
                {step < 2 ? (
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setStep(step + 1)}
                        disabled={!canNext}
                        style={{ minWidth: 60 }}
                    >
                        Next
                    </button>
                ) : (
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleSubmit}
                        disabled={loading || !form.dish_name.trim()}
                        style={{ minWidth: 60 }}
                    >
                        {loading ? "Posting..." : "Post"}
                    </button>
                )}
            </div>

            <div className="composer-body">
                {error && <div className="alert alert-error">{error}</div>}

                {step === 0 && (
                    <div>
                        <div
                            className={`composer-upload-zone ${photoPreview ? "has-photo" : ""}`}
                            onClick={() => fileRef.current?.click()}
                        >
                            {photoPreview ? (
                                <img src={photoPreview} alt="Food photo" />
                            ) : (
                                <div>
                                    <div style={{ fontSize: 20, marginBottom: 8, color: "var(--text-muted)" }}>📷</div>
                                    <div style={{ fontSize: 15, color: "var(--text-secondary)" }}>Tap to add a photo</div>
                                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                                        or drag and drop
                                    </div>
                                </div>
                            )}
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                            />
                        </div>
                        {photos.length > 1 && (
                            <div className="photo-preview" style={{ marginTop: 12 }}>
                                {photos.map((url, i) => (
                                    <img key={i} src={url} alt={`photo-${i}`} onClick={() => setPhotoPreview(url)} style={{ cursor: "pointer", opacity: photoPreview === url ? 1 : 0.6 }} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step === 1 && (
                    <div className="form">
                        <div className="form-group">
                            <label className="form-label">Dish name</label>
                            <input
                                name="dish_name" type="text" className="form-input"
                                placeholder="e.g. Margherita Pizza"
                                value={form.dish_name} onChange={handleChange}
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Restaurant</label>
                            <input
                                name="restaurant_id" type="text" className="form-input"
                                placeholder="Search restaurants..."
                                value={form.restaurant_id} onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Rating</label>
                            <RatingDots
                                rating={form.rating}
                                onChange={(r) => setForm({ ...form, rating: r })}
                                interactive
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="form">
                        <div className="form-group">
                            <label className="form-label">Review</label>
                            <textarea
                                name="review_text" className="form-textarea"
                                placeholder="Tell us about your experience..."
                                value={form.review_text} onChange={handleChange}
                                style={{ minHeight: 140 }}
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cuisine</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {CUISINE_OPTIONS.map((c) => (
                                    <button
                                        key={c} type="button"
                                        className={`cuisine-tag`}
                                        onClick={() => setForm({ ...form, cuisine_tag: form.cuisine_tag === c ? "" : c })}
                                        style={{
                                            cursor: "pointer", border: "0.5px solid var(--border)",
                                            background: form.cuisine_tag === c ? "var(--accent)" : "rgba(0,0,0,0.04)",
                                            color: form.cuisine_tag === c ? "white" : "var(--text-secondary)",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
