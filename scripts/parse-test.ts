const { splitAfroditeEntries, formatInstructions } = require('../src/App');

// Amostra curta extraída do JSON original (exemplo de entrada problemática)
const sample = `1 - Com o auxilio de um batedor de carne esmague, separadamente, alhos descascados, capim limão e gengibre. Reserve-os separados. Em uma panela grande coloque óleo, cebola roxa cortada em cubos médios e leve ao fogo médio por 5 minutos ou até dourar. Adicione o alho esmagado e refogue por 3 minutos. Acrescente açúcar mascavo, suco de laranja, vinagre de xerez, melado e cozinhe por 3 minutos. Despeje mel, junte o capim limão e o gengibre esmagados acima, mostarda (tipo Dijon), molho inglês (tipo Worcestershire), catchup, tomate picado e cozinhe por 30 minutos em fogo baixo. Depois deste tempo tempere com sal.`;

console.log('Input sample:\n', sample.slice(0, 400), '...\n');

const entries = splitAfroditeEntries([sample]);
console.log('splitAfroditeEntries ->', entries.length, 'entries');
entries.forEach((e, i) => console.log(i + 1, e.slice(0, 200)));

console.log('\nformatInstructions on combined instructions:');
const combined = entries.join('\n');
const instr = formatInstructions(combined);
console.log('formatInstructions ->', instr.length, 'instructions');
instr.forEach((s, i) => console.log(i + 1, s));
