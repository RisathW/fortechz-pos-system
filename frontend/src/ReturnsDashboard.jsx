import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, Eye, X, Receipt } from 'lucide-react';

export default function ReturnsDashboard() {
  const [returns, setReturns] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewReturn, setViewReturn] = useState(null); // State for the popup modal

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
    <div className="p-8 h-full flex flex-col gap-6 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors relative">
      
      {/* --- VIEW RETURNED ITEMS MODAL --- */}
      {viewReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[600px] max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-2">
                  <Receipt className="text-red-500" size={24} /> Returned Items Breakdown
                </h3>
                <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-1">Invoice: {viewReturn.invoice_number}</p>
              </div>
              <button onClick={() => setViewReturn(null)} className="text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-5 overflow-y-auto bg-white dark:bg-slate-900">
              <div className="flex justify-between mb-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                 <p>Processed By: <span className="text-red-600 dark:text-red-400">{viewReturn.created_by}</span></p>
                 <p>Date: {new Date(viewReturn.created_at).toLocaleString()}</p>
              </div>

              <table className="w-full text-left border-collapse rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-3 font-bold text-slate-700 dark:text-slate-300 text-sm">Item Name</th>
                    <th className="p-3 text-center font-bold text-slate-700 dark:text-slate-300 text-sm">Returned Qty</th>
                    <th className="p-3 text-right font-bold text-slate-700 dark:text-slate-300 text-sm">Refund Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {(() => {
                    try {
                      const items = JSON.parse(viewReturn.returned_items || '[]');
                      if (items.length === 0) return <tr><td colSpan="3" className="p-4 text-center text-slate-400">No item details recorded for this legacy return.</td></tr>;
                      
                      return items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 text-sm font-bold text-slate-800 dark:text-white">{item.title}</td>
                          <td className="p-3 text-center text-sm font-black text-red-600 dark:text-red-400">{item.qty}</td>
                          <td className="p-3 text-right text-sm font-black text-slate-800 dark:text-white">
                            LKR {(item.qty * Number(item.price || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ));
                    } catch (e) {
                      return <tr><td colSpan="3" className="p-4 text-center text-red-500">Error parsing returned items data.</td></tr>;
                    }
                  })()}
                </tbody>
              </table>
            </div>

            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center">
               <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Cash Refunded</p>
               <span className="font-black text-2xl text-red-600 dark:text-red-400">- LKR {Number(viewReturn.amount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <RotateCcw className="text-red-500 dark:text-red-400" size={32}/> Returns Audit Log
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Secure record of all cash refunded and items restocked.</p>
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
              <th className="p-4 font-bold text-center text-slate-700 dark:text-slate-300">Returned Items</th>
              <th className="p-4 font-bold text-right text-slate-700 dark:text-slate-300">Total Cash Refunded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr><td colSpan="5" className="p-10 text-center font-bold text-slate-500 animate-pulse">Loading returns history...</td></tr>
            ) : filteredReturns.length === 0 ? (
              <tr><td colSpan="5" className="p-10 text-center font-bold text-slate-500">No returns have been processed yet.</td></tr>
            ) : (
              filteredReturns.map(ret => (
                <tr key={ret.id} className="hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors">
                  <td className="p-4 text-slate-600 dark:text-slate-300 text-sm font-medium">
                    {new Date(ret.created_at).toLocaleDateString()} <br/>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(ret.created_at).toLocaleTimeString()}</span>
                  </td>
                  <td className="p-4 font-black text-slate-800 dark:text-white font-mono text-sm">{ret.invoice_number}</td>
                  <td className="p-4 text-red-600 dark:text-red-400 font-bold">{ret.created_by}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setViewReturn(ret)} 
                      className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 font-bold py-1.5 px-3 rounded-lg flex items-center gap-2 justify-center mx-auto transition-colors text-xs border border-red-200 dark:border-red-800/50"
                    >
                      <Eye size={14} /> View Returned Items
                    </button>
                  </td>
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