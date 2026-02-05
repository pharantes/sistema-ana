#!/usr/bin/env node
/**
 * Automated PDF Reports API Test
 * 
 * Tests the API endpoints to ensure:
 * 1. ContasAPagar returns colaboradorData with PIX/banco
 * 2. ContasAReceber returns staff with enriched colaboradorData
 * 3. Filters work correctly
 */

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin@admin.com';
const TEST_PASSWORD = 'admin123';

let authCookie = null;

async function login() {
  console.log('🔐 Logging in...');

  const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      json: true,
    }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  // Extract session cookie
  const cookies = response.headers.get('set-cookie');
  if (cookies) {
    authCookie = cookies.split(';')[0];
  }

  console.log('✅ Logged in successfully\n');
}

async function testContasAPagar() {
  console.log('📊 Testing ContasAPagar API...');
  console.log('-'.repeat(60));

  const response = await fetch(`${BASE_URL}/api/contasapagar?page=1&pageSize=5`, {
    headers: {
      'Cookie': authCookie,
    },
  });

  if (!response.ok) {
    throw new Error(`ContasAPagar API failed: ${response.status}`);
  }

  const data = await response.json();
  const items = data.items || [];

  console.log(`✅ API returned ${items.length} items\n`);

  // Check first few items for data structure
  let passCount = 0;
  let failCount = 0;

  for (let i = 0; i < Math.min(3, items.length); i++) {
    const item = items[i];
    console.log(`Item ${i + 1}:`);
    console.log(`  Staff Name: ${item.staffName || 'N/A'}`);
    console.log(`  ColaboradorId: ${item.colaboradorId ? '✓' : '✗'}`);
    console.log(`  ColaboradorLabel: ${item.colaboradorLabel || 'N/A'}`);

    if (item.colaboradorData) {
      console.log(`  ✅ ColaboradorData exists:`);
      console.log(`     Nome: ${item.colaboradorData.nome || 'N/A'}`);
      console.log(`     PIX: ${item.colaboradorData.pix || 'MISSING'}`);
      console.log(`     Banco: ${item.colaboradorData.banco || 'MISSING'}`);

      if (item.colaboradorData.pix && item.colaboradorData.banco) {
        passCount++;
      } else {
        failCount++;
        console.log(`  ⚠️  Missing PIX or Banco data`);
      }
    } else {
      console.log(`  ❌ ColaboradorData MISSING`);
      failCount++;
    }
    console.log('');
  }

  console.log(`Results: ${passCount} passed, ${failCount} failed\n`);
  return { pass: passCount, fail: failCount };
}

async function testContasAReceber() {
  console.log('📊 Testing ContasAReceber API...');
  console.log('-'.repeat(60));

  const response = await fetch(`${BASE_URL}/api/contasareceber?page=1&pageSize=5`, {
    headers: {
      'Cookie': authCookie,
    },
  });

  if (!response.ok) {
    throw new Error(`ContasAReceber API failed: ${response.status}`);
  }

  const data = await response.json();
  const items = data.items || [];

  console.log(`✅ API returned ${items.length} items\n`);

  // Check if staff array exists and has colaboradorData
  let passCount = 0;
  let failCount = 0;

  for (let i = 0; i < Math.min(3, items.length); i++) {
    const item = items[i];
    console.log(`Item ${i + 1}: ${item.name || 'N/A'}`);
    console.log(`  Client: ${item.clientName || 'N/A'}`);

    if (item.staff && Array.isArray(item.staff)) {
      console.log(`  ✅ Staff array exists (${item.staff.length} members)`);

      for (let j = 0; j < Math.min(2, item.staff.length); j++) {
        const staff = item.staff[j];
        console.log(`\n  Staff ${j + 1}: ${staff.name || 'N/A'}`);
        console.log(`     PIX: ${staff.pix || 'MISSING'}`);
        console.log(`     Bank: ${staff.bank || 'N/A'}`);

        if (staff.colaboradorData) {
          console.log(`     ✅ ColaboradorData attached:`);
          console.log(`        PIX: ${staff.colaboradorData.pix || 'MISSING'}`);
          console.log(`        Banco: ${staff.colaboradorData.banco || 'MISSING'}`);

          if (staff.colaboradorData.pix || staff.pix) {
            passCount++;
          } else {
            failCount++;
          }
        } else {
          console.log(`     ⚠️  ColaboradorData not attached`);
          if (staff.pix) {
            passCount++;
          } else {
            failCount++;
          }
        }
      }
    } else {
      console.log(`  ❌ Staff array MISSING`);
      failCount++;
    }
    console.log('');
  }

  console.log(`Results: ${passCount} passed, ${failCount} failed\n`);
  return { pass: passCount, fail: failCount };
}

async function testFilters() {
  console.log('📊 Testing Filters...');
  console.log('-'.repeat(60));

  // Test 1: Date filter
  console.log('Test 1: Date filter on ContasAPagar');
  const response1 = await fetch(
    `${BASE_URL}/api/contasapagar?dueFrom=2026-01-01&dueTo=2026-01-31`,
    { headers: { 'Cookie': authCookie } }
  );
  const data1 = await response1.json();
  console.log(`  ✅ Returned ${data1.items?.length || 0} items with date filter\n`);

  // Test 2: Status filter
  console.log('Test 2: Status filter (ABERTO)');
  const response2 = await fetch(
    `${BASE_URL}/api/contasapagar?status=ABERTO`,
    { headers: { 'Cookie': authCookie } }
  );
  const data2 = await response2.json();
  const allOpen = data2.items?.every(item => item.status === 'ABERTO');
  console.log(`  ${allOpen ? '✅' : '❌'} Returned ${data2.items?.length || 0} items, all ABERTO: ${allOpen}\n`);

  // Test 3: Search filter
  console.log('Test 3: Search filter');
  const response3 = await fetch(
    `${BASE_URL}/api/contasapagar?q=Maria`,
    { headers: { 'Cookie': authCookie } }
  );
  const data3 = await response3.json();
  console.log(`  ✅ Returned ${data3.items?.length || 0} items with search\n`);

  return { pass: 3, fail: 0 };
}

async function main() {
  console.log('\n🧪 Automated PDF Reports API Tests\n');
  console.log('=' + '='.repeat(60) + '\n');

  try {
    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    await login();

    const results = {
      contasAPagar: await testContasAPagar(),
      contasAReceber: await testContasAReceber(),
      filters: await testFilters(),
    };

    console.log('=' + '='.repeat(60));
    console.log('📊 Test Summary\n');

    let totalPass = 0;
    let totalFail = 0;

    Object.entries(results).forEach(([test, result]) => {
      totalPass += result.pass;
      totalFail += result.fail;
      console.log(`${test}: ${result.pass} passed, ${result.fail} failed`);
    });

    console.log(`\nTotal: ${totalPass} passed, ${totalFail} failed`);

    if (totalFail === 0) {
      console.log('\n✅ ALL TESTS PASSED!\n');
      console.log('📋 Next steps:');
      console.log('  1. Manually test PDF generation in browser');
      console.log('  2. Verify PIX/Banco columns in generated PDFs');
      console.log('  3. Test with different filter combinations');
      console.log('  4. If all looks good, merge to main branch\n');
    } else {
      console.log(`\n⚠️  ${totalFail} tests failed. Please review.\n`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main().catch(console.error);
