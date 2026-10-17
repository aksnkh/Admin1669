import { config, post, ApiError } from './client';
import type { Order, OrderFilters, ResponseEnvelope, Technician } from '../types';
export function orderRequest(filters: OrderFilters, pageNo: number, pageSize: number) {
  const parseID = (value: string) => {
    if (!value.trim()) return 0;
    const number = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(number))
      throw new Error('کد باید عدد صحیح و در محدودهٔ قابل پشتیبانی مرورگر باشد.');
    return number;
  };
  const customerID = parseID(filters.CustomerID);
  if (customerID > 2147483647) throw new Error('کد مشتری از محدودهٔ مجاز بیشتر است.');
  return {
    ...filters,
    ID: parseID(filters.ID),
    CustomerID: customerID,
    PageNo: pageNo,
    PageSize: pageSize,
  };
}
async function payload<T>(promise: Promise<ResponseEnvelope<T>>) {
  const data = await promise;
  if (data.statusCode >= 400) throw new ApiError(data.message, data.statusCode);
  if (data.payload === null) throw new ApiError(data.message || 'پاسخ سرور فاقد اطلاعات است.', 502);
  return data.payload;
}
export const listOrders = (
  filters: OrderFilters,
  page: number,
  size: number,
  signal?: AbortSignal,
) =>
  payload(
    post<ResponseEnvelope<Order[]>>(
      'Orders/selDataEntryForTechnician',
      orderRequest(filters, page, size),
      signal,
    ),
  );
export const listTechnicians = (signal?: AbortSignal) =>
  payload(post<ResponseEnvelope<Technician[]>>('Tch/getSprTch', undefined, signal));
export const listProvinces = (signal?: AbortSignal) =>
  payload(
    post<ResponseEnvelope<{ prvName: string | null }[]>>(
      'BasicInfo/getProvince',
      undefined,
      signal,
    ),
  );
export async function referOrder(id: number, fullName: string) {
  if (!config.referralEndpoint) throw new Error('سرویس ثبت ارجاع هنوز فعال نشده است.');
  const result = await post<ResponseEnvelope<boolean>>(config.referralEndpoint, {
    id,
    ref_tech: fullName,
  });
  if (result.statusCode >= 400 || result.payload !== true)
    throw new Error(result.message || 'ثبت ارجاع تأیید نشد.');
}
