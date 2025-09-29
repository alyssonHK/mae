// Serverless proxy para NewsAPI — evita CORS ao chamar diretamente do cliente.
// Configure a chave de API em variavel de ambiente `NEWSAPI_KEY` (no Vercel: set as Secret).
// Este handler espera receber uma requisicao GET opcionalmente com query params que serão repassados.

const NEWSAPI_BASE = 'https://newsapi.org/v2/everything';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.NEWSAPI_KEY || process.env.VITE_NEWSAPI_KEY || process.env.VITE_NEWSAPI;
  if (!apiKey) return res.status(500).json({ error: 'NEWSAPI_KEY not configured on server' });

  try {
    // Repassa a query string do cliente para o NewsAPI (mas ignoramos qualquer header de api key vindo do cliente)
    const query = req.url && req.url.includes('?') ? req.url.split('?')[1] : '';
    const targetUrl = `${NEWSAPI_BASE}${query ? `?${query}` : ''}`;

    console.log('[news proxy] requesting', targetUrl);

    // timeout simples: abort after 10s
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const r = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await r.text();

    if (!r.ok) {
      console.error('[news proxy] upstream error', r.status, text.slice(0, 200));
      // tentar parsear JSON do upstream se possivel
      try {
        const parsed = JSON.parse(text);
        return res.status(r.status).json({ error: 'Upstream error', upstream: parsed });
      } catch (e) {
        return res.status(r.status).json({ error: 'Upstream error', detail: text.slice(0, 200) });
      }
    }

    // repassa status e body com content-type seguro
    res.status(200);
    res.setHeader('Content-Type', 'application/json');
    return res.end(text);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[news proxy] request timed out');
      return res.status(504).json({ error: 'Upstream timeout' });
    }
    console.error('news proxy error', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'News proxy failed', detail: String(err) });
  }
};
