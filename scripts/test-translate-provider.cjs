// Testa provider de tradução (reproduz a lógica de api/translate.js)
const https = require('https');
const http = require('http');

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function run() {
  const q = 'Hello, how are you?';
  const source = 'en';
  const target = 'pt';
  const providerUrl = process.env.TRANSLATE_PROVIDER_URL;
  const apiKey = process.env.TRANSLATE_API_KEY;

  if (providerUrl) {
    console.log('Testing provider url', providerUrl);
    const payload = JSON.stringify({ q, source, target });
    try {
      const res = await fetchUrl(providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          'Content-Length': Buffer.byteLength(payload),
        },
        body: payload,
      });
      console.log('status', res.status);
      console.log(res.body.slice(0, 1000));
      return;
    } catch (e) {
      console.error('provider request failed', e);
    }
  }

  console.log('Testing MyMemory fallback');
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${source}|${target}`;
  try {
    const res = await fetchUrl(url);
    console.log('status', res.status);
    console.log(res.body.slice(0, 1000));
  } catch (e) {
    console.error('mymemory request failed', e);
  }
}

run();
