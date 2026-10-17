export interface ResponseEnvelope<T> {
  statusCode: number;
  message: string;
  title: string;
  payload: T | null;
}
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAtUtc: string;
  refreshTokenExpiresAtUtc: string;
}
export interface Order {
  id: number;
  mashine: string | null;
  brand: string | null;
  error: string | null;
  city: string | null;
  region: string | null;
  customerFamily: string | null;
  customerID: number | null;
  repair: string | null;
  insertDate: string | null;
  tel: string | null;
  mobile: string | null;
  technician: string | null;
  repairDate: string | null;
  cost: number | null;
  comment: string | null;
  operator: string | null;
  province: string | null;
  ref_tech: string | null;
  techFeedbackFlag: string | null;
  offlineID: number | null;
}
export interface Technician {
  tchId: number;
  fullName: string | null;
}
export interface OrderFilters {
  ID: string;
  CustomerID: string;
  CustomerFamily: string;
  Technician: string;
  Mobile: string;
  Date: string;
  Tel: string;
  Province: string;
  Ref: string;
}
export const emptyFilters: OrderFilters = {
  ID: '',
  CustomerID: '',
  CustomerFamily: '',
  Technician: '',
  Mobile: '',
  Date: '',
  Tel: '',
  Province: '',
  Ref: '',
};
