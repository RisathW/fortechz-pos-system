import React, { useState, useEffect } from 'react';
import { Receipt, Search, Printer, RotateCcw, X, AlertCircle, Eye } from 'lucide-react';

export default function SalesHistory({ user }) {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [reprintSale, setReprintSale] = useState(null);
  const [activeReturn, setActiveReturn] = useState(null);
  const [viewSale, setViewSale] = useState(null); // State for viewing items
  const [returnItems, setReturnItems] = useState([]);

  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 6000); 
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
        showToast(`Backend Error: ${err.message}`);
        setIsLoading(false);
      });
  };

  useEffect(() => { fetchSales(); }, []);

  const filteredSales = sales.filter(s => 
    (s.invoice_number || '').toLowerCase().includes(search.toLowerCase()) || 
    (s.created_by || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleReprint = (sale) => {
    setReprintSale(sale);
    setTimeout(() => {
       window.print();
       setTimeout(() => setReprintSale(null), 500); 
    }, 100);
  };

  const openReturnModal = (sale) => {
    const remainingItems = (sale.items || []).reduce((acc, item) => acc + item.qty, 0);
    if (remainingItems === 0) {
      return showToast("All items on this invoice have been completely returned.");
    }
    setActiveReturn(sale);
    const itemsWithTracker = (sale.items || []).map(item => ({ ...item, returnQty: 0 }));
    setReturnItems(itemsWithTracker);
  };

  const updateReturnQty = (index, delta) => {
    setReturnItems(prev => {
      const newItems = [...prev];
      const item = newItems[index];
      const newQty = item.returnQty + delta;
      if (newQty >= 0 && newQty <= item.qty) { item.returnQty = newQty; }
      return newItems;
    });
  };

  const calculateTotalRefund = () => {
    return returnItems.reduce((sum, item) => sum + (item.returnQty * Number(item.price || 0)), 0);
  };

  const processReturn = async () => {
    const totalRefund = calculateTotalRefund();
    if (totalRefund === 0) return showToast("Please select at least one item to return.");

    const res = await fetch('http://localhost:5000/api/returns/process', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice_number: activeReturn.invoice_number,
        items: returnItems,
        total_refund: totalRefund,
        username: currentUser.username || 'System'
      })
    });

    if (res.ok) {
      fetch('http://localhost:5000/api/printer/open-drawer', { method: 'POST' }).catch(e => e);
      showToast(`Successfully processed refund of LKR ${totalRefund.toFixed(2)}!`);
      setActiveReturn(null);
      fetchSales(); 
    } else {
      showToast("Error processing return. Check server logs.");
    }
  };

  return (
    <>
      <div className="p-8 h-full flex flex-col gap-6 overflow-hidden bg-slate-50 dark:bg-slate-950 print:hidden relative transition-colors">
        
        {toast && (
          <div className={`fixed top-6 right-6 text-white px-6 py-4 rounded-xl shadow-2xl z-50 font-bold flex items-center gap-3 border-l-4 ${toast.includes('Error') ? 'bg-red-600 dark:bg-red-700 border-red-900' : 'bg-slate-800 dark:bg-slate-900 border-emerald-500'} animate-pulse`}>
            {toast.includes('Error') && <AlertCircle size={24} />}
            {toast}
          </div>
        )}

        {/* --- VIEW ITEMS MODAL (NEW) --- */}
        {viewSale && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[600px] max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-2">
                    <Receipt className="text-blue-500" size={24} /> Invoice Details
                  </h3>
                  <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-1">{viewSale.invoice_number}</p>
                </div>
                <button onClick={() => setViewSale(null)} className="text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg transition-colors"><X size={24} /></button>
              </div>
              
              <div className="p-5 overflow-y-auto bg-white dark:bg-slate-900">
                <table className="w-full text-left border-collapse rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-300 text-sm">Item Name</th>
                      <th className="p-3 text-center font-bold text-slate-700 dark:text-slate-300 text-sm">Qty</th>
                      <th className="p-3 text-right font-bold text-slate-700 dark:text-slate-300 text-sm">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {viewSale.items.filter(i=>i && i.title).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 text-sm font-bold text-slate-800 dark:text-white">
                           {item.title} 
                           {item.qty === 0 && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase">Fully Returned</span>}
                        </td>
                        <td className="p-3 text-center text-sm font-black text-slate-600 dark:text-slate-400">{item.qty}</td>
                        <td className="p-3 text-right text-sm text-slate-500 dark:text-slate-400">{Number(item.price || (item.subtotal / (item.qty || 1))).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- RETURN MODAL --- */}
        {activeReturn && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[600px] overflow-hidden flex flex-col max-h-[90vh] border border-transparent dark:border-slate-700 transition-colors">
              <div className="bg-slate-800 dark:bg-slate-950 text-white p-5 flex justify-between items-center transition-colors">
                <div>
                  <h3 className="font-black text-xl flex items-center gap-2"><RotateCcw size={20}/> Process Return</h3>
                  <p className="text-slate-300 text-sm font-mono mt-1">Invoice: {activeReturn.invoice_number}</p>
                </div>
                <button onClick={() => setActiveReturn(null)} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
              </div>

              <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 transition-colors">
                <table className="w-full text-left bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                  <thead className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 transition-colors">
                    <tr>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-200 text-sm">Item Name</th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-200 text-sm text-center">Remaining</th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-200 text-sm text-center">Return Qty</th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-200 text-sm text-right">Refund</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {returnItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 text-slate-800 dark:text-white font-bold text-sm">{item.title || 'Unknown Item'}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 font-bold text-center">{item.qty}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => updateReturnQty(idx, -1)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-black text-slate-600 dark:text-slate-300 transition-colors">-</button>
                            <span className="font-black w-4 dark:text-white">{item.returnQty}</span>
                            <button onClick={() => updateReturnQty(idx, 1)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-black text-slate-600 dark:text-slate-300 transition-colors">+</button>
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-white text-right">LKR {(item.returnQty * Number(item.price || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-sm">Total Refund Amount</span>
                  <span className="font-black text-3xl text-red-600 dark:text-red-400">LKR {calculateTotalRefund().toFixed(2)}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setActiveReturn(null)} className="flex-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button onClick={processReturn} className="flex-1 bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                    <RotateCcw size={20}/> Confirm & Restock
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MAIN PAGE CONTENT --- */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <Receipt className="text-blue-600 dark:text-blue-400" size={32}/> Checkout History
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Complete audit log of all transactions and returns.</p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input type="text" placeholder="Search Invoice No or Cashier..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium shadow-sm transition-colors" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-y-auto shadow-sm flex-1 transition-colors">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 transition-colors">
              <tr>
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Date & Time</th>
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Invoice No</th>
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Cashier</th>
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-center">Net Items Remaining</th>
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-center">Payment</th>
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-right">Net Total (LKR)</th>
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {isLoading ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-500 font-bold animate-pulse">Loading database history...</td></tr>
              ) : filteredSales.length === 0 ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-500 font-bold">Your database is empty.</td></tr>
              ) : (
                filteredSales.map(sale => {
                  const refundedAmount = Number(sale.refunded_amount) || 0;
                  const remainingItems = (sale.items || []).reduce((acc, item) => acc + item.qty, 0);
                  const isFullyRefunded = remainingItems === 0;
                  const netTotal = Math.max(0, Number(sale.total_amount) - refundedAmount);

                  return (
                    <tr key={sale.id} className={`transition-colors ${refundedAmount > 0 ? 'bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                      <td className="p-4 text-slate-600 dark:text-slate-300 text-sm font-medium">
                        {new Date(sale.created_at).toLocaleDateString()} <br/>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(sale.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="p-4 font-black text-slate-800 dark:text-white font-mono text-sm">{sale.invoice_number}</td>
                      <td className="p-4 text-blue-600 dark:text-blue-400 font-bold">{sale.created_by}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => setViewSale(sale)} className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 mx-auto hover:text-blue-600 transition-colors bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                          {remainingItems} items <Eye size={14}/>
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{sale.payment_type}</span>
                      </td>
                      <td className="p-4 font-black text-slate-800 dark:text-white text-right">
                        {refundedAmount > 0 && (
                          <div className="text-red-600 dark:text-red-400 flex items-center justify-end gap-1 text-xs mb-1 font-bold bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-md inline-flex float-right ml-auto">
                            <AlertCircle size={14}/> Returned: -{refundedAmount.toFixed(2)}
                          </div>
                        )}
                        <div className="clear-both pt-1">LKR {netTotal.toFixed(2)}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openReturnModal(sale)} title={isFullyRefunded ? "All Items Returned" : "Return Items"} disabled={isFullyRefunded} className={`${isFullyRefunded ? 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-50' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50'} font-bold p-2 rounded-lg transition-colors`}>
                            <RotateCcw size={16} />
                          </button>
                          <button onClick={() => handleReprint(sale)} title="Reprint Receipt" className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold p-2 rounded-lg transition-colors">
                            <Printer size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* (Keep Reprint Modal exactly as it was) */}
      {reprintSale && (
        <div className="hidden print:block w-[80mm] p-4 text-black bg-white font-mono text-sm mx-auto">
          <div className="text-center mb-4">
            <h1 className="font-black text-xl">Nalini Book Shop</h1>
            <p className="text-xs"> No 05,Opposite Bus Station,51000</p>
            <p className="text-xs mt-2 border-b border-black pb-2 border-dashed">
              Date: {new Date(reprintSale.created_at).toLocaleDateString()} {new Date(reprintSale.created_at).toLocaleTimeString()} <br/>
              Cashier: {reprintSale.created_by} <br/>
              Invoice: {reprintSale.invoice_number} <br/>
              <span className="font-black mt-1 inline-block">** DUPLICATE RECEIPT **</span>
            </p>
          </div>
          {(!reprintSale.invoice_number.startsWith('ADV-') && !reprintSale.invoice_number.startsWith('BAL-')) && (
            <table className="w-full mb-4 text-xs">
              <thead><tr className="border-b border-black border-dashed"><th className="text-left pb-1">Item</th><th className="text-center pb-1">Qty</th><th className="text-right pb-1">Amt</th></tr></thead>
              <tbody>
                {(reprintSale.items || []).map((item, idx) => (
                  <tr key={idx}><td className="py-1 break-words">{(item.title || '').substring(0, 15)}</td><td className="py-1 text-center">{item.qty}</td><td className="py-1 text-right">{Number(item.subtotal || 0).toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="border-t border-black border-dashed pt-2 flex justify-between font-black text-base mb-4">
            <span>TOTAL:</span><span>LKR {Number(reprintSale.total_amount || 0).toFixed(2)}</span>
          </div>
          <div className="text-center text-xs mt-6"><p>Thank You, Come Again!</p></div>
        </div>
      )}
    </>
  );
}