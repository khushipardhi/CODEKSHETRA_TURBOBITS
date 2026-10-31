/**
 * scripts/test-groq-credentials.mjs
 * Sentinel City Intelligence — Groq Three-Role Credential & Model Health Test
 */

import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const p = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
}

loadEnv();

const roleKeys = {
  Role1_EvidenceAnalyst: process.env.GROQ_ROLE1_API_KEY || process.env.GROQ_API_KEY_1 || process.env.GROQ_LLAMA_API_KEY,
  Role2_ImpactAnalyst: process.env.GROQ_ROLE2_API_KEY || process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY,
  Role3_ReportEditor: process.env.GROQ_ROLE3_API_KEY || process.env.GROQ_API_KEY_3 || process.env.GROQ_THIRD_API_KEY,
};

async function testRole(name, key, models) {
  console.log(`\nTesting ${name}...`);
  if (!key) {
    console.log(`  -> Key NOT CONFIGURED`);
    return { ok: false, reason: 'NOT_CONFIGURED' };
  }

  console.log(`  -> Key prefix: ${key.substring(0, 4)}... length: ${key.length}`);
  const client = new Groq({ apiKey: key });

  for (const model of models) {
    try {
      const t0 = Date.now();
      const res = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are an environmental test assistant. Always output JSON.' },
          { role: 'user', content: '{"action": "ping"}' }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 100,
        temperature: 0.1,
      });
      const duration = Date.now() - t0;
      const content = res.choices[0]?.message?.content;
      console.log(`  ✓ SUCCESS via model "${model}" in ${duration}ms: ${content}`);
      return { ok: true, duration, content, model };
    } catch (err) {
      console.log(`  ✗ FAILED via model "${model}": ${err.status || ''} - ${err.message}`);
    }
  }
  return { ok: false };
}

async function main() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('   GROQ THREE-ROLE HEALTH AND LIVE ENDPOINT AUDIT           ');
  console.log('════════════════════════════════════════════════════════════');

  const candidateModels = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
  ];

  await testRole('Role 1 (Evidence Analyst)', roleKeys.Role1_EvidenceAnalyst, candidateModels);
  await testRole('Role 2 (Impact Analyst)', roleKeys.Role2_ImpactAnalyst, candidateModels);
  await testRole('Role 3 (Report Editor)', roleKeys.Role3_ReportEditor, candidateModels);

  console.log('\nAudit complete.');
}

main();
