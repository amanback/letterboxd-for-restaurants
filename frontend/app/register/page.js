"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register(username, email, password);
            router.push("/");
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Join FoodBlog</h1>
                <p className="auth-subtitle">Create your account and start sharing</p>
                {error && <div className="alert alert-error">{error}</div>}
                <form className="form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input id="register-username" type="text" className="form-input" placeholder="foodie_jane"
                            value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input id="register-email" type="email" className="form-input" placeholder="you@example.com"
                            value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input id="register-password" type="password" className="form-input" placeholder="At least 6 characters"
                            value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    </div>
                    <button id="register-submit" type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>
                <p className="auth-link">
                    Already have an account? <Link href="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
