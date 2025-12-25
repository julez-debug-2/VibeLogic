/**
 * API Routes for individual Flow operations
 */

import { auth } from "@/lib/auth";
import { sql } from "@vercel/postgres";
import { NextRequest } from "next/server";

// GET /api/flows/[id] - Get single flow
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { rows } = await sql`
            SELECT id, title, description, nodes, edges, created_at, updated_at
            FROM flows
            WHERE id = ${id} AND user_id = ${session.user.id}
        `;

        if (rows.length === 0) {
            return Response.json({ error: "Flow not found" }, { status: 404 });
        }

        return Response.json({ flow: rows[0] });
    } catch (error) {
        console.error("GET /api/flows/[id] error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/flows/[id] - Update flow
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { title, description, nodes, edges } = await request.json();

        const { rows } = await sql`
            UPDATE flows
            SET 
                title = COALESCE(${title}, title),
                description = COALESCE(${description}, description),
                nodes = COALESCE(${nodes ? JSON.stringify(nodes) : null}::jsonb, nodes),
                edges = COALESCE(${edges ? JSON.stringify(edges) : null}::jsonb, edges)
            WHERE id = ${id} AND user_id = ${session.user.id}
            RETURNING id, title, description, created_at, updated_at
        `;

        if (rows.length === 0) {
            return Response.json({ error: "Flow not found" }, { status: 404 });
        }

        return Response.json({ flow: rows[0] });
    } catch (error) {
        console.error("PUT /api/flows/[id] error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/flows/[id] - Delete flow
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { rowCount } = await sql`
            DELETE FROM flows
            WHERE id = ${id} AND user_id = ${session.user.id}
        `;

        if (rowCount === 0) {
            return Response.json({ error: "Flow not found" }, { status: 404 });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/flows/[id] error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
