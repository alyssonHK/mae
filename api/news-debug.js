// Endpoint de debug para checar se a variável NEWSAPI_KEY existe no ambiente.
// NÃO expõe o valor da chave — apenas informa se está presente.
export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const hasNewsKey = Boolean(process.env.NEWSAPI_KEY);
  const hasViteKey = Boolean(process.env.VITE_NEWSAPI_KEY);
  const envInfo = {
    hasNewsKey,
    hasViteKey,
    nodeEnv: process.env.NODE_ENV || null,
  };

  return res.status(200).json({ ok: true, env: envInfo, note: 'This endpoint does not reveal secret values.' });
}
