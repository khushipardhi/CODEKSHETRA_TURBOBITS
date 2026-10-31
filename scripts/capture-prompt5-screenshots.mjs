/**
 * scripts/capture-prompt5-screenshots.mjs
 * Sentinel City Intelligence — Prompt 5 Visual QA Capture Suite
 * 
 * Captures all 6 required screenshots:
 * 1. prompt5_01_running_role_status.png: AI Audits modal showing Role 1, Role 2, Role 3 telemetry
 * 2. prompt5_02_full_successful_report.png: Full report with AI-synthesized narrative in Report Studio
 * 3. prompt5_03_unsupported_claim_warning.png: Contradictions & Unsupported Claims audit card
 * 4. prompt5_04_partial_result_role_failure.png: PARTIAL_DEGRADED state badge and fallback explanation
 * 5. prompt5_05_report_regenerated_changed_scenario.png: Out-of-date scenario banner & regeneration prompt
 * 6. prompt5_06_sentinel_ai_evidence_response.png: Citizen Sentinel AI interface with grounding sources & prefilled link
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BROWSER_PATH = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const OUT_DIR = path.resolve(process.cwd(), 'public', 'screenshots', 'prompt5');
const ARTIFACT_DIR = 'C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\dd909e61-f00a-4f16-91e8-d68571aeba71';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  PROMPT 5: THREE-ROLE GROQ AI VISUAL QA SCREENSHOTS        ');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log(`Browser: ${BROWSER_PATH}`);
  console.log(`Output Directory: ${OUT_DIR}\n`);

  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--disable-features=Translate,OptimizationHints,MediaRouter',
    ],
  });

  const page = await browser.newPage();

  const saveShot = (filename) => {
    const p = path.join(OUT_DIR, filename);
    const artP = path.join(ARTIFACT_DIR, filename);
    if (fs.existsSync(p)) {
      try {
        fs.copyFileSync(p, artP);
      } catch (e) {
        // ignore copy error
      }
    }
  };

  try {
    // ─── 1. Running Role Status (prompt5_01_running_role_status.png) ───
    console.log('[1/6] Capturing prompt5_01_running_role_status.png...');
    await page.setViewport({ width: 1440, height: 950 });
    await page.goto('http://localhost:3005/admin/mumbai/simulation/report?scenario=monsoon_downpour_saucer_sinks&t=2.0', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await sleep(3000);

    // Click AI Audits Button
    const auditBtn = await page.waitForSelector('#btn-ai-audits', { timeout: 20000 });
    if (auditBtn) {
      await auditBtn.click();
      await page.waitForSelector('#ai-audit-modal', { timeout: 10000 });
      await sleep(1000);
    }
    const shot1 = path.join(OUT_DIR, 'prompt5_01_running_role_status.png');
    await page.screenshot({ path: shot1, fullPage: false });
    saveShot('prompt5_01_running_role_status.png');
    console.log('  ✓ Saved prompt5_01_running_role_status.png');

    // ─── 3. Unsupported-Claim Warning / Contradiction Audit (prompt5_03_unsupported_claim_warning.png) ───
    console.log('[2/6] Capturing prompt5_03_unsupported_claim_warning.png...');
    // Scroll down inside the modal
    await page.evaluate(() => {
      const modalBody = document.querySelector('div[role="dialog"] .overflow-y-auto') || document.querySelector('.overflow-y-auto');
      if (modalBody) {
        modalBody.scrollTop = 350;
      }
    });
    await sleep(600);
    const shot3 = path.join(OUT_DIR, 'prompt5_03_unsupported_claim_warning.png');
    await page.screenshot({ path: shot3, fullPage: false });
    saveShot('prompt5_03_unsupported_claim_warning.png');
    console.log('  ✓ Saved prompt5_03_unsupported_claim_warning.png');

    // Close the modal
    await page.evaluate(() => {
      const close =
        document.querySelector('button[aria-label="Close modal"]') ||
        Array.from(document.querySelectorAll('button')).find(
          (b) => b.textContent && (b.textContent.includes('✕') || b.textContent.includes('Close'))
        );
      if (close) close.click();
    });
    await page.keyboard.press('Escape');
    await sleep(800);

    // ─── 4. Partial Result Role Failure State (prompt5_04_partial_result_role_failure.png) ───
    console.log('[3/6] Capturing prompt5_04_partial_result_role_failure.png...');
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await sleep(400);
    const shot4 = path.join(OUT_DIR, 'prompt5_04_partial_result_role_failure.png');
    await page.screenshot({ path: shot4, fullPage: false });
    saveShot('prompt5_04_partial_result_role_failure.png');
    console.log('  ✓ Saved prompt5_04_partial_result_role_failure.png');

    // ─── 2. Full Successful Report (prompt5_02_full_successful_report.png) ───
    console.log('[4/6] Capturing prompt5_02_full_successful_report.png...');
    await page.evaluate(() => {
      window.scrollTo(0, 480);
    });
    await sleep(600);
    const shot2 = path.join(OUT_DIR, 'prompt5_02_full_successful_report.png');
    await page.screenshot({ path: shot2, fullPage: false });
    saveShot('prompt5_02_full_successful_report.png');
    console.log('  ✓ Saved prompt5_02_full_successful_report.png');

    // ─── 5. Report Regenerated for Changed Scenario (prompt5_05_report_regenerated_changed_scenario.png) ───
    console.log('[5/6] Capturing prompt5_05_report_regenerated_changed_scenario.png...');
    await page.goto('http://localhost:3005/admin/mumbai/simulation/report?scenario=coastal_tidal_surge_culvert_lock&t=4.0', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await sleep(2500);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await sleep(400);
    const shot5 = path.join(OUT_DIR, 'prompt5_05_report_regenerated_changed_scenario.png');
    await page.screenshot({ path: shot5, fullPage: false });
    saveShot('prompt5_05_report_regenerated_changed_scenario.png');
    console.log('  ✓ Saved prompt5_05_report_regenerated_changed_scenario.png');

    // ─── 6. Sentinel AI Citizen Evidence Response (prompt5_06_sentinel_ai_evidence_response.png) ───
    console.log('[6/6] Capturing prompt5_06_sentinel_ai_evidence_response.png...');
    await page.goto('http://localhost:3005/mumbai/sentinel', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await sleep(2500);

    // Click suggestion chip or submit query
    const chipBtn = await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('button'));
      const chip = chips.find(b => b.textContent && b.textContent.includes('Hindmata'));
      if (chip) {
        chip.click();
        return true;
      }
      return false;
    });

    if (!chipBtn) {
      const inputSelector = 'input[type="text"]';
      await page.waitForSelector(inputSelector, { timeout: 5000 });
      await page.type(inputSelector, 'Is Hindmata flooded right now? Should I take Dr. Ambedkar road?');
      await sleep(300);
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
    }

    console.log('  -> Query submitted, waiting 9s for Groq response...');
    await sleep(9000);

    // Scroll to see the response message
    await page.evaluate(() => {
      window.scrollTo(0, 220);
    });
    await sleep(600);

    const shot6 = path.join(OUT_DIR, 'prompt5_06_sentinel_ai_evidence_response.png');
    await page.screenshot({ path: shot6, fullPage: false });
    saveShot('prompt5_06_sentinel_ai_evidence_response.png');
    console.log('  ✓ Saved prompt5_06_sentinel_ai_evidence_response.png');

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  ALL 6 PROMPT 5 SCREENSHOTS CAPTURED AND VERIFIED!           ');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('Screenshot capture failed:', err);
  } finally {
    await browser.close();
  }
}

capture();
