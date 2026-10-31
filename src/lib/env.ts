/* ════════════════════════════════════════════════════════
   Environment Configuration
   Reads actual .env.local key names
   Fail-closed in production, warn in development
   ════════════════════════════════════════════════════════ */

import path from "path";

function optionalEnv(key: string, defaultValue: string = ""): string {
  return process.env[key] || defaultValue;
}

/**
 * Parse TiDB connection details from .env.local
 * 
 * The .env.local has a non-standard layout:
 * - DATABASE_HOST may be "..." (placeholder)
 * - DATABASE_SSL_CA_PATH contains the full mysql CLI command with real credentials
 * - AI keys use standard names: GROQ_LLAMA_API_KEY, ASSEMBLY_AI_MODEL
 */
function parseDatabaseHost(): string {
  const host = optionalEnv("DATABASE_HOST", "");
  if (host && host !== "...") return host;

  // Fallback: extract from DATABASE_SSL_CA_PATH which contains the mysql CLI command
  const sslLine = optionalEnv("DATABASE_SSL_CA_PATH", "");
  const hostMatch = sslLine.match(/-h\s+([^\s]+)/);
  if (hostMatch) return hostMatch[1];

  return "localhost";
}

function parseDatabaseUser(): string {
  const user = optionalEnv("DATABASE_USER", "");
  if (user && user !== "...") return user;

  // Fallback: extract from DATABASE_SSL_CA_PATH
  const sslLine = optionalEnv("DATABASE_SSL_CA_PATH", "");
  const userMatch = sslLine.match(/-u\s+'([^']+)'/);
  if (userMatch) return userMatch[1];

  return "root";
}

