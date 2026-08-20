import React, { useState, useEffect } from 'react';
import { TrendingUp, Banknote, CreditCard, Calendar, RotateCcw, Activity, Printer, Filter } from 'lucide-react';
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

  // 1. Calculate Gross Revenue (This is already adjusted by the backend for returns!)
  const grossRevenue = summary.reduce((sum, s) => sum + parseFloat(s.total), 0);
  
  // 2. 🚨 THE FIX: Net Profit is JUST Revenue minus Cost. 
  // We DO NOT subtract totalReturns here, because grossRevenue already went down!
  const netProfit = grossRevenue - totalCogs;
  
  const cashRevenue = summary.find(s => s.payment_type === 'Cash')?.total || 0;
  const cardRevenue = summary.find(s => s.payment_type === 'Card')?.total || 0;

  // Smart Grouping for the Pie Chart
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

  // ✅ Custom Tooltip to support Tailwind Dark Mode inside Recharts
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

      {/* PRINT HEADER */}
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-3xl font-black text-black">Nalini Book Shop - Business Report</h1>
        <p className="text-gray-500 font-bold mt-1">
          Report Period: {period === 'custom' ? `${startDate} to ${endDate}` : period.toUpperCase().replace('_', ' ')}
        </p>
        <p className="text-xs text-gray-400">Generated on: {new Date().toLocaleString()}</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl font-bold mb-6 shadow-sm print:hidden transition-colors">
          Error: {errorMsg}
        </div>
      )}

      {/* 4-CARD DASHBOARD - Fixed for Print Layout */}
      <div className="grid grid-cols-4 gap-6 mb-8 print:grid print:grid-cols-4 print:gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between print:border-gray-300 print:shadow-none print:p-4 transition-colors">
          <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400 font-bold text-sm">
            <TrendingUp size={18} className="text-blue-500 dark:text-blue-400" /> Gross Revenue
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white print:text-black">LKR {grossRevenue.toFixed(2)}</div>
        </div>

        {/* This card just displays the totalReturns variable for cash flow awareness */}
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 flex flex-col justify-between print:bg-white print:border-gray-300 print:shadow-none print:p-4 transition-colors">
          <div className="flex items-center gap-2 mb-4 text-red-500 dark:text-red-400 font-bold text-sm print:text-gray-500">
            <RotateCcw size={18} /> Total Cash Refunded
          </div>
          <div className="text-2xl lg:text-3xl font-black text-red-600 dark:text-red-400 print:text-black">- LKR {totalReturns.toFixed(2)}</div>
        </div>

        <div className="bg-emerald-600 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between print:bg-white print:border print:border-gray-300 print:shadow-none print:text-black print:p-4 transition-colors">
          <div className="flex items-center gap-2 mb-4 opacity-90 font-bold text-sm print:text-gray-500">
            <Activity size={18} /> Net (Profit)
          </div>
          {/* ✅ Now displaying the fully calculated True Profit */}
          <div className="text-2xl lg:text-3xl font-black">LKR {netProfit.toFixed(2)}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center gap-3 print:border-gray-300 print:shadow-none transition-colors">
          <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1"><Banknote size={16} className="text-emerald-500 dark:text-emerald-400 print:text-gray-500"/> Cash</span>
            <span className="print:text-black">LKR {Number(cashRevenue).toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-[1px]"></div>
          <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1"><CreditCard size={16} className="text-blue-500 dark:text-blue-400 print:text-gray-500"/> Card</span>
            <span className="print:text-black">LKR {Number(cardRevenue).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION - Fixed widths, responsive pie, tilted text */}
      {(items.length > 0 || paymentData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:grid print:grid-cols-3 print:gap-4 print:mb-8 print:break-inside-avoid">
          
          {/* BAR CHART */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 print:border-none print:shadow-none print:p-0 transition-colors">
            <h2 className="font-bold text-lg mb-6 text-slate-800 dark:text-white">Top 10 Selling Items</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={items.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                  <XAxis 
                    dataKey="title" 
                    tick={{fontSize: 11, fill: '#64748b'}} 
                    tickLine={false} 
                    axisLine={false} 
                    interval={0}
                    angle={-35} // Tilt text for readability
                    textAnchor="end" // Align text to the tick
                    tickFormatter={(val) => val.length > 18 ? val.substring(0, 18) + '...' : val} 
                  />
                  <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs.${val}`} width={80} />
                  
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 print:border-none print:shadow-none print:p-0 transition-colors">
            <h2 className="font-bold text-lg mb-6 text-slate-800 dark:text-white text-center">Payment Breakdown</h2>
            <div className="h-72 w-full flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%" 
                    outerRadius="80%"
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  
                  <RechartsTooltip content={<CustomTooltip />} />
                  
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', paddingTop: '20px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* DETAILED DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden print:border-none print:shadow-none print:mt-4 transition-colors">
        <h2 className="font-bold text-lg p-6 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white print:px-0 print:border-b-2 print:border-gray-800">Net Items Sold Breakdown</h2>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 print:bg-white">
            <tr>
              <th className="p-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-xs print:text-black print:px-0">Book / Item Title</th>
              <th className="p-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-xs text-center print:text-black">Net Units Sold</th>
              <th className="p-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-xs text-right print:text-black print:px-0">Net Revenue Generated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 print:divide-gray-200">
            {items.length === 0 && !errorMsg && (
              <tr><td colSpan="3" className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">No sales recorded for this period.</td></tr>
            )}
            
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-bold text-slate-800 dark:text-white print:px-0">{item.title}</td>
                <td className="p-4 text-center font-black text-blue-600 dark:text-blue-400 print:text-black">{item.qty_sold}</td>
                <td className="p-4 text-right font-black text-slate-700 dark:text-slate-300 print:px-0 print:text-black">LKR {Number(item.item_revenue).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}