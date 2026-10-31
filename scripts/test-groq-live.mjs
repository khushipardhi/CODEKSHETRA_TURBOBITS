import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';

// Read .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function checkKeys() {
  const keys = [
    { name: 'GROQ_LLAMA_API_KEY (Role 1 / Evidence)', key: process.env.GROQ_LLAMA_API_KEY },
    { name: 'GROQ_API_KEY (Role 2 / Impact & Citizen)', key: process.env.GROQ_API_KEY },
    { name: 'GROQ_THIRD_API_KEY (Role 3 / Report Editor)', key: process.env.GROQ_THIRD_API_KEY },
  ];

  for (const { name, key } of keys) {
    console.log(`\nChecking ${name}...`);
    if (!key || key.trim().length < 10) {
      console.log(`  -> Missing or unconfigured.`);
      continue;
    }
    console.log(`  -> Key present (${key.slice(0, 7)}...)`);
    const client = new Groq({ apiKey: key });
    try {
      const models = await client.models.list();
      console.log(`  -> Authenticated successfully! Available models: ${models.data.length}`);
      const modelIds = models.data.map(m => m.id);
      const chatModels = modelIds.filter(id => 
        id.includes('llama') || id.includes('gemma') || id.includes('mixtral') || id.includes('qwen') || id.includes('gpt')
      );
      console.log(`  -> Top active chat models:`, chatModels.slice(0, 10));
    } catch (err) {
      console.log(`  -> Error testing key:`, err.message);
    }
  }
}

checkKeys();
