/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — Phase 7 Citizen Experience Automated Tests
   ════════════════════════════════════════════════════════ */

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== STARTING SENTINEL PHASE 7 CITIZEN EXPERIENCE TEST SUITE ===\n");
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}: ${err.message}`);
    }
  }

  // 1. Mumbai Hyperlocal Briefing
  await test("Mumbai Dadar Briefing with Hydrology & Verified Shelter", async () => {
    const res = await fetch(`${BASE_URL}/api/hazards/briefing?city=mumbai&area=Dadar&lat=19.0178&lon=72.8478`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const data = body.data;
    if (!data.currentTelemetry?.weather?.temperatureCelsius) throw new Error("Missing weather telemetry");
    if (!data.hydrology?.isSink) throw new Error("Expected Dadar/Hindmata to be detected as sink");
    if (!data.nearestEmergencyFacility?.name) throw new Error("Missing nearest shelter");
    if (!data.nearestEmergencyFacility?.googleMapsUrl) throw new Error("Missing Google Maps directions URL");
    if (!data.helpline.includes("1916")) throw new Error("Missing BMC 1916 helpline");
  });

  // 2. Pune Hyperlocal Briefing with Boundary Compartmentalization
  await test("Pune Shivajinagar Briefing with PMC Shelter (Zero Mumbai Leaks)", async () => {
    const res = await fetch(`${BASE_URL}/api/hazards/briefing?city=pune&area=Shivajinagar&lat=18.5314&lon=73.8446`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const data = body.data;
    if (data.hydrology) throw new Error("Mumbai hydrology leaked into Pune");
    if (!data.nearestEmergencyFacility?.name.includes("PMC")) throw new Error("Expected PMC shelter for Pune");
    if (!data.helpline.includes("020-25501000")) throw new Error("Missing PMC helpline");
  });

  // 3. Nagpur Hyperlocal Briefing with NMC Shelter
  await test("Nagpur Sitabuldi Briefing with NMC Shelter (Zero Coastal/Tidal Leaks)", async () => {
    const res = await fetch(`${BASE_URL}/api/hazards/briefing?city=nagpur&area=Sitabuldi&lat=21.1458&lon=79.0882`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const data = body.data;
    if (data.currentTelemetry?.marine) throw new Error("Coastal marine data leaked to landlocked Nagpur");
    if (!data.nearestEmergencyFacility?.name.includes("NMC")) throw new Error("Expected NMC shelter for Nagpur");
    if (!data.helpline.includes("0712-2567011")) throw new Error("Missing NMC helpline");
  });

  // 4. Dedicated Citizen Alert Centre Route
  await test("Dedicated Citizen Alert Centre Route HTTP 200", async () => {
    const res = await fetch(`${BASE_URL}/mumbai/alerts`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  });

  // 5. Action-Oriented Sentinel AI Reporting Inquiry
  await test("Action-Oriented Sentinel AI: Recurring Issue Guidance", async () => {
    const res = await fetch(`${BASE_URL}/api/hazards/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: "mumbai",
        message: "How do I report a recurring waterlogging and drain overflow issue in Dadar?",
        userLocation: { lat: 19.0178, lon: 72.8478, localityName: "Dadar" },
      }),
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const data = body.data;
    if (!data.reply || data.reply.length < 50) throw new Error("Empty AI reply");
    if (!data.groundingSources || data.groundingSources.length === 0) throw new Error("Missing grounding sources");
  });

  // 6. Action-Oriented Sentinel AI Report Tracking Inquiry
  await test("Action-Oriented Sentinel AI: Report Tracking Guidance", async () => {
    const res = await fetch(`${BASE_URL}/api/hazards/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: "mumbai",
        message: "Where can I see updates on my previous civic complaint MUM-1049?",
        userLocation: { lat: 19.0178, lon: 72.8478, localityName: "Dadar" },
      }),
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const data = body.data;
    if (!data.reply) throw new Error("Empty AI reply");
  });

  console.log(`\n==================================================`);
  console.log(`PHASE 7 SUITE: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log(`==================================================`);
  if (passed !== total) process.exit(1);
}

runTests();
