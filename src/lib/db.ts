/* ════════════════════════════════════════════════════════
   TiDB Database Connection
   MySQL2 connection pool with TLS for TiDB Cloud
   ════════════════════════════════════════════════════════ */

import mysql from "mysql2/promise";
import fs from "fs";
import { env } from "./env";

let pool: mysql.Pool | null = null;

/** Get or create the connection pool */
export function getPool(): mysql.Pool {
  if (pool) return pool;

  // Read TLS CA certificate for TiDB Cloud
  let ssl: mysql.SslOptions | undefined;
  try {
    const caPath = env.databaseSslCaPath;
    if (fs.existsSync(caPath)) {
      ssl = {
        ca: fs.readFileSync(caPath, "utf-8"),
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      };
    } else {
      // On Vercel or when ca file is missing, use Node's built-in CAs
      ssl = {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      };
    }
  } catch (err) {
    console.warn("[DB] Could not load TLS CA cert, connecting without TLS:", err);
  }

  pool = mysql.createPool({
    host: env.databaseHost,
    port: env.databasePort,
    user: env.databaseUser,
    password: env.databasePassword,
    database: env.databaseName,
    ssl,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    timezone: "+00:00",
    charset: "utf8mb4",
  });

  console.log(
    `[DB] Pool created → ${env.databaseHost}:${env.databasePort}/${env.databaseName}`
  );

  return pool;
}

/** Execute a query and return typed rows */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: (string | number | boolean | null | Buffer)[]
): Promise<T[]> {
  const p = getPool();
  const [rows] = await p.execute(sql, params);
  return rows as T[];
}

/** Execute a mutation (INSERT/UPDATE/DELETE) */
export async function execute(
  sql: string,
  params?: (string | number | boolean | null | Buffer)[]
): Promise<mysql.ResultSetHeader> {
  const p = getPool();
  const [result] = await p.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

/** Test database connectivity */
export async function testConnection(): Promise<{
  connected: boolean;
  version?: string;
  error?: string;
}> {
  try {
    const rows = await query<{ version: string }>(
      "SELECT VERSION() as version"
    );
    return {
      connected: true,
      version: rows[0]?.version,
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
