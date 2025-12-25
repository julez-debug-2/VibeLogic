"use client";

import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { FlowCanvas } from "../components/FlowEditor/FlowCanvas";

function HomeContent() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">Lade...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 gap-6">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Logic2Vibe</h1>
                    <p className="text-gray-600">Logik statt Text • Klarheit statt Chaos</p>
                </div>
                <button
                    onClick={() => signIn("github")}
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                >
                    Mit GitHub anmelden
                </button>
            </div>
        );
    }

    return (
        <main className="h-screen w-screen overflow-hidden relative">
            <div className="absolute top-4 right-4 z-10 flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow">
                <span className="text-sm text-gray-600">{session.user?.email}</span>
                <button
                    onClick={() => signOut()}
                    className="text-sm text-red-600 hover:text-red-800"
                >
                    Abmelden
                </button>
            </div>
            <FlowCanvas />
        </main>
    );
}

export default function Home() {
    return (
        <SessionProvider>
            <HomeContent />
        </SessionProvider>
    );
}
