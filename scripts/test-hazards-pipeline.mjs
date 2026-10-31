import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function testPipeline() {
  console.log("=== Testing Sentinel Pipeline ===");

  // 1. Test Open-Meteo Weather for all 3 cities
  const cities = ["mumbai", "pune", "nagpur"];
  for (const c of cities) {
    const coords = {
      mumbai: [19.076, 72.877],
      pune: [18.5204, 73.8567],
      nagpur: [21.1458, 79.0882]
    }[c];

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m&forecast_days=1&timezone=auto`;
    const res = await fetch(weatherUrl);
    const data = await res.json();
    console.log(`[Weather] ${c.toUpperCase()}: Temp=${data.current?.temperature_2m}°C, Precip=${data.current?.precipitation}mm, Wind=${data.current?.wind_speed_10m}km/h`);
  }

  // 2. Test NDMA SACHET feed
  const sachetRes = await fetch("https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails");
  const sachetData = await sachetRes.json();
  const alertList = Array.isArray(sachetData) ? sachetData : (sachetData.data || []);
  console.log(`[SACHET] Total active CAP alerts across India: ${alertList.length}`);

  // 3. Test Groq API Key directly
  const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_LLAMA_API_KEY;
  console.log(`[Groq Key Present] ${!!groqKey}`);
  if (groqKey) {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: "You are Sentinel City Intelligence." },
          { role: "user", content: "State your status in 10 words." }
        ],
        max_tokens: 30
      })
    });
    const groqJson = await groqRes.json();
    console.log(`[Groq Response Status: ${groqRes.status}] Answer:`, groqJson.choices?.[0]?.message?.content);
  }

  console.log("=== Sentinel Pipeline Tests Verified ===");
}

testPipeline().catch(err => {
  console.error("Pipeline test error:", err);
  process.exit(1);
});
