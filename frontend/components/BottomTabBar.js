"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomTabBar({ user }) {
    const pathname = usePathname();
    const isActive = (path) => pathname === path || pathname.startsWith(path + "/");

    if (!user) return null;

    return (
        <nav className="bottom-tab-bar">
            {/* Home */}
            <Link href="/" className={`tab-item ${pathname === "/" ? "active" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Home</span>
            </Link>

            {/* Discover */}
            <Link href="/nearby" className={`tab-item ${isActive("/nearby") ? "active" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Discover</span>
            </Link>

            {/* Compose FAB */}
            <Link href="/food-logs/new">
                <button className="tab-compose" aria-label="New log">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </Link>

            {/* Friends */}
            <Link href="/friends" className={`tab-item ${isActive("/friends") ? "active" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Friends</span>
            </Link>

            {/* Profile */}
            <Link href="/profile" className={`tab-item ${isActive("/profile") ? "active" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Profile</span>
            </Link>
        </nav>
    );
}
