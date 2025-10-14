import { validateContasAReceberUpsert } from '../lib/validators/contasareceber.js';

function test(payload, label) {
  try {
    const out = validateContasAReceberUpsert(payload);
    console.log(label + ' -> OK:', out);
  } catch (e) {
    console.log(label + ' -> ERROR:', e.message);
  }
}

// Payload where qtdeParcela is an empty string (what the server originally received)
const payloadWithEmpty = {
  actionId: '0123456789abcdef01234567',
  qtdeParcela: '',
  valor: '123.45',
};

// Cleaned payload: qtdeParcela removed, valor numeric
const payloadClean = {
  actionId: '0123456789abcdef01234567',
  valor: 123.45,
};

console.log('Running validator tests...');
test(payloadWithEmpty, 'empty-qtdeParcela');
test(payloadClean, 'clean-payload');
