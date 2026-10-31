import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

// Simple env file parser without extra packages
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.warn(".env.local not found");
    return;
  }
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

async function testAll() {
  const results = {};

  // 1. TiDB Database Connection
  console.log("\n--- 1. Testing TiDB Database Connection ---");
  try {
    const host = process.env.DATABASE_HOST;
    const port = parseInt(process.env.DATABASE_PORT || "4000", 10);
    const user = process.env.DATABASE_USER;
    const password = process.env.DATABASE_PASSWORD;
    const database = process.env.DATABASE_NAME || "nagpur_connect";

    console.log(`Host: ${host}:${port}`);
    console.log(`User: ${user}`);
    console.log(`Database: ${database}`);

    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      ssl: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      },
    });

    const [rows] = await connection.execute("SELECT VERSION() as version, DATABASE() as db");
    console.log("✅ TiDB Connection SUCCESS:", rows);
    
    // Check tables
    const [tables] = await connection.execute("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log(`✅ Found ${tableNames.length} tables in database:`, tableNames);
    
    results.database = { status: "OK", version: rows[0]?.version, tables: tableNames };
    await connection.end();
  } catch (err) {
    console.error("❌ TiDB connection FAILED:", err.message);
    results.database = { status: "ERROR", error: err.message };
  }

  // 2. Groq AI
  console.log("\n--- 2. Testing Groq AI API ---");
  try {
    const groqKey = process.env.GROQ_LLAMA_API_KEY || process.env.GROQ_API_KEY;
    if (!groqKey) {
      throw new Error("GROQ key is missing");
    }
    const resp = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${groqKey}`,
      },
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Groq HTTP ${resp.status}: ${errText}`);
    }
    const data = await resp.json();
    console.log(`✅ Groq AI Connected! Available models count: ${data.data?.length || 0}`);
    results.groq = { status: "OK", modelCount: data.data?.length };
  } catch (err) {
    console.error("❌ Groq AI FAILED:", err.message);
    results.groq = { status: "ERROR", error: err.message };
  }

  // 3. AssemblyAI
  console.log("\n--- 3. Testing AssemblyAI ---");
  try {
    const aaiKey = process.env.ASSEMBLY_AI_MODEL || process.env.ASSEMBLYAI_API_KEY;
    if (!aaiKey) {
      throw new Error("AssemblyAI key is missing");
    }
    const resp = await fetch("https://api.assemblyai.com/v2/transcript", {
      headers: {
        Authorization: aaiKey,
      },
    });
    if (!resp.ok && resp.status !== 200) {
      const errText = await resp.text();
      throw new Error(`AssemblyAI HTTP ${resp.status}: ${errText}`);
    }
    console.log("✅ AssemblyAI API Authenticated successfully!");
    results.assemblyai = { status: "OK" };
  } catch (err) {
    console.error("❌ AssemblyAI FAILED:", err.message);
    results.assemblyai = { status: "ERROR", error: err.message };
  }

  // 4. MapTiler
  console.log("\n--- 4. Testing MapTiler API Key ---");
  try {
    const mapKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    if (!mapKey) {
      throw new Error("MapTiler key is missing");
    }
    const resp = await fetch(`https://api.maptiler.com/maps/streets-v2/style.json?key=${mapKey}`);
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`MapTiler HTTP ${resp.status}: ${errText}`);
    }
    console.log("✅ MapTiler API key valid and responsive!");
    results.maptiler = { status: "OK" };
  } catch (err) {
    console.error("❌ MapTiler FAILED:", err.message);
    results.maptiler = { status: "ERROR", error: err.message };
  }

  // 5. EmailJS Configuration
  console.log("\n--- 5. Checking EmailJS Config ---");
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const connectedEmail = process.env.EMAILJS_CONNECTED_EMAIL;

  if (serviceId && templateId && publicKey && privateKey) {
    console.log(`✅ EmailJS configured (Service: ${serviceId}, Template: ${templateId}, Target: ${connectedEmail})`);
    results.emailjs = { status: "OK", serviceId, templateId, connectedEmail };
  } else {
    console.warn("⚠️ EmailJS missing some keys");
    results.emailjs = { status: "MISSING_KEYS" };
  }

  // 6. VAPID Web Push
  console.log("\n--- 6. Checking VAPID Push Config ---");
  const vapidPub = process.env.VAPID_PUBLIC_KEY;
  const vapidPriv = process.env.VAPID_PRIVATE_KEY;
  const vapidSub = process.env.VAPID_SUBJECT;
  if (vapidPub && vapidPriv && vapidSub) {
    console.log(`✅ VAPID push notification keys configured (Subject: ${vapidSub})`);
    results.vapid = { status: "OK", vapidSubject: vapidSub };
  } else {
    console.warn("⚠️ VAPID keys incomplete");
    results.vapid = { status: "INCOMPLETE" };
  }

  // 7. Google OAuth & Auth Secret
  console.log("\n--- 7. Checking Auth Secrets ---");
  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (googleId && googleSecret && nextAuthSecret) {
    console.log(`✅ Auth & Google OAuth configured (Client ID: ${googleId.substring(0, 15)}...)`);
    results.auth = { status: "OK", hasGoogleOAuth: true, hasNextAuthSecret: true };
  } else {
    console.warn("⚠️ Auth credentials incomplete");
    results.auth = { status: "INCOMPLETE" };
  }

  console.log("\n════════════════ SUMMARY ════════════════");
  console.log(JSON.stringify(results, null, 2));
}

testAll();
