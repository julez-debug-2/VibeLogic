/**
 * Next-Auth Configuration with PostgreSQL Adapter
 */

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { Pool } from "@neondatabase/serverless";
import PostgresAdapter from "@auth/pg-adapter";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PostgresAdapter(pool),
    providers: [
        GitHub({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
        Google({
            clientId: process.env.GOOGLE_ID!,
            clientSecret: process.env.GOOGLE_SECRET!,
        }),
    ],
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        async session({ session, user }) {
            if (session.user && user) {
                session.user.id = user.id;
            }
            return session;
        },
    },
});
