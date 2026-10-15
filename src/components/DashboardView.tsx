import React, { useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { formatRupiah, formatDateIndo, getPaymentMethodLabel } from '../utils/formatters';
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  BarChart2,
  Calendar,
  Layers,
  Sparkles,
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  Eye,
  Plus
} from 'lucide-react';
import { Transaction } from '../types/pos';

interface DashboardViewProps {
  onViewTransaction: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onViewTransaction }) => {
  const { transactions, products, setActiveTab } = usePOS();

  // Non-voided valid transactions
  const validTransactions = useMemo(() => {
    return transactions.filter((t) => t.status === 'completed');
  }, [transactions]);

  // Today's metrics (Asia/Jakarta date prefix)
  const todayDateStr = new Date().toISOString().slice(0, 10);

  const todayTransactions = useMemo(() => {
    return validTransactions.filter((t) => t.createdAt.startsWith(todayDateStr));
  }, [validTransactions, todayDateStr]);

  const todayRevenue = useMemo(() => {
    return todayTransactions.reduce((sum, t) => sum + t.total, 0);
  }, [todayTransactions]);

  const todayCount = todayTransactions.length;

  const todayAOV = todayCount > 0 ? Math.round(todayRevenue / todayCount) : 0;

  const todayItemsCount = useMemo(() => {
    return todayTransactions.reduce(
      (sum, t) => sum + t.items.reduce((s, it) => s + it.quantity, 0),
      0
    );
  }, [todayTransactions]);

  // All time total revenue
  const totalLifetimeRevenue = useMemo(() => {
    return validTransactions.reduce((sum, t) => sum + t.total, 0);
  }, [validTransactions]);

  // Best selling products calculation
  const topSellingProducts = useMemo(() => {
    const productSalesMap: Record<string, { name: string; variant: string; size: string; quantity: number; revenue: number }> = {};

    validTransactions.forEach((t) => {
      t.items.forEach((item) => {
        const key = item.productId || `${item.productName}-${item.size}`;
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            name: item.productName,
            variant: item.variantName,
            size: item.size,
            quantity: 0,
            revenue: 0
          };
        }
        productSalesMap[key].quantity += item.quantity;
        productSalesMap[key].revenue += item.subtotal;
      });
    });

    return Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [validTransactions]);

  // Payment methods breakdown
  const paymentBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      qris: { count: 0, total: 0 },
      bank_transfer: { count: 0, total: 0 },
      debit_credit: { count: 0, total: 0 },
      other: { count: 0, total: 0 }
    };

    validTransactions.forEach((t) => {
      const method = t.paymentMethod || 'cash';
      if (!counts[method]) counts[method] = { count: 0, total: 0 };
      counts[method].count += 1;
      counts[method].total += t.total;
    });

    return counts;
  }, [validTransactions]);

  // Daily Trend (Last 7 Days)
  const last7DaysChart = useMemo(() => {
    const days: { dateStr: string; label: string; total: number; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const dayNum = d.getDate();

      const txs = validTransactions.filter((t) => t.createdAt.startsWith(iso));
      const tot = txs.reduce((sum, t) => sum + t.total, 0);

      days.push({
        dateStr: iso,
        label: `${dayName} ${dayNum}`,
        total: tot,
        count: txs.length
      });
    }

    const maxVal = Math.max(...days.map((d) => d.total), 100000);
    return { days, maxVal };
  }, [validTransactions]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-sky-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
            FUTARIYA GREEK YOGURT FACTORY · DASHBOARD
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Ringkasan Operasional Toko
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl">
            Semua data dihitung secara otomatis dan real-time dari riwayat transaksi yang tersimpan.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('cashier')}
          className="px-5 py-3 bg-white text-sky-800 hover:bg-sky-50 font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Buka Transaksi Kasir</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Omzet Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Omzet Hari Ini</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono-numbers">
              {formatRupiah(todayRevenue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {todayCount} transaksi hari ini
            </div>
          </div>
        </div>

        {/* KPI 2: Total Transaksi Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Jumlah Transaksi</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono-numbers">
              {todayCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Nota berhasil diterbitkan
            </div>
          </div>
        </div>

        {/* KPI 3: Rata-Rata Nilai Transaksi (AOV) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Rata-Rata Nilai (AOV)</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono-numbers">
              {formatRupiah(todayAOV)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Per transaksi hari ini
            </div>
          </div>
        </div>

        {/* KPI 4: Total Produk Terjual */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Produk Terjual Hari Ini</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono-numbers">
              {todayItemsCount} <span className="text-sm font-semibold text-slate-500">item</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Total porsi / kemasan
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Sales Trend Chart & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 7-Day Trend Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grafik Penjualan 7 Hari Terakhir</h3>
              <p className="text-xs text-slate-500">Omzet harian dalam ribuan rupiah</p>
            </div>
            <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg">
              Total: {formatRupiah(last7DaysChart.days.reduce((s, d) => s + d.total, 0))}
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-52 w-full flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-100">
            {last7DaysChart.days.map((day, idx) => {
              const heightPercent = Math.max(8, (day.total / last7DaysChart.maxVal) * 100);
              const isToday = idx === last7DaysChart.days.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="text-[10px] font-mono-numbers text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-semibold whitespace-nowrap">
                    {formatRupiah(day.total)}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[42px] rounded-t-xl transition-all duration-300 ${
                      isToday
                        ? 'bg-gradient-to-t from-sky-600 to-sky-400 group-hover:from-sky-700 group-hover:to-sky-500 shadow-sm'
                        : 'bg-gradient-to-t from-slate-200 to-slate-300 group-hover:from-sky-300 group-hover:to-sky-400'
                    }`}
                  />
                  <div className={`text-[10px] font-semibold mt-2 ${isToday ? 'text-sky-700 font-bold' : 'text-slate-500'}`}>
                    {day.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Payment Methods Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Metode Pembayaran</h3>
            <p className="text-xs text-slate-500 mb-4">Distribusi transaksi berdasarkan metode bayar</p>

            <div className="space-y-3">
              {/* Tunai */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Tunai</div>
                    <div className="text-[11px] text-slate-500">{paymentBreakdown.cash.count} transaksi</div>
                  </div>
                </div>
                <div className="text-xs font-bold font-mono-numbers text-slate-900">
                  {formatRupiah(paymentBreakdown.cash.total)}
                </div>
              </div>

              {/* QRIS */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">QRIS</div>
                    <div className="text-[11px] text-slate-500">{paymentBreakdown.qris.count} transaksi</div>
                  </div>
                </div>
                <div className="text-xs font-bold font-mono-numbers text-slate-900">
                  {formatRupiah(paymentBreakdown.qris.total)}
                </div>
              </div>

              {/* Transfer Bank */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Transfer Bank</div>
                    <div className="text-[11px] text-slate-500">{paymentBreakdown.bank_transfer.count} transaksi</div>
                  </div>
                </div>
                <div className="text-xs font-bold font-mono-numbers text-slate-900">
                  {formatRupiah(paymentBreakdown.bank_transfer.total)}
                </div>
              </div>

              {/* Kartu Debit */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Kartu EDC</div>
                    <div className="text-[11px] text-slate-500">{paymentBreakdown.debit_credit.count} transaksi</div>
                  </div>
                </div>
                <div className="text-xs font-bold font-mono-numbers text-slate-900">
                  {formatRupiah(paymentBreakdown.debit_credit.total)}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Total Akumulasi:</span>
            <span className="font-bold text-slate-900 font-mono-numbers">
              {formatRupiah(totalLifetimeRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Top Selling Products & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Top 5 Best Sellers (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">5 Produk Terlaris</h3>
            <span className="text-[11px] text-slate-400">Berdasarkan kuantitas</span>
          </div>

          {topSellingProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada data penjualan tercatat.
            </div>
          ) : (
            <div className="space-y-3">
              {topSellingProducts.map((prod, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-black flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {prod.size} · {prod.quantity} terjual
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold font-mono-numbers text-slate-900">
                    {formatRupiah(prod.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Transaksi Terbaru</h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline"
            >
              Lihat Semua Riwayat
            </button>
          </div>

          {validTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada transaksi. Silakan proses transaksi pertama melalui menu Kasir.
            </div>
          ) : (
            <div className="space-y-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 pb-2">
                    <th className="py-2 font-medium">No. Nota</th>
                    <th className="py-2 font-medium">Waktu</th>
                    <th className="py-2 font-medium">Pelanggan</th>
                    <th className="py-2 font-medium">Metode</th>
                    <th className="py-2 font-medium text-right">Total</th>
                    <th className="py-2 font-medium text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validTransactions.slice(0, 5).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-mono font-bold text-slate-900">
                        {tx.invoiceNumber}
                      </td>
                      <td className="py-2.5 text-slate-500 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 font-medium text-slate-700">
                        {tx.customerName || 'Umum'}
                      </td>
                      <td className="py-2.5 text-slate-600">
                        {getPaymentMethodLabel(tx.paymentMethod)}
                      </td>
                      <td className="py-2.5 font-bold font-mono-numbers text-slate-900 text-right">
                        {formatRupiah(tx.total)}
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => onViewTransaction(tx)}
                          className="p-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded"
                          title="Lihat Struk"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
