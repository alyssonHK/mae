// Teste rápido: buscar receita aleatória do TheMealDB e tentar traduzir via LibreTranslate
(async function main() {
  try {
    const mealRes = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
    if (!mealRes.ok) throw new Error('Falha ao buscar TheMealDB');
    const data = await mealRes.json();
    const meal = Array.isArray(data.meals) && data.meals.length > 0 ? data.meals[0] : null;
    if (!meal) throw new Error('Nenhuma receita retornada');

    console.log('=== TheMealDB sample ===');
    console.log('Name:', meal.strMeal);
    console.log('Category:', meal.strCategory);
    console.log('Area:', meal.strArea);
    console.log('Image:', meal.strMealThumb);
    console.log('\nInstructions (first 400 chars):\n', (meal.strInstructions || '').slice(0, 400));

    // attempt translate a small portion
    const toTranslate = (meal.strInstructions || '').slice(0, 1000);
    if (!toTranslate) return;

  const candidates = [];
  // Prioriza MyMemory (GET) porque nao precisa de chave e costuma permitir
  // chamadas diretas do browser/servidor.
  candidates.push('mymemory://');
  if (process.env.VITE_TRANSLATE_API_URL) candidates.push(process.env.VITE_TRANSLATE_API_URL);
  candidates.push('https://translate.argosopentech.com/translate');
  candidates.push('https://libretranslate.de/translate');

    let translated = null;
    for (const url of candidates) {
      console.log('\nTrying translate URL:', url);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ q: toTranslate, source: 'en', target: 'pt', format: 'text' }),
        });
        if (!res.ok) {
          console.log(' -> non-ok status', res.status);
          continue;
        }
        const ct = res.headers.get('content-type') || '';
        let data;
        if (!ct.includes('application/json')) {
          const text = await res.text();
          try { data = JSON.parse(text); } catch (err) { console.log(' -> non-json response'); continue; }
        } else {
          data = await res.json();
        }

        // MyMemory shape
        if (data?.responseData?.translatedText) { translated = data.responseData.translatedText; break; }
        if (data && typeof data.translatedText === 'string') { translated = data.translatedText; break; }
        if (data && data.data && Array.isArray(data.data.translations) && data.data.translations[0] && data.data.translations[0].translatedText) { translated = data.data.translations[0].translatedText; break; }
        const maybe = Object.values(data).find((v) => typeof v === 'string');
        if (typeof maybe === 'string') { translated = maybe; break; }
        console.log(' -> unexpected response shape, continuing');
      } catch (err) {
        console.log(' -> request error', err.message || err);
        continue;
      }
    }

    if (translated) {
      console.log('\nTranslated snippet (preview):');
      console.log(translated.slice(0, 400));
    } else {
      console.log('\nTranslation failed on all candidate endpoints.');
    }
  } catch (err) {
    console.error('Erro:', err.message || err);
    process.exit(1);
  }
})();