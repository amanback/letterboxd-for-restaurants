"use client";
import { AuthProvider, useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import BottomTabBar from "@/components/BottomTabBar";

function LayoutInner({ children }) {
    const { user } = useAuth();
    return (
        <>
            <Navbar />
            <main>{children}</main>
            <BottomTabBar user={user} />
        </>
    );
}

export default function ClientLayout({ children }) {
    return (
        <AuthProvider>
            <LayoutInner>{children}</LayoutInner>
        </AuthProvider>
    );
}
