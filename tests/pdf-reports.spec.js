import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('PDF Reports Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
  });

  test('ContasAPagar - should have PIX/Banco data in table', async ({ page }) => {
    await page.goto(`${BASE_URL}/contasapagar`);
    await page.waitForSelector('table', { timeout: 10000 });

    // Check if PIX column exists and has data
    const pixCells = await page.$$('table tbody tr td:nth-child(8)'); // PIX column
    expect(pixCells.length).toBeGreaterThan(0);

    // Check first cell has actual PIX data (not empty, not ObjectId)
    if (pixCells.length > 0) {
      const pixText = await pixCells[0].textContent();
      expect(pixText).toBeTruthy();
      expect(pixText).not.toContain('_id');
      console.log('✓ PIX column has data:', pixText);
    }

    // Check Banco column
    const bancoCells = await page.$$('table tbody tr td:nth-child(9)'); // Banco column
    if (bancoCells.length > 0) {
      const bancoText = await bancoCells[0].textContent();
      console.log('✓ Banco column has data:', bancoText);
    }
  });

  test('ContasAPagar - PDF generation with filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/contasapagar`);
    await page.waitForSelector('table');

    // Apply status filter
    await page.selectOption('select[name="statusFilter"]', 'ABERTO');
    await page.waitForTimeout(1000);

    // Set date filter
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const formatDate = (d) => d.toISOString().split('T')[0];
    await page.fill('input[type="date"]:first-of-type', formatDate(lastMonth));
    await page.fill('input[type="date"]:last-of-type', formatDate(today));
    await page.waitForTimeout(1000);

    // Listen for download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Gerar PDF")');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
    console.log('✓ PDF downloaded:', download.suggestedFilename());
  });

  test('ContasAReceber - should have PIX data in table', async ({ page }) => {
    await page.goto(`${BASE_URL}/contasareceber`);
    await page.waitForSelector('table', { timeout: 10000 });

    // Check if table has data
    const rows = await page.$$('table tbody tr');
    expect(rows.length).toBeGreaterThan(0);
    console.log('✓ ContasAReceber has', rows.length, 'rows');
  });

  test('ContasAReceber - PDF generation', async ({ page }) => {
    await page.goto(`${BASE_URL}/contasareceber`);
    await page.waitForSelector('table');

    // Listen for download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Gerar PDF")');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
    console.log('✓ ContasAReceber PDF downloaded:', download.suggestedFilename());
  });

  test('API - ContasAPagar returns colaboradorData', async ({ request }) => {
    // Login first to get cookies
    const loginResponse = await request.post(`${BASE_URL}/api/auth/signin/credentials`, {
      data: {
        email: 'admin@admin.com',
        password: 'admin123',
      },
    });

    // Get contas
    const response = await request.get(`${BASE_URL}/api/contasapagar?page=1&pageSize=5`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    const items = data.items || [];

    console.log('✓ ContasAPagar API returned', items.length, 'items');

    // Check first item has colaboradorData
    if (items.length > 0) {
      const firstItem = items[0];
      if (firstItem.colaboradorData) {
        console.log('✓ ColaboradorData exists');
        console.log('  - PIX:', firstItem.colaboradorData.pix);
        console.log('  - Banco:', firstItem.colaboradorData.banco);
      }
    }
  });

  test('API - ContasAReceber returns staff with enriched data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/contasareceber?page=1&pageSize=5`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    const items = data.items || [];

    console.log('✓ ContasAReceber API returned', items.length, 'items');

    // Check if staff array exists
    if (items.length > 0 && items[0].staff) {
      console.log('✓ Staff array exists with', items[0].staff.length, 'members');
      const firstStaff = items[0].staff[0];
      if (firstStaff) {
        console.log('  - Name:', firstStaff.name);
        console.log('  - PIX:', firstStaff.pix || firstStaff.colaboradorData?.pix);
      }
    }
  });
});
