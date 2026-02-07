export type ComboType = 'F-M-S-D' | 'F-S' | 'M-D' | 'F-M';

export interface AdultSizeStock {
  M: number;
  L: number;
  XL: number;
  XXL: number;
  '3XL': number;
}

export interface KidsSizeStock {
  '0-1': number;
  '1-2': number;
  '2-3': number;
  '3-4': number;
  '4-5': number;
  '5-6': number;
  '6-7': number;
  '7-8': number;
  '9-10': number;
  '11-12': number;
  '13-14': number;
}

export interface GranularInventory {
  men: AdultSizeStock;
  women: AdultSizeStock;
  boys: KidsSizeStock;
  girls: KidsSizeStock;
}

export interface Design {
  id: string;
  name: string;
  color: string;
  fabric: string;
  imageUrl: string;
  inventory: GranularInventory;
  childType?: 'boys' | 'girls' | 'unisex' | 'none';
  label?: string;
  createdAt: number;
}

export type OrderStatus = 'pending' | 'accepted' | 'rejected';

export interface Order {
  id: string;
  designId: string;
  designName?: string; // For display
  comboType: ComboType;
  selectedSizes: Record<string, string>;
  customerName: string;
  customerEmail?: string;
  customerPhone: string; // Stored as bigint in DB, but string in UI to preserve precision/formatting
  customerCountryCode: string;
  customerAddress: string;
  notes?: Record<string, string>; // Per-member notes (ht, wt, etc)
  status: OrderStatus;
  createdAt: number;
}

export type Role = 'STAFF' | 'CUSTOMER';

export interface AppState {
  designs: Design[];
  orders: Order[];
  role: Role;
}
