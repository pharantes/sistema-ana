#!/usr/bin/env node
/**
 * Direct Database Test - Verify PDF Data Structure
 * Tests that the data in MongoDB has the correct structure for PDF generation
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-ana';

async function testContasAPagar(db) {
  console.log('\n📊 Testing ContasAPagar Data Structure');
  console.log('-'.repeat(60));

  const items = await db.collection('contasapagar')
    .find({ testData: true })
    .limit(5)
    .toArray();

  let passed = 0;
  let failed = 0;

  for (const item of items) {
    // Test 1: Has colaboradorId
    if (item.colaboradorId) {
      // Fetch colaborador
      const colab = await db.collection('colaboradores').findOne({ _id: item.colaboradorId });

      if (colab && colab.pix && colab.banco) {
        console.log(`✓ Item ${item._id}: ColaboradorId linked to ${colab.nome}`);
        console.log(`  PIX: ${colab.pix}, Banco: ${colab.banco}`);
        passed++;
      } else {
        console.log(`✗ Item ${item._id}: Colaborador missing PIX/Banco`);
        failed++;
      }
    } else {
      console.log(`✗ Item ${item._id}: No colaboradorId`);
      failed++;
    }
  }

  console.log(`\nContasAPagar: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

async function testActions(db) {
  console.log('\n📊 Testing Actions Staff Data');
  console.log('-'.repeat(60));

  const actions = await db.collection('actions')
    .find({ testData: true })
    .limit(5)
    .toArray();

  let passed = 0;
  let failed = 0;

  for (const action of actions) {
    if (action.staff && action.staff.length > 0) {
      let hasValidStaff = false;
      for (const staff of action.staff) {
        if (staff.name && staff.pix && staff.bank) {
          hasValidStaff = true;
          console.log(`✓ Action ${action.name}: ${staff.name}`);
          console.log(`  PIX: ${staff.pix}, Bank: ${staff.bank}`);
          break;
        }
      }
      if (hasValidStaff) {
        passed++;
      } else {
        console.log(`✗ Action ${action.name}: Staff missing PIX/Bank data`);
        failed++;
      }
    } else {
      console.log(`✗ Action ${action.name}: No staff array`);
      failed++;
    }
  }

  console.log(`\nActions: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

async function testContasAReceber(db) {
  console.log('\n📊 Testing ContasAReceber Structure');
  console.log('-'.repeat(60));

  const items = await db.collection('contasareceber')
    .find({ testData: true })
    .limit(5)
    .toArray();

  let passed = 0;
  let failed = 0;

  for (const item of items) {
    const action = await db.collection('actions').findOne({ _id: item.actionId });

    if (action && action.staff && action.staff.length > 0) {
      console.log(`✓ Receivable ${item._id} links to action with ${action.staff.length} staff`);
      const firstStaff = action.staff[0];
      console.log(`  Staff: ${firstStaff.name}, PIX: ${firstStaff.pix}`);
      passed++;
    } else {
      console.log(`✗ Receivable ${item._id}: No action or staff`);
      failed++;
    }
  }

  console.log(`\nContasAReceber: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

async function main() {
  console.log('\n🧪 Direct Database Tests for PDF Reports\n');
  console.log('='.repeat(60));

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    const results = {
      contasAPagar: await testContasAPagar(db),
      actions: await testActions(db),
      contasAReceber: await testContasAReceber(db),
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary\n');

    let totalPassed = 0;
    let totalFailed = 0;

    Object.entries(results).forEach(([test, result]) => {
      totalPassed += result.passed;
      totalFailed += result.failed;
      console.log(`${test}: ${result.passed} passed, ${result.failed} failed`);
    });

    console.log(`\nTotal: ${totalPassed} passed, ${totalFailed} failed`);

    if (totalFailed === 0) {
      console.log('\n✅ ALL DATABASE TESTS PASSED!');
      console.log('\n📋 Database structure is correct for PDF generation.');
      console.log('Next: Verify helpers attach colaboradorData correctly.\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${totalFailed} tests failed.\n`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
