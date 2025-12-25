/**
 * API Routes for Flows CRUD operations
 */

import { auth } from "@/lib/auth";
import { sql } from "@vercel/postgres";
import { NextRequest } from "next/server";

// GET /api/flows - List all flows for current user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { rows } = await sql`
            SELECT id, title, description, created_at, updated_at
            FROM flows
            WHERE user_id = ${session.user.id}
            ORDER BY updated_at DESC
        `;

        return Response.json({ flows: rows });
    } catch (error) {
        console.error("GET /api/flows error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/flows - Create new flow
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, description, nodes, edges } = await request.json();

        const { rows } = await sql`
            INSERT INTO flows (user_id, title, description, nodes, edges)
            VALUES (${session.user.id}, ${title || 'Untitled Flow'}, ${description || ''}, ${JSON.stringify(nodes)}, ${JSON.stringify(edges)})
            RETURNING id, title, description, created_at, updated_at
        `;

        return Response.json({ flow: rows[0] }, { status: 201 });
    } catch (error) {
        console.error("POST /api/flows error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
