"use client";

import { FlowCanvas } from "../components/FlowEditor/FlowCanvas";

export default function Home() {
    return (
        <main className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">
                Logic Flow Editor
            </h1>

            <p className="text-gray-600 mb-6">
                Skizziere deine Logik visuell mit Nodes und Verbindungen.
            </p>

            <FlowCanvas />
        </main>
    );
}
