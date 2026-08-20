import React, { useState, useEffect } from 'react';
import { RotateCcw, Search } from 'lucide-react';

export default function ReturnsDashboard() {
  const [returns, setReturns] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/returns/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setReturns(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching returns:", err);
        setIsLoading(false);
      });
  }, []);

  const filteredReturns = returns.filter(r => 
    (r.invoice_number || '').toLowerCase().includes(search.toLowerCase()) || 
    (r.created_by || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <RotateCcw className="text-red-500 dark:text-red-400" size={32}/> Returns Audit Log
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Secure record of all cash refunded to customers.</p>
        </div>
        
        <div className="relative w-72">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Invoice No or Cashier..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-10 p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 dark:text-white transition-colors shadow-sm" 
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-y-auto shadow-sm flex-1 transition-colors">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
            <tr>
              <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Refund Date & Time</th>
              <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Original Invoice No</th>
              <th className="p-4 font-bold text-red-600 dark:text-red-400">Processed By (Cashier)</th>
              <th className="p-4 font-bold text-right text-slate-700 dark:text-slate-300">Total Cash Refunded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr><td colSpan="4" className="p-10 text-center font-bold text-slate-500 animate-pulse">Loading returns history...</td></tr>
            ) : filteredReturns.length === 0 ? (
              <tr><td colSpan="4" className="p-10 text-center font-bold text-slate-500">No returns have been processed yet.</td></tr>
            ) : (
              filteredReturns.map(ret => (
                <tr key={ret.id} className="hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors">
                  <td className="p-4 text-slate-600 dark:text-slate-300 text-sm font-medium">
                    {new Date(ret.created_at).toLocaleDateString()} <br/>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(ret.created_at).toLocaleTimeString()}</span>
                  </td>
                  <td className="p-4 font-black text-slate-800 dark:text-white font-mono text-sm">{ret.invoice_number}</td>
                  <td className="p-4 text-red-600 dark:text-red-400 font-bold">{ret.created_by}</td>
                  <td className="p-4 font-black text-red-600 dark:text-red-400 text-right">- LKR {Number(ret.amount).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}