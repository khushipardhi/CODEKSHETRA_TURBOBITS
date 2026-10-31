import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';

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

const key = process.env.GROQ_THIRD_API_KEY || process.env.GROQ_API_KEY_3 || process.env.GROQ_ROLE3_API_KEY;
console.log('Role 3 Key configured:', Boolean(key));

const client = new Groq({ apiKey: key });

async function run() {
  const minimalEvidence = {
    meta: { scenarioId: 'monsoon_downpour_saucer_sinks', timeStepHours: 2.0, city: 'mumbai' },
    citywideSummary: { totalWards: 24, peakScore: 88.5, peakWard: 'F/North', overallAlertLevel: 'RED_WARNING' },
    topRankedWards: [
      { rank: 1, wardId: 'F/North', wardName: 'F/North (Matunga / Sion)', score: 88.5, tier: 'HIGH' },
      { rank: 2, wardId: 'F/South', wardName: 'F/South (Parel)', score: 82.1, tier: 'HIGH' }
    ]
  };

  const role1Sample = {
    environmentalInterpretation: 'Heavy precipitation exceeding 65mm/h across eastern catchment.',
    keySupportingEvidence: ['Open-Meteo HRRR telemetry', 'Copernicus 30m DEM minima']
  };

  const role2Sample = {
    criticalWardComparison: 'F/North and F/South exhibit highest depression volume.',
    proximityVsDamageDisclaimer: 'Physical damage is not confirmed; spatial proximity indicates screening priority.'
  };

  const prompt = `Synthesize and review the final simulation dossier report based on the following verified components:

EVIDENCE SUMMARY:
${JSON.stringify(minimalEvidence, null, 2)}

ROLE 1 (EVIDENCE ANALYST):
${JSON.stringify(role1Sample, null, 2)}

ROLE 2 (IMPACT & OPERATIONS ANALYST):
${JSON.stringify(role2Sample, null, 2)}

Provide your synthesized editorial review and verified key findings adhering strictly to JSON.`;

  try {
    const res = await client.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
      messages: [
        {
          role: 'system',
          content: 'You are AI Role 3 (Report Editor & Quality Reviewer) for Sentinel City Intelligence, operating under MCGM / BMC. You must output ONLY a valid JSON object adhering to: { "executiveSummarySynthesis": "string", "editorialCommentary": "string", "contradictionFlags": [], "unsupportedClaimsRemoved": [], "verifiedKeyFindings": ["string"], "editorialReviewPassed": true }'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1500,
    });

    console.log('Role 3 Distilled Prompt Success:');
    console.log(res.choices[0].message.content);
  } catch (err) {
    console.error('Role 3 Error:', err.status, err.message);
  }
}

run();
