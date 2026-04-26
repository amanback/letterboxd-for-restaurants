"use client";
export default function CuisineTag({ label }) {
    if (!label) return null;
    return <span className="cuisine-tag">{label}</span>;
}
