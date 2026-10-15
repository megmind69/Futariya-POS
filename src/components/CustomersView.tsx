import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { Customer } from '../types/pos';
import { formatRupiah, normalizeIndonesianPhone, formatDateIndo } from '../utils/formatters';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageSquare,
  Edit2,
  Trash2,
  X,
  Calendar,
  DollarSign,
  ShoppingBag,
  ExternalLink,
  CheckCircle,
  FileText
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, transactions } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notes: ''
  });

  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<Customer | null>(null);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.normalizedPhone.includes(q) ||
        (c.notes || '').toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingCustomerId(null);
    setFormData({ name: '', phone: '', notes: '' });
    setModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomerId(c.id);
    setFormData({
      name: c.name,
      phone: c.phone,
      notes: c.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama pelanggan wajib diisi.');
      return;
    }

    if (editingCustomerId) {
      updateCustomer(editingCustomerId, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        notes: formData.notes.trim()
      });
    } else {
      addCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        notes: formData.notes.trim()
      });
    }

    setModalOpen(false);
  };

  const handleDelete = (c: Customer) => {
    if (window.confirm(`Hapus data pelanggan "${c.name}"?`)) {
      deleteCustomer(c.id);
      if (selectedCustomerDetail?.id === c.id) {
        setSelectedCustomerDetail(null);
      }
    }
  };

  // Open direct WhatsApp chat
  const handleDirectWA = (normalizedPhone: string, name: string) => {
    if (!normalizedPhone) return;
    const greeting = encodeURIComponent(`Halo Kak ${name}, terima kasih telah berkunjung ke Futariya Greek Yogurt Factory! Apakah ada menu yang ingin dipesan kembali hari ini?`);
    window.open(`https://wa.me/${normalizedPhone}?text=${greeting}`, '_blank');
  };

  // Customer transactions history
  const customerTransactions = useMemo(() => {
    if (!selectedCustomerDetail) return [];
    return transactions.filter(
      (t) =>
        t.customerId === selectedCustomerDetail.id ||
        (t.normalizedPhone && t.normalizedPhone === selectedCustomerDetail.normalizedPhone)
    );
  }, [selectedCustomerDetail, transactions]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Data Pelanggan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pelanggan toko, nomor WhatsApp terverifikasi, riwayat belanja, dan loyalitas.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/25 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelanggan Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, nomor telepon atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500">
          Total: <span className="font-bold text-slate-800">{customers.length}</span> pelanggan terdaftar
        </div>
      </div>

      {/* Customers Cards & Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Customer Cards Grid (7-8 cols) */}
        <div className={`${selectedCustomerDetail ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                Tidak ada data pelanggan yang cocok.
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = selectedCustomerDetail?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerDetail(c)}
                    className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-500 ring-2 ring-sky-500/10 shadow-sm'
                        : 'border-slate-200 hover:border-sky-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {c.name}
                          </h4>
                          <div className="text-[11px] text-sky-700 font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>+{c.normalizedPhone || c.phone}</span>
                          </div>
                        </div>

                        {/* WhatsApp Direct Action */}
                        {c.normalizedPhone && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectWA(c.normalizedPhone, c.name);
                            }}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors"
                            title="Chat WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {c.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-2">
                          "{c.notes}"
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Total Belanja:</div>
                        <div className="font-bold text-slate-900 font-mono-numbers">
                          {formatRupiah(c.totalSpend || 0)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">Transaksi:</div>
                        <div className="font-bold text-slate-900 font-mono-numbers">
                          {c.totalOrders || 0}x
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(c);
                          }}
                          className="p-1 text-slate-400 hover:text-sky-600 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(c);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Customer Profile & Transaction History (5 cols) */}
        {selectedCustomerDetail && (
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 sticky top-20">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">
                  Profil Pelanggan
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedCustomerDetail.name}
                </h3>
                <div className="text-xs text-slate-600 font-mono mt-0.5">
                  +{selectedCustomerDetail.normalizedPhone}
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomerDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Total Belanja</span>
                <span className="text-sm font-bold text-slate-900 font-mono-numbers">
                  {formatRupiah(selectedCustomerDetail.totalSpend || 0)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Total Transaksi</span>
                <span className="text-sm font-bold text-slate-900 font-mono-numbers">
                  {selectedCustomerDetail.totalOrders || 0} order
                </span>
              </div>
            </div>

            {/* WhatsApp Direct Action Button */}
            {selectedCustomerDetail.normalizedPhone && (
              <button
                type="button"
                onClick={() => handleDirectWA(selectedCustomerDetail.normalizedPhone, selectedCustomerDetail.name)}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim Pesan WhatsApp Langsung</span>
              </button>
            )}

            {/* Transaction History for Customer */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">Riwayat Nota Belanja</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customerTransactions.length === 0 ? (
                  <div className="text-xs text-slate-400 py-4 text-center">
                    Belum ada riwayat transaksi yang tersambung dengan nomor ini.
                  </div>
                ) : (
                  customerTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-800">{tx.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-500">{formatDateIndo(tx.createdAt)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 font-mono-numbers">{formatRupiah(tx.total)}</div>
                        <div className="text-[10px] text-slate-500">{tx.items.length} item</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD / EDIT CUSTOMER ================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingCustomerId ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Pelanggan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibu Siti Rahmawati"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 08111774235"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
                {formData.phone && (
                  <div className="text-[11px] text-sky-700 mt-1 pl-1 font-mono">
                    Otomatis Ternormalisasi: +{normalizeIndonesianPhone(formData.phone)}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Pelanggan (Preferensi / Alamat / Catatan)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Suka varian kurma & strawberry parfait..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/25"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
