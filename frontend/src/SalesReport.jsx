import React, { useState, useEffect } from 'react';
import { TrendingUp, Banknote, CreditCard, RotateCcw, Activity, Printer, RefreshCw, Download, BookOpen } from 'lucide-react';
import { Card, CardHeader, StatCard, Tabs, Button, Toolbar, EmptyRow, money, inputCls, thCls, tdCls, trCls, cx } from './ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-lg">
        <p className="font-bold text-slate-800 dark:text-white mb-1">
          {label || payload[0].name || payload[0].payload.name}
        </p>
        <p className="text-blue-600 dark:text-blue-400 font-black text-lg">
          LKR {Number(payload[0].value).toFixed(2)}
        </p>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Revenue</p>
      </div>
    );
  }
  return null;
};

export default function SalesReport() {
  const [period, setPeriod] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [summary, setSummary] = useState([]);
  const [items, setItems] = useState([]);
  const [totalReturns, setTotalReturns] = useState(0);
  const [totalCogs, setTotalCogs] = useState(0); 
  const [errorMsg, setErrorMsg] = useState('');

  const fetchReport = () => {
    let url = `http://localhost:5000/api/reports/sales?period=${period}&t=${Date.now()}`;
    if (period === 'custom' && startDate && endDate) {
      url += `&start=${startDate}&end=${endDate}`;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Server connection lost.");
        return res.json();
      })
      .then(data => {
        if (data.error) {
          setErrorMsg(data.error);
        } else {
          setSummary(data.summary || []);
          setItems(data.items || []);
          setTotalReturns(Number(data.total_returns) || 0);
          setTotalCogs(Number(data.total_cogs) || 0);
          setErrorMsg('');
        }
      })
      .catch(err => setErrorMsg('Failed to connect to the server. Please ensure the backend is running.'));
  };

  useEffect(() => {
    if (period !== 'custom' || (period === 'custom' && startDate && endDate)) {
      fetchReport();
    }
  }, [period, startDate, endDate]);

  const grossRevenue = summary.reduce((sum, s) => sum + parseFloat(s.total), 0);
  const netProfit = grossRevenue - totalCogs;
  
  const cashRevenue = summary.find(s => s.payment_type === 'Cash')?.total || 0;
  const cardRevenue = summary.find(s => s.payment_type === 'Card')?.total || 0;

  const paymentTotals = {};
  summary.forEach(s => {
      const type = s.payment_type.startsWith('Split') ? 'Split Pay' : s.payment_type;
      paymentTotals[type] = (paymentTotals[type] || 0) + parseFloat(s.total);
  });
  
  const paymentData = Object.keys(paymentTotals).map(key => ({
      name: key,
      value: paymentTotals[key]
  })).filter(d => d.value > 0);

  const CHART_COLORS = ['#1d5ff5', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1', '#84cc16', '#0ea5e9'];

  const handlePrint = () => {
    window.print();
  };

  const getReportDateString = () => {
    const today = new Date();
    if (period === 'custom') return `${startDate} to ${endDate}`;
    if (period === 'today') return `Today (${today.toLocaleDateString()})`;
    if (period === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return `Yesterday (${yesterday.toLocaleDateString()})`;
    }
    if (period === 'month') return `This Month (${today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })})`;
    if (period === 'last_month') {
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return `Last Month (${lastMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })})`;
    }
    if (period === 'year') return `This Year (${today.getFullYear()})`;
    return period.toUpperCase();
  };



  const itemsSold = items.reduce((sum, i) => sum + (Number(i.qty_sold) || 0), 0);
  const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const paymentSum = paymentData.reduce((a, d) => a + d.value, 0) || 1;

  const exportCsv = () => {
    const rows = [['Item', 'Units Sold', 'Revenue (LKR)', 'Cost (LKR)', 'Profit (LKR)', 'Share %']];
    items.forEach(i => {
      const rev = Number(i.item_revenue) || 0; const cost = Number(i.item_cost) || 0;
      rows.push([(i.title || 'Advance Payment / Other').replace(/"/g, '""'), i.qty_sold, rev.toFixed(2), cost.toFixed(2), (rev - cost).toFixed(2), grossRevenue ? ((rev / grossRevenue) * 100).toFixed(1) : '0']);
    });
    rows.push([]);
    rows.push(['Gross Revenue', '', grossRevenue.toFixed(2)]);
    rows.push(['Refunds', '', totalReturns.toFixed(2)]);
    rows.push(['Net Profit', '', netProfit.toFixed(2)]);
    const csv = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `sales-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const PERIODS = [
    { key: 'today', label: 'Today' }, { key: 'yesterday', label: 'Yesterday' },
    { key: 'month', label: 'This Month' }, { key: 'last_month', label: 'Last Month' },
    { key: 'year', label: 'This Year' }, { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col gap-6 [&>*]:shrink-0 print:p-0 print:bg-white print:block">

      {/* ⚙️ BULLETPROOF CSS PRINT OVERRIDES */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          html, body, #root {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-card, .print-card > div { background: white !important; border-color: #cbd5e1 !important; margin-bottom: 16px; break-inside: avoid; }
          .print-card, .print-card * { color: black !important; }
          /* This stops the chart SVGs from blowing up out of bounds */
          .recharts-wrapper { max-width: 100% !important; }
          ::-webkit-scrollbar { display: none !important; }
        }
      `}} />

      {/* TOOLBAR - Hides when printing */}
      <Toolbar className="print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs tabs={PERIODS} active={period} onChange={setPeriod} />
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={cx(inputCls, 'w-40 py-1.5')} />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={cx(inputCls, 'w-40 py-1.5')} />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchReport}><RefreshCw size={15}/> Refresh</Button>
          <Button variant="secondary" onClick={exportCsv} disabled={items.length === 0}><Download size={15}/> Export CSV</Button>
          <Button onClick={handlePrint}><Printer size={15}/> Export PDF</Button>
        </div>
      </Toolbar>

      {/* 🖨️ PERFECTED PRINT HEADER */}
      <div className="hidden print:flex justify-between items-start mb-6 border-b-2 border-slate-800 pb-4">
        <div className="max-w-[65%]">
          <h1 className="text-4xl font-black print:!text-black uppercase tracking-tighter leading-none mb-1">ForTechZ POS System</h1>
          <h2 className="text-xl font-bold print:!text-slate-800">Nalini Book Shop - Financial Report</h2>
          <p className="text-xs font-bold print:!text-slate-600 mt-2">Generated on: {new Date().toLocaleString()}</p>
        </div>

        <div className="text-right print:!bg-slate-100 p-3 rounded-lg border print:!border-slate-300 min-w-[220px] shadow-sm">
          <p className="text-xs font-black print:!text-slate-600 uppercase tracking-widest mb-1">Report Period</p>
          <p className="text-lg font-black print:!text-blue-800 uppercase leading-tight">{getReportDateString()}</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium print:hidden">
          Error: {errorMsg}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 print:grid-cols-2 print:gap-4">
        <div className="print-card rounded-2xl"><StatCard label="Gross Revenue" sub={getReportDateString()} value={money(grossRevenue)} icon={TrendingUp} bars={items.slice(0, 7).map(i => Number(i.item_revenue)).reverse()} /></div>
        <div className="print-card rounded-2xl"><StatCard label="Total Cash Refunded" sub="Returns in this period" value={`- ${money(totalReturns)}`} icon={RotateCcw} tone="red" barTone="red" bars={false} /></div>
        <div className="print-card rounded-2xl"><StatCard label="Net Profit" sub={`${margin.toFixed(1)}% margin · COGS ${money(totalCogs)}`} value={money(netProfit)} icon={Activity} tone="green" bars={false} /></div>
        <div className="print-card rounded-2xl"><StatCard label="Units Sold" sub={`${items.length} different titles`} value={itemsSold.toLocaleString()} icon={BookOpen} tone="purple" bars={false} /></div>
      </div>

      {/* CHARTS */}
      {(items.length > 0 || paymentData.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 print:block">

          {/* DONUT */}
          <Card className="p-5 print-card">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Payment Breakdown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Revenue by payment method</p>
            <div style={{ height: '220px', width: '100%' }} className="relative mt-2">
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius="62%" outerRadius="85%" paddingAngle={3} dataKey="value" stroke="none">
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Total</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">{money(grossRevenue)}</p>
              </div>
            </div>
            <div className="space-y-2 mt-3">
              {paymentData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {d.name === 'Cash' ? <Banknote size={14}/> : d.name === 'Card' ? <CreditCard size={14}/> : null}
                    {d.name}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{money(d.value)} <span className="text-xs text-slate-400 font-normal">({((d.value / paymentSum) * 100).toFixed(0)}%)</span></span>
                </div>
              ))}
            </div>
          </Card>

          {/* BAR CHART */}
          <Card className="p-5 xl:col-span-2 print-card">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top 10 Selling Items</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">Ranked by net revenue</p>
            <div style={{ height: '320px', width: '100%' }}>
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={items.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid stroke="#6b6e93" strokeOpacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="title"
                    tick={{fontSize: 10, fill: '#9497b8'}}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    tickFormatter={(val) => val && val.length > 15 ? val.substring(0, 15) + '...' : val}
                  />
                  <YAxis tick={{fontSize: 11, fill: '#9497b8'}} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs.${val}`} width={70} />
                  <RechartsTooltip cursor={{fill: 'rgba(100, 116, 139, 0.08)'}} content={<CustomTooltip />} />
                  <Bar dataKey="item_revenue" radius={[6, 6, 0, 0]} maxBarSize={44} fill="#1d5ff5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* DETAILED DATA TABLE */}
      <Card className="overflow-hidden print-card">
        <CardHeader title="Net Items Sold Breakdown" subtitle={getReportDateString()} />
        <table className="w-full text-left print:text-xs">
          <thead>
            <tr>
              <th className={thCls}>#</th>
              <th className={thCls}>Book / Item Title</th>
              <th className={cx(thCls, 'text-center')}>Net Units Sold</th>
              <th className={cx(thCls, 'text-right')}>Net Revenue</th>
              <th className={cx(thCls, 'text-right')}>Profit / Margin</th>
              <th className={cx(thCls, 'w-48')}>Share of Revenue</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !errorMsg && <EmptyRow colSpan={6}>No sales recorded for this period.</EmptyRow>}
            {items.map((item, idx) => {
              const rev = Number(item.item_revenue) || 0;
              const share = grossRevenue ? (rev / grossRevenue) * 100 : 0;
              const profit = rev - (Number(item.item_cost) || 0);
              return (
                <tr key={idx} className={trCls}>
                  <td className={cx(tdCls, 'text-slate-400 w-10')}>{idx + 1}</td>
                  <td className={cx(tdCls, 'font-semibold text-slate-900 dark:text-white')}>
                    {item.title?.trim() ? item.title : 'Advance Payment / Other'}
                  </td>
                  <td className={cx(tdCls, 'text-center font-semibold text-blue-600 dark:text-blue-400')}>{item.qty_sold}</td>
                  <td className={cx(tdCls, 'text-right font-semibold text-slate-900 dark:text-white')}>{money(rev)}</td>
                  <td className={cx(tdCls, 'text-right', profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>{money(profit)}<span className="block text-[11px] text-slate-400">{rev ? ((profit / rev) * 100).toFixed(1) : '0.0'}% margin</span></td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${share}%` }} /></div>
                      <span className="text-xs text-slate-500 w-10 text-right">{share.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

    </div>
  );
}
