import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Product,
  CategoryInfo,
  CartItem,
  Customer,
  Transaction,
  StoreSettings,
  AppTab,
  PaymentMethod,
  TransactionItem
} from '../types/pos';
import {
  INITIAL_CATEGORIES,
  INITIAL_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS
} from '../data/initialCatalog';
import {
  generateNextInvoiceNumber,
  normalizeIndonesianPhone
} from '../utils/formatters';

interface POSContextType {
  // Navigation
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;

  // Catalog & Inventory
  products: Product[];
  categories: CategoryInfo[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => { success: boolean; message: string };
  toggleProductActive: (id: string) => void;
  isProductUsedInTransactions: (productId: string) => boolean;

  // Categories
  addCategory: (category: CategoryInfo) => void;
  updateCategory: (id: string, updates: Partial<CategoryInfo>) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, note?: string) => void;
  updateCartQuantity: (cartItemId: string, newQty: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  discountType: 'nominal' | 'percent';
  discountValue: number;
  discountAmount: number;
  setDiscount: (type: 'nominal' | 'percent', value: number) => void;
  taxAmount: number;
  cartTotal: number;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;

  // Drafts
  draftOrders: { id: string; name: string; timestamp: string; cart: CartItem[]; notes: string; customer: Customer | null }[];
  saveDraftOrder: (draftName?: string) => void;
  restoreDraftOrder: (draftId: string) => void;
  deleteDraftOrder: (draftId: string) => void;

  // Transactions & Checkout
  transactions: Transaction[];
  isProcessingPayment: boolean;
  processPayment: (details: {
    paymentMethod: PaymentMethod;
    cashReceived: number;
    paymentReference?: string;
    overrideCustomerName?: string;
    overrideCustomerPhone?: string;
  }) => Promise<{ success: boolean; transaction?: Transaction; error?: string }>;
  voidTransaction: (transactionId: string, reason: string) => { success: boolean; message?: string };
  lastCompletedTransaction: Transaction | null;
  setLastCompletedTransaction: (tx: Transaction | null) => void;

  // Customers
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'totalOrders' | 'totalSpend' | 'createdAt' | 'normalizedPhone'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Settings & Storage
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  resetAllDataToDefaults: () => void;
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonData: string) => { success: boolean; message: string };
}

