import { Transaction, StoreSettings } from '../types/pos';

/**
 * Format number to Indonesian Rupiah currency string.
 * Example: 25000 -> "Rp 25.000"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

/**
 * Format standard Indonesian date and time (WIB).
 * Example: "15 Oktober 2026, 14:30 WIB"
 */
export function formatDateIndo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
  } catch {
    return dateStr;
  }
}

/**
 * Format date only (no time) in Indonesian.
 * Example: "15 Oktober 2026"
 */
export function formatDateOnlyIndo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

/**
 * Normalize an Indonesian telephone / WhatsApp number.
 * Rules from requirements:
 * - Strip all non-digit characters (+, -, spaces, dots)
 * - If begins with 08..., replace with 628...
 * - If begins with 8..., prefix with 628...
 * - If begins with 628..., keep 628...
 * Example: 0811-1774-235 -> 628111774235
 */
export function normalizeIndonesianPhone(input: string): string {
  if (!input) return '';
  // Remove spaces, pluses, dashes, parentheses
  let cleaned = input.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Check if the normalized phone number is a valid Indonesian mobile number
 */
export function isValidIndonesianPhone(normalized: string): boolean {
  return /^628\d{8,11}$/.test(normalized);
}

/**
 * Translates payment method to Indonesian label
 */
export function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'cash':
      return 'Tunai';
    case 'qris':
      return 'QRIS';
    case 'bank_transfer':
      return 'Transfer Bank';
    case 'debit_credit':
      return 'Kartu Debit/Kredit';
    default:
      return 'Lainnya';
  }
}

/**
 * Generate formatted WhatsApp receipt message matching user request specification
 */
export function generateWhatsAppReceiptMessage(
  tx: Transaction,
  settings: StoreSettings
): string {
  const lines: string[] = [];
  
  lines.push(`*${settings.storeName.toUpperCase()}*`);
  lines.push(`${settings.tagline}`);
  lines.push('');
  lines.push(`No. Transaksi: ${tx.invoiceNumber}`);
  lines.push(`Tanggal: ${formatDateIndo(tx.createdAt)}`);
  if (tx.customerName) {
    lines.push(`Pelanggan: ${tx.customerName}`);
  }
  lines.push(`Kasir: ${tx.cashierName}`);
  lines.push('');
  
  tx.items.forEach((item, index) => {
    const sizeDisplay = item.size ? ` (${item.size})` : '';
    lines.push(`${index + 1}. ${item.productName}${sizeDisplay}`);
    lines.push(`   ${item.quantity} × ${formatRupiah(item.unitPrice)} = ${formatRupiah(item.subtotal)}`);
    if (item.note) {
      lines.push(`   _Catatan: ${item.note}_`);
    }
  });
  
  lines.push('');
  lines.push(`Subtotal: ${formatRupiah(tx.subtotal)}`);
  if (tx.discount > 0) {
    lines.push(`Diskon: -${formatRupiah(tx.discount)}`);
  }
  if (tx.tax > 0) {
    lines.push(`Pajak: ${formatRupiah(tx.tax)}`);
  }
  lines.push(`*TOTAL: ${formatRupiah(tx.total)}*`);
  lines.push('');
  
  lines.push(`Pembayaran: ${getPaymentMethodLabel(tx.paymentMethod)}`);
  if (tx.paymentMethod === 'cash') {
    lines.push(`Dibayar: ${formatRupiah(tx.cashReceived)}`);
    lines.push(`Kembalian: ${formatRupiah(tx.change)}`);
  } else if (tx.paymentReference) {
    lines.push(`Ref/Bukti: ${tx.paymentReference}`);
  }
  
  lines.push('');
  lines.push('Terima kasih telah memilih Futariya.');
  lines.push('Semoga hari Anda sehat dan menyenangkan!');
  
  return lines.join('\n');
}

/**
 * Builds the official WhatsApp Click-to-Chat URL
 * https://wa.me/NOMOR_INTERNASIONAL?text=TEKS_STRUK_YANG_SUDAH_DI-URL-ENCODE
 */
export function buildWhatsAppClickToChatUrl(
  normalizedPhone: string,
  message: string
): string {
  const cleanPhone = normalizedPhone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Generate a unique sequential invoice number for today.
 * Format: FTR-YYYYMMDD-XXXX (e.g. FTR-20261015-0001)
 */
export function generateNextInvoiceNumber(
  prefix: string = 'FTR',
  todayTransactionsCount: number = 0
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const seq = String(todayTransactionsCount + 1).padStart(4, '0');
  return `${prefix}-${dateStr}-${seq}`;
}
