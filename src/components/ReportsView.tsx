import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { formatRupiah, formatDateIndo, getPaymentMethodLabel } from '../utils/formatters';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Receipt,
  Tag,
  DollarSign,
  PieChart,
  ShoppingBag,
  ArrowUpRight
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { transactions, categories } = usePOS();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Filter valid transactions (completed, not voided)
  const validTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStr = now.toISOString().slice(0, 7);

    return transactions.filter((t) => {
      if (t.status !== 'completed') return false;

      if (period === 'today') {
        return t.createdAt.startsWith(todayStr);
      } else if (period === 'week') {
        const txDate = new Date(t.createdAt);
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      } else if (period === 'month') {
        return t.createdAt.startsWith(monthStr);
      }
      return true;
    });
  }, [transactions, period]);

  // Aggregate Key Metrics
  const grossSales = useMemo(() => {
    return validTransactions.reduce((sum, t) => sum + t.subtotal, 0);
  }, [validTransactions]);

  const totalDiscount = useMemo(() => {
    return validTransactions.reduce((sum, t) => sum + t.discount, 0);
  }, [validTransactions]);

  const totalTax = useMemo(() => {
    return validTransactions.reduce((sum, t) => sum + t.tax, 0);
  }, [validTransactions]);

  const netSales = useMemo(() => {
    return validTransactions.reduce((sum, t) => sum + t.total, 0);
  }, [validTransactions]);

  const transactionCount = validTransactions.length;
  const averageTransactionValue = transactionCount > 0 ? Math.round(netSales / transactionCount) : 0;

  const totalItemsSold = useMemo(() => {
    return validTransactions.reduce(
      (sum, t) => sum + t.items.reduce((s, it) => s + it.quantity, 0),
      0
    );
  }, [validTransactions]);

  // Breakdown by Category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number }> = {};

    validTransactions.forEach((t) => {
      t.items.forEach((it) => {
        // Find category from id or name prefix
        let catKey = 'other';
        if (it.productId.startsWith('gy-')) catKey = 'greek_yogurt';
        else if (it.productId.startsWith('pf-')) catKey = 'parfait';
        else if (it.productId.startsWith('jl-')) catKey = 'jelly';
        else if (it.productId.startsWith('yd-')) catKey = 'yogurt_drink';
        else if (it.productId.startsWith('fs-')) catKey = 'fruit_salad';
        else if (it.productId.startsWith('sm-')) catKey = 'sago_mango';

        const catInfo = categories.find((c) => c.id === catKey);
        const catName = catInfo ? catInfo.name : 'Lainnya';

        if (!map[catKey]) {
          map[catKey] = { name: catName, quantity: 0, revenue: 0 };
        }
        map[catKey].quantity += it.quantity;
        map[catKey].revenue += it.subtotal;
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [validTransactions, categories]);

  // Breakdown by Product & Variant
  const productBreakdown = useMemo(() => {
    const map: Record<string, { name: string; variant: string; size: string; quantity: number; revenue: number }> = {};

    validTransactions.forEach((t) => {
      t.items.forEach((it) => {
        const key = `${it.productName}-${it.size}`;
        if (!map[key]) {
          map[key] = {
            name: it.productName,
            variant: it.variantName,
            size: it.size,
            quantity: 0,
            revenue: 0
          };
        }
        map[key].quantity += it.quantity;
        map[key].revenue += it.subtotal;
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [validTransactions]);

  // Breakdown by Payment Method
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    validTransactions.forEach((t) => {
      const m = t.paymentMethod || 'cash';
      if (!map[m]) map[m] = { count: 0, total: 0 };
      map[m].count += 1;
      map[m].total += t.total;
    });
    return map;
  }, [validTransactions]);

  // Export CSV
  const handleExportCSV = () => {
    const summaryLines = [
      'LAPORAN PENJUALAN FUTARIYA GREEK YOGURT',
      `Periode: ${period.toUpperCase()}`,
      `Tanggal Unduh: ${new Date().toLocaleString('id-ID')}`,
      '',
      `Total Penjualan Bruto,${grossSales}`,
      `Total Diskon Diberikan,${totalDiscount}`,
      `Total Pajak,${totalTax}`,
      `Total Penjualan Neto (Omzet),${netSales}`,
      `Jumlah Transaksi,${transactionCount}`,
      `Total Produk Terjual,${totalItemsSold}`,
      `Rata-Rata Nilai Transaksi (AOV),${averageTransactionValue}`,
      '',
      'RINCIAN PENJUALAN PER PRODUK',
      'Nama Produk,Varian,Ukuran,Kuantitas Terjual,Total Omzet'
    ];

    productBreakdown.forEach((p) => {
      summaryLines.push(
        `"${p.name.replace(/"/g, '""')}","${p.variant.replace(/"/g, '""')}","${p.size}",${p.quantity},${p.revenue}`
      );
    });

    const blob = new Blob([summaryLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-penjualan-futariya-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Laporan Penjualan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis omzet bruto & neto, diskon, performa menu terlaris, dan metode pembayaran.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                period === 'today' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                period === 'week' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                period === 'month' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                period === 'all' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block">Penjualan Bruto</span>
          <div className="text-base font-bold text-slate-900 font-mono-numbers mt-1">
            {formatRupiah(grossSales)}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-rose-500 font-semibold block">Total Diskon</span>
          <div className="text-base font-bold text-rose-600 font-mono-numbers mt-1">
            -{formatRupiah(totalDiscount)}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-sky-600 font-semibold block">Penjualan Neto (Omzet)</span>
          <div className="text-base font-extrabold text-sky-700 font-mono-numbers mt-1">
            {formatRupiah(netSales)}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block">Total Transaksi</span>
          <div className="text-base font-bold text-slate-900 font-mono-numbers mt-1">
            {transactionCount} nota
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block">Produk Terjual</span>
          <div className="text-base font-bold text-slate-900 font-mono-numbers mt-1">
            {totalItemsSold} item
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block">Rata-Rata Transaksi</span>
          <div className="text-base font-bold text-slate-900 font-mono-numbers mt-1">
            {formatRupiah(averageTransactionValue)}
          </div>
        </div>
      </div>

      {/* Grid: Category Breakdown & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Penjualan Berdasarkan Kategori</h3>
            <span className="text-xs text-slate-500">Kontribusi Omzet</span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada data penjualan pada periode yang dipilih.
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((cat, idx) => {
                const percent = netSales > 0 ? Math.round((cat.revenue / netSales) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{cat.name}</span>
                      <div className="space-x-2">
                        <span className="text-slate-500">{cat.quantity} item</span>
                        <span className="font-bold font-mono-numbers text-slate-900">{formatRupiah(cat.revenue)}</span>
                        <span className="text-sky-700 font-semibold">({percent}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="bg-sky-600 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Performa Metode Pembayaran</h3>

          {Object.keys(paymentBreakdown).length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada transaksi.
            </div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(paymentBreakdown).map(([method, data]) => {
                const percent = netSales > 0 ? Math.round((data.total / netSales) * 100) : 0;
                return (
                  <div
                    key={method}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {getPaymentMethodLabel(method)}
                      </div>
                      <div className="text-[11px] text-slate-500">{data.count} transaksi</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono-numbers text-slate-900">
                        {formatRupiah(data.total)}
                      </div>
                      <div className="text-[10px] font-semibold text-sky-700">{percent}% dari total</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Product-Level Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Detail Penjualan Seluruh Produk & Varian</h3>
          <span className="text-xs text-slate-500">{productBreakdown.length} varian terjual</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-3">Varian / Rasa</th>
                <th className="py-3 px-3">Ukuran</th>
                <th className="py-3 px-3 text-right">Kuantitas Terjual</th>
                <th className="py-3 px-4 text-right">Total Omzet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Tidak ada penjualan pada periode ini.
                  </td>
                </tr>
              ) : (
                productBreakdown.map((prod, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{prod.name}</td>
                    <td className="py-3 px-3 text-slate-600">{prod.variant}</td>
                    <td className="py-3 px-3 text-slate-600">{prod.size}</td>
                    <td className="py-3 px-3 text-right font-semibold font-mono-numbers text-slate-800">
                      {prod.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono-numbers text-slate-900">
                      {formatRupiah(prod.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
