// script de teste para parsing (Node.js)
// Copia a lógica dos helpers de parsing para validar heurísticas sem depender do TypeScript

function sanitizeAfroditeLine(value) {
  if (!value) return '';
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function splitMergedAfroditeSegments(text) {
  if (!text) return [];
  const segments = [];
  let buffer = '';
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    buffer += char;

    const nextIsDigit = next !== undefined && /\d/.test(next);
    const charIsDigit = /\d/.test(char);
    const isBoundaryByDigit = nextIsDigit && !charIsDigit;

    const nextIsUpper = next !== undefined && /[A-ZÁÉÍÓÚÃÕÂÊÎÔÛ]/.test(next);
    const charIsLower = /[a-záéíóúãõâêîôû)]/.test(char);
    const isBoundaryByCase = nextIsUpper && charIsLower;

    const isPunctThenUpper = /[\.\-–—:,;()]$/.test(char) && nextIsUpper;

    if (isBoundaryByDigit || isBoundaryByCase || isPunctThenUpper) {
      segments.push(buffer.trim());
      buffer = '';
    }
  }
  if (buffer.trim()) segments.push(buffer.trim());
  return segments.map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function splitAfroditeEntries(lines) {
  if (!lines) return [];
  const entries = [];
  for (const raw of lines) {
    const sanitized = sanitizeAfroditeLine(raw);
    if (!sanitized) continue;
    const parts = sanitized.split(/\r?\n+/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const segments = splitMergedAfroditeSegments(trimmed);
      if (segments.length > 1) {
        entries.push(...segments);
      } else {
        const numericSplit = trimmed.split(/(?=\b\d+\s*[\-.)])/);
        if (numericSplit.length > 1) {
          entries.push(...numericSplit.map((s) => s.trim()).filter(Boolean));
        } else {
          entries.push(trimmed);
        }
      }
    }
  }
  return entries.filter(Boolean);
}

function formatInstructions(text) {
  if (!text) return [];
  const byLines = text.split(/\r?\n+/).map((s) => s.trim()).filter(Boolean);
  const segments = [];
  for (const line of byLines) {
    const numericParts = line.split(/(?=\b\d+\s*[\-.)])/).map((s) => s.trim()).filter(Boolean);
    for (const part of numericParts) {
      const dotParts = part.split(/(?<=\.)\s+(?=[A-ZÀ-Ú])/).map((s) => s.trim()).filter(Boolean);
      for (const p of dotParts) {
        const cleaned = p.replace(/^[0-9]+\s*[-–.)]?\s*/, '').replace(/^\./, '').trim();
        if (cleaned) segments.push(cleaned);
      }
    }
  }
  return segments;
}

// Exemplo (trecho problemático da imagem/JSON)
const sample = `1 - Com o auxilio de um batedor de carne esmague, separadamente, alhos descascados, capim limão e gengibre. Reserve-os separados. Em uma panela grande coloque óleo, cebola roxa cortada em cubos médios e leve ao fogo médio por 5 minutos ou até dourar. Adicione o alho esmagado e refogue por 3 minutos. Acrescente açúcar mascavo, suco de laranja, vinagre de xerez, melado e cozinhe por 3 minutos. Despeje mel, junte o capim limão e o gengibre esmagados acima, mostarda (tipo Dijon), molho inglês (tipo Worcestershire), catchup, tomate picado e cozinhe por 30 minutos em fogo baixo. Depois deste tempo tempere com sal.`;

console.log('Input sample:\n', sample.slice(0, 400), '...\n');
const entries = splitAfroditeEntries([sample]);
console.log('\nsplitAfroditeEntries ->', entries.length, 'entries');
entries.forEach((e, i) => console.log(i + 1, '-', e));

const combined = entries.join('\n');
const instr = formatInstructions(combined);
console.log('\nformatInstructions ->', instr.length, 'instructions');
instr.forEach((s, i) => console.log(i + 1, '-', s));
