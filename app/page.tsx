'use client';

import React from 'react';
import { AppProvider, useApp } from '@/lib/store';
import { DemoBanner } from '@/components/DemoBanner';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';

import { DashboardView } from '@/components/DashboardView';
import { MarketsView } from '@/components/MarketsView';
import { TradingView } from '@/components/TradingView';
import { PortfolioView } from '@/components/PortfolioView';
import { WalletView } from '@/components/WalletView';
import { TransactionsView } from '@/components/TransactionsView';
import { CalculatorView } from '@/components/CalculatorView';
import { TawkManager } from '@/components/TawkManager';
import { TawkChatView } from '@/components/TawkChatView';
import { SecurityView } from '@/components/SecurityView';
import { SettingsView } from '@/components/SettingsView';
import { LegalView } from '@/components/LegalView';
import { LawEnforcementView } from '@/components/LawEnforcementView';
import { FAQView } from '@/components/FAQView';
import { AdminView } from '@/components/AdminView';
import { FeesSystemView as XRwaView } from '@/components/FeesSystemView';

import { FeeProtocolModal } from '@/components/FeeProtocolModal';
import { SearchModal } from '@/components/SearchModal';
import { AuthModal } from '@/components/AuthModal';
import { ActivationModal } from '@/components/ActivationModal';
import { LiquidNavigationPanel } from '@/components/LiquidNavigationPanel';
import { PublicLandingView } from '@/components/PublicLandingView';
import { InternetGuard } from '@/components/InternetGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';


const ThemeSync: React.FC = () => {
  const { theme } = useApp();
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.className = theme === 'light' ? 'light-theme' : 'dark-theme';
    }
  }, [theme]);
  return null;
};

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, isAuthenticated, user } = useApp();

  React.useEffect(() => {
    if ((activeTab === 'admin' || activeTab === 'fees-system' || activeTab === 'x-rwa') && user.role !== 'owner' && user.email !== 'richardshannon901@gmail.com') {
      setActiveTab('dashboard');
    }
  }, [activeTab, user.role, user.email, setActiveTab]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white">
        <ThemeSync />
        <PublicLandingView />
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ThemeSync />
      <TawkManager />
      <DemoBanner />
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'markets' && <MarketsView />}
            {activeTab === 'trading' && <TradingView />}
            {activeTab === 'portfolio' && <PortfolioView />}
            {activeTab === 'wallet' && <WalletView />}
            {activeTab === 'transactions' && <TransactionsView />}
            {activeTab === 'calculator' && <CalculatorView />}
            {activeTab === 'chat' && <TawkChatView />}
            {activeTab === 'security' && <SecurityView />}
            {activeTab === 'settings' && <SettingsView />}
            {activeTab === 'legal' && <LegalView />}
            {activeTab === 'law-enforcement' && <LawEnforcementView />}
            {activeTab === 'faq' && <FAQView />}
            {activeTab === 'admin' && <AdminView />}
            {activeTab === 'x-rwa' && <XRwaView />}
            {activeTab === 'fees-system' && <FeesSystemView />}
          </div>
        </main>
      </div>

      <MobileNav />
      <FeeProtocolModal />
      <SearchModal />
      <AuthModal />
      <ActivationModal />
      <LiquidNavigationPanel />
    </div>
  );
};

export default function Page() {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4 p-3 shadow-2xl animate-pulse">
          <img src="/logo.svg" alt="OKX FLIX Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
        </div>
        <h1 className="text-white text-base font-bold tracking-tight">OKX FLIX</h1>
        <p className="text-slate-400 text-xs mt-1 font-mono">Loading secure application...</p>
        <div className="w-32 h-1 bg-slate-800 rounded-full mt-6 overflow-hidden">
          <div className="w-1/2 h-full bg-blue-600 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <InternetGuard>
          <MainContent />
        </InternetGuard>
      </AppProvider>
    </ErrorBoundary>
  );
}
