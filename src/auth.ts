/* ════════════════════════════════════════════════════════
   Auth.js (NextAuth v5) Configuration
   Google OAuth provider with JWT session
   Links guest reports to Google account on first sign-in
   Role-based resolution for Citizens and Field Workers
   ════════════════════════════════════════════════════════ */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { env } from "@/lib/env";
import { execute, query } from "@/lib/db";
import { generateULID } from "@/lib/ids";
import type { WorkerSessionProfile } from "@/types/auth";

interface DbWorkerRow {
  id: string;
  name: string;
  email: string;
  department_code: string;
  department_name: string;
  zone: string;
  role: string;
  vehicle: string | null;
  status: string;
  is_approved: number;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
    }),
  ],
  secret: env.nextAuthSecret,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider !== "google") return true;

      try {
        const googleId = account.providerAccountId;
        const email = user.email || "";
        const name = user.name || "";
        const avatar = user.image || "";

        // Check if user is a registered field worker
        const workerRows = await query<DbWorkerRow>(
          `SELECT id, name, email, department_code, department_name, zone, role, vehicle, status, is_approved
           FROM workers
           WHERE LOWER(email) = LOWER(?)
           LIMIT 1`,
          [email]
        ).catch(() => []);

        if (workerRows.length > 0) {
          // Worker exists — update their avatar if missing or changed
          await execute(
            `UPDATE workers SET avatar = ?, updated_at = NOW() WHERE LOWER(email) = LOWER(?)`,
            [avatar, email]
          ).catch(() => {});
        }

        // Upsert citizen record as fallback / dual identity
        const existing = await query<{ id: string; guest_id: string | null }>(
          `SELECT id, guest_id FROM citizens WHERE google_id = ? LIMIT 1`,
          [googleId]
        ).catch(() => []);

        if (existing.length === 0) {
          // New Google user — create citizen record
          await execute(
            `INSERT INTO citizens (id, google_id, email, name, avatar_url)
             VALUES (?, ?, ?, ?, ?)`,
            [generateULID(), googleId, email, name, avatar]
          ).catch((err: unknown) => {
            console.warn("[Auth] Failed to create citizen:", err);
          });
        } else {
          // Update existing
          await execute(
            `UPDATE citizens SET email = ?, name = ?, avatar_url = ?, updated_at = NOW()
             WHERE google_id = ?`,
            [email, name, avatar, googleId]
          ).catch(() => {});
        }
      } catch (err) {
        console.warn("[Auth] signIn callback error:", err);
      }

      return true;
    },

    async jwt({ token, account, user }) {
      if (account) {
        token.googleId = account.providerAccountId;
        token.provider = account.provider;
      }
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      // Query database for worker role resolution
      if (token.email) {
        try {
          const workerRows = await query<DbWorkerRow>(
            `SELECT id, name, email, department_code, department_name, zone, role, vehicle, status, is_approved
             FROM workers
             WHERE LOWER(email) = LOWER(?)
             LIMIT 1`,
            [token.email]
          );

          if (workerRows.length > 0) {
            const w = workerRows[0];
            token.role = "WORKER";
            token.workerProfile = {
              id: w.id,
              name: w.name,
              email: w.email,
              departmentCode: w.department_code,
              departmentName: w.department_name,
              zone: w.zone,
              role: w.role,
              vehicle: w.vehicle,
              isApproved: Boolean(w.is_approved),
            };
          } else {
            token.role = "CITIZEN";
            token.workerProfile = null;
          }
        } catch (err) {
          console.warn("[Auth] Worker check error in jwt:", err);
          token.role = "CITIZEN";
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.googleId = token.googleId as string;
        session.user.provider = token.provider as string;
        session.user.role = (token.role as "CITIZEN" | "WORKER" | "ADMIN") || "CITIZEN";
        session.user.workerProfile = (token.workerProfile as WorkerSessionProfile) || null;
      }
      return session;
    },
  },
});
