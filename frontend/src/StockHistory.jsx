import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export default function StockHistory() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/stock/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(err => console.error("Failed to fetch stock history"));
  }, []);

  const filteredHistory = history.filter(h => 
    (h.title || '').toLowerCase().includes(search.toLowerCase()) || 
    (h.supplier || '').toLowerCase().includes(search.toLowerCase()) ||
    (h.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <ClipboardList className="text-blue-600 dark:text-blue-400" size={32}/> Stock Audit History
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Log of all GRN (Stock In) and PRN (Stock Out) transactions.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search item, supplier, or notes..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-10 p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium shadow-sm transition-colors" 
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-y-auto shadow-sm flex-1 transition-colors">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 transition-colors">
            <tr>
              <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Date & Time</th>
              <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Type</th>
              <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Supplier</th>
              <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Item Name</th>
              <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-center">Qty</th>
              <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-right">Buy Rate (LKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {filteredHistory.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">No stock transactions found.</td></tr>
            ) : (
              filteredHistory.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 text-slate-600 dark:text-slate-300 text-sm font-medium">
                    {new Date(log.created_at).toLocaleDateString()} <br/>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </td>
                  <td className="p-4">
                    {log.type === 'GRN' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold transition-colors">
                        <ArrowDownToLine size={12}/> GRN (In)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full text-xs font-bold transition-colors">
                        <ArrowUpFromLine size={12}/> PRN (Out)
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{log.supplier || 'N/A'}</td>
                  <td className="p-4">
                    <p className="font-black text-slate-800 dark:text-white">{log.title}</p>
                    {log.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">Note: {log.notes}</p>}
                  </td>
                  <td className="p-4 text-center font-black text-slate-800 dark:text-white">{log.quantity}</td>
                  <td className="p-4 text-right font-black text-slate-800 dark:text-white">
                    {Number(log.buy_rate).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}