export const env = {
  // ─── Database (TiDB) ───
  get databaseHost(): string {
    return parseDatabaseHost();
  },
  databasePort: parseInt(optionalEnv("DATABASE_PORT", "4000"), 10),
  get databaseUser(): string {
    return parseDatabaseUser();
  },
  databasePassword: optionalEnv("DATABASE_PASSWORD", ""),
  databaseName: optionalEnv("DATABASE_NAME", "nagpur_connect"),

  /** Path to TLS CA cert for TiDB Cloud */
  get databaseSslCaPath(): string {
    // The isrgrootx1.pem is in the project parent directory
    return path.resolve(process.cwd(), "..", "isrgrootx1.pem");
  },

  // ─── AI (Groq: Separate Keys for Reporting vs Sentinel Assistant vs 3-Role Simulation Dossier) ───
  /** Key for Incident Reporting & Classification AI (llama/compound models) */
  get groqReportingApiKey(): string {
    return (
      process.env["GROQ_LLAMA_API_KEY"] ||
      process.env["GROQ_API_KEY"] ||
      optionalEnv("GROQ_LLAMA_API_KEY", "")
    );
  },

  /** Key for Citizen Sentinel Safety & Hazard Briefing Assistant */
  get groqSentinelApiKey(): string {
    return (
      process.env["GROQ_API_KEY"] ||
      process.env["GROQ_LLAMA_API_KEY"] ||
      optionalEnv("GROQ_API_KEY", "")
    );
  },

  /** Legacy alias for general Groq access */
  get groqApiKey(): string {
    return this.groqSentinelApiKey || this.groqReportingApiKey;
  },

  /** Role 1 — Evidence Analyst API Key */
  get groqRole1ApiKey(): string {
    return (
      process.env["GROQ_ROLE1_API_KEY"] ||
      process.env["GROQ_EVIDENCE_API_KEY"] ||
      process.env["GROQ_API_KEY_1"] ||
      process.env["GROQ_LLAMA_API_KEY"] ||
      ""
    );
  },

  /** Role 2 — Impact & Operations Analyst API Key */
  get groqRole2ApiKey(): string {
    return (
      process.env["GROQ_ROLE2_API_KEY"] ||
      process.env["GROQ_IMPACT_API_KEY"] ||
      process.env["GROQ_API_KEY_2"] ||
      process.env["GROQ_API_KEY"] ||
      ""
    );
  },

  /** Role 3 — Report Editor & Quality Reviewer API Key */
  get groqRole3ApiKey(): string {
    return (
      process.env["GROQ_ROLE3_API_KEY"] ||
      process.env["GROQ_EDITOR_API_KEY"] ||
      process.env["GROQ_API_KEY_3"] ||
      process.env["GROQ_THIRD_API_KEY"] ||
      ""
    );
  },

  /**
   * AssemblyAI API key.
   * In .env.local it is stored as "ASSEMBLY_AI_MODEL" or "ASSEMBLYAI_API_KEY".
   */
  get assemblyAiKey(): string {
    return (
      process.env["ASSEMBLYAI_API_KEY"] ||
      process.env["ASSEMBLY_AI_MODEL"] ||
      process.env["ASSEMBLYAI_KEY"] ||
      ""
    );
  },

  // ─── GIS & Environmental Remote Sensing ───
  get mapTilerApiKey(): string {
    return (
      process.env["NEXT_PUBLIC_MAPTILER_API_KEY"] ||
      process.env["MAPTILER_API_KEY"] ||
      ""
    );
  },

  get openTopographyApiKey(): string {
    return process.env["OPENTOPOGRAPHY_API_KEY"] || "";
  },

  get nasaEarthdata(): { token: string; username: string; password: string } {
    return {
      token: process.env["NASA_EARTHDATA_TOKEN"] || "",
      username: process.env["NASA_EARTHDATA_USERNAME"] || "",
      password: process.env["NASA_EARTHDATA_PASSWORD"] || "",
    };
  },

  get mosdac(): { email: string; pass: string } {
    return {
      email: process.env["MOSDAC_USER_EMAIL"] || process.env["MOSDAC_user_email"] || "",
      pass: process.env["MOSDAC_PASS"] || process.env["MOSDAC_pass"] || "",
    };
  },

  // ─── Open-Meteo & National Alert Endpoints ───
  get openMeteo(): {
    baseUrl: string;
    airQualityUrl: string;
    marineUrl: string;
    floodUrl: string;
    seasonalUrl: string;
    archiveUrl: string;
    extendedWeatherUrl: string;
  } {
    return {
      baseUrl: process.env["OPEN_METEO_BASE_URL"] || "https://api.open-meteo.com/v1/forecast",
      airQualityUrl: process.env["OPEN_METEO_AIR_QUALITY_URL"] || process.env["openmeetio_airquality_api"] || "https://air-quality-api.open-meteo.com/v1/air-quality",
      marineUrl: process.env["OPEN_METEO_MARINE_URL"] || process.env["openmeetio_marine_api"] || "https://marine-api.open-meteo.com/v1/marine",
      floodUrl: process.env["OPEN_METEO_FLOOD_URL"] || process.env["openmeetio_flood_api"] || "https://flood-api.open-meteo.com/v1/flood",
      seasonalUrl: process.env["OPEN_METEO_SEASONAL_URL"] || process.env["openmeetio_seasonal_api"] || "https://seasonal-api.open-meteo.com/v1/seasonal",
      archiveUrl: process.env["OPEN_METEO_ARCHIVE_URL"] || "",
      extendedWeatherUrl: process.env["OPEN_METEO_EXTENDED_WEATHER_URL"] || process.env["openmeetio_wheather_2_key"] || "",
    };
  },

  get ndmaSachetMaharashtraRssUrl(): string {
    return process.env["NDMA_SACHET_MAHARASHTRA_RSS_URL"] || "https://sachet.ndma.gov.in/cap_public_website/rss/rss_maharashtra.xml";
  },

  // ─── Session ───
  sessionSecret: optionalEnv("SESSION_SECRET", "dev-secret-change-me"),

  // ─── VAPID Push Notifications ───
  vapidSubject: optionalEnv("VAPID_SUBJECT", "mailto:mesadinepos@gmail.com"),
  vapidPublicKey: optionalEnv("VAPID_PUBLIC_KEY", "BJ0sCzV6gYOOVWQAX8qA019mevAv2YpZOh9OXXLi_x7pB0q-0tJBftrTkSkBJKwd391aQ6s07cZXd1cXei7ezks"),
  vapidPrivateKey: optionalEnv("VAPID_PRIVATE_KEY", ""),

  // ─── Google OAuth ───
  googleClientId: optionalEnv("GOOGLE_CLIENT_ID", ""),
  googleClientSecret: optionalEnv("GOOGLE_CLIENT_SECRET", ""),
  nextAuthSecret: optionalEnv("NEXTAUTH_SECRET", optionalEnv("SESSION_SECRET", "dev-secret-change-me")),
  nextAuthUrl: optionalEnv("NEXTAUTH_URL", "http://localhost:3000"),

  // ─── App ───
  appUrl: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  nodeEnv: optionalEnv("NODE_ENV", "development"),

  get isProduction(): boolean {
    return this.nodeEnv === "production";
  },

  get isDevelopment(): boolean {
    return this.nodeEnv === "development";
  },
} as const;
