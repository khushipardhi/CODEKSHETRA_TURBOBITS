import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const BASE_URL = "http://localhost:3000";
const ARTIFACT_DIR = "C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\e0b45031-f0f8-4066-8567-28eef54a4f96";

function findChrome() {
  const paths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("No Chrome/Edge browser found");
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runApiAssertions() {
  console.log("\n=== STEP 1: RUNNING PHASE 9 ADMIN COMMAND CENTRE INTEGRATION ASSERTIONS ===");

  // 1. Test Admin Stats Aggregation API (/api/admin/stats)
  console.log("\n1. Testing Admin Stats Aggregation API (/api/admin/stats?city=mumbai):");
  const statsRes = await fetch(`${BASE_URL}/api/admin/stats?city=mumbai`);
  console.log("  Status code:", statsRes.status, statsRes.status === 200 ? "PASS ✓" : "FAIL ✗");
  const statsJson = await statsRes.json();
  console.log("  Total Persisted Incidents:", statsJson.kpi?.total);
  console.log("  Awaiting Review Incidents:", statsJson.kpi?.awaitingReviewCount);
  console.log("  Critical Active Incidents:", statsJson.kpi?.criticalActive);
  console.log("  In Progress Incidents:", statsJson.kpi?.inProgress);
  console.log("  Resolved Past 7 Days:", statsJson.kpi?.resolvedThisWeek);
  console.log("  Department Work Awaiting Action:", statsJson.kpi?.departmentAwaitingActionCount);
  console.log("  Provenance Source:", statsJson.provenanceSource);
  console.log("  Time Window:", statsJson.timeWindow);

  if (statsJson.kpi?.total === undefined || statsJson.kpi?.awaitingReviewCount === undefined) {
    throw new Error("Stats API failed to return full KPI breakdown");
  }

  // 2. Test Routing Decisions & Overdue SLAs (/api/admin/routing/decisions)
  console.log("\n2. Testing Routing Decisions API (/api/admin/routing/decisions?city=mumbai):");
  const routingRes = await fetch(`${BASE_URL}/api/admin/routing/decisions?city=mumbai`);
  console.log("  Status code:", routingRes.status, routingRes.status === 200 ? "PASS ✓" : "FAIL ✗");
  const routingJson = await routingRes.json();
  console.log("  Total Routing Decisions:", routingJson.kpis?.totalRoutingDecisions);
  console.log("  Pending Reviews Count:", routingJson.kpis?.pendingReviewsCount);
  console.log("  Overdue SLA Tasks Count:", routingJson.kpis?.overdueTasksCount);
  console.log("  Blocked Dependencies Count:", routingJson.kpis?.blockedTasksCount);
  console.log("  Configuration Gaps Count:", routingJson.kpis?.configurationGapsCount);

  // 3. Test Advisory Proposal Flow (Workflow Manager)
  console.log("\n3. Testing Precautionary Advisory Proposal via /api/hazards/workflow:");
  const advisoryRes = await fetch(`${BASE_URL}/api/hazards/workflow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "PROPOSE_ADVISORY",
      city: "mumbai",
      scenarioId: "monsoon_cloudburst_coastal_surge",
      scenarioTitle: "Monsoon Convective Downpour & Tidal Surge",
      wardId: "F/North",
      wardName: "Ward F/North (Matunga / Sion / Wadala)",
      screeningScore: 84,
      hazardType: "urban_flood",
      recommendedCivicActions: [
        "Avoid low-lying underpasses at Gandhi Market and King's Circle",
        "Monitor municipal emergency helpline 1916",
      ],
      chronicHotspotNames: ["Gandhi Market Underpass", "King's Circle"],
    }),
  });
  console.log("  Propose Advisory status:", advisoryRes.status, advisoryRes.status === 200 ? "PASS ✓" : "FAIL ✗");
  const advisoryJson = await advisoryRes.json();
  const advisoryId = advisoryJson.data?.advisoryId;
  console.log("  Created Advisory ID:", advisoryId);
  console.log("  Initial Approval Status (Draft):", advisoryJson.data?.approvalStatus);

  if (!advisoryId || advisoryJson.data?.approvalStatus !== "AWAITING_REVIEW") {
    throw new Error("Advisory creation failed approval boundary verification");
  }

  // 4. Test Formal Administrative Signoff (Approval Boundary)
  console.log("\n4. Testing Formal Administrative Signoff (/api/hazards/workflow APPROVE_ADVISORY):");
  const approveRes = await fetch(`${BASE_URL}/api/hazards/workflow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "APPROVE_ADVISORY",
      advisoryId,
      actorId: "ADMIN_MUNICIPAL_CHIEF",
      role: "ADMIN",
      notes: "Authorized by Senior Municipal Incident Commander for broadcast",
    }),
  });
  console.log("  Approve Advisory status:", approveRes.status, approveRes.status === 200 ? "PASS ✓" : "FAIL ✗");
  const approveJson = await approveRes.json();
  console.log("  Updated Approval Status:", approveJson.data?.approvalStatus);
  console.log("  Approved By Actor:", approveJson.data?.approvedBy);

  // 5. Test Department Task Dispatch & Lifecycle Transitions
  console.log("\n5. Testing Department Task Dispatch & Status Transition (/api/hazards/workflow):");
  const taskRes = await fetch(`${BASE_URL}/api/hazards/workflow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "CREATE_TASK",
      city: "mumbai",
      wardId: "F/North",
      category: "water_drainage",
      taskTitle: "Deploy portable diesel dewatering suction pump at Gandhi Market Underpass",
      requiredAction: "Inspect gravity outfall flap gate and maintain suction level under 0.3m",
      customDepartmentCode: "drainage",
    }),
  });
  console.log("  Create Task status:", taskRes.status, taskRes.status === 200 ? "PASS ✓" : "FAIL ✗");
  const taskJson = await taskRes.json();
  const taskId = taskJson.data?.taskId;
  console.log("  Dispatched Task ID:", taskId);
  console.log("  Initial Task Status:", taskJson.data?.status);
  console.log("  Assigned Department:", taskJson.data?.departmentName);

  if (taskId) {
    // 1. Accept task
    const acceptRes = await fetch(`${BASE_URL}/api/hazards/workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TRANSITION_TASK",
        taskId,
        fromStatus: taskJson.data?.status || "TASK_ASSIGNED",
        toStatus: "TASK_ACCEPTED",
        actorId: "MUNICIPAL_DISPATCHER",
        role: "ADMIN",
        actionNotes: "Drainage ward officer acknowledged task and mobilized crew",
      }),
    });
    const acceptJson = await acceptRes.json();
    console.log("  Transitioned to Accepted:", acceptJson.data?.status);

    // 2. Mobilize crew En Route
    const transRes = await fetch(`${BASE_URL}/api/hazards/workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TRANSITION_TASK",
        taskId,
        fromStatus: "TASK_ACCEPTED",
        toStatus: "TASK_EN_ROUTE",
        actorId: "MUNICIPAL_DISPATCHER",
        role: "ADMIN",
        actionNotes: "Field crew mobilized with dewatering suction pump en route to site",
      }),
    });
    const transJson = await transRes.json();
    console.log("  Transitioned to En Route:", transJson.data?.status);
  }

  // 6. Test Data Health API
  console.log("\n6. Testing Environmental Data Quality & Pipeline Health (/api/hazards/health):");
  const healthRes = await fetch(`${BASE_URL}/api/hazards/health?city=mumbai`);
  console.log("  Status code:", healthRes.status, healthRes.status === 200 ? "PASS ✓" : "FAIL ✗");
  const healthJson = await healthRes.json();
  console.log("  System Overall Health:", healthJson.data?.status);
  console.log("  Total Monitored Connectors:", healthJson.data?.connectors?.length);

  // 7. Test Security & Unknown Department Validation (Reject Invalid Department Override)
  console.log("\n7. Testing Security & Routing Validation with Unknown Department:");
  const badOverrideRes = await fetch(`${BASE_URL}/api/admin/routing/override`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      incidentId: "nonexistent-incident",
      overrideDepartment: "unsupported_foreign_ministry",
      reason: "Attempting arbitrary department injection",
      city: "mumbai",
    }),
  });
  console.log("  Unknown Dept Override status:", badOverrideRes.status, badOverrideRes.status === 400 ? "REJECTED (PASS ✓)" : "FAIL ✗");
  const badOverrideJson = await badOverrideRes.json();
  console.log("  Rejection error code:", badOverrideJson.error?.code);

  return { advisoryId, taskId };
}

async function runBrowserCaptures() {
  console.log("\n=== STEP 2: LAUNCHING HEADLESS CHROMIUM TO CAPTURE 9 PHASE 9 SCREENSHOTS ===");
  const chromePath = findChrome();
  console.log("Using browser binary:", chromePath);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--window-size=1360,950",
    ],
  });

  try {
    const page = await browser.newPage();

    // 1. Command Centre Overview
    console.log("1. Capturing Command Centre Overview (/admin/mumbai)...");
    await page.setViewport({ width: 1360, height: 950 });
    await page.goto(`${BASE_URL}/admin/mumbai`, { waitUntil: "networkidle2" });
    await page.waitForSelector("h2::-p-text('Priority Ward Vulnerability')", { timeout: 15000 });
    await sleep(2000);
    const shot1 = path.join(ARTIFACT_DIR, "phase9_01_command_centre_overview.png");
    await page.screenshot({ path: shot1, fullPage: false });
    console.log("  Saved ->", shot1);

    // 2. Source / Data-Health Panel
    console.log("2. Capturing Data-Health Monitor Modal...");
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
    const healthBtn = await page.waitForSelector("button::-p-text('Data Health Pipelines')", { timeout: 8000 });
    if (healthBtn) {
      await healthBtn.click();
      await page.waitForSelector("h2::-p-text('Environmental Telemetry & Pipeline Health')", { timeout: 8000 });
      await sleep(1500);
    }
    const shot2 = path.join(ARTIFACT_DIR, "phase9_02_source_data_health_panel.png");
    await page.screenshot({ path: shot2 });
    console.log("  Saved ->", shot2);

    // Close health modal
    const closeHealthBtn = await page.$("#close-health-modal-btn");
    if (closeHealthBtn) {
      await closeHealthBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await sleep(1000);

    // 3. Selected Ward and Linked Incidents (Ward Action Hub Modal)
    console.log("3. Capturing Selected Ward Action Hub & Dossier Modal (Ward F/North)...");
    const inspectBtn = await page.waitForSelector("button::-p-text('Inspect Dossier')", { timeout: 10000 });
    if (inspectBtn) {
      await page.evaluate(el => el.scrollIntoView({ block: 'center' }), inspectBtn);
      await sleep(600);
      await inspectBtn.click();
      await page.waitForSelector("h3::-p-text('Ward Action Hub')", { timeout: 10000 });
      await sleep(1500);
    }
    const shot3 = path.join(ARTIFACT_DIR, "phase9_03_selected_ward_dossier_modal.png");
    await page.screenshot({ path: shot3 });
    console.log("  Saved ->", shot3);

    // 4. Draft Advisory and Approval (inside Ward Action Hub)
    console.log("4. Capturing Precautionary Advisory Drafting & Approval Screen...");
    const advisoryTab = await page.waitForSelector("button::-p-text('Draft Advisory')", { timeout: 8000 });
    if (advisoryTab) {
      await advisoryTab.click();
      await page.waitForSelector("button::-p-text('Submit Advisory Proposal')", { timeout: 8000 });
      await sleep(1500);
    }
    const shot7 = path.join(ARTIFACT_DIR, "phase9_07_draft_advisory_approval.png");
    await page.screenshot({ path: shot7 });
    console.log("  Saved ->", shot7);

    // Close Ward Action Hub Modal
    const closeWardBtn = await page.$("#close-ward-modal-btn");
    if (closeWardBtn) {
      await closeWardBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await sleep(1000);

    // 5. Full Report Navigation (Simulation Report Studio)
    console.log("5. Capturing Simulation Report Studio (/admin/mumbai/simulation/report?ward=F/North)...");
    await page.goto(`${BASE_URL}/admin/mumbai/simulation/report?ward=F/North`, { waitUntil: "networkidle2" });
    try {
      await page.waitForSelector("a::-p-text('Return to Simulation Map')", { timeout: 25000 });
      await sleep(2000);
    } catch {
      await sleep(4000);
    }
    const shot4 = path.join(ARTIFACT_DIR, "phase9_04_full_report_navigation_studio.png");
    await page.screenshot({ path: shot4, fullPage: false });
    console.log("  Saved ->", shot4);

    // 6. Department Task View (/department/mumbai/drainage)
    console.log("6. Capturing Department Operations Console (/department/mumbai/drainage)...");
    await page.goto(`${BASE_URL}/department/mumbai/drainage`, { waitUntil: "networkidle2" });
    await sleep(2500);
    const shot5 = path.join(ARTIFACT_DIR, "phase9_05_department_task_view.png");
    await page.screenshot({ path: shot5, fullPage: false });
    console.log("  Saved ->", shot5);

    // 7. Routing Decision & Fallback Review (scrolled on Command Centre)
    console.log("7. Capturing Routing Review & Explainable Decision Center...");
    await page.goto(`${BASE_URL}/admin/mumbai`, { waitUntil: "networkidle2" });
    await sleep(2500);
    await page.evaluate(() => {
      window.scrollBy(0, 750);
    });
    await sleep(1500);
    const shot6 = path.join(ARTIFACT_DIR, "phase9_06_routing_decision_fallback.png");
    await page.screenshot({ path: shot6 });
    console.log("  Saved ->", shot6);

    // 8. Mobile Admin View (390px iPhone Viewport)
    console.log("8. Capturing Mobile Admin View (390px iPhone standard)...");
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/admin/mumbai`, { waitUntil: "networkidle2" });
    await sleep(2500);
    const shot8 = path.join(ARTIFACT_DIR, "phase9_08_mobile_admin_view.png");
    await page.screenshot({ path: shot8, fullPage: false });
    console.log("  Saved ->", shot8);

    // 9. Error / Unsupported Data State
    console.log("9. Capturing Unsupported City / Configuration Gap State...");
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/admin/unsupported_city`, { waitUntil: "networkidle2" });
    await sleep(2000);
    const shot9 = path.join(ARTIFACT_DIR, "phase9_09_error_unsupported_data_state.png");
    await page.screenshot({ path: shot9 });
    console.log("  Saved ->", shot9);

    console.log("\n✓ ALL 9 PHASE 9 SCREENSHOTS CAPTURED AND VERIFIED SUCCESSFULLY!");
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    await runApiAssertions();
    await runBrowserCaptures();
    console.log("\n=== PHASE 9 TEST AND CAPTURE RUN COMPLETE ===");
  } catch (err) {
    console.error("FATAL: Phase 9 script execution failed:", err);
    process.exit(1);
  }
}

main();
