"use client";

export default function RatingDots({ rating, onChange, interactive = false }) {
    return (
        <div className="rating-dots">
            {[1, 2, 3, 4, 5].map((n) => (
                <span
                    key={n}
                    className={`rating-dot ${n <= rating ? "filled" : ""} ${interactive ? "interactive" : ""}`}
                    onClick={interactive && onChange ? () => onChange(n) : undefined}
                    role={interactive ? "button" : undefined}
                    aria-label={interactive ? `Rate ${n}` : undefined}
                />
            ))}
        </div>
    );
}
