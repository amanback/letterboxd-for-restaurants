"use client";
export default function ComposerProgress({ currentStep, totalSteps = 3 }) {
    return (
        <div className="composer-progress">
            {Array.from({ length: totalSteps }, (_, i) => (
                <div
                    key={i}
                    className={`composer-progress-segment ${i < currentStep ? "done" : ""} ${i === currentStep ? "active" : ""}`}
                />
            ))}
        </div>
    );
}
