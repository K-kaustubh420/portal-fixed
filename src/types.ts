// src/types.ts (or similar location)

export interface BillItem {
  id: number;
  proposal_id: number;
  category: string;
  sub_category: string;
  type: string;
  quantity: number;
  cost: number;
  amount: number; // This is the calculated amount (quantity * cost)
  status: string; // e.g., "estimated", "approved", "paid"
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  isSettled: boolean;
  id: number;
  event_name: string;
  convener_name: string;
  convener_email: string;
  department_name: string;
  bill_items: BillItem[];
}

// Type for the aggregated data needed by the chart
export interface DepartmentTotal {
  department_name: string;
  totalAmount: number;
}