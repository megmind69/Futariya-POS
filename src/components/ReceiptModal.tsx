import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { Transaction } from '../types/pos';
import {
  formatRupiah,
  formatDateIndo,
  generateWhatsAppReceiptMessage,
  buildWhatsAppClickToChatUrl,
  normalizeIndonesianPhone,
  getPaymentMethodLabel
} from '../utils/formatters';
import { BrandLogo } from './BrandLogo';
import {
  Printer,
  Share2,
  Copy,
  Check,
  Download,
  X,
  Phone,
  ArrowRight,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onNewTransaction: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onNewTransaction
}) => {
  const { settings, updateCustomer } = usePOS();
  const [activeFormat, setActiveFormat] = useState<'digital' | 'thermal'>('digital');
  const [thermalWidth, setThermalWidth] = useState<'58mm' | '80mm'>(settings.paperWidth || '58mm');

  // Input for adding/editing WhatsApp number on the fly
  const [inputPhone, setInputPhone] = useState<string>(
    transaction?.normalizedPhone || transaction?.customerPhone || ''
  );
  const [copiedText, setCopiedText] = useState(false);
  const [showApiArchitecture, setShowApiArchitecture] = useState(false);

  if (!isOpen || !transaction) return null;

  const currentNormalizedPhone = normalizeIndonesianPhone(inputPhone);
  const receiptTextMessage = generateWhatsAppReceiptMessage(transaction, settings);
  const waClickUrl = currentNormalizedPhone
    ? buildWhatsAppClickToChatUrl(currentNormalizedPhone, receiptTextMessage)
    : '';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReceiptText = () => {
    navigator.clipboard.writeText(receiptTextMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadTextFile = () => {
    const blob = new Blob([receiptTextMessage], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Struk-${transaction.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenWhatsApp = () => {
    if (!currentNormalizedPhone) {
      alert('Silakan masukkan nomor WhatsApp pelanggan terlebih dahulu.');
      return;
    }
    window.open(waClickUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                Transaksi Sukses
              </span>
              <h3 className="text-base font-bold font-mono">
                {transaction.invoiceNumber}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Format Selector Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Tampilan Struk:</span>
            <div className="inline-flex bg-slate-200/80 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveFormat('digital')}
                className={`px-3 py-1 font-semibold rounded-md transition-all ${
                  activeFormat === 'digital' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Struk Digital
              </button>
              <button
                type="button"
                onClick={() => setActiveFormat('thermal')}
                className={`px-3 py-1 font-semibold rounded-md transition-all ${
                  activeFormat === 'thermal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Struk Thermal POS
              </button>
            </div>
          </div>

          {activeFormat === 'thermal' && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium">Lebar Kertas:</span>
              <select
                value={thermalWidth}
                onChange={(e) => setThermalWidth(e.target.value as any)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 font-semibold text-slate-700"
              >
                <option value="58mm">58 mm</option>
                <option value="80mm">80 mm</option>
              </select>
            </div>
          )}
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= STAGE 1: WHATSAPP CLICK TO CHAT ACTION BOX ================= */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                  <Share2 className="w-4 h-4" />
                </div>
                <span>Kirim Struk via WhatsApp Pelanggan</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                WhatsApp Click-to-Chat
              </span>
            </div>

            <p className="text-xs text-emerald-800 leading-relaxed">
              Kirimkan rincian struk resmi secara langsung ke nomor WhatsApp pelanggan tanpa perlu menyimpan kontak terlebih dahulu.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nomor WhatsApp (contoh: 08111774235)..."
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                disabled={!currentNormalizedPhone}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka WhatsApp & Kirim</span>
              </button>
            </div>

            {currentNormalizedPhone && (
              <div className="text-[11px] text-emerald-700 font-mono">
                Format Tautan Resmi: <span className="font-bold underline">https://wa.me/{currentNormalizedPhone}</span>
              </div>
            )}
          </div>

          {/* ================= STAGE 2: RECEIPT PREVIEWS ================= */}
          {activeFormat === 'digital' ? (
            /* Modern Digital Receipt Card */
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="text-center pb-3 border-b border-slate-200">
                <BrandLogo size="md" className="justify-center mb-1" />
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  {settings.storeName}
                </h4>
                <div className="text-xs font-medium text-sky-700 italic">
                  "{settings.tagline}"
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {settings.legalSubtitle}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {settings.address} · WA: {settings.storePhone} · IG: {settings.instagram}
                </div>
              </div>

              {/* Transaction Metadata */}
              <div className="grid grid-cols-2 text-xs text-slate-600 gap-y-1 py-1 border-b border-slate-200/80">
                <div>
                  <span className="text-slate-400">No. Nota:</span>{' '}
                  <span className="font-mono font-bold text-slate-800">{transaction.invoiceNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Kasir:</span>{' '}
                  <span className="font-semibold text-slate-800">{transaction.cashierName}</span>
                </div>
                <div>
                  <span className="text-slate-400">Waktu:</span>{' '}
                  <span className="font-medium">{formatDateIndo(transaction.createdAt)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Pelanggan:</span>{' '}
                  <span className="font-bold text-slate-800">{transaction.customerName || 'Umum'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 py-1">
                {transaction.items.map((item, idx) => (
                  <div key={idx} className="text-xs flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900">
                        {item.productName} {item.size && <span className="text-slate-500 font-normal">({item.size})</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono-numbers">
                        {item.quantity} × {formatRupiah(item.unitPrice)}
                      </div>
                      {item.note && (
                        <div className="text-[10px] text-amber-700 italic">
                          Catatan: {item.note}
                        </div>
                      )}
                    </div>
                    <div className="font-bold font-mono-numbers text-slate-900">
                      {formatRupiah(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Payment Details */}
              <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono-numbers">{formatRupiah(transaction.subtotal)}</span>
                </div>
                {transaction.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Diskon</span>
                    <span className="font-mono-numbers">-{formatRupiah(transaction.discount)}</span>
                  </div>
                )}
                {transaction.tax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Pajak</span>
                    <span className="font-mono-numbers">{formatRupiah(transaction.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                  <span>TOTAL AKHIR</span>
                  <span className="text-base text-sky-700 font-mono-numbers">
                    {formatRupiah(transaction.total)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Metode Pembayaran</span>
                  <span className="font-bold text-slate-800">
                    {getPaymentMethodLabel(transaction.paymentMethod)}
                  </span>
                </div>
                {transaction.paymentMethod === 'cash' ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Uang Diterima</span>
                      <span className="font-mono-numbers">{formatRupiah(transaction.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Kembalian</span>
                      <span className="font-mono-numbers">{formatRupiah(transaction.change)}</span>
                    </div>
                  </>
                ) : (
                  transaction.paymentReference && (
                    <div className="flex justify-between text-slate-600">
                      <span>Ref / Bukti</span>
                      <span className="font-mono">{transaction.paymentReference}</span>
                    </div>
                  )
                )}
              </div>

              {/* Footer Note */}
              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[11px] text-slate-500 leading-relaxed whitespace-pre-line">
                {settings.receiptFooter}
              </div>
            </div>
          ) : (
            /* Thermal POS Receipt Preview (58mm or 80mm layout) */
            <div className="flex justify-center bg-slate-200 p-4 rounded-2xl">
              <div
                id="thermal-preview-container"
                className={`bg-white text-slate-900 p-4 shadow-lg font-mono text-[11px] leading-tight select-text ${
                  thermalWidth === '58mm' ? 'w-[240px]' : 'w-[320px]'
                }`}
              >
                <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
                  <div className="font-bold text-xs uppercase">{settings.storeName}</div>
                  <div className="text-[10px]">{settings.tagline}</div>
                  <div className="text-[9px] text-slate-600">ID32110019782040724 (Halal)</div>
                  <div className="text-[9px] text-slate-600">{settings.address}</div>
                  <div className="text-[9px] text-slate-600">WA: {settings.storePhone}</div>
                </div>

                <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                  <div>No: {transaction.invoiceNumber}</div>
                  <div>Tgl: {formatDateIndo(transaction.createdAt)}</div>
                  <div>Kasir: {transaction.cashierName}</div>
                  <div>Pelanggan: {transaction.customerName || 'Umum'}</div>
                </div>

                <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5">
                  {transaction.items.map((it, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-semibold truncate">
                        {it.productName} {it.size ? `(${it.size})` : ''}
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span>{it.quantity} x {formatRupiah(it.unitPrice)}</span>
                        <span className="font-bold">{formatRupiah(it.subtotal)}</span>
                      </div>
                      {it.note && <div className="text-[9px] italic text-slate-600">*{it.note}</div>}
                    </div>
                  ))}
                </div>

                <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatRupiah(transaction.subtotal)}</span>
                  </div>
                  {transaction.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Diskon:</span>
                      <span>-{formatRupiah(transaction.discount)}</span>
                    </div>
                  )}
                  {transaction.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Pajak:</span>
                      <span>{formatRupiah(transaction.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold pt-1">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(transaction.total)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Bayar ({getPaymentMethodLabel(transaction.paymentMethod)}):</span>
                    <span>{formatRupiah(transaction.cashReceived)}</span>
                  </div>
                  {transaction.paymentMethod === 'cash' && (
                    <div className="flex justify-between font-bold">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(transaction.change)}</span>
                    </div>
                  )}
                  {transaction.paymentReference && (
                    <div>Ref: {transaction.paymentReference}</div>
                  )}
                </div>

                <div className="pt-2 text-center text-[9px] leading-tight text-slate-600 whitespace-pre-line">
                  {settings.receiptFooter}
                </div>
              </div>
            </div>
          )}

          {/* ================= OPTION B: WHATSAPP BUSINESS API ARCHITECTURE EXPANDER ================= */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowApiArchitecture(!showApiArchitecture)}
              className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Pilihan B — Arsitektur WhatsApp Business Platform / Cloud API</span>
              </div>
              <span className="text-slate-500 font-normal">
                {showApiArchitecture ? 'Tutup Arsitektur' : 'Lihat Arsitektur'}
              </span>
            </button>

            {showApiArchitecture && (
              <div className="p-4 bg-white text-xs space-y-2.5 text-slate-600 border-t border-slate-200">
                <p>
                  Sistem POS Futariya dirancang modular sehingga siap dihubungkan langsung ke WhatsApp Cloud API resmi
                  dari Meta tanpa mengubah antarmuka kasir.
                </p>
                <div className="bg-slate-900 text-sky-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto space-y-1">
                  <div>POST /api/whatsapp/send-receipt</div>
                  <div>Authorization: Bearer &lt;STORE_SECURE_TOKEN_ON_SERVER&gt;</div>
                  <div>Content-Type: application/json</div>
                  <pre className="text-slate-300 mt-1">
{JSON.stringify(
  {
    messaging_product: 'whatsapp',
    to: currentNormalizedPhone || '628111774235',
    type: 'template',
    template: {
      name: 'futariya_transaction_receipt',
      language: { code: 'id' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: transaction.invoiceNumber },
            { type: 'text', text: formatRupiah(transaction.total) }
          ]
        }
      ]
    }
  },
  null,
  2
)}
                  </pre>
                </div>
                <p className="text-[11px] text-slate-500">
                  Status saat ini: Menggunakan <strong>Pilihan A (WhatsApp Click-to-Chat resmi wa.me)</strong> yang 100% gratis, aman, dan langsung berfungsi tanpa biaya API atau konfigurasi token pihak ketiga.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap gap-2.5 items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk ({thermalWidth})</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReceiptText}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedText ? 'Tersalin' : 'Salin Teks'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTextFile}
              className="hidden sm:flex px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh TXT</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onNewTransaction}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/25 flex items-center gap-1.5 transition-all"
          >
            <span>Transaksi Baru</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hidden container dedicated for native browser printing in thermal printer paper format */}
      <div id="printable-receipt" className="hidden">
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{settings.storeName}</div>
          <div style={{ fontSize: '10px' }}>{settings.tagline}</div>
          <div style={{ fontSize: '9px' }}>Halal: ID32110019782040724</div>
          <div style={{ fontSize: '9px' }}>{settings.address}</div>
          <div style={{ fontSize: '9px' }}>WA: {settings.storePhone}</div>
          <div>--------------------------------</div>
        </div>

        <div style={{ fontSize: '10px', marginBottom: '6px' }}>
          <div>No: {transaction.invoiceNumber}</div>
          <div>Tgl: {formatDateIndo(transaction.createdAt)}</div>
          <div>Kasir: {transaction.cashierName}</div>
          <div>Pelanggan: {transaction.customerName || 'Umum'}</div>
          <div>--------------------------------</div>
        </div>

        <div style={{ fontSize: '10px', marginBottom: '6px' }}>
          {transaction.items.map((it, idx) => (
            <div key={idx} style={{ marginBottom: '4px' }}>
              <div>{it.productName} {it.size ? `(${it.size})` : ''}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{it.quantity} x {formatRupiah(it.unitPrice)}</span>
                <span style={{ fontWeight: 'bold' }}>{formatRupiah(it.subtotal)}</span>
              </div>
            </div>
          ))}
          <div>--------------------------------</div>
        </div>

        <div style={{ fontSize: '10px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>{formatRupiah(transaction.subtotal)}</span>
          </div>
          {transaction.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Diskon:</span>
              <span>-{formatRupiah(transaction.discount)}</span>
            </div>
          )}
          {transaction.tax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pajak:</span>
              <span>{formatRupiah(transaction.tax)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px' }}>
            <span>TOTAL:</span>
            <span>{formatRupiah(transaction.total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Bayar ({getPaymentMethodLabel(transaction.paymentMethod)}):</span>
            <span>{formatRupiah(transaction.cashReceived)}</span>
          </div>
          {transaction.paymentMethod === 'cash' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Kembalian:</span>
              <span>{formatRupiah(transaction.change)}</span>
            </div>
          )}
          {transaction.paymentReference && (
            <div>Ref: {transaction.paymentReference}</div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: '9px', whiteSpace: 'pre-line' }}>
          {settings.receiptFooter}
        </div>
      </div>
    </div>
  );
};
