#!/usr/bin/env node
/**
 * Generate Test Data for PDF Reports
 * 
 * Creates realistic fake data for testing PDF generation:
 * - Clientes with various names
 * - Colaboradores with PIX and banco information
 * - Actions with staff assignments
 * - ContasAPagar with colaborador references
 * - ContasAReceber with different statuses
 */

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-ana';

// Test data templates
const CLIENTES = [
  { nome: 'Maria Silva Eventos', codigo: 'MSE001', pix: '11987654321', banco: 'Banco do Brasil', conta: '12345-6' },
  { nome: 'João Carlos Produções', codigo: 'JCP002', pix: 'joao.carlos@email.com', banco: 'Itaú', conta: '23456-7' },
  { nome: 'Ana Paula Festas', codigo: 'APF003', pix: '11976543210', banco: 'Bradesco', conta: '34567-8' },
  { nome: 'Carlos Eduardo Shows', codigo: 'CES004', pix: 'carlos.shows@gmail.com', banco: 'Santander', conta: '45678-9' },
  { nome: 'Fernanda Costa Eventos', codigo: 'FCE005', pix: '11965432109', banco: 'Caixa', conta: '56789-0' },
];

const COLABORADORES = [
  { nome: 'Ricardo Fotógrafo', empresa: 'Foto Perfeita', codigo: 'FOT001', pix: '11999887766', banco: 'Nubank', conta: '0001-1' },
  { nome: 'Julia Cinegrafista', empresa: 'Vídeo Pro', codigo: 'CIN001', pix: 'julia.video@email.com', banco: 'Inter', conta: '0002-2' },
  { nome: 'Pedro DJ', empresa: 'DJ Pedro Som', codigo: 'DJ001', pix: '11988776655', banco: 'Banco do Brasil', conta: '0003-3' },
  { nome: 'Carla Decoradora', empresa: 'Decor Arte', codigo: 'DEC001', pix: 'carla.decor@gmail.com', banco: 'Itaú', conta: '0004-4' },
  { nome: 'Roberto Iluminador', empresa: 'Luz Ideal', codigo: 'ILU001', pix: '11977665544', banco: 'Bradesco', conta: '0005-5' },
  { nome: 'Sandra Buffet', empresa: 'Delícias Buffet', codigo: 'BUF001', pix: 'sandra.buffet@email.com', banco: 'Santander', conta: '0006-6' },
  { nome: 'Marcos Segurança', empresa: 'Segurança Total', codigo: 'SEG001', pix: '11966554433', banco: 'Caixa', conta: '0007-7' },
  { nome: 'Patricia Cerimonial', empresa: 'Cerimonial Chic', codigo: 'CER001', pix: 'patricia.cerimonial@gmail.com', banco: 'Nubank', conta: '0008-8' },
];

const ACTION_TYPES = [
  'Casamento Premium',
  'Festa de 15 Anos',
  'Formatura',
  'Evento Corporativo',
  'Aniversário',
  'Casamento Simples',
  'Festa Infantil',
  'Confraternização',
];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateBRPhone() {
  return `119${randomInt(10000000, 99999999)}`;
}

function generatePixKey(index) {
  const types = ['phone', 'email', 'cpf', 'random'];
  const type = types[index % types.length];

  switch (type) {
    case 'phone':
      return generateBRPhone();
    case 'email':
      return `usuario${index}@email.com`;
    case 'cpf':
      return `${randomInt(100, 999)}.${randomInt(100, 999)}.${randomInt(100, 999)}-${randomInt(10, 99)}`;
    case 'random':
      return `${Math.random().toString(36).substring(2, 15)}`;
  }
}

async function clearTestData(db) {
  console.log('🧹 Clearing existing test data...');

  // Mark test data with a flag so we can identify it
  await db.collection('clientes').deleteMany({ testData: true });
  await db.collection('colaboradores').deleteMany({ testData: true });
  await db.collection('actions').deleteMany({ testData: true });
  await db.collection('contasapagar').deleteMany({ testData: true });
  await db.collection('contasareceber').deleteMany({ testData: true });

  console.log('✅ Test data cleared\n');
}

