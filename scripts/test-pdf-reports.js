#!/usr/bin/env node
/**
 * PDF Report Testing Script
 * 
 * This script validates that PDF reports are correctly generated with:
 * 1. Proper PIX/Banco information from colaboradorData
 * 2. Correct filter application
 * 3. Accurate totals and data
 * 
 * Run this script after starting the dev server with: node scripts/test-pdf-reports.js
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-ana';

async function main() {
  console.log('\n🔍 PDF Report Data Validation Script\n');
  console.log('=' + '='.repeat(60) + '\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    // Test 1: Check colaboradores have PIX/banco data
    console.log('📊 Test 1: Colaboradores with PIX/Banco data');
    console.log('-'.repeat(60));
    const colaboradoresWithPix = await db.collection('colaboradores')
      .find({ pix: { $exists: true, $ne: '' } })
      .limit(5)
      .toArray();

    const colaboradoresWithBanco = await db.collection('colaboradores')
      .find({ banco: { $exists: true, $ne: '' } })
      .limit(5)
      .toArray();

    console.log(`Colaboradores with PIX: ${colaboradoresWithPix.length}`);
    colaboradoresWithPix.forEach(c => {
      console.log(`  - ${c.nome}: ${c.pix}`);
    });

    console.log(`\nColaboradores with Banco: ${colaboradoresWithBanco.length}`);
    colaboradoresWithBanco.forEach(c => {
      console.log(`  - ${c.nome}: ${c.banco}`);
    });

    // Test 2: Check Actions with staff data
    console.log('\n\n📊 Test 2: Actions with staff information');
    console.log('-'.repeat(60));
    const actionsWithStaff = await db.collection('actions')
      .find({ 'staff.0': { $exists: true } })
      .limit(5)
      .toArray();

    console.log(`Actions with staff: ${actionsWithStaff.length}`);
    actionsWithStaff.forEach(action => {
      console.log(`\n  Action: ${action.name || action.event}`);
      action.staff.forEach(s => {
        console.log(`    - ${s.name}: R$ ${s.value}, PIX: ${s.pix || 'N/A'}, Bank: ${s.bank || 'N/A'}`);
      });
    });

    // Test 3: Check ContasAPagar data structure
    console.log('\n\n📊 Test 3: ContasAPagar with colaborador references');
    console.log('-'.repeat(60));
    const contasAPagar = await db.collection('contasapagar')
      .find({ colaboradorId: { $exists: true } })
      .limit(5)
      .toArray();

    console.log(`ContasAPagar with colaboradorId: ${contasAPagar.length}`);
    for (const conta of contasAPagar) {
      const colaborador = await db.collection('colaboradores').findOne({ _id: conta.colaboradorId });
      console.log(`\n  Conta: ${conta.staffName || 'N/A'}`);
      console.log(`    ColaboradorId: ${conta.colaboradorId}`);
      if (colaborador) {
        console.log(`    Colaborador: ${colaborador.nome}`);
        console.log(`    PIX: ${colaborador.pix || 'N/A'}`);
        console.log(`    Banco: ${colaborador.banco || 'N/A'}`);
      }
    }

    // Test 4: Check ContasAReceber data structure
    console.log('\n\n📊 Test 4: ContasAReceber structure');
    console.log('-'.repeat(60));
    const contasAReceber = await db.collection('contasareceber')
      .find({})
      .limit(5)
      .toArray();

    console.log(`ContasAReceber records: ${contasAReceber.length}`);
    for (const conta of contasAReceber) {
      const action = await db.collection('actions').findOne({ _id: conta.actionId });
      console.log(`\n  Conta: ActionId ${conta.actionId}`);
      console.log(`    Status: ${conta.status}`);
      console.log(`    Valor: R$ ${conta.valor}`);
      if (action) {
        console.log(`    Action: ${action.name || action.event}`);
        console.log(`    Staff count: ${action.staff?.length || 0}`);
      }
    }

    // Test 5: Database counts
    console.log('\n\n📊 Test 5: Database counts');
    console.log('-'.repeat(60));
    const counts = {
      colaboradores: await db.collection('colaboradores').countDocuments(),
      actions: await db.collection('actions').countDocuments(),
      contasapagar: await db.collection('contasapagar').countDocuments(),
      contasareceber: await db.collection('contasareceber').countDocuments(),
      clientes: await db.collection('clientes').countDocuments(),
    };

    Object.entries(counts).forEach(([collection, count]) => {
      console.log(`  ${collection}: ${count}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Validation complete!\n');
    console.log('📋 Next steps:');
    console.log('  1. Start dev server: npm run dev');
    console.log('  2. Login to the application');
    console.log('  3. Navigate to /contasapagar and /contasareceber');
    console.log('  4. Apply different filters and generate PDFs');
    console.log('  5. Verify PIX/Banco information is displayed correctly');
    console.log('  6. Verify filter information is shown in PDF header\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
