import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { Product, ProductCategory } from '../types/pos';
import { formatRupiah } from '../utils/formatters';
import { ProductVisual } from './ProductVisual';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  AlertTriangle,
  X,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    isProductUsedInTransactions
  } = usePOS();

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'greek_yogurt' as ProductCategory,
    variantName: '',
    size: '',
    costPrice: 0,
    price: 0,
    stock: 20,
    unit: 'jar',
    isActive: true,
    isAvailable: true,
    description: ''
  });

  const [formError, setFormError] = useState('');
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (selectedCategory !== 'all' && prod.category !== selectedCategory) {
        return false;
      }
      if (statusFilter === 'active' && !prod.isActive) return false;
      if (statusFilter === 'inactive' && prod.isActive) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          prod.name.toLowerCase().includes(q) ||
          prod.variantName.toLowerCase().includes(q) ||
          prod.sku.toLowerCase().includes(q) ||
          prod.size.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, statusFilter, searchQuery]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setFormError('');
    setFormData({
      name: '',
      sku: `FTR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      category: 'greek_yogurt',
      variantName: '',
      size: '200 gr',
      costPrice: 0,
      price: 25000,
      stock: 20,
      unit: 'jar',
      isActive: true,
      isAvailable: true,
      description: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setFormError('');
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      variantName: product.variantName,
      size: product.size,
      costPrice: product.costPrice || 0,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
      isActive: product.isActive,
      isAvailable: product.isAvailable,
      description: product.description || ''
    });
    setIsModalOpen(true);
  };

  // Generate Unique SKU
  const handleGenerateSKU = () => {
    const catCode = formData.category.slice(0, 2).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({
      ...prev,
      sku: `FTR-${catCode}-${rand}`
    }));
  };

  // Submit Add / Edit
  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!formData.name.trim()) {
      setFormError('Nama produk wajib diisi.');
      return;
    }
    if (!formData.sku.trim()) {
      setFormError('SKU produk wajib diisi.');
      return;
    }
    if (formData.price < 0) {
      setFormError('Harga jual tidak boleh negatif.');
      return;
    }
    if (formData.stock < 0) {
      setFormError('Jumlah stok tidak boleh negatif.');
      return;
    }

    // SKU Unique check
    const skuExists = products.some(
      (p) => p.sku.toLowerCase() === formData.sku.trim().toLowerCase() && p.id !== editingProductId
    );
    if (skuExists) {
      setFormError('SKU sudah digunakan oleh produk lain. Harap gunakan SKU yang unik.');
      return;
    }

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category,
        variantName: formData.variantName.trim() || formData.name.trim(),
        size: formData.size.trim(),
        costPrice: Number(formData.costPrice) || 0,
        price: Number(formData.price),
        stock: Number(formData.stock),
        unit: formData.unit.trim() || 'pcs',
        isActive: formData.isActive,
        isAvailable: formData.isAvailable,
        description: formData.description.trim()
      });
    } else {
      addProduct({
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category,
        variantName: formData.variantName.trim() || formData.name.trim(),
        size: formData.size.trim(),
        costPrice: Number(formData.costPrice) || 0,
        price: Number(formData.price),
        stock: Number(formData.stock),
        unit: formData.unit.trim() || 'pcs',
        isActive: formData.isActive,
        isAvailable: formData.isAvailable,
        description: formData.description.trim()
      });
    }

    setIsModalOpen(false);
  };

  // Handle Delete with transaction check
  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus produk "${product.name}"?`)) {
      const res = deleteProduct(product.id);
      if (!res.success) {
        setDeleteNotice(res.message);
        setTimeout(() => setDeleteNotice(null), 6000);
      }
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Nama Produk', 'SKU', 'Kategori', 'Varian', 'Ukuran', 'Harga Modal', 'Harga Jual', 'Stok', 'Satuan', 'Status'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.category,
      `"${p.variantName.replace(/"/g, '""')}"`,
      p.size,
      p.costPrice || 0,
      p.price,
      p.stock,
      p.unit,
      p.isActive ? 'Aktif' : 'Nonaktif'
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `katalog-produk-futariya-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Produk & Katalog
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola seluruh menu, varian rasa, ukuran kemasan, harga jual, dan stok toko Futariya.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/25 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Delete / Safe Notice Alert */}
      {deleteNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Proteksi Riwayat Transaksi:</strong> {deleteNotice}
          </div>
          <button onClick={() => setDeleteNotice(null)} className="text-amber-500 hover:text-amber-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama produk, SKU, varian, atau ukuran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif Saja</option>
            <option value="inactive">Nonaktif Saja</option>
          </select>
        </div>
      </div>

      {/* Products Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Menu & Varian</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Ukuran</th>
                <th className="py-3 px-3 text-right">Harga Jual</th>
                <th className="py-3 px-3 text-right">Stok</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada produk yang cocok dengan pencarian / filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isUsed = isProductUsedInTransactions(prod.id);
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Visual */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ProductVisual
                            category={prod.category}
                            variantName={prod.variantName}
                            className="w-10 h-10 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 leading-snug">
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-sky-700 font-medium">
                              {prod.variantName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-600">
                        {prod.sku}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 capitalize text-slate-600">
                        {prod.category.replace('_', ' ')}
                      </td>

                      {/* Size */}
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {prod.size}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono-numbers">
                        {formatRupiah(prod.price)}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-3 text-right font-mono-numbers">
                        <span
                          className={`font-semibold ${
                            prod.stock <= 5 ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          {prod.stock} {prod.unit}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleProductActive(prod.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            prod.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                          title="Klik untuk ubah status aktif/nonaktif"
                        >
                          {prod.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={isUsed ? 'Nonaktifkan Produk' : 'Hapus Produk'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: ADD / EDIT PRODUCT ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-sky-400 uppercase">
                  {editingProductId ? 'Edit Katalog' : 'Produk Baru'}
                </span>
                <h3 className="text-base font-bold">
                  {editingProductId ? 'Ubah Informasi Produk' : 'Tambah Produk ke Katalog'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Greek Yogurt Plain Sweetened"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              {/* SKU & Auto Generate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    SKU / Kode Produk <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Contoh: FTR-GY-200"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateSKU}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                      title="Buat SKU Acak Otomatis"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kategori Menu <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="other">Lainnya / Tambahan</option>
                  </select>
                </div>
              </div>

              {/* Variant Name & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Varian / Rasa
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Strawberry, Kurma, Plain..."
                    value={formData.variantName}
                    onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Ukuran / Volume <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 80 gr, 200 gr, 1 Liter, Smart..."
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>
              </div>

              {/* Price & Cost Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Harga Jual (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono-numbers font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Harga Modal / HPP (Opsional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice || ''}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono-numbers"
                  />
                </div>
              </div>

              {/* Stock & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Stok Saat Ini <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock || ''}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono-numbers font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Satuan Penjualan
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="jar">jar (toples)</option>
                    <option value="cup">cup</option>
                    <option value="botol">botol</option>
                    <option value="pack">pack</option>
                    <option value="bowl">bowl</option>
                    <option value="box">box</option>
                    <option value="porsi">porsi</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Keterangan / Deskripsi Produk
                </label>
                <textarea
                  rows={2}
                  placeholder="Informasi komposisi, manfaat kesehatan, atau instruksi konsumsi..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span>Produk Aktif (Tampil di Kasir)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <span>Tersedia untuk Dijual</span>
                </label>
              </div>

              {/* Form Bottom Actions */}
              <div className="flex gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/30"
                >
                  {editingProductId ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
