import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { Transaction } from '../types/pos';
import {
  formatRupiah,
  formatDateIndo,
  getPaymentMethodLabel,
  buildWhatsAppClickToChatUrl,
  generateWhatsAppReceiptMessage
} from '../utils/formatters';
import {
  History,
  Search,
  Eye,
  Share2,
  Ban,
  Download,
  AlertTriangle,
  X,
  CheckCircle
} from 'lucide-react';

interface TransactionsViewProps {
  onViewReceipt: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onViewReceipt }) => {
  const { transactions, voidTransaction, settings } = usePOS();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'voided'>('all');

  // Void modal state
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [targetVoidTx, setTargetVoidTx] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidNotice, setVoidNotice] = useState<string | null>(null);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return transactions.filter((tx) => {
      // Period filter
      if (periodFilter === 'today') {
        if (!tx.createdAt.startsWith(todayStr)) return false;
      } else if (periodFilter === 'week') {
        const txDate = new Date(tx.createdAt);
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      } else if (periodFilter === 'month') {
        const monthPrefix = now.toISOString().slice(0, 7);
        if (!tx.createdAt.startsWith(monthPrefix)) return false;
      }

      // Method filter
      if (methodFilter !== 'all' && tx.paymentMethod !== methodFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && tx.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesInvoice = tx.invoiceNumber.toLowerCase().includes(q);
        const matchesCustomer = (tx.customerName || '').toLowerCase().includes(q);
        const matchesCashier = (tx.cashierName || '').toLowerCase().includes(q);
        const matchesItems = tx.items.some((item) => item.productName.toLowerCase().includes(q));
        return matchesInvoice || matchesCustomer || matchesCashier || matchesItems;
      }

      return true;
    });
  }, [transactions, periodFilter, methodFilter, statusFilter, searchQuery]);

  const handleOpenVoidModal = (tx: Transaction) => {
    setTargetVoidTx(tx);
    setVoidReason('');
    setVoidModalOpen(true);
  };

  const handleConfirmVoid = () => {
    if (!targetVoidTx) return;
    if (!voidReason.trim()) {
      alert('Alasan pembatalan (void) wajib diisi.');
      return;
    }

    const res = voidTransaction(targetVoidTx.id, voidReason.trim());
    if (res.success) {
      setVoidNotice(`Nota ${targetVoidTx.invoiceNumber} berhasil dibatalkan dan stok dikembalikan.`);
      setTimeout(() => setVoidNotice(null), 5000);
      setVoidModalOpen(false);
      setTargetVoidTx(null);
    } else {
      alert(res.message);
    }
  };

  const handleSendWA = (tx: Transaction) => {
    if (!tx.normalizedPhone) {
      onViewReceipt(tx);
      return;
    }
    const msg = generateWhatsAppReceiptMessage(tx, settings);
    const url = buildWhatsAppClickToChatUrl(tx.normalizedPhone, msg);
    window.open(url, '_blank');
  };

  // Export Transactions to CSV
  const handleExportCSV = () => {
    const headers = [
      'No. Nota',
      'Tanggal Waktu',
      'Kasir',
      'Pelanggan',
      'No. WhatsApp',
      'Metode Bayar',
      'Subtotal',
      'Diskon',
      'Pajak',
      'Total Akhir',
      'Status',
      'Alasan Void'
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.invoiceNumber,
      `"${formatDateIndo(tx.createdAt)}"`,
      `"${tx.cashierName}"`,
      `"${tx.customerName || 'Umum'}"`,
      tx.normalizedPhone || '',
      getPaymentMethodLabel(tx.paymentMethod),
      tx.subtotal,
      tx.discount,
      tx.tax,
      tx.total,
      tx.status === 'completed' ? 'Selesai' : 'Dibatalkan (Void)',
      `"${(tx.voidReason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat-transaksi-futariya-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Riwayat Transaksi Penjualan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh nota transaksi, status pembayaran, cetak ulang struk, dan pengiriman WhatsApp.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor Riwayat CSV</span>
        </button>
      </div>

      {/* Void Notification */}
      {voidNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-600" />
            <span>{voidNotice}</span>
          </div>
          <button onClick={() => setVoidNotice(null)} className="text-amber-600 hover:text-amber-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari no nota, nama pelanggan, menu, atau kasir..."
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
          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">Bulan Ini</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Metode</option>
            <option value="cash">Tunai</option>
            <option value="qris">QRIS</option>
            <option value="bank_transfer">Transfer Bank</option>
            <option value="debit_credit">Kartu EDC</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="completed">Selesai</option>
            <option value="voided">Dibatalkan (Void)</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">No. Nota</th>
                <th className="py-3 px-3">Tanggal & Waktu</th>
                <th className="py-3 px-3">Pelanggan</th>
                <th className="py-3 px-3">Ringkasan Item</th>
                <th className="py-3 px-3">Metode</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada riwayat transaksi yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isVoided = tx.status === 'voided';
                  const totalItemsQty = tx.items.reduce((s, it) => s + it.quantity, 0);

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isVoided ? 'bg-rose-50/30 opacity-70' : ''
                      }`}
                    >
                      {/* Invoice Number */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {tx.invoiceNumber}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {formatDateIndo(tx.createdAt)}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {tx.customerName || 'Umum'}
                        </div>
                        {tx.normalizedPhone && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            +{tx.normalizedPhone}
                          </div>
                        )}
                      </td>

                      {/* Items summary */}
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                        <span className="font-semibold text-slate-800">{totalItemsQty} item</span>{' '}
                        <span className="text-[11px] text-slate-500">
                          ({tx.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')})
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-medium text-slate-700">
                          {getPaymentMethodLabel(tx.paymentMethod)}
                        </span>
                        {tx.paymentReference && (
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                            {tx.paymentReference}
                          </div>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono-numbers whitespace-nowrap">
                        <span className={isVoided ? 'line-through text-slate-400' : ''}>
                          {formatRupiah(tx.total)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {isVoided ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            Void / Dibatalkan
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Selesai
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewReceipt(tx)}
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Buka Struk"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleSendWA(tx)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Kirim Struk WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {!isVoided && (
                            <button
                              onClick={() => handleOpenVoidModal(tx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Batalkan / Void Transaksi"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
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

      {/* ================= MODAL: VOID / BATALKAN TRANSAKSI ================= */}
      {voidModalOpen && targetVoidTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Batalkan Transaksi (Void)</span>
              </h3>
              <button onClick={() => setVoidModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-1">
              <p>
                Anda akan membatalkan nota <strong>{targetVoidTx.invoiceNumber}</strong> senilai{' '}
                <strong>{formatRupiah(targetVoidTx.total)}</strong>.
              </p>
              <p className="text-[11px] text-rose-700">
                Stok produk yang ada di dalam transaksi ini akan otomatis dikembalikan ke etalase toko.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Alasan Pembatalan / Void <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Pelanggan salah pesan rasa, transaksi ganda, salah input kasir..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setVoidModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/25"
              >
                Konfirmasi Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
