import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test('open contas a receber and capture modal', async ({ page }) => {
  await page.goto(BASE + '/login');
  await page.fill('input[type=text]', 'admin');
  await page.fill('input[type=password]', 'adminpassword');
  await page.click('button[type=submit]');
  await page.waitForURL('**/');

  await page.goto(BASE + '/contasareceber');
  // wait for table rows
  await page.waitForSelector('table tbody tr');
  // click first row to go to detail page (rows navigate when clicked)
  const firstRow = page.locator('table tbody tr').first();
  if (!firstRow) { test.skip(); return; }
  await firstRow.click();
  // wait for navigation to detail page
  await page.waitForURL('**/contasareceber/*');
  // click the Edit button on the detail page
  await page.click('button:has-text("Editar")');
  // Wait for modal dialog and title
  await page.waitForSelector('role=dialog >> text=Conta a Receber', { timeout: 15000 });
  // screenshot the modal area (dialog role)
  const modal = await page.locator('role=dialog');
  await modal.screenshot({ path: 'tmp/contas-receber-modal.png', timeout: 15000 });
  // also capture a focused crop of the two date inputs
  const dateInputs = await page.locator('role=dialog').locator('text=Data de vencimento').locator('..').locator('input[type=text], input[type=date], .PaddedInput');
  // if found, screenshot the container
  if (await dateInputs.count() > 0) {
    await dateInputs.first().screenshot({ path: 'tmp/contas-receber-date-input.png' });
  }
});
