import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { Product, ProductCategory } from '../types/pos';
import { ProductVisual } from './ProductVisual';
import { formatRupiah } from '../utils/formatters';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
  FileText,
  User,
  Clock,
  Sparkles,
  Check,
  Percent,
  X,
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface CashierViewProps {
  onOpenPaymentModal: () => void;
}

export const CashierView: React.FC<CashierViewProps> = ({ onOpenPaymentModal }) => {
  const {
    products,
    categories,
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
    customers,
    draftOrders,
    saveDraftOrder,
    restoreDraftOrder,
    deleteDraftOrder
  } = usePOS();

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal states for discounts & notes
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [tempDiscountType, setTempDiscountType] = useState<'nominal' | 'percent'>('nominal');
  const [tempDiscountVal, setTempDiscountVal] = useState<number>(0);

  const [activeItemNoteId, setActiveItemNoteId] = useState<string | null>(null);
  const [itemNoteText, setItemNoteText] = useState('');

  const [draftsModalOpen, setDraftsModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  // Filter products: active and available
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Must be active and available
      if (!prod.isActive || !prod.isAvailable) return false;

      // Category filter
      if (selectedCategory !== 'all' && prod.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(query);
        const matchesVariant = prod.variantName.toLowerCase().includes(query);
        const matchesSku = prod.sku.toLowerCase().includes(query);
        const matchesSize = prod.size.toLowerCase().includes(query);
        return matchesName || matchesVariant || matchesSku || matchesSize;
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleOpenDiscountModal = () => {
    setTempDiscountType(discountType);
    setTempDiscountVal(discountValue);
    setDiscountModalOpen(true);
  };

  const handleApplyDiscount = () => {
    setDiscount(tempDiscountType, Number(tempDiscountVal) || 0);
    setDiscountModalOpen(false);
  };

  const handleOpenItemNote = (cartItemId: string, currentNote: string = '') => {
    setActiveItemNoteId(cartItemId);
    setItemNoteText(currentNote);
  };

  const handleSaveItemNote = () => {
    if (activeItemNoteId) {
      const item = cart.find((i) => i.id === activeItemNoteId);
      if (item) {
        item.note = itemNoteText.trim();
      }
      setActiveItemNoteId(null);
      setItemNoteText('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Draft Notification Banner if any exists */}
      {draftOrders.length > 0 && (
        <div className="mb-4 bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-sky-900 font-medium">
            <Clock className="w-4 h-4 text-sky-600" />
            <span>Ada <strong>{draftOrders.length} pesanan draft</strong> tersimpan.</span>
          </div>
          <button
            onClick={() => setDraftsModalOpen(true)}
            className="text-xs font-bold text-sky-700 hover:text-sky-900 underline"
          >
            Lihat & Pulihkan Draft
          </button>
        </div>
      )}

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: CATALOG (8 cols) ================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search Bar & Stats */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari menu, rasa, ukuran, atau SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500 whitespace-nowrap px-1">
              Menampilkan <span className="font-semibold text-slate-900 font-mono-numbers">{filteredProducts.length}</span> produk
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              Semua Menu
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isSelected ? '#ffffff' : cat.color }}
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
              <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Tidak ada produk yang cocok</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Coba cari dengan kata kunci lain atau ubah filter kategori produk.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-4 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100"
              >
                Reset Pencarian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3.5">
              {filteredProducts.map((product) => {
                const cartQty = cart
                  .filter((item) => item.product.id === product.id)
                  .reduce((sum, item) => sum + item.quantity, 0);

                const isLowStock = product.stock <= 5 && product.stock > 0;
                const isOutOfStock = product.stock === 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      if (!isOutOfStock) addToCart(product);
                    }}
                    className={`group bg-white rounded-2xl p-3.5 border transition-all cursor-pointer relative flex flex-col justify-between select-none ${
                      isOutOfStock
                        ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                        : cartQty > 0
                        ? 'border-sky-500 ring-2 ring-sky-500/10 shadow-sm hover:shadow-md'
                        : 'border-slate-200/90 hover:border-sky-300 hover:shadow-md'
                    }`}
                  >
                    {/* Visual Illustration */}
                    <div className="relative mb-2">
                      <ProductVisual
                        category={product.category}
                        variantName={product.variantName}
                        size={product.size}
                        className="w-full h-24"
                      />
                      {cartQty > 0 && (
                        <div className="absolute top-2 right-2 bg-sky-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md shadow-sky-600/30">
                          {cartQty}
                        </div>
                      )}
                      {product.size && (
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {product.size}
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div>
                      <div className="text-[11px] font-semibold text-sky-700 tracking-wide mb-0.5">
                        {product.variantName}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                      {product.description && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Action */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {product.sku}
                        </div>
                        <div className="text-sm font-bold text-slate-900 font-mono-numbers">
                          {formatRupiah(product.price)}
                        </div>
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className={`p-2 rounded-xl transition-all ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400'
                            : 'bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white group-hover:scale-105 active:scale-95'
                        }`}
                        title="Tambah ke Keranjang"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Stock Alert */}
                    {isLowStock && (
                      <div className="mt-1 text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Sisa {product.stock} {product.unit}</span>
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="mt-1 text-[10px] text-rose-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Stok Habis</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: CART & CHECKOUT (4-5 cols) ================= */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/90 flex flex-col justify-between sticky top-20 min-h-[calc(100vh-6.5rem)]">
          {/* Cart Header */}
          <div className="space-y-3 pb-3 border-b border-slate-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Keranjang Kasir</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Apakah Anda yakin ingin mengosongkan keranjang belanja?')) {
                      clearCart();
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Customer Selector */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  {selectedCustomer ? (
                    <div>
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {selectedCustomer.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {selectedCustomer.phone}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      Pelanggan Umum (Tanpa Data)
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {selectedCustomer && (
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    title="Hapus Pelanggan"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setCustomerModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-100/70 hover:bg-sky-100 rounded-lg"
                >
                  {selectedCustomer ? 'Ganti' : 'Pilih / Tambah'}
                </button>
              </div>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-2.5 max-h-[38vh]">
            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-600">Keranjang masih kosong</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik menu di sebelah kiri untuk menambahkan pesanan
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-2.5 border border-slate-200/60 transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span>{item.product.size}</span>
                        <span>·</span>
                        <span className="font-mono-numbers">{formatRupiah(item.unitPrice)}</span>
                      </div>
                      {item.note && (
                        <div className="text-[10px] text-amber-700 italic mt-0.5">
                          "{item.note}"
                        </div>
                      )}
                    </div>

                    <div className="text-xs font-bold text-slate-900 font-mono-numbers shrink-0">
                      {formatRupiah(item.subtotal)}
                    </div>
                  </div>

                  {/* Quantity Stepper & Note Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/40">
                    <button
                      onClick={() => handleOpenItemNote(item.id, item.note)}
                      className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded ${
                        item.note
                          ? 'text-amber-800 bg-amber-100 font-semibold'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>{item.note ? 'Ubah Catatan' : '+ Catatan'}</span>
                    </button>

                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-rose-500" /> : <Minus className="w-3 h-3" />}
                      </button>
                      <span className="w-7 text-center text-xs font-bold font-mono-numbers text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Bottom: Order Notes, Calculations & Pay Button */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            {/* General Order Note Input */}
            <input
              type="text"
              placeholder="Catatan pesanan umum (opsional)..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
            />

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} item)</span>
                <span className="font-mono-numbers font-medium">{formatRupiah(cartSubtotal)}</span>
              </div>

              {/* Discount Row */}
              <div className="flex justify-between items-center text-slate-600">
                <button
                  onClick={handleOpenDiscountModal}
                  className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Tag className="w-3 h-3" />
                  <span>
                    Diskon {discountValue > 0 ? `(${discountType === 'percent' ? `${discountValue}%` : 'Rp'})` : '+ Tambah'}
                  </span>
                </button>
                <span className="font-mono-numbers text-emerald-600 font-medium">
                  {discountAmount > 0 ? `-${formatRupiah(discountAmount)}` : 'Rp 0'}
                </span>
              </div>

              {/* Tax Row if configured */}
              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Pajak</span>
                  <span className="font-mono-numbers font-medium">{formatRupiah(taxAmount)}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200/90">
                <span className="text-sm font-bold text-slate-900">Total Tagihan</span>
                <span className="text-xl font-extrabold text-sky-700 font-mono-numbers">
                  {formatRupiah(cartTotal)}
                </span>
              </div>
            </div>

            {/* Action Buttons: Hold Draft & Bayar */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => saveDraftOrder()}
                className="col-span-1 py-3 px-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Simpan pesanan sebagai draft (park)"
              >
                Simpan Draft
              </button>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={onOpenPaymentModal}
                className="col-span-2 py-3 px-4 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.99] rounded-xl shadow-md shadow-sky-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL: DISKON ================= */}
      {discountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-600" />
                <span>Atur Diskon Transaksi</span>
              </h3>
              <button
                onClick={() => setDiscountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTempDiscountType('nominal')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tempDiscountType === 'nominal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Nominal (Rp)
              </button>
              <button
                type="button"
                onClick={() => setTempDiscountType('percent')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tempDiscountType === 'percent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Persen (%)
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-600 block mb-1">
                {tempDiscountType === 'nominal' ? 'Nominal Diskon (Rupiah)' : 'Persentase Diskon (0 - 100%)'}
              </label>
              <input
                type="number"
                min="0"
                max={tempDiscountType === 'percent' ? 100 : cartSubtotal}
                value={tempDiscountVal || ''}
                onChange={(e) => setTempDiscountVal(Number(e.target.value))}
                placeholder={tempDiscountType === 'nominal' ? 'Contoh: 10000' : 'Contoh: 10'}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono-numbers"
              />
            </div>

            {/* Quick percent badges */}
            {tempDiscountType === 'percent' && (
              <div className="flex gap-2">
                {[5, 10, 15, 20, 25, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTempDiscountVal(pct)}
                    className="flex-1 py-1 bg-sky-50 text-sky-700 text-xs font-semibold rounded-lg hover:bg-sky-100"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDiscount('nominal', 0);
                  setDiscountModalOpen(false);
                }}
                className="flex-1 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl"
              >
                Hapus Diskon
              </button>
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="flex-1 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CATATAN ITEM ================= */}
      {activeItemNoteId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Catatan Pesanan Item</span>
              </h3>
              <button onClick={() => setActiveItemNoteId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={3}
              placeholder="Contoh: Kurang manis, ekstra sendok, pisah saus..."
              value={itemNoteText}
              onChange={(e) => setItemNoteText(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveItemNoteId(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveItemNote}
                className="flex-1 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PILIH PELANGGAN ================= */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600" />
                <span>Pilih Pelanggan</span>
              </h3>
              <button onClick={() => setCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              <div
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerModalOpen(false);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  !selectedCustomer ? 'border-sky-500 bg-sky-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Pelanggan Umum (Tanpa Identitas)</div>
                  <div className="text-[11px] text-slate-500">Transaksi langsung tanpa menyimpan data</div>
                </div>
                {!selectedCustomer && <Check className="w-4 h-4 text-sky-600" />}
              </div>

              {customers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setCustomerModalOpen(false);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected ? 'border-sky-500 bg-sky-50/50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.phone}</div>
                      {c.notes && <div className="text-[10px] text-slate-400">{c.notes}</div>}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-sky-600" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DRAFT ORDERS ================= */}
      {draftsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Daftar Pesanan Draft Tersimpan</span>
              </h3>
              <button onClick={() => setDraftsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {draftOrders.map((draft) => (
                <div
                  key={draft.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{draft.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {draft.cart.length} item · {draft.customer?.name || 'Pelanggan Umum'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        restoreDraftOrder(draft.id);
                        setDraftsModalOpen(false);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg"
                    >
                      Buka
                    </button>
                    <button
                      onClick={() => deleteDraftOrder(draft.id)}
                      className="p-1 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
