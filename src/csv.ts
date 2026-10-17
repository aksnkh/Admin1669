import type { Order } from './types';
export const columns: { key: keyof Order; label: string }[] = [
  { key: 'id', label: 'کد سفارش' },
  { key: 'customerFamily', label: 'نام مشتری' },
  { key: 'mashine', label: 'دستگاه' },
  { key: 'brand', label: 'برند' },
  { key: 'error', label: 'ایراد' },
  { key: 'province', label: 'استان' },
  { key: 'city', label: 'شهر' },
  { key: 'region', label: 'منطقه' },
  { key: 'mobile', label: 'موبایل' },
  { key: 'tel', label: 'تلفن' },
  { key: 'technician', label: 'تکنسین' },
  { key: 'ref_tech', label: 'ارجاع به' },
  { key: 'insertDate', label: 'زمان ثبت' },
  { key: 'customerID', label: 'کد مشتری' },
  { key: 'repair', label: 'تعمیر' },
  { key: 'repairDate', label: 'تاریخ تعمیر' },
  { key: 'cost', label: 'هزینه' },
  { key: 'comment', label: 'توضیحات' },
  { key: 'operator', label: 'اپراتور' },
  { key: 'offlineID', label: 'ثبت اقدام' },
  { key: 'techFeedbackFlag', label: 'بازخورد تکنسین' },
];
export function csvCell(value: unknown) {
  let text = value == null ? '' : String(value);
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function exportOrders(rows: Order[]) {
  const data =
    '\uFEFF' +
    [
      columns.map((c) => csvCell(c.label)).join(','),
      ...rows.map((row) => columns.map((c) => csvCell(row[c.key])).join(',')),
    ].join('\r\n');
  const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'orders-1669.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
