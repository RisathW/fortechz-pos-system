import React, { useState, useEffect } from 'react';
import { Receipt, Search, Printer, Eye, X } from 'lucide-react';

export default function CheckoutHistory() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  
  const [reprintSale, setReprintSale] = useState(null);
  const [viewSale, setViewSale] = useState(null); // ✅ New state for the items modal

  useEffect(() => {
    fetch('http://localhost:5000/api/sales/history')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSales(data); });
  }, []);

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

  return (
    <>
      <div className="p-8 h-full flex flex-col gap-6 overflow-hidden bg-slate-50 dark:bg-slate-950 print:hidden transition-colors relative">
        
        {/* --- VIEW ITEMS MODAL --- */}
        {viewSale && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[600px] max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
              <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-2">
                    <Receipt className="text-blue-500" size={24} /> Invoice Details
                  </h3>
                  <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-1">{viewSale.invoice_number}</p>
                </div>
                <button onClick={() => setViewSale(null)} className="text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto bg-white dark:bg-slate-900">
                <div className="flex justify-between mb-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                   <p>Cashier: <span className="text-blue-600 dark:text-blue-400">{viewSale.created_by}</span></p>
                   <p>Date: {new Date(viewSale.created_at).toLocaleString()}</p>
                </div>

                <table className="w-full text-left border-collapse rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-300 text-sm">Item Name</th>
                      <th className="p-3 text-center font-bold text-slate-700 dark:text-slate-300 text-sm">Qty</th>
                      <th className="p-3 text-right font-bold text-slate-700 dark:text-slate-300 text-sm">Unit Price</th>
                      <th className="p-3 text-right font-bold text-slate-700 dark:text-slate-300 text-sm">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {viewSale.items.filter(i=>i && i.title).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 text-sm font-bold text-slate-800 dark:text-white">{item.title}</td>
                        <td className="p-3 text-center text-sm font-black text-slate-600 dark:text-slate-400">{item.qty}</td>
                        <td className="p-3 text-right text-sm text-slate-500 dark:text-slate-400">
                          {Number(item.price || (item.subtotal / item.qty)).toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-sm font-black text-slate-800 dark:text-white">
                          {Number(item.subtotal || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center">
                 <div>
                   <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payment Method</p>
                   <p className="font-bold text-slate-700 dark:text-slate-200">{viewSale.payment_type}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Paid</p>
                   <span className="font-black text-2xl text-blue-600 dark:text-blue-400">LKR {Number(viewSale.total_amount).toFixed(2)}</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <Receipt className="text-blue-600 dark:text-blue-400" size={32}/> Checkout History
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Complete audit log of all transactions and cashiers.</p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Invoice No or Cashier..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full pl-10 p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium shadow-sm transition-colors" 
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-y-auto shadow-sm flex-1 transition-colors">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="p-4 font-bold">Date & Time</th>
                <th className="p-4 font-bold">Invoice No</th>
                <th className="p-4 font-bold">Cashier</th>
                <th className="p-4 font-bold text-center">Items Sold / Status</th>
                <th className="p-4 font-bold text-center">Payment</th>
                <th className="p-4 font-bold text-right">Total (LKR)</th>
                <th className="p-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.map(sale => {
                const validItems = (sale.items || []).filter(i => i && i.title);
                
                return (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-slate-600 dark:text-slate-300 text-sm font-medium">
                      {new Date(sale.created_at).toLocaleDateString()} <br/>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(sale.created_at).toLocaleTimeString()}</span>
                    </td>
                    <td className="p-4 font-black text-slate-800 dark:text-white font-mono text-sm">{sale.invoice_number}</td>
                    <td className="p-4 text-blue-600 dark:text-blue-400 font-bold">{sale.created_by}</td>
                    <td className="p-4 text-center">
                      {/* ✅ Modified: Now shows a clean button instead of bullet points */}
                      {sale.invoice_number.startsWith('ADV-') ? (
                        <span className="text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded border border-amber-200 dark:border-amber-800/50 text-xs shadow-sm uppercase tracking-wider">
                          Reservation Advance
                        </span>
                      ) : sale.invoice_number.startsWith('BAL-') ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded border border-emerald-200 dark:border-emerald-800/50 text-xs shadow-sm uppercase tracking-wider">
                          Balance Paid (Pickup)
                        </span>
                      ) : validItems.length > 0 ? (
                        <button 
                          onClick={() => setViewSale(sale)} 
                          className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold py-1.5 px-3 rounded-lg flex items-center gap-2 justify-center mx-auto transition-colors text-xs border border-blue-200 dark:border-blue-800/50"
                        >
                          <Eye size={14} /> View {validItems.length} Items
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-xs">No items recorded</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sale.payment_type.includes('Cash') && sale.payment_type.includes('Card') ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                        sale.payment_type === 'Cash' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        {sale.payment_type}
                      </span>
                    </td>
                    <td className="p-4 font-black text-slate-800 dark:text-white text-right">LKR {Number(sale.total_amount).toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleReprint(sale)} 
                        className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold py-2 px-3 rounded-lg flex items-center gap-2 justify-center mx-auto transition-colors text-xs"
                      >
                        <Printer size={14} /> Reprint
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

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
              <thead>
                <tr className="border-b border-black border-dashed">
                  <th className="text-left pb-1">Item</th>
                  <th className="text-center pb-1">Qty</th>
                  <th className="text-right pb-1">Amt</th>
                </tr>
              </thead>
              <tbody>
                {(reprintSale.items || []).filter(i => i && i.title).map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1 break-words">{item.title.substring(0, 15)}</td>
                    <td className="py-1 text-center">{item.qty}</td>
                    <td className="py-1 text-right">{Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          <div className="border-t border-black border-dashed pt-2 flex justify-between font-black text-base mb-4">
            <span>{reprintSale.invoice_number.startsWith('ADV-') ? 'ADVANCE:' : reprintSale.invoice_number.startsWith('BAL-') ? 'BALANCE:' : 'TOTAL:'}</span>
            <span>LKR {Number(reprintSale.total_amount).toFixed(2)}</span>
          </div>
          <div className="text-center text-xs mt-6">
            <p>Thank You, Come Again!</p>
          </div>
        </div>
      )}
    </>
  );
}