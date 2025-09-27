// Pequeno proxy de tradução para Vercel (JS)
// Configurar via env:
// TRANSLATE_PROVIDER_URL (opcional) - url do provider que aceite { q, source, target }
// TRANSLATE_API_KEY (opcional) - chave para provider

if (!globalThis._translate_cache) globalThis._translate_cache = new Map();
const cache = globalThis._translate_cache;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { q, source = 'en', target = 'pt' } = req.body ?? {};
  if (!q) return res.status(400).json({ error: 'Missing q' });

  const cacheKey = `t::${q}::${source}::${target}`;
  if (cache.has(cacheKey)) return res.json({ translatedText: cache.get(cacheKey) });

  try {
    const providerUrl = process.env.TRANSLATE_PROVIDER_URL;
    const apiKey = process.env.TRANSLATE_API_KEY;

    if (providerUrl) {
      const r = await fetch(providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ q, source, target }),
      });

      if (!r.ok) {
        const text = await r.text();
        return res.status(502).json({ error: 'Provider error', detail: text });
      }

      const data = await r.json();
      const translated = (data.translatedText ?? data.translations?.[0]?.translatedText ?? data.translation) || null;
      if (translated) {
        cache.set(cacheKey, translated);
        return res.json({ translatedText: translated });
      }
      return res.status(502).json({ error: 'Provider returned unexpected payload', data });
    }

    // fallback: MyMemory
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${source}|${target}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: 'MyMemory failure' });
    const d = await r.json();
    const translated = d?.responseData?.translatedText ?? null;
    if (translated) {
      cache.set(cacheKey, translated);
      return res.json({ translatedText: translated });
    }
    return res.status(502).json({ error: 'No translation from MyMemory' });
  } catch (err) {
    console.error('translate handler error', err);
    return res.status(500).json({ error: 'internal' });
  }
};
