/* eslint-env node */
/* global console, process */
import dbConnect from './connect.js';
import Cliente from './models/Cliente.js';
import Colaborador from './models/Colaborador.js';
import Action from './models/Action.js';
import ContasAPagar from './models/ContasAPagar.js';
import ContasAReceber from './models/ContasAReceber.js';

function pad4(n) { return String(n).padStart(4, '0'); }
function addDays(d, days) { const x = new Date(d); x.setDate(x.getDate() + days); return x; }
function weekendAdjust(d) { const x = new Date(d); const day = x.getDay(); if (day === 6) x.setDate(x.getDate() + 2); if (day === 0) x.setDate(x.getDate() + 1); return x; }
function computeDueFrom(start) { return weekendAdjust(addDays(start, 15)); }
function pick(arr, n = 1) { const a = arr.slice(); const out = []; while (n-- > 0 && a.length) { out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]); } return out; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function money(min, max) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }

async function seed() {
  await dbConnect();
  console.log('Connected');

  // Clean collections except users and ContaFixa
  await Cliente.deleteMany({});
  await Colaborador.deleteMany({});
  await Action.deleteMany({});
  await ContasAPagar.deleteMany({});
  await ContasAReceber.deleteMany({});

  // Seed Clientes (specified)
  const clienteNames = [
    'CocaCola',
    'Uberlandia Refrescos',
    'Flavio Calcados',
    'Unitri',
    'Ambev',
    'Politriz',
    'Rede Bandeirantes',
  ];
  const clientesPayload = clienteNames.map((nome, i) => ({
    codigo: pad4(i + 1),
    nome,
    endereco: `Rua ${i + 1}, ${100 + i}`,
    cidade: 'Uberlândia',
    uf: 'MG',
    telefone: `34 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
    email: `${nome.toLowerCase().replace(/\s+/g, '')}@exemplo.com`,
    nomeContato: 'Contato',
    tipo: 'Empresa',
    cnpjCpf: `${randomInt(10, 99)}.${randomInt(100, 999)}.${randomInt(100, 999)}/0001-${randomInt(10, 99)}`,
  }));
  const clientes = await Cliente.insertMany(clientesPayload);

  // Seed Colaboradores: 12 PF + 3 companies
  const firstNames = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gustavo', 'Helena', 'Igor', 'Júlia', 'Kaio', 'Larissa', 'Marcelo', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sofia', 'Thiago', 'Vitória'];
  const lastNames = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nunes', 'Cardoso'];
  const bancos = ['Banco do Brasil', 'Caixa', 'Itaú', 'Bradesco', 'Santander'];
  const ufs = ['MG', 'SP', 'GO'];
  const pfColaboradores = Array.from({ length: 12 }).map((_, idx) => {
    const nome = `${firstNames[randomInt(0, firstNames.length - 1)]} ${lastNames[randomInt(0, lastNames.length - 1)]}`;
    const banco = bancos[randomInt(0, bancos.length - 1)];
    const conta = `${randomInt(1000, 9999)}-${randomInt(0, 9)}`;
    return {
      codigo: pad4(1001 + idx),
      nome,
      empresa: '',
      pix: `${nome.toLowerCase().replace(/[^a-z]/g, '')}@pix.com`,
      banco,
      conta,
      uf: ufs[randomInt(0, ufs.length - 1)],
      telefone: `34 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
      email: `${nome.toLowerCase().replace(/\s+/g, '.')}@colaborador.com`,
      tipo: 'Pessoa Fisica',
      cnpjCpf: `${randomInt(100, 999)}.${randomInt(100, 999)}.${randomInt(100, 999)}-${randomInt(10, 99)}`,
    };
  });
  const companies = [
    { codigo: pad4(2001), nome: 'Transporte Rápido', empresa: 'Transporte Rápido LTDA', pix: 'transporte@pix.com', banco: 'Santander', conta: '1234-5', uf: 'MG', telefone: '34 98888-1111', email: 'contato@transporte.com', tipo: 'Pessoa Juridica', cnpjCpf: '11.111.111/0001-11' },
    { codigo: pad4(2002), nome: 'Catering Saboroso', empresa: 'Catering Saboroso LTDA', pix: 'catering@pix.com', banco: 'Itaú', conta: '5678-9', uf: 'MG', telefone: '34 98888-2222', email: 'contato@catering.com', tipo: 'Pessoa Juridica', cnpjCpf: '22.222.222/0001-22' },
    { codigo: pad4(2003), nome: 'Guia Turístico Pro', empresa: 'Guia Turístico Pro ME', pix: 'guia@pix.com', banco: 'Bradesco', conta: '2468-0', uf: 'MG', telefone: '34 98888-3333', email: 'contato@guiapro.com', tipo: 'Pessoa Juridica', cnpjCpf: '33.333.333/0001-33' },
  ];
  const colaboradores = await Colaborador.insertMany([...pfColaboradores, ...companies]);

  // Build quick maps
  const pfList = colaboradores.filter(s => (s.tipo || '').toLowerCase().includes('fisica'));
  const companyList = colaboradores.filter(s => (s.tipo || '').toLowerCase() === 'pessoa juridica');

  // Create 30 actions across past/present/future
  const today = new Date();
  const buckets = [
    { name: 'past', base: addDays(today, -45), count: 10 },
    { name: 'present', base: addDays(today, -1), count: 10 },
    { name: 'future', base: addDays(today, 20), count: 10 },
  ];

  const createdActions = [];
  for (const bucket of buckets) {
    for (let i = 0; i < bucket.count; i++) {
      const start = addDays(bucket.base, randomInt(-7, 7));
      const end = addDays(start, randomInt(0, 3));
      const due = computeDueFrom(start);
      const client = clientes[randomInt(0, clientes.length - 1)];
      const staffCount = randomInt(1, Math.min(3, pfList.length));
      const staffSelected = pick(pfList, staffCount);
      const staff = staffSelected.map(s => {
        const usePix = Math.random() < 0.6; // prefer PIX
        const pgt = usePix ? 'PIX' : 'TED';
        return {
          name: s.nome,
          value: money(400, 1800),
          pix: usePix ? (s.pix || `${s.nome.toLowerCase().replace(/[^a-z]/g, '')}@pix.com`) : '',
          bank: !usePix ? `${s.banco || 'Banco'} ${s.conta || '0000-0'}`.trim() : '',
          pgt,
          vencimento: due,
        };
      });

      // Costs: 0-2, link to companies
      const costCount = randomInt(0, 2);
      const costTypes = ['Transporte', 'Alimentação', 'Guia'];
      const costs = Array.from({ length: costCount }).map(() => {
        const comp = companyList[randomInt(0, companyList.length - 1)];
        const desc = costTypes[randomInt(0, costTypes.length - 1)];
        const methodRoll = Math.random();
        let pgt = 'BOLETO';
        if (methodRoll < 0.33) pgt = 'PIX'; else if (methodRoll < 0.66) pgt = 'TED'; else if (methodRoll < 0.85) pgt = 'DINHEIRO';
        return {
          description: desc,
          value: money(120, 1200),
          pgt,
          pix: pgt === 'PIX' ? (comp.pix || 'empresa@pix.com') : '',
          bank: pgt === 'TED' ? `${comp.banco || 'Banco'} ${comp.conta || '0000-0'}` : '',
          vencimento: due,
          colaboradorId: comp._id,
          vendorName: '',
          vendorEmpresa: '',
        };
      });

      const action = await Action.create({
        name: `Ação ${bucket.name} #${i + 1}`,
        client: client._id,
        date: start,
        startDate: start,
        endDate: end,
        paymentMethod: 'PIX',
        dueDate: due,
        staff,
        costs,
        createdBy: 'seed',
      });
      createdActions.push(action);

      // Create contas a pagar per staff and cost with mixed statuses
      const reportDate = due;
      const ops = [];
      for (const st of staff) {
        const status = Math.random() < 0.35 ? 'PAGO' : 'ABERTO';
        ops.push({ updateOne: { filter: { actionId: action._id, staffName: st.name }, update: { $setOnInsert: { actionId: action._id, staffName: st.name }, $set: { reportDate, status } }, upsert: true } });
      }
      for (const ct of action.costs) {
        const status = Math.random() < 0.35 ? 'PAGO' : 'ABERTO';
        ops.push({ updateOne: { filter: { actionId: action._id, costId: ct._id }, update: { $setOnInsert: { actionId: action._id, costId: ct._id }, $set: { reportDate, status, colaboradorId: ct.colaboradorId || undefined } }, upsert: true } });
      }
      if (ops.length) await ContasAPagar.bulkWrite(ops);

      // Optionally seed contas a receber per action (kept simple)
      try {
        await ContasAReceber.create({ actionId: action._id, clientId: client._id, reportDate: due, status: 'ABERTO' });
      } catch { /* ignore */ }
    }
  }

  console.log(`Seed completed: ${clientes.length} clientes, ${colaboradores.length} colaboradores, ${createdActions.length} ações.`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
