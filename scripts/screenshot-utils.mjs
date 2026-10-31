import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const rootDir = process.cwd();
const TMP_SCREENSHOT_DIR = path.join(rootDir, 'public/screenshots/tmp');

/**
 * Ensures the target directory exists.
 */
export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Resolves a standardized screenshot path.
 * If isTemporary is true, places file in public/screenshots/tmp/.
 */
export function getScreenshotPath(subfolder, filename, isTemporary = false) {
  const baseDir = isTemporary ? TMP_SCREENSHOT_DIR : path.join(rootDir, 'public/screenshots', subfolder);
  ensureDir(baseDir);
  return path.join(baseDir, filename);
}

/**
 * Captures a screenshot using Puppeteer page with SHA-256 deduplication.
 * Only writes to disk if file does not exist or if pixels/content have changed.
 */
export async function captureWithDeduplication(page, targetPath, options = {}) {
  ensureDir(path.dirname(targetPath));
  const buffer = await page.screenshot({ ...options });
  const newHash = crypto.createHash('sha256').update(buffer).digest('hex');

  if (fs.existsSync(targetPath)) {
    try {
      const existingBuffer = fs.readFileSync(targetPath);
      const existingHash = crypto.createHash('sha256').update(existingBuffer).digest('hex');
      if (newHash === existingHash) {
        // Unchanged; skip disk write
        return { path: targetPath, written: false, unchanged: true };
      }
    } catch (e) {}
  }

  fs.writeFileSync(targetPath, buffer);
  return { path: targetPath, written: true, unchanged: false };
}

/**
 * Cleans up temporary screenshots upon successful test completion.
 * If test failed, preserves them for debugging.
 */
export function finalizeTestRun(testPassed, tempFiles = []) {
  if (testPassed) {
    for (const f of tempFiles) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch (e) {}
    }
    // Also clean empty temp directory
    try {
      if (fs.existsSync(TMP_SCREENSHOT_DIR) && fs.readdirSync(TMP_SCREENSHOT_DIR).length === 0) {
        fs.rmdirSync(TMP_SCREENSHOT_DIR);
      }
    } catch (e) {}
  } else {
    console.warn(`[ScreenshotUtils] Test failed. Retaining ${tempFiles.length} temporary screenshots for debugging.`);
  }
}
