'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { 
  LayoutDashboard, TrendingUp, CandlestickChart, PieChart, 
  Wallet, History, Calculator, Headphones, ShieldCheck, 
  Settings, BookOpen, HelpCircle, Building2, ShieldAlert, 
  Globe, X, LogOut, Award, ChevronRight
} from 'lucide-react';
import { TabType } from '@/types';

interface NavSection {
  title: string;
  items: {
    id: TabType;
    translationKey: string;
    icon: React.ElementType;
    badge?: string;
    requiresOwner?: boolean;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { id: 'dashboard', translationKey: 'nav.dashboard', icon: LayoutDashboard },
      { id: 'markets', translationKey: 'nav.markets', icon: TrendingUp },
      { id: 'trading', translationKey: 'nav.trading', icon: CandlestickChart },
      { id: 'portfolio', translationKey: 'nav.portfolio', icon: PieChart },
      { id: 'wallet', translationKey: 'nav.wallet', icon: Wallet },
    ]
  },
  {
    title: 'FINANCE & HISTORY',
    items: [
      { id: 'transactions', translationKey: 'nav.transactions', icon: History },
      { id: 'calculator', translationKey: 'nav.calculator', icon: Calculator },
    ]
  },
  {
    title: 'SUPPORT & SECURITY',
    items: [
      { id: 'chat', translationKey: 'nav.support', icon: Headphones },
      { id: 'security', translationKey: 'nav.security', icon: ShieldCheck },
      { id: 'settings', translationKey: 'nav.settings', icon: Settings },
      { id: 'legal', translationKey: 'nav.legal', icon: BookOpen },
      { id: 'faq', translationKey: 'nav.faq', icon: HelpCircle },
    ]
  },
  {
    title: 'GOVERNANCE & COMPLIANCE',
    items: [
      { id: 'law-enforcement', translationKey: 'nav.lawEnforcement', icon: Building2, badge: 'GOV' },
    ]
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { id: 'admin', translationKey: 'nav.admin', icon: ShieldAlert, badge: 'PRO', requiresOwner: true },
    ]
  },
  {
    title: 'X-RWA',
    items: [
      { id: 'x-rwa' as TabType, translationKey: 'nav.xrwa', icon: Globe, requiresOwner: true },
    ]
  }
];

export const LiquidNavigationPanel: React.FC = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen, activeTab, setActiveTab, user, logout, language, theme } = useApp();

  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  if (!isMobileMenuOpen) return null;

  const isOwner = user.role === 'owner' || user.email === 'richardshannon901@gmail.com';

  return (
    <div className={`fixed inset-0 w-full h-full z-[99999] ${
      theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#070a12] text-slate-100'
    } flex flex-col overflow-y-auto overflow-x-hidden overscroll-x-none select-none`}>

      {/* Header */}
      <div className={`px-6 py-5 sm:px-10 sm:py-6 border-b ${
        theme === 'light' ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#0b0f19]'
      } flex items-center justify-between sticky top-0 z-20`}>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-0.5 flex items-center justify-center">
            <img src="/logo.svg" alt="OKX FLIX" className="w-full h-full rounded-[14px] object-cover bg-slate-900 border border-slate-700/50 p-1.5" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight">OKX FLIX</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md font-mono font-bold tracking-wider">NAVIGATION</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">ID: {user.id || 'USR-PRO'}</p>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className={`px-4 py-2.5 rounded-2xl ${
            theme === 'light' ? 'bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
          } border flex items-center gap-2 text-xs font-semibold cursor-pointer`}
          title="Close Navigation"
        >
          <X className="w-4 h-4 text-slate-400" />
          <span>Close</span>
        </button>
      </div>

      {/* Content Container */}
      <div className="flex-1 px-6 sm:px-10 py-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* VIP Status Banner */}
        <div className={`flex items-center gap-4 ${
          theme === 'light' ? 'bg-white border-blue-500/20 shadow-xs' : 'bg-slate-900 border-blue-500/30'
        } border px-6 py-4 rounded-2xl`}>
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-wide truncate">VIP Institutional Tier</p>
            <p className="text-[11px] text-blue-400 font-mono truncate">Status: {user.accountStatus || 'ACTIVE'} ({user.email})</p>
          </div>
        </div>

        {/* Navigation Sections */}
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(item => {
            if (item.requiresOwner && !isOwner) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-3">
              <h3 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest px-2">{section.title}</h3>
              <div className="flex flex-col gap-2.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const label = getTranslation(language, item.translationKey);

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full group flex items-center justify-between px-4.5 py-4 rounded-2xl text-xs font-semibold cursor-pointer ${
                        isActive 
                          ? 'bg-blue-600 text-white border border-blue-400/50' 
                          : theme === 'light'
                            ? 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200'
                            : 'bg-slate-950 hover:bg-slate-900 text-slate-200 hover:text-white border border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold truncate">{label}</span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {item.badge && (
                          <span className={`text-[10px] px-2.5 py-1 rounded-lg font-mono font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Footer / Sign Out */}
        <div className="pt-6 pb-16">
          <button
            onClick={() => {
              logout();
              setIsMobileMenuOpen(false);
            }}
            className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out / Switch Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
