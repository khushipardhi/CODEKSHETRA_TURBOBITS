const res = await fetch('http://localhost:3000/api/admin/reports/telemetry-pdf?city=mumbai&tab=overview&format=html');
const html = await res.text();
console.log('Contains [object Object]?:', html.includes('[object Object]'));
const cardRegex = /<div class="metric-card">([\s\S]*?)<\/div>\s*(?=<\/div>|<div class="metric-card">|$)/g;
let match;
while ((match = cardRegex.exec(html)) !== null) {
  console.log('--- Card ---');
  console.log(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}
