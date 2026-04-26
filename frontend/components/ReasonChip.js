"use client";
export default function ReasonChip({ reason }) {
    if (!reason) return null;
    return <span className="reason-chip">{reason}</span>;
}
