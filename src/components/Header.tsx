import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { BrandLogo } from './BrandLogo';
import { AppTab } from '../types/pos';
import {
  ShoppingCart,
  LayoutDashboard,
  Package,
  Layers,
  History,
  Users,
  BarChart3,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    cart,
    cartTotal,
    settings
  } = usePOS();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navItems: { tab: AppTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'cashier', label: 'Kasir', icon: <ShoppingCart className="w-4 h-4" /> },
    { tab: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { tab: 'products', label: 'Produk', icon: <Package className="w-4 h-4" /> },
    { tab: 'categories', label: 'Kategori', icon: <Layers className="w-4 h-4" /> },
    { tab: 'transactions', label: 'Riwayat', icon: <History className="w-4 h-4" /> },
    { tab: 'customers', label: 'Pelanggan', icon: <Users className="w-4 h-4" /> },
    { tab: 'reports', label: 'Laporan', icon: <BarChart3 className="w-4 h-4" /> },
    { tab: 'settings', label: 'Pengaturan', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Single element brand wordmark */}
          <div
            onClick={() => setActiveTab('cashier')}
            className="cursor-pointer shrink-0 select-none"
          >
            <BrandLogo size="md" showSubtitle={true} />
          </div>

          {/* Zone 2: Navigation Links (single-line, concise) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className={isActive ? 'text-sky-600' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action (Kasir Cart Button) */}
          <div className="flex items-center gap-3 shrink-0">
            {activeTab !== 'cashier' ? (
              <button
                onClick={() => setActiveTab('cashier')}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm shadow-sky-600/20 transition-all whitespace-nowrap"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Buka Kasir</span>
                {cartItemCount > 0 && (
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[11px] font-bold">
                    {cartItemCount}
                  </span>
                )}
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                <span className="text-slate-500">Kasir:</span>
                <span className="font-semibold text-slate-800">{settings.cashierName || 'Kasir 1'}</span>
                {cartItemCount > 0 && (
                  <span className="ml-1 pl-2 border-l border-slate-200 font-mono-numbers text-sky-700 font-bold">
                    {formatRupiah(cartTotal)}
                  </span>
                )}
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <div className="py-2 px-3 bg-sky-50 rounded-lg mb-2 flex items-center justify-between text-xs text-sky-800 font-medium">
            <span>{settings.storeName}</span>
            <span className="font-bold">{settings.cashierName}</span>
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => {
                  setActiveTab(item.tab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-500 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.tab === 'cashier' && cartItemCount > 0 && (
                  <span className={`ml-auto px-2 py-0.5 rounded text-xs ${isActive ? 'bg-white/30 text-white' : 'bg-sky-100 text-sky-800'}`}>
                    {cartItemCount} item
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
