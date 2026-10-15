export type ProductCategory =
  | 'greek_yogurt'
  | 'parfait'
  | 'jelly'
  | 'yogurt_drink'
  | 'fruit_salad'
  | 'sago_mango'
  | 'other';

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  description: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  variantName: string;
  size: string;
  costPrice?: number;
  price: number;
  stock: number;
  unit: string;
  imageUrl?: string;
  isActive: boolean;
  isAvailable: boolean; // false if "-" on menu
  description?: string;
  isCustom?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string; // unique item id in cart
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  notes?: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderAt?: string;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'qris' | 'bank_transfer' | 'debit_credit' | 'other';

export type TransactionStatus = 'completed' | 'voided';

export interface TransactionItem {
  productId: string;
  productName: string;
  variantName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  note?: string;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  discountType: 'nominal' | 'percent';
  discountValue: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  change: number;
  paymentReference?: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  normalizedPhone?: string;
  notes?: string;
  status: TransactionStatus;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  legalSubtitle: string;
  address: string;
  storePhone: string;
  instagram: string;
  cashierName: string;
  invoicePrefix: string;
  taxRatePercent: number;
  receiptFooter: string;
  enableStockDeduction: boolean;
  paperWidth: '58mm' | '80mm';
}

export type AppTab =
  | 'cashier'
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'transactions'
  | 'customers'
  | 'reports'
  | 'settings';
