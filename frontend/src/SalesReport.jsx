import React, { useState, useEffect } from 'react';
import { TrendingUp, Banknote, CreditCard, RotateCcw, Activity, Printer, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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

  const CHART_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#f43f5e', '#6366f1', '#84cc16', '#0ea5e9'];

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

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 print:p-0 print:bg-white transition-colors">
      
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
          /* This stops the chart SVGs from blowing up out of bounds */
          .recharts-wrapper { max-width: 100% !important; }
          ::-webkit-scrollbar { display: none !important; }
        }
      `}} />

      {/* HEADER SECTION - Hides when printing */}
      <div className="flex justify-between items-start mb-6 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white">Financial Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Track your real net revenue, refunds, and actual items sold.</p>
        </div>
        
        <div className="flex gap-3">
          {period === 'custom' && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 bg-transparent outline-none font-bold text-slate-600 dark:text-slate-300 text-sm dark:[color-scheme:dark]" />
              <span className="text-slate-300 dark:text-slate-600 font-bold">to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 bg-transparent outline-none font-bold text-slate-600 dark:text-slate-300 text-sm dark:[color-scheme:dark]" />
            </div>
          )}

          <div className="relative">
            <Filter className="absolute left-3 top-3.5 text-slate-500 dark:text-slate-400" size={16} />
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)} 
              className="pl-9 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-colors"
            >
              <option value="today">Today's Sales</option>
              <option value="yesterday">Yesterday</option>
              <option value="month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          <button onClick={handlePrint} className="bg-slate-800 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm flex items-center gap-2 transition-colors">
            <Printer size={18}/> Export PDF
          </button>
        </div>
      </div>

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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-600 px-4 py-3 rounded-xl font-bold mb-6 shadow-sm print:hidden">
          Error: {errorMsg}
        </div>
      )}

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-4 gap-6 mb-8 print:grid-cols-2 print:gap-4 print:mb-6 print:break-inside-avoid">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between print:!border-slate-300 print:!bg-white print:p-4">
          <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold text-sm print:!text-slate-600">
            <TrendingUp size={18} className="text-blue-500 print:!text-blue-700" /> Gross Revenue
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white print:!text-black">LKR {grossRevenue.toFixed(2)}</div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 flex flex-col justify-between print:!border-red-300 print:!bg-red-50 print:p-4">
          <div className="flex items-center gap-2 mb-4 text-red-500 font-bold text-sm print:!text-red-700">
            <RotateCcw size={18} className="print:!text-red-700"/> Total Cash Refunded
          </div>
          <div className="text-2xl lg:text-3xl font-black text-red-600 dark:text-red-400 print:!text-red-800">- LKR {totalReturns.toFixed(2)}</div>
        </div>

        <div className="bg-emerald-600 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between print:!bg-emerald-50 print:!border print:!border-emerald-300 print:!text-emerald-900 print:p-4">
          <div className="flex items-center gap-2 mb-4 opacity-90 font-bold text-sm print:!text-emerald-700">
            <Activity size={18} className="print:!text-emerald-700"/> Net (Profit)
          </div>
          <div className="text-2xl lg:text-3xl font-black print:!text-emerald-900">LKR {netProfit.toFixed(2)}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center gap-3 print:!border-slate-300 print:!bg-white print:p-4">
          <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-300 print:!text-slate-800">
            <span className="flex items-center gap-1"><Banknote size={16} className="text-emerald-500 print:!text-emerald-700"/> Cash</span>
            <span className="print:font-black">LKR {Number(cashRevenue).toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-[1px] print:!bg-slate-300"></div>
          <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-300 print:!text-slate-800">
            <span className="flex items-center gap-1"><CreditCard size={16} className="text-blue-500 print:!text-blue-700"/> Card</span>
            <span className="print:font-black">LKR {Number(cardRevenue).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 🚀 CHARTS SECTION - Fixed with explicit inline pixel heights to stop collapsing! */}
      {(items.length > 0 || paymentData.length > 0) && (
        <div className="flex flex-col lg:flex-row gap-6 mb-8 print:flex print:flex-col print:gap-8 print:mb-8 print:w-full">
          
          {/* BAR CHART */}
          <div className="w-full lg:w-2/3 print:w-full print:break-inside-avoid bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 print:!border-slate-300 print:!shadow-none print:!bg-white print:p-4">
            <h2 className="font-bold text-lg mb-6 text-slate-800 dark:text-white print:!text-black">Top 10 Selling Items</h2>
            {/* INLINE HEIGHT PREVENTS PRINT COLLAPSE */}
            <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={items.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                  <XAxis 
                    dataKey="title" 
                    tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} 
                    tickLine={false} 
                    axisLine={false} 
                    interval={0}
                    angle={-35} 
                    textAnchor="end" 
                    tickFormatter={(val) => val && val.length > 15 ? val.substring(0, 15) + '...' : val} 
                  />
                  <YAxis tick={{fontSize: 11, fill: '#64748b', fontWeight: 'bold'}} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs.${val}`} width={70} />
                  
                  <RechartsTooltip cursor={{fill: 'rgba(100, 116, 139, 0.05)'}} content={<CustomTooltip />} />
                  
                  <Bar dataKey="item_revenue" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {items.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PIE CHART */}
          <div className="w-full lg:w-1/3 print:w-full print:break-inside-avoid bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 print:!border-slate-300 print:!shadow-none print:!bg-white print:p-4">
            <h2 className="font-bold text-lg mb-6 text-slate-800 dark:text-white text-center print:!text-black">Payment Breakdown</h2>
            {/* INLINE HEIGHT PREVENTS PRINT COLLAPSE */}
            <div style={{ height: '350px', width: '100%' }} className="flex justify-center items-center">
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="45%"
                    innerRadius="50%" 
                    outerRadius="75%" 
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', paddingTop: '15px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* DETAILED DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden print:!border-slate-300 print:!shadow-none print:mt-2 transition-colors">
        <h2 className="font-bold text-lg p-6 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white print:px-5 print:py-4 print:!border-slate-300 print:!text-black print:!bg-slate-100">
          Net Items Sold Breakdown
        </h2>
        <table className="w-full text-left text-sm print:text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 print:!bg-white print:border-b-2 print:!border-slate-400">
            <tr>
              <th className="p-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-xs print:!text-slate-600 print:py-3">Book / Item Title</th>
              <th className="p-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-xs text-center print:!text-slate-600 print:py-3">Net Units Sold</th>
              <th className="p-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-xs text-right print:!text-slate-600 print:py-3">Net Revenue Generated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 print:!divide-slate-200">
            {items.length === 0 && !errorMsg && (
              <tr><td colSpan="3" className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium print:!text-slate-600">No sales recorded for this period.</td></tr>
            )}
            
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors print:!bg-white">
                {/* 🐛 !text-black added so Dark Mode cannot make text invisible during printing */}
                <td className="p-4 font-bold text-slate-800 dark:text-white print:!text-black print:py-3">
                  {item.title?.trim() ? item.title : 'Advance Payment / Other'}
                </td>
                <td className="p-4 text-center font-black text-blue-600 dark:text-blue-400 print:!text-blue-800 print:py-3">{item.qty_sold}</td>
                <td className="p-4 text-right font-black text-slate-700 dark:text-slate-300 print:!text-black print:py-3">LKR {Number(item.item_revenue).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}