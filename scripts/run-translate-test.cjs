// Roda localmente o handler api/translate.js com mocks de req/res (CommonJS)
// Uso: node scripts/run-translate-test.cjs

const path = require('path');
const handler = require(path.resolve(__dirname, '../api/translate.js'));

async function run() {
  const req = {
    method: 'POST',
    body: { q: 'Hello, how are you?', source: 'en', target: 'pt' },
  };

  let statusCode = 200;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(obj) {
      console.log('--- RESPONSE ---');
      console.log('status:', statusCode);
      console.log(JSON.stringify(obj, null, 2));
      return Promise.resolve();
    },
    end() {
      return Promise.resolve();
    }
  };

  try {
    await handler(req, res);
  } catch (err) {
    console.error('handler threw:', err);
    process.exitCode = 2;
  }
}

run();
