'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { Globe, Shield, Coins, Building2, CheckCircle2, ArrowRight } from 'lucide-react';

export const XRwaView: React.FC = () => {
  const { user, theme } = useApp();
  const isOwner = user.role === 'owner' || user.email === 'richardshannon901@gmail.com';

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-fadeIn">
      <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">X-RWA (Real World Assets) Protocol</h1>
              <p className="text-xs text-slate-400 mt-0.5">Institutional Tokenization, Treasury Yields, and Physical Asset Backing</p>
            </div>
          </div>
          <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-xl font-mono font-bold">
            PROTOCOL ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-xs text-slate-400 font-mono">Total RWA Tokenized</p>
            <p className="text-2xl font-black text-white font-mono">$1,450,000,000</p>
            <p className="text-[11px] text-emerald-400 font-mono">100% Fully Audited Reserves</p>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-xs text-slate-400 font-mono">Average Yield (APY)</p>
            <p className="text-2xl font-black text-emerald-400 font-mono">8.45%</p>
            <p className="text-[11px] text-slate-400 font-mono">Daily On-Chain Distribution</p>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-xs text-slate-400 font-mono">Institutional Investors</p>
            <p className="text-2xl font-black text-blue-400 font-mono">342 Vaults</p>
            <p className="text-[11px] text-slate-400 font-mono">Global Liquidity Pool</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white">Supported Real World Asset Instruments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">US Treasury Bills (USTb)</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">5.25% Yield</span>
              </div>
              <p className="text-xs text-slate-400">Short-duration US government obligations tokenized 1:1 on-chain with instant institutional liquidity.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Prime Real Estate Trust (PROP)</span>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono">7.80% Yield</span>
              </div>
              <p className="text-xs text-slate-400">Commercial real estate holdings in tier-1 global financial districts generating quarterly rental yields.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
