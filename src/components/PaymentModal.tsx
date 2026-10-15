import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { PaymentMethod } from '../types/pos';
import { formatRupiah, normalizeIndonesianPhone } from '../utils/formatters';
import {
  X,
  Banknote,
  QrCode,
  Building2,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Copy,
  Check
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  const {
    cartTotal,
    cartSubtotal,
    discountAmount,
    taxAmount,
    selectedCustomer,
    processPayment,
    isProcessingPayment,
    settings
  } = usePOS();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number>(cartTotal);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>(selectedCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(selectedCustomer?.phone || '');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);

  if (!isOpen) return null;

  // Real-time phone normalization
  const normalizedPhonePreview = customerPhone ? normalizeIndonesianPhone(customerPhone) : '';

  // Calculate change for cash
  const change = Math.max(0, cashReceived - cartTotal);
  const isCashInsufficient = paymentMethod === 'cash' && cashReceived < cartTotal;

  // Common quick cash buttons
  const quickCashOptions = [
    { label: 'Uang Pas', amount: cartTotal },
    { label: 'Rp 20.000', amount: 20000 },
    { label: 'Rp 50.000', amount: 50000 },
    { label: 'Rp 100.000', amount: 100000 },
    { label: 'Rp 200.000', amount: 200000 },
    { label: 'Rp 500.000', amount: 500000 }
  ].filter((opt) => opt.amount >= cartTotal || opt.label === 'Uang Pas');

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleCompletePayment = async () => {
    setErrorMessage('');

    if (paymentMethod === 'cash' && cashReceived < cartTotal) {
      setErrorMessage(
        `Jumlah uang diterima (${formatRupiah(cashReceived)}) masih kurang dari total tagihan (${formatRupiah(cartTotal)}).`
      );
      return;
    }

    const result = await processPayment({
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? cashReceived : cartTotal,
      paymentReference: paymentReference.trim() || undefined,
      overrideCustomerName: customerName.trim() || undefined,
      overrideCustomerPhone: customerPhone.trim() || undefined
    });

    if (result.success) {
      onPaymentSuccess();
    } else {
      setErrorMessage(result.error || 'Terjadi kesalahan saat menyimpan transaksi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-sky-400 uppercase">
              Pembayaran Transaksi
            </span>
            <h3 className="text-lg font-bold">Penyelesaian Pembayaran</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessingPayment}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Total Tagihan Banner */}
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-sky-800 font-medium">Total yang harus dibayar:</span>
              <div className="text-2xl font-black text-sky-950 font-mono-numbers">
                {formatRupiah(cartTotal)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 space-y-0.5">
              <div>Subtotal: {formatRupiah(cartSubtotal)}</div>
              {discountAmount > 0 && <div className="text-rose-600">Diskon: -{formatRupiah(discountAmount)}</div>}
              {taxAmount > 0 && <div>Pajak: {formatRupiah(taxAmount)}</div>}
            </div>
          </div>

          {/* Customer Input Section (Optional) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-600" />
              <span>Data Pelanggan (Opsional untuk Struk WhatsApp)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Nama pelanggan..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <div>
                <input
                  type="text"
                  placeholder="No. WhatsApp (contoh: 08111774235)..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
                {normalizedPhonePreview && (
                  <div className="text-[10px] text-sky-700 font-medium mt-1 pl-1">
                    Format WA: <span className="font-mono font-bold">+{normalizedPhonePreview}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">Metode Pembayaran</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'cash'
                    ? 'border-sky-600 bg-sky-50/70 text-sky-900 font-bold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span className="text-xs">Tunai (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'qris'
                    ? 'border-sky-600 bg-sky-50/70 text-sky-900 font-bold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-5 h-5 text-sky-600" />
                <span className="text-xs">QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-sky-600 bg-sky-50/70 text-sky-900 font-bold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span className="text-xs">Transfer Bank</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('debit_credit')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'debit_credit'
                    ? 'border-sky-600 bg-sky-50/70 text-sky-900 font-bold shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span className="text-xs">Kartu Debit/EDC</span>
              </button>
            </div>
          </div>

          {/* Payment Specific Controls */}
          {paymentMethod === 'cash' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Uang Diterima dari Pelanggan
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full pl-11 pr-4 py-2.5 text-base font-bold font-mono-numbers bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {quickCashOptions.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCashReceived(opt.amount)}
                    className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-sky-50 hover:border-sky-300 text-slate-700 font-mono-numbers transition-all"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Change calculation */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Kembalian:</span>
                <span
                  className={`text-lg font-black font-mono-numbers ${
                    isCashInsufficient ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {isCashInsufficient ? 'Uang Kurang!' : formatRupiah(change)}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'qris' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-center">
              <div className="inline-block p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                {/* Simulated Real QRIS graphic with merchant name */}
                <div className="w-40 h-40 bg-white flex flex-col items-center justify-center p-1 relative mx-auto">
                  <div className="text-[10px] font-black tracking-widest text-slate-800 uppercase mb-1">
                    QRIS · FUTARIYA
                  </div>
                  {/* Stylized QR Code matrix */}
                  <svg viewBox="0 0 100 100" className="w-28 h-28" fill="#0f172a">
                    {/* Corners */}
                    <rect x="5" y="5" width="25" height="25" rx="3" fill="none" stroke="#0f172a" strokeWidth="4" />
                    <rect x="11" y="11" width="13" height="13" fill="#0f172a" />
                    <rect x="70" y="5" width="25" height="25" rx="3" fill="none" stroke="#0f172a" strokeWidth="4" />
                    <rect x="76" y="11" width="13" height="13" fill="#0f172a" />
                    <rect x="5" y="70" width="25" height="25" rx="3" fill="none" stroke="#0f172a" strokeWidth="4" />
                    <rect x="11" y="76" width="13" height="13" fill="#0f172a" />
                    {/* Data dots */}
                    <rect x="36" y="10" width="8" height="8" />
                    <rect x="48" y="10" width="8" height="8" />
                    <rect x="40" y="24" width="8" height="8" />
                    <rect x="12" y="40" width="8" height="8" />
                    <rect x="24" y="40" width="8" height="8" />
                    <rect x="40" y="40" width="20" height="20" fill="#0284c7" rx="2" />
                    <rect x="68" y="40" width="8" height="8" />
                    <rect x="80" y="40" width="8" height="8" />
                    <rect x="36" y="70" width="8" height="8" />
                    <rect x="48" y="76" width="8" height="8" />
                    <rect x="70" y="70" width="8" height="8" />
                    <rect x="80" y="80" width="8" height="8" />
                  </svg>
                  <div className="text-[9px] text-slate-500 font-mono mt-1">
                    NMID: ID1024321908721
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 text-left">
                  Nomor Referensi Transaksi QRIS (RRN / Bukti Bayar)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: RRN-9823410294"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-800 uppercase">Rekening Toko</span>
                  <div className="text-sm font-bold text-slate-900 font-mono">BCA: 283-091-2351</div>
                  <div className="text-xs text-slate-500">a.n Futariya Greek Yogurt Factory</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyAccount('2830912351')}
                  className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg flex items-center gap-1"
                >
                  {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAccount ? 'Tersalin' : 'Salin Rekening'}</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nomor Referensi / Nama Pengirim Bank
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Trf a.n Budi Santoso / Ref #TRF-9023"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'debit_credit' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nomor Approval Code / Trace EDC Mesin Kartu
                </label>
                <input
                  type="text"
                  placeholder="Contoh: APPR-847291 / Mandiri EDC #12"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={onClose}
              className="flex-1 py-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Kembali
            </button>

            <button
              type="button"
              disabled={isProcessingPayment || isCashInsufficient}
              onClick={handleCompletePayment}
              className="flex-2 py-3 px-6 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.99] rounded-xl shadow-lg shadow-sky-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Transaksi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selesaikan & Terbitkan Struk</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
