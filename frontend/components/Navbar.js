"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const isActive = (path) => path === "/" ? pathname === "/" : pathname.startsWith(path);

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-brand">
                    <span className="brand-text">FoodBlog</span>
                </Link>

                <div className="nav-links">
                    {user ? (
                        <>
                            <Link href="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>Home</Link>
                            <Link href="/nearby" className={`nav-link ${isActive("/nearby") ? "active" : ""}`}>Discover</Link>
                            <Link href="/friends" className={`nav-link ${isActive("/friends") ? "active" : ""}`}>Friends</Link>
                            <Link href="/food-logs/new" className={`nav-link ${isActive("/food-logs/new") ? "active" : ""}`}>+ Log</Link>
                            <div className="nav-user">
                                <Link href="/profile" className="nav-username">{user.username}</Link>
                                <button onClick={logout} className="btn-logout">Sign out</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className={`nav-link ${isActive("/login") ? "active" : ""}`}>Login</Link>
                            <Link href="/register" className="nav-link btn-register">Get Started</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
