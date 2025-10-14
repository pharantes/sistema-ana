import { test, expect } from '@playwright/test';

// Adjust baseURL if your dev server runs on a different port
const BASE = 'http://localhost:3000';

// Helper to capture keystroke-by-keystroke values
async function captureTypingValues(locator, seq, page) {
  const seen = [];
  for (const ch of seq) {
    await locator.type(ch, { delay: 50 });
    // small wait to allow component formatting to run
    await page.waitForTimeout(80);
    const v = await locator.inputValue();
    seen.push(v);
  }
  return seen;
}

test.describe('Currency & Date interactive checks', () => {
  test('login, type currency and date inputs and print step values', async ({ page }) => {
    await page.goto(BASE + '/login');
    // Fill login form (the app uses username/password inputs as plain inputs)
    await page.fill('input[type=text]', 'admin');
    await page.fill('input[type=password]', 'adminpassword');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button:has-text("Entrar")'),
    ]);

    // Wait for root to render
    await page.waitForSelector('nav');

    // Open the 'Nova Ação' modal on /acoes and add a cost row so currency/date inputs appear
    await page.goto(BASE + '/acoes');
    // Click the top 'Nova Ação' button to open modal
    await page.click('button:has-text("Nova Ação")');
    // Wait for modal title to appear
    await page.waitForSelector('text=Nova Ação');
    // Click 'Adicionar custo' inside the modal to add a cost row
    await page.click('button:has-text("Adicionar custo")');
    // Wait for the currency input to appear inside the modal (inputmode=decimal)
    const currencyLocator = page.locator('div[role="dialog"] input[inputmode="decimal"]');
    await expect(currencyLocator.first()).toBeVisible({ timeout: 8000 });
    // Clear any existing value
    await currencyLocator.first().fill('');

    // Type character-by-character and capture displayed value
    const currencySeq = ['1', '2', '3', '4', '5'];
    const currencyObserved = await captureTypingValues(currencyLocator, currencySeq, page);
    console.log('Currency typing observed:', currencyObserved);

    // Now blur and read final formatted value
    await currencyLocator.blur();
    await page.waitForTimeout(100);
    const currencyFinal = await currencyLocator.inputValue();
    console.log('Currency final on blur:', currencyFinal);

    // The BRDateInput for the new cost should now be present in the modal
    const dateInput = page.locator('div[role="dialog"] input[inputmode="numeric"][placeholder="dd/mm/aaaa"]');
    await expect(dateInput.first()).toBeVisible({ timeout: 8000 });
    await dateInput.first().fill('');
    const dateSeq = ['0', '1', '0', '2', '2', '0', '2', '1'];
    const dateObserved = await captureTypingValues(dateInput, dateSeq, page);
    console.log('Date typing observed:', dateObserved);

    // Final ISO value should be in the hidden date input (type=date)
    const hidden = page.locator('input[type="date"][aria-hidden="true"]');
    if ((await hidden.count()) > 0) {
      const iso = await hidden.first().inputValue();
      console.log('Hidden native date value (ISO):', iso);
    } else {
      console.log('Hidden native date input not found');
    }

    // Keep assertions minimal: ensure we produced some output
    expect(currencyObserved.length).toBeGreaterThan(0);
    expect(dateObserved.length).toBeGreaterThan(0);
  });
});