const STORAGE_KEYS = {
  PRODUCTS: 'futariya_pos_products_v1',
  CATEGORIES: 'futariya_pos_categories_v1',
  CUSTOMERS: 'futariya_pos_customers_v1',
  TRANSACTIONS: 'futariya_pos_transactions_v1',
  SETTINGS: 'futariya_pos_settings_v1',
  DRAFTS: 'futariya_pos_drafts_v1'
};

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<AppTab>('cashier');

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading products from storage:', e);
    }
    return INITIAL_PRODUCTS;
  });

  // Categories
  const [categories, setCategories] = useState<CategoryInfo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading categories from storage:', e);
    }
    return INITIAL_CATEGORIES;
  });

  // Customers
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading customers from storage:', e);
    }
    return INITIAL_CUSTOMERS;
  });

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading transactions from storage:', e);
    }
    return [];
  });

  // Settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...INITIAL_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Error loading settings from storage:', e);
    }
    return INITIAL_SETTINGS;
  });

  // Drafts
  const [draftOrders, setDraftOrders] = useState<
    { id: string; name: string; timestamp: string; cart: CartItem[]; notes: string; customer: Customer | null }[]
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRAFTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading drafts from storage:', e);
    }
    return [];
  });

  // Active Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<'nominal' | 'percent'>('nominal');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [lastCompletedTransaction, setLastCompletedTransaction] = useState<Transaction | null>(null);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products:', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories:', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed to save customers:', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(draftOrders));
    } catch (e) {
      console.error('Failed to save drafts:', e);
    }
  }, [draftOrders]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountValue <= 0) return 0;
    if (discountType === 'percent') {
      const calc = (cartSubtotal * discountValue) / 100;
      return Math.min(calc, cartSubtotal);
    }
    return Math.min(discountValue, cartSubtotal);
  }, [cartSubtotal, discountType, discountValue]);

  const taxAmount = useMemo(() => {
    if (!settings.taxRatePercent || settings.taxRatePercent <= 0) return 0;
    const taxableAmount = Math.max(0, cartSubtotal - discountAmount);
    return Math.round((taxableAmount * settings.taxRatePercent) / 100);
  }, [cartSubtotal, discountAmount, settings.taxRatePercent]);

  const cartTotal = useMemo(() => {
    const afterDiscount = Math.max(0, cartSubtotal - discountAmount);
    return afterDiscount + taxAmount;
  }, [cartSubtotal, discountAmount, taxAmount]);

  // Cart Handlers
  const addToCart = (product: Product, quantity = 1, note = '') => {
    if (!product.isAvailable || !product.isActive) return;

    setCart((prev) => {
      // Check if product already exists in cart with same product id and note
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && (item.note || '') === (note || '')
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: newQty * existing.unitPrice
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          product,
          quantity,
          unitPrice: product.price,
          subtotal: quantity * product.price,
          note
        };
        return [...prev, newItem];
      }
    });
  };

  const updateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.unitPrice
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setOrderNotes('');
    setSelectedCustomer(null);
  };

  const setDiscount = (type: 'nominal' | 'percent', value: number) => {
    setDiscountType(type);
    setDiscountValue(Math.max(0, value));
  };

  // Draft Orders
  const saveDraftOrder = (draftName?: string) => {
    if (cart.length === 0) return;
    const name = draftName || `Draft #${draftOrders.length + 1} (${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`;
    const newDraft = {
      id: `draft-${Date.now()}`,
      name,
      timestamp: new Date().toISOString(),
      cart: [...cart],
      notes: orderNotes,
      customer: selectedCustomer
    };
    setDraftOrders((prev) => [newDraft, ...prev]);
    clearCart();
  };

  const restoreDraftOrder = (draftId: string) => {
    const draft = draftOrders.find((d) => d.id === draftId);
    if (!draft) return;
    setCart(draft.cart);
    setOrderNotes(draft.notes);
    setSelectedCustomer(draft.customer);
    setDraftOrders((prev) => prev.filter((d) => d.id !== draftId));
    setActiveTab('cashier');
  };

  const deleteDraftOrder = (draftId: string) => {
    setDraftOrders((prev) => prev.filter((d) => d.id !== draftId));
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: now,
      updatedAt: now
    };
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  };

  const isProductUsedInTransactions = (productId: string): boolean => {
    return transactions.some((t) => t.items.some((item) => item.productId === productId));
  };

  const deleteProduct = (id: string): { success: boolean; message: string } => {
    const isUsed = isProductUsedInTransactions(id);
    if (isUsed) {
      // Safe guard: deactivate instead of hard delete
      updateProduct(id, { isActive: false });
      return {
        success: false,
        message: 'Produk sudah tercatat dalam riwayat transaksi. Produk otomatis dinonaktifkan agar laporan historis tetap akurat.'
      };
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    return { success: true, message: 'Produk berhasil dihapus.' };
  };

  const toggleProductActive = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p))
    );
  };

  // Category CRUD
  const addCategory = (category: CategoryInfo) => {
    setCategories((prev) => [...prev, category]);
  };

  const updateCategory = (id: string, updates: Partial<CategoryInfo>) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  // Customer Management
  const addCustomer = (
    custData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpend' | 'createdAt' | 'normalizedPhone'>
  ): Customer => {
    const norm = normalizeIndonesianPhone(custData.phone);
    const newCustomer: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      normalizedPhone: norm,
      totalOrders: 0,
      totalSpend: 0,
      createdAt: new Date().toISOString()
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          if (updates.phone) {
            updated.normalizedPhone = normalizeIndonesianPhone(updates.phone);
          }
          return updated;
        }
        return c;
      })
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Checkout / Payment Processing
  const processPayment = async (details: {
    paymentMethod: PaymentMethod;
    cashReceived: number;
    paymentReference?: string;
    overrideCustomerName?: string;
    overrideCustomerPhone?: string;
  }): Promise<{ success: boolean; transaction?: Transaction; error?: string }> => {
    if (cart.length === 0) {
      return { success: false, error: 'Keranjang belanja masih kosong.' };
    }

    if (isProcessingPayment) {
      return { success: false, error: 'Sedang memproses transaksi...' };
    }

    setIsProcessingPayment(true);

    try {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const countToday = transactions.filter((t) => t.createdAt.startsWith(today)).length;
      const invoiceNumber = generateNextInvoiceNumber(settings.invoicePrefix || 'FTR', countToday);

      const totalAmount = cartTotal;

      if (details.paymentMethod === 'cash' && details.cashReceived < totalAmount) {
        setIsProcessingPayment(false);
        return {
          success: false,
          error: `Uang diterima (Rp ${details.cashReceived.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${totalAmount.toLocaleString('id-ID')}).`
        };
      }

      const changeAmount = details.paymentMethod === 'cash' ? Math.max(0, details.cashReceived - totalAmount) : 0;

      // Prepare snapshot items
      const transactionItems: TransactionItem[] = cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        variantName: item.product.variantName,
        size: item.product.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        note: item.note
      }));

      // Customer resolution
      let customerName = details.overrideCustomerName || selectedCustomer?.name || undefined;
      let customerPhone = details.overrideCustomerPhone || selectedCustomer?.phone || undefined;
      let normalizedPhone = customerPhone ? normalizeIndonesianPhone(customerPhone) : undefined;

      // If customer info is provided and not already in customer database, optionally register/update
      let resolvedCustomerId = selectedCustomer?.id;
      if (customerName && normalizedPhone) {
        const existingCust = customers.find(
          (c) => c.normalizedPhone === normalizedPhone || c.name.toLowerCase() === customerName!.toLowerCase()
        );
        if (existingCust) {
          resolvedCustomerId = existingCust.id;
          updateCustomer(existingCust.id, {
            totalOrders: (existingCust.totalOrders || 0) + 1,
            totalSpend: (existingCust.totalSpend || 0) + totalAmount,
            lastOrderAt: now.toISOString()
          });
        } else {
          const created = addCustomer({
            name: customerName,
            phone: customerPhone || normalizedPhone,
            notes: 'Dibuat saat transaksi di kasir'
          });
          resolvedCustomerId = created.id;
          updateCustomer(created.id, {
            totalOrders: 1,
            totalSpend: totalAmount,
            lastOrderAt: now.toISOString()
          });
        }
      } else if (resolvedCustomerId) {
        const existingCust = customers.find((c) => c.id === resolvedCustomerId);
        if (existingCust) {
          updateCustomer(existingCust.id, {
            totalOrders: (existingCust.totalOrders || 0) + 1,
            totalSpend: (existingCust.totalSpend || 0) + totalAmount,
            lastOrderAt: now.toISOString()
          });
        }
      }

      const newTransaction: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        invoiceNumber,
        createdAt: now.toISOString(),
        items: transactionItems,
        subtotal: cartSubtotal,
        discount: discountAmount,
        discountType,
        discountValue,
        tax: taxAmount,
        total: totalAmount,
        paymentMethod: details.paymentMethod,
        cashReceived: details.paymentMethod === 'cash' ? details.cashReceived : totalAmount,
        change: changeAmount,
        paymentReference: details.paymentReference || undefined,
        cashierName: settings.cashierName || 'Kasir',
        customerId: resolvedCustomerId,
        customerName,
        customerPhone,
        normalizedPhone,
        notes: orderNotes || undefined,
        status: 'completed'
      };

      // Deduct stock if enabled
      if (settings.enableStockDeduction) {
        setProducts((prev) =>
          prev.map((p) => {
            const bought = transactionItems.find((item) => item.productId === p.id);
            if (bought) {
              const updatedStock = Math.max(0, p.stock - bought.quantity);
              return { ...p, stock: updatedStock, updatedAt: now.toISOString() };
            }
            return p;
          })
        );
      }

      // Save transaction
      setTransactions((prev) => [newTransaction, ...prev]);
      setLastCompletedTransaction(newTransaction);

      // Reset cart
      clearCart();
      setIsProcessingPayment(false);

      return { success: true, transaction: newTransaction };
    } catch (err: any) {
      setIsProcessingPayment(false);
      return { success: false, error: err.message || 'Terjadi kesalahan sistem saat memproses transaksi.' };
    }
  };

  // Void Transaction
  const voidTransaction = (transactionId: string, reason: string): { success: boolean; message?: string } => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return { success: false, message: 'Transaksi tidak ditemukan.' };
    if (tx.status === 'voided') return { success: false, message: 'Transaksi ini sudah dibatalkan sebelumnya.' };

    const now = new Date().toISOString();

    // Restore stock if it was deducted
    if (settings.enableStockDeduction) {
      setProducts((prev) =>
        prev.map((p) => {
          const item = tx.items.find((it) => it.productId === p.id);
          if (item) {
            return { ...p, stock: p.stock + item.quantity, updatedAt: now };
          }
          return p;
        })
      );
    }

    // Adjust customer stats if linked
    if (tx.customerId) {
      const cust = customers.find((c) => c.id === tx.customerId);
      if (cust) {
        updateCustomer(cust.id, {
          totalOrders: Math.max(0, cust.totalOrders - 1),
          totalSpend: Math.max(0, cust.totalSpend - tx.total)
        });
      }
    }

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              status: 'voided',
              voidReason: reason,
              voidedAt: now,
              voidedBy: settings.cashierName || 'Kasir'
            }
          : t
      )
    );

    return { success: true, message: 'Transaksi berhasil dibatalkan (void) dan stok telah dikembalikan.' };
  };

  // Settings
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Backup & Restore
  const exportDatabaseJSON = () => {
    const dump = {
      appName: 'Futariya Yogurt Shop POS',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      products,
      categories,
      customers,
      transactions,
      settings
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `futariya-pos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDatabaseJSON = (jsonData: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.products && Array.isArray(parsed.products)) setProducts(parsed.products);
      if (parsed.categories && Array.isArray(parsed.categories)) setCategories(parsed.categories);
      if (parsed.customers && Array.isArray(parsed.customers)) setCustomers(parsed.customers);
      if (parsed.transactions && Array.isArray(parsed.transactions)) setTransactions(parsed.transactions);
      if (parsed.settings && typeof parsed.settings === 'object') setSettings(parsed.settings);

      return { success: true, message: 'Data cadangan berhasil dipulihkan secara penuh!' };
    } catch (e: any) {
      return { success: false, message: `Format file cadangan tidak valid: ${e.message}` };
    }
  };

  const resetAllDataToDefaults = () => {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.DRAFTS);

    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setCustomers(INITIAL_CUSTOMERS);
    setTransactions([]);
    setSettings(INITIAL_SETTINGS);
    setDraftOrders([]);
    clearCart();
  };

  return (
    <POSContext.Provider
      value={{
        activeTab,
        setActiveTab,
        products,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductActive,
        isProductUsedInTransactions,
        addCategory,
        updateCategory,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        discountType,
        discountValue,
        discountAmount,
        setDiscount,
        taxAmount,
        cartTotal,
        orderNotes,
        setOrderNotes,
        selectedCustomer,
        setSelectedCustomer,
        draftOrders,
        saveDraftOrder,
        restoreDraftOrder,
        deleteDraftOrder,
        transactions,
        isProcessingPayment,
        processPayment,
        voidTransaction,
        lastCompletedTransaction,
        setLastCompletedTransaction,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        settings,
        updateSettings,
        resetAllDataToDefaults,
        exportDatabaseJSON,
        importDatabaseJSON
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
