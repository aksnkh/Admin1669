import { test, expect, type Page } from '@playwright/test';
const order = {
  id: 5000000000,
  mashine: 'لباسشویی',
  brand: 'سامسونگ',
  error: 'تخلیه آب',
  city: 'تهران',
  region: null,
  customerFamily: 'مشتری تست',
  customerID: 5000000001,
  repair: null,
  insertDate: '1405/07/25',
  tel: null,
  mobile: '09120000000',
  technician: 'تکنسین تست',
  repairDate: null,
  cost: 5000000000,
  comment: null,
  operator: null,
  province: 'تهران',
  ref_tech: null,
  techFeedbackFlag: null,
  offlineID: 5000000002,
};
const tokens = {
  accessToken: 'test-access',
  refreshToken: 'test-refresh',
  accessTokenExpiresAtUtc: '2099-01-01',
  refreshTokenExpiresAtUtc: '2099-02-01',
};
const envelope = (payload: unknown) => ({ statusCode: 200, title: '', message: '', payload });
async function setup(page: Page, referral = false) {
  await page.route('**/config.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.ADMIN1669_CONFIG={apiBaseUrl:'https://test.invalid/api',referralEndpoint:${referral ? "'Orders/refDataEntryForMobile'" : 'null'}};`,
    }),
  );
  await page.route('https://test.invalid/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = {};
    if (path.endsWith('/auth/login')) data = tokens;
    else if (path.endsWith('/getProvince')) data = envelope([{ prvName: 'تهران' }]);
    else if (path.endsWith('/getSprTch')) data = envelope([{ tchId: 2, fullName: 'تکنسین تست' }]);
    else if (path.endsWith('/selDataEntryForTechnician')) data = envelope([order]);
    else if (path.endsWith('/refDataEntryForMobile')) data = envelope(true);
    else if (path.endsWith('/auth/logout')) return route.fulfill({ status: 204 });
    else throw new Error(`Unexpected endpoint: ${path}`);
    await route.fulfill({ json: data });
  });
}
async function login(page: Page) {
  await page.goto('/');
  await page.getByLabel('نام کاربری', { exact: true }).fill('supervisor');
  await page.getByLabel('رمز ورود', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'ورود به پنل' }).click();
  await expect(page.getByRole('heading', { name: /سلام/ })).toBeVisible();
}
test('real login contract, report filters, large IDs and CSV download', async ({ page }) => {
  await setup(page);
  const requests: Record<string, unknown>[] = [];
  page.on('request', (req) => {
    if (req.url().endsWith('/selDataEntryForTechnician')) requests.push(req.postDataJSON());
  });
  await login(page);
  await page.getByRole('link', { name: 'گزارش عملیاتی', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'مشتری تست' })).toBeVisible();
  await page.getByLabel('نام مشتری', { exact: true }).fill('مشتری');
  await page.getByLabel('کد سفارش', { exact: true }).fill('۵۰۰۰۰۰۰۰۰۰');
  await page.getByRole('button', { name: 'جست‌وجو', exact: true }).click();
  await expect.poll(() => requests.at(-1)?.ID).toBe(5000000000);
  expect(requests.at(-1)).toMatchObject({
    CustomerFamily: 'مشتری',
    PageNo: 1,
    PageSize: 25,
    CustomerID: 0,
  });
  await page.getByRole('button', { name: 'جزئیات سفارش 5000000000' }).click();
  await expect(page.getByRole('dialog')).toContainText('5000000001');
  await expect(page.getByRole('dialog')).toContainText('5000000002');
  await page.getByRole('button', { name: 'بستن', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'خروجی صفحه' }).click();
  expect((await download).suggestedFilename()).toBe('orders-1669.csv');
  await expect(page.getByRole('button', { name: 'بعدی', exact: true })).toBeDisabled();
});
test('API login errors are shown without signing in', async ({ page }) => {
  await setup(page);
  await page.route('**/auth/login', (route) =>
    route.fulfill({ status: 401, json: { message: 'اطلاعات ورود نامعتبر است' } }),
  );
  await page.goto('/');
  await page.getByLabel('نام کاربری', { exact: true }).fill('bad');
  await page.getByLabel('رمز ورود', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'ورود به پنل' }).click();
  await expect(page.getByRole('alert')).toContainText('اطلاعات ورود نامعتبر است');
  await expect(page).toHaveURL(/login/);
});
test('referral sends selected technician only after confirmation', async ({ page }) => {
  await setup(page, true);
  await login(page);
  let submitted: unknown = null;
  await page.route('**/Orders/refDataEntryForMobile', (route) => {
    submitted = route.request().postDataJSON();
    return route.fulfill({ json: envelope(true) });
  });
  await page.getByRole('link', { name: 'ارجاع سفارش‌ها', exact: true }).click();
  await page.getByRole('button', { name: 'ارجاع', exact: true }).click();
  await page.getByRole('dialog').getByLabel('تکنسین', { exact: true }).selectOption('تکنسین تست');
  await page.getByRole('button', { name: 'ثبت ارجاع', exact: true }).click();
  expect(submitted).toBeNull();
  await page.getByRole('button', { name: 'تأیید نهایی', exact: true }).click();
  await expect.poll(() => submitted).toEqual({ id: 5000000000, ref_tech: 'تکنسین تست' });
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
test('unavailable referral remains disabled, no false success', async ({ page }) => {
  await setup(page);
  await login(page);
  await page.getByRole('link', { name: 'ارجاع سفارش‌ها', exact: true }).click();
  await page.getByRole('button', { name: 'ارجاع', exact: true }).click();
  await expect(page.getByRole('button', { name: 'ثبت ارجاع', exact: true })).toBeDisabled();
});
test('concurrent 401s rotate refresh token once and retry requests', async ({ page }) => {
  await setup(page);
  await login(page);
  let refreshCount = 0;
  await page.route('**/auth/refresh', async (route) => {
    refreshCount++;
    await new Promise((resolve) => setTimeout(resolve, 70));
    await route.fulfill({
      json: { ...tokens, accessToken: 'new-access', refreshToken: 'new-refresh' },
    });
  });
  await page.route('https://test.invalid/api/**', async (route, request) => {
    if (request.headers()['authorization'] === 'Bearer test-access')
      return route.fulfill({ status: 401, json: { message: 'expired' } });
    await route.fallback();
  });
  await page.getByRole('link', { name: 'گزارش عملیاتی', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'مشتری تست' })).toBeVisible();
  expect(refreshCount).toBe(1);
  expect(
    await page.evaluate(
      () => JSON.parse(sessionStorage.getItem('admin1669.session')!).refreshToken,
    ),
  ).toBe('new-refresh');
});
test('report API errors are visible and retry recovers', async ({ page }) => {
  await setup(page);
  await login(page);
  let fail = true;
  await page.route('**/Orders/selDataEntryForTechnician', (route) =>
    fail
      ? route.fulfill({ status: 500, json: { message: 'خطای اتصال آزمایشی' } })
      : route.fallback(),
  );
  await page.getByRole('link', { name: 'گزارش عملیاتی', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('خطای اتصال آزمایشی');
  fail = false;
  await page.getByRole('button', { name: 'تلاش دوباره' }).click();
  await expect(page.getByRole('cell', { name: 'مشتری تست' })).toBeVisible();
});
test('mobile demo navigation, filters, no API requests or horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let calls = 0;
  await page.route('**/api/**', (route) => {
    calls++;
    return route.abort();
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'مشاهده نسخه نمایشی' }).click();
  await expect(page.getByText('اطلاعات نمونه‌اند', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'باز کردن منو' }).click();
  await page.getByRole('link', { name: 'گزارش عملیاتی', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'مشتری نمونه یک' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('نام مشتری', { exact: true }).fill('هیچکس');
  await page.getByRole('button', { name: 'جست‌وجو', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'سفارشی پیدا نشد' })).toBeVisible();
  expect(calls).toBe(0);
});
test('logout revokes refresh token, clears only application session and guards routes', async ({
  page,
}) => {
  await setup(page);
  await login(page);
  await page.evaluate(() => sessionStorage.setItem('other-app', 'keep'));
  let revoked = '';
  await page.route('**/auth/logout', (route) => {
    revoked = route.request().postDataJSON().refreshToken;
    return route.fulfill({ status: 204 });
  });
  await page.getByRole('button', { name: 'خروج از حساب' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'خروج', exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await expect.poll(() => revoked).toBe('test-refresh');
  expect(await page.evaluate(() => sessionStorage.getItem('admin1669.session'))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem('other-app'))).toBe('keep');
  await page.goto('/#/orders-report');
  await expect(page).toHaveURL(/login/);
});
test('page size and next/previous navigate server pages', async ({ page }) => {
  await setup(page);
  await login(page);
  const pages: number[] = [];
  await page.route('**/Orders/selDataEntryForTechnician', (route) => {
    const body = route.request().postDataJSON();
    pages.push(body.PageNo);
    const rows =
      body.PageNo === 1
        ? Array.from({ length: body.PageSize }, (_, index) => ({ ...order, id: 1000 + index }))
        : [];
    return route.fulfill({ json: envelope(rows) });
  });
  await page.getByRole('link', { name: 'گزارش عملیاتی', exact: true }).click();
  await page.getByLabel('تعداد در صفحه', { exact: true }).selectOption('10');
  await expect(page.getByRole('button', { name: 'بعدی', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'بعدی', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'سفارشی پیدا نشد' })).toBeVisible();
  expect(pages.at(-1)).toBe(2);
  await page.getByRole('button', { name: 'قبلی', exact: true }).click();
  await expect(page.getByRole('button', { name: 'جزئیات سفارش 1000', exact: true })).toBeVisible();
  expect(pages.at(-1)).toBe(1);
});
test('failed referral remains open and shows error, no success', async ({ page }) => {
  await setup(page, true);
  await login(page);
  await page.route('**/Orders/refDataEntryForMobile', (route) =>
    route.fulfill({ json: { ...envelope(false), message: 'ثبت ارجاع انجام نشد' } }),
  );
  await page.getByRole('link', { name: 'ارجاع سفارش‌ها', exact: true }).click();
  await page.getByRole('button', { name: 'ارجاع', exact: true }).click();
  await page.getByRole('dialog').getByLabel('تکنسین', { exact: true }).selectOption('تکنسین تست');
  await page.getByRole('button', { name: 'ثبت ارجاع', exact: true }).click();
  await page.getByRole('button', { name: 'تأیید نهایی', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('ثبت ارجاع انجام نشد');
  await expect(page.getByText('ارجاع با موفقیت ثبت شد.', { exact: true })).not.toBeVisible();
});
test('static build works in a subfolder without server rewrites', async ({ page }) => {
  const bad: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) bad.push(response.url());
  });
  await page.route('**/portal/**', async (route) => {
    const response = await route.fetch({ url: route.request().url().replace('/portal/', '/') });
    await route.fulfill({ response });
  });
  await page.goto('/portal/');
  await page.getByRole('button', { name: 'مشاهده نسخه نمایشی' }).click();
  await page.getByRole('link', { name: 'گزارش عملیاتی', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'مشتری نمونه یک' })).toBeVisible();
  expect(bad).toEqual([]);
  await expect(page).toHaveURL(/portal\/#\/orders-report/);
});
