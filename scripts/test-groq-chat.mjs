import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';

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

async function testCompletion() {
  const client2 = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log('Testing GROQ_API_KEY with qwen/qwen3.8-27b...');
  try {
    const resp = await client2.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: 'Say hello in 3 words.' }],
      max_tokens: 20,
    });
    console.log('GROQ_API_KEY Response:', resp.choices[0]?.message?.content);
  } catch (err) {
    console.log('Error with qwen:', err.message);
  }

  const client3 = new Groq({ apiKey: process.env.GROQ_THIRD_API_KEY });
  console.log('Testing GROQ_THIRD_API_KEY with openai/gpt-oss-120b...');
  try {
    const resp = await client3.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: 'Say hello in 3 words.' }],
      max_tokens: 20,
    });
    console.log('GROQ_THIRD_API_KEY Response:', resp.choices[0]?.message?.content);
  } catch (err) {
    console.log('Error with gpt-oss-120b:', err.message);
  }
}

testCompletion();
