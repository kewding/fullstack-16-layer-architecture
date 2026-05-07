import type {
  PaginatedVendorTx,
  PaginatedCustomerTx,
  PurchaseDetail,
  VendorTxType,
  CustomerTxType,
} from '../schemas/transactions.schema';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

const BASE = '/api/admin/transactions';

export const transactionService = {
  async listVendorTransactions(
    page: number,
    search: string,
    type: VendorTxType,
    dateStart: string,
    dateEnd: string,
  ): Promise<PaginatedVendorTx> {
    const params = new URLSearchParams({
      page: String(page),
      ...(search && { search }),
      ...(type && { type }),
      ...(dateStart && { date_start: dateStart }),
      ...(dateEnd && { date_end: dateEnd }),
    });
    const res = await fetch(`${BASE}/vendors?${params}`);
    const json: APIResponse<PaginatedVendorTx> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch vendor transactions');
    return json.data!;
  },

  async listCustomerTransactions(
    page: number,
    search: string,
    type: CustomerTxType,
    dateStart: string,
    dateEnd: string,
  ): Promise<PaginatedCustomerTx> {
    const params = new URLSearchParams({
      page: String(page),
      ...(search && { search }),
      ...(type && { type }),
      ...(dateStart && { date_start: dateStart }),
      ...(dateEnd && { date_end: dateEnd }),
    });
    const res = await fetch(`${BASE}/customers?${params}`);
    const json: APIResponse<PaginatedCustomerTx> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch customer transactions');
    return json.data!;
  },

  async getPurchaseDetail(saleID: string): Promise<PurchaseDetail> {
    const res = await fetch(`${BASE}/purchase/${saleID}`);
    const json: APIResponse<PurchaseDetail> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch purchase detail');
    return json.data!;
  },
};