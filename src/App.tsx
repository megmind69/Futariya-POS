import React, { useState } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Header } from './components/Header';
import { CashierView } from './components/CashierView';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { CategoriesView } from './components/CategoriesView';
import { TransactionsView } from './components/TransactionsView';
import { CustomersView } from './components/CustomersView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { Transaction } from './types/pos';
import { BrandLogo } from './components/BrandLogo';

const POSMain: React.FC = () => {
  const { activeTab, setActiveTab, lastCompletedTransaction, setLastCompletedTransaction } = usePOS();

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Active Receipt Modal State
  const [activeReceiptTx, setActiveReceiptTx] = useState<Transaction | null>(null);

  const handleOpenPayment = () => {
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    // lastCompletedTransaction is set inside processPayment in POSContext
  };

  const handleViewReceipt = (tx: Transaction) => {
    setActiveReceiptTx(tx);
  };

  const handleCloseReceipt = () => {
    setLastCompletedTransaction(null);
    setActiveReceiptTx(null);
  };

  const handleNewTransactionFromReceipt = () => {
    handleCloseReceipt();
    setActiveTab('cashier');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Header with Top Bar Contract */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'cashier' && (
          <CashierView onOpenPaymentModal={handleOpenPayment} />
        )}
        {activeTab === 'dashboard' && (
          <DashboardView onViewTransaction={handleViewReceipt} />
        )}
        {activeTab === 'products' && <ProductsView />}
        {activeTab === 'categories' && <CategoriesView />}
        {activeTab === 'transactions' && (
          <TransactionsView onViewReceipt={handleViewReceipt} />
        )}
        {activeTab === 'customers' && <CustomersView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Checkout / Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Receipt Modal (Triggered either post-checkout or upon clicking view/reprint) */}
      <ReceiptModal
        transaction={lastCompletedTransaction || activeReceiptTx}
        isOpen={Boolean(lastCompletedTransaction || activeReceiptTx)}
        onClose={handleCloseReceipt}
        onNewTransaction={handleNewTransactionFromReceipt}
      />

      {/* Professional Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" showSubtitle={false} />
            <span className="text-slate-400">·</span>
            <span className="font-medium">"Healthy Life with Healthy Food"</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Halal ID32110019782040724</span>
            <span>·</span>
            <span>WA: 0811-1774-235</span>
            <span>·</span>
            <span>IG: @futari_ya</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <POSMain />
    </POSProvider>
  );
}