async function generateTestData(db) {
  console.log('📊 Generating test data for PDF reports...\n');

  // Insert Clientes
  console.log('Creating test clientes...');
  const clienteIds = [];
  for (const cliente of CLIENTES) {
    const result = await db.collection('clientes').insertOne({
      ...cliente,
      formaPgt: randomFromArray(['PIX', 'TED', 'Boleto']),
      testData: true,
      createdAt: new Date(),
    });
    clienteIds.push(result.insertedId);
    console.log(`  ✓ ${cliente.nome}`);
  }

  // Insert Colaboradores
  console.log('\nCreating test colaboradores...');
  const colaboradorIds = [];
  const colaboradorNames = [];
  for (const colab of COLABORADORES) {
    const result = await db.collection('colaboradores').insertOne({
      ...colab,
      testData: true,
      createdAt: new Date(),
    });
    colaboradorIds.push(result.insertedId);
    colaboradorNames.push(colab.nome);
    console.log(`  ✓ ${colab.nome} - PIX: ${colab.pix}, Banco: ${colab.banco}`);
  }

  // Generate Actions with staff
  console.log('\nCreating test actions...');
  const actionIds = [];
  const startDate = new Date('2025-12-01');
  const endDate = new Date('2026-02-28');

  for (let i = 0; i < 15; i++) {
    const actionDate = randomDate(startDate, endDate);
    const numStaff = randomInt(2, 5);
    const selectedStaff = [];

    // Select random staff with PIX/banco info
    for (let j = 0; j < numStaff; j++) {
      const colab = COLABORADORES[j % COLABORADORES.length];
      const vencimento = new Date(actionDate);
      vencimento.setDate(vencimento.getDate() + randomInt(5, 30));

      selectedStaff.push({
        name: colab.nome,
        value: randomInt(500, 3000),
        pix: colab.pix,
        bank: colab.banco,
        pgt: randomFromArray(['PIX', 'TED']),
        vencimento: vencimento,
      });
    }

    const result = await db.collection('actions').insertOne({
      name: randomFromArray(ACTION_TYPES),
      event: randomFromArray(ACTION_TYPES),
      client: randomFromArray(clienteIds),
      date: actionDate,
      startDate: actionDate,
      endDate: new Date(actionDate.getTime() + 5 * 60 * 60 * 1000), // 5 hours later
      staff: selectedStaff,
      costs: [],
      createdBy: 'test-admin',
      testData: true,
      createdAt: new Date(),
    });
    actionIds.push(result.insertedId);
    console.log(`  ✓ Action ${i + 1}: ${selectedStaff.length} staff members`);
  }

  // Generate ContasAPagar
  console.log('\nCreating test contas a pagar...');
  let contasCount = 0;
  for (let i = 0; i < 20; i++) {
    const actionId = randomFromArray(actionIds);
    const action = await db.collection('actions').findOne({ _id: actionId });
    const colaboradorIdx = i % COLABORADORES.length;
    const colab = COLABORADORES[colaboradorIdx];
    const colaboradorId = colaboradorIds[colaboradorIdx];

    const reportDate = randomDate(startDate, endDate);
    const vencimento = new Date(reportDate);
    vencimento.setDate(vencimento.getDate() + randomInt(5, 30));

    const status = randomFromArray(['ABERTO', 'ABERTO', 'ABERTO', 'PAGO']); // 75% open

    await db.collection('contasapagar').insertOne({
      actionId: actionId,
      reportDate: reportDate,
      status: status,
      staffName: action.staff[0]?.name || colab.nome,
      colaboradorId: colaboradorId,
      vencimento: vencimento,
      testData: true,
      createdAt: new Date(),
    });
    contasCount++;
  }
  console.log(`  ✓ Created ${contasCount} contas a pagar`);

  // Generate ContasAReceber
  console.log('\nCreating test contas a receber...');
  let receberCount = 0;
  for (const actionId of actionIds) {
    const action = await db.collection('actions').findOne({ _id: actionId });
    const totalValue = action.staff.reduce((sum, s) => sum + s.value, 0) * 1.3; // 30% markup

    const vencimento = new Date(action.date);
    vencimento.setDate(vencimento.getDate() + randomInt(10, 45));

    const status = randomFromArray(['ABERTO', 'ABERTO', 'RECEBIDO']); // 66% open
    const dataRecebimento = status === 'RECEBIDO' ? randomDate(vencimento, new Date()) : null;

    await db.collection('contasareceber').insertOne({
      actionId: actionId,
      clientId: action.client,
      valor: totalValue,
      status: status,
      dataVencimento: vencimento,
      dataRecebimento: dataRecebimento,
      reportDate: action.date,
      testData: true,
      createdAt: new Date(),
    });
    receberCount++;
  }
  console.log(`  ✓ Created ${receberCount} contas a receber`);

  // Generate Fixed Accounts (Contas Fixas)
  console.log('\nCreating test contas fixas...');
  const fixedAccounts = [
    { name: 'Aluguel Escritório', empresa: 'Imobiliária Central', tipo: 'mensal', valor: 2500 },
    { name: 'Internet e Telefone', empresa: 'Telecom Brasil', tipo: 'mensal', valor: 350 },
    { name: 'Contador', empresa: 'Contabilidade Silva', tipo: 'mensal', valor: 800 },
    { name: 'Seguro Equipamentos', empresa: 'Seguradora Top', tipo: 'anual', valor: 1200 },
    { name: 'Software Management', empresa: 'TechSoft', tipo: 'mensal', valor: 450 },
  ];

  for (const fixed of fixedAccounts) {
    const vencimento = new Date('2026-02-10');
    const status = randomFromArray(['ABERTO', 'PAGO']);
    const paidDate = status === 'PAGO' ? new Date('2026-02-05') : null;

    await db.collection('contasfixas').insertOne({
      ...fixed,
      vencimento: vencimento,
      status: status,
      paidDate: paidDate,
      testData: true,
      createdAt: new Date(),
    });
  }
  console.log(`  ✓ Created ${fixedAccounts.length} contas fixas`);

  return {
    clientes: clienteIds.length,
    colaboradores: colaboradorIds.length,
    actions: actionIds.length,
    contasAPagar: contasCount,
    contasAReceber: receberCount,
    contasFixas: fixedAccounts.length,
  };
}

async function main() {
  console.log('\n🧪 PDF Reports Test Data Generator\n');
  console.log('=' + '='.repeat(60) + '\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    // Clear existing test data
    await clearTestData(db);

    // Generate new test data
    const counts = await generateTestData(db);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test data generation complete!\n');
    console.log('📊 Summary:');
    Object.entries(counts).forEach(([key, count]) => {
      console.log(`  ${key}: ${count}`);
    });

    console.log('\n📋 Next steps:');
    console.log('  1. Start dev server: npm run dev');
    console.log('  2. Login to application');
    console.log('  3. Test PDF generation:');
    console.log('     - /contasapagar → Generate both PDFs');
    console.log('     - /contasareceber → Generate PDF');
    console.log('  4. Verify PIX/Banco columns are populated');
    console.log('  5. Verify filters work correctly\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
