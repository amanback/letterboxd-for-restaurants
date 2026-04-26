"use client";
export default function AvatarStack({ names = [], max = 3 }) {
    if (!names.length) return null;
    const shown = names.slice(0, max);
    const extra = names.length - max;
    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", marginRight: extra > 0 ? 6 : 0 }}>
                {shown.map((name, i) => (
                    <div
                        key={i}
                        className="user-avatar"
                        style={{
                            width: 28, height: 28, fontSize: 11,
                            marginLeft: i > 0 ? -8 : 0,
                            border: "2px solid #FAFAF8",
                            zIndex: max - i,
                            position: "relative",
                        }}
                    >
                        {(name || "?")[0].toUpperCase()}
                    </div>
                ))}
            </div>
            {extra > 0 && (
                <span style={{ fontSize: 12, color: "#8A8A82", fontWeight: 400 }}>
                    +{extra}
                </span>
            )}
        </div>
    );
}
