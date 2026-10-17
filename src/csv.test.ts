import { describe, expect, it } from 'vitest';
import { csvCell } from './csv';
import { orderRequest } from './api/orders';
import { emptyFilters } from './types';
describe('CSV', () => {
  it('escapes quotes and separators', () => expect(csvCell('a,"b"')).toBe('"a,""b"""'));
  it('neutralizes spreadsheet formulas', () => expect(csvCell('=cmd()')).toBe('"\'=cmd()"'));
  it('handles null', () => expect(csvCell(null)).toBe('""'));
});
describe('order request', () => {
  it('matches API parameters and preserves bigint values in JS safe range', () =>
    expect(orderRequest({ ...emptyFilters, ID: '5000000000' }, 2, 25)).toMatchObject({
      ID: 5000000000,
      CustomerID: 0,
      PageNo: 2,
      PageSize: 25,
    }));
  it('rejects IDs outside JS safe integer range rather than silently rounding', () =>
    expect(() => orderRequest({ ...emptyFilters, ID: '9223372036854775807' }, 1, 25)).toThrow());
  it('rejects invalid customer ID', () =>
    expect(() => orderRequest({ ...emptyFilters, CustomerID: '5000000000' }, 1, 25)).toThrow());
});
