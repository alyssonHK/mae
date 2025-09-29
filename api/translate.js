// REMOVED: api/translate.js
// O projeto agora usa `public/translated_meals.json` para receitas traduzidas
// e nao necessita mais deste proxy de traducao. Mantido apenas como placeholder.
module.exports = function handler(req, res) {
  res.statusCode = 410; // Gone
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Translation proxy removed' }));
};
