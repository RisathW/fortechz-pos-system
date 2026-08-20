import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, AlertCircle, CheckCircle, Receipt, ArrowRight, PackageX } from 'lucide-react';

export default function ReturnsDashboard({ user }) {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [returnItems, setReturnItems] = useState([]);

  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(''), 4000);
  };

  const fetchSales = () => {
    setIsLoading(true);
    fetch(`http://localhost:5000/api/sales/history?t=${Date.now()}`)
      .then(async res => {
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await res.json() : null;
        if (!res.ok) throw new Error(data && data.error ? data.error : "Database connection failed");
        return data;
      })
      .then(data => { 
        if (Array.isArray(data)) setSales(data); 
        else setSales([]);
        setIsLoading(false);
      })
      .catch(err => {
        showToast(`Backend Error: ${err.message}`, 'error');
        setIsLoading(false);
      });
  };

  useEffect(() => { 
    fetchSales(); 
  }, []);

  // Filter out reservations, we only want actual completed sales for returns
  const filteredSales = sales.filter(s => 
    !s.invoice_number.startsWith('ADV-') &&
    ((s.invoice_number || '').toLowerCase().includes(search.toLowerCase()) || 
    (s.created_by || '').toLowerCase().includes(search.toLowerCase()))
  );

  const selectInvoice = (sale) => {
    const remainingItems = (sale.items || []).reduce((acc, item) => acc + item.qty, 0);
    if (remainingItems === 0) {
      return showToast("All items on this invoice have already been returned.", "error");
    }
    
    setActiveInvoice(sale);
    // Initialize the tracker array for this specific invoice
    const itemsWithTracker = (sale.items || []).map(item => ({ ...item, returnQty: 0 }));
    setReturnItems(itemsWithTracker);
  };

  const updateReturnQty = (index, delta) => {
    setReturnItems(prev => {
      const newItems = [...prev];
      const item = newItems[index];
      const newQty = item.returnQty + delta;
      
      // Prevent returning less than 0 or more than the customer actually bought
      if (newQty >= 0 && newQty <= item.qty) { 
        item.returnQty = newQty; 
      }
      return newItems;
    });
  };

  const calculateTotalRefund = () => {
    return returnItems.reduce((sum, item) => sum + (item.returnQty * Number(item.price || 0)), 0);
  };

  const processReturn = async () => {
    const totalRefund = calculateTotalRefund();
    if (totalRefund === 0) return showToast("Please select at least one item to return.", "error");

    const res = await fetch('http://localhost:5000/api/returns/process', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice_number: activeInvoice.invoice_number,
        items: returnItems,
        total_refund: totalRefund,
        username: currentUser.username || 'System'
      })
    });

    if (res.ok) {
      // Automatically pop the cash drawer if they are refunding money
      fetch('http://localhost:5000/api/printer/open-drawer', { method: 'POST' }).catch(e => e);
      
      showToast(`Successfully refunded LKR ${totalRefund.toFixed(2)}! Drawer opened.`);
      setActiveInvoice(null);
      setSearch('');
      fetchSales(); 
    } else {
      showToast("Error processing return. Check server logs.", "error");
    }
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors relative">
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-6 right-6 text-white px-6 py-4 rounded-xl shadow-2xl z-50 font-bold flex items-center gap-3 border-l-4 ${toast.type === 'error' ? 'bg-red-600 dark:bg-red-700 border-red-900' : 'bg-slate-800 dark:bg-slate-900 border-emerald-500'} animate-pulse`}>
          {toast.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
          {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <RotateCcw className="text-red-500 dark:text-red-400" size={32}/> Returns & Refunds
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Scan an invoice to process customer refunds and restock inventory.</p>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        
        {/* LEFT PANEL: INVOICE SEARCH */}
        <div className="w-1/3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col transition-colors overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Scan or type Invoice No..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full pl-10 p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-slate-800 dark:text-white transition-colors shadow-sm" 
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
               <p className="text-center font-bold text-slate-500 mt-10 animate-pulse">Searching records...</p>
            ) : filteredSales.length === 0 ? (
               <p className="text-center font-bold text-slate-500 mt-10">No matching invoices found.</p>
            ) : (
              filteredSales.map(sale => {
                const remainingItems = (sale.items || []).reduce((acc, item) => acc + item.qty, 0);
                const isActive = activeInvoice && activeInvoice.id === sale.id;

                return (
                  <div 
                    key={sale.id}
                    onClick={() => selectInvoice(sale)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 shadow-md' 
                        : remainingItems === 0
                          ? 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-mono font-black text-sm ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                        {sale.invoice_number}
                      </span>
                      {remainingItems === 0 && (
                        <span className="text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">REFUNDED</span>
                      )}
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span>{new Date(sale.created_at).toLocaleDateString()}</span>
                      <span>{remainingItems} items</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: RETURN PROCESSOR */}
        <div className="w-2/3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col transition-colors overflow-hidden">
          {!activeInvoice ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
              <PackageX size={64} className="mb-4 opacity-50" />
              <h2 className="text-xl font-bold">No Invoice Selected</h2>
              <p className="font-medium mt-1">Select an invoice from the left panel to begin a return.</p>
            </div>
          ) : (
            <>
              {/* Active Invoice Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Receipt className="text-slate-400" /> Invoice {activeInvoice.invoice_number}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1">
                    Cashier: {activeInvoice.created_by} | Original Payment: {activeInvoice.payment_type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Max Refund Available</p>
                  <p className="text-xl font-black text-slate-800 dark:text-white">LKR {Number(activeInvoice.total_amount).toFixed(2)}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="flex-1 overflow-y-auto p-6">
                <table className="w-full text-left">
                  <thead className="border-b-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">
                    <tr>
                      <th className="pb-3 font-bold">Item Description</th>
                      <th className="pb-3 font-bold text-center">Purchased</th>
                      <th className="pb-3 font-bold text-center">Qty to Return</th>
                      <th className="pb-3 font-bold text-right">Refund Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {returnItems.map((item, idx) => (
                      <tr key={idx} className={item.returnQty > 0 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                        <td className="py-4 text-slate-800 dark:text-white font-bold text-sm">
                          {item.title || 'Unknown Item'}
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1">LKR {Number(item.price).toFixed(2)} each</div>
                        </td>
                        <td className="py-4 text-slate-500 dark:text-slate-400 font-black text-center text-lg">{item.qty}</td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-max mx-auto p-1 border border-slate-200 dark:border-slate-700 shadow-inner">
                            <button 
                              onClick={() => updateReturnQty(idx, -1)} 
                              disabled={item.returnQty === 0}
                              className="w-10 h-10 rounded-md bg-white dark:bg-slate-700 disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-600 font-black text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
                            >-</button>
                            <span className={`font-black text-xl w-6 text-center ${item.returnQty > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                              {item.returnQty}
                            </span>
                            <button 
                              onClick={() => updateReturnQty(idx, 1)} 
                              disabled={item.returnQty === item.qty}
                              className="w-10 h-10 rounded-md bg-white dark:bg-slate-700 disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-600 font-black text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
                            >+</button>
                          </div>
                        </td>
                        <td className="py-4 font-black text-slate-800 dark:text-white text-right text-lg">
                          LKR {(item.returnQty * Number(item.price || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Footer */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Cash to Return</p>
                  <p className="text-4xl font-black text-red-600 dark:text-red-400">LKR {calculateTotalRefund().toFixed(2)}</p>
                </div>
                <button 
                  onClick={processReturn} 
                  disabled={calculateTotalRefund() === 0}
                  className="bg-red-600 text-white font-black py-4 px-8 rounded-xl hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 transition-colors flex items-center justify-center gap-3 shadow-sm text-lg"
                >
                  Confirm Refund & Restock <ArrowRight size={24}/>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}