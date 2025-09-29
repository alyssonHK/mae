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

    const r = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
      },
    });

    const text = await r.text();
    // repassa status e body
    res.status(r.status);
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
    return res.end(text);
  } catch (err) {
    console.error('news proxy error', err);
    return res.status(502).json({ error: 'News proxy failed' });
  }
};
