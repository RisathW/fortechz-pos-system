import React, { useState, useEffect } from 'react';
import { Search, Trash2, Package, AlertTriangle, Printer } from 'lucide-react';

export default function GeneralInventory({ user }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ title: '', category: 'Stationery', cost_price: '', retail_price: '', available_qty: '' });
  
  // Custom non-blocking alert & confirm states
  const [toast, setToast] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const categories = ['Stationery', 'Exercise Books', 'Water Bottles', 'Trophies', 'Tennis Balls'];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchItems = () => {
    fetch('http://localhost:5000/api/books').then(res => res.json()).then(data => { 
      if (Array.isArray(data)) setItems(data.filter(item => categories.includes(item.category)));
    });
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submissionData = { ...formData, cost_price: parseFloat(formData.cost_price) || 0, author_name: 'N/A', isbn_barcode: `ITEM-${Date.now()}` };
    const res = await fetch('http://localhost:5000/api/books', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submissionData) });
    if (res.ok) { 
      setFormData({ title: '', category: 'Stationery', cost_price: '', retail_price: '', available_qty: '' }); 
      fetchItems(); 
      showToast("Item added successfully!");
    } else {
      showToast("Error adding item.");
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const res = await fetch(`http://localhost:5000/api/books/${deleteConfirm}`, { method: 'DELETE' });
    if (res.ok) {
      fetchItems();
      showToast("Item deleted!");
    }
    setDeleteConfirm(null);
  };

  const printBarcode = (item) => {
    const printWindow = window.open('', '', 'width=300,height=200');
    printWindow.document.write(`
      <html>
        <body style="text-align:center; font-family:monospace; margin-top:20px;">
          <h2 style="margin:0; font-size:16px;">${item.title.substring(0, 20)}</h2>
          <p style="margin:5px 0; font-size:12px;">LKR ${item.retail_price}</p>
          <div style="font-size:24px; font-weight:bold; letter-spacing:2px; padding:10px; border:1px solid #000; display:inline-block;">*${item.isbn_barcode}*</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const filteredItems = items.filter(item => search === '' || (item.title || '').toLowerCase().includes(search.toLowerCase()));
  const lowStockItems = items.filter(i => i.available_qty <= 5);

  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-hidden bg-slate-50 dark:bg-slate-950 relative transition-colors">
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-2xl z-50 font-bold border-l-4 border-blue-500 animate-pulse">
          {toast}
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-6 border border-transparent dark:border-slate-700">
            <h3 className="font-black text-xl mb-4 dark:text-white">Confirm Deletion</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="w-1/2 bg-slate-200 dark:bg-slate-800 dark:text-white font-bold py-3 rounded-xl transition-colors">Cancel</button>
              <button onClick={executeDelete} className="w-1/2 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* LOW STOCK ALERT BANNER */}
      {user?.role === 'Manager' && lowStockItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-500/70 p-4 rounded-r-xl flex items-start gap-3 shadow-sm transition-colors">
          <AlertTriangle className="text-red-500 dark:text-red-400" size={24}/>
          <div>
            <h3 className="text-red-800 dark:text-red-400 font-bold">Low Stock Warning ({lowStockItems.length} items)</h3>
            <p className="text-red-600 dark:text-red-300 text-sm font-medium">The following items have 5 or less in stock: {lowStockItems.slice(0,5).map(i=>i.title).join(', ')}{lowStockItems.length > 5 ? '...' : ''}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Package className="text-blue-600 dark:text-blue-400" size={32}/> General Store Inventory</h1>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search general items..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-10 p-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium shadow-sm transition-colors" 
          />
        </div>
      </div>
      
      {/* ADD ITEM FORM (MANAGER) */}
      {user?.role === 'Manager' && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm grid grid-cols-6 gap-4 items-end transition-colors">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Item Name *</label>
            <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-3 font-bold outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Category</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-3 font-medium outline-none focus:ring-2 focus:ring-blue-500">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Buy Rate</label>
            <input type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full border dark:border-slate-700 rounded-lg p-3 font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Retail Price *</label>
            <input type="number" step="0.01" required value={formData.retail_price} onChange={e => setFormData({...formData, retail_price: e.target.value})} className="w-full border dark:border-slate-700 rounded-lg p-3 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="col-span-1 flex gap-2">
            <div className="w-1/3">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Qty</label>
              <input type="number" required value={formData.available_qty} onChange={e => setFormData({...formData, available_qty: e.target.value})} className="w-full border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg p-3 font-bold px-2 text-center outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="w-2/3">
              <button type="submit" className="w-full h-[50px] bg-blue-600 text-white font-black rounded-lg hover:bg-blue-700 transition-colors">Add</button>
            </div>
          </div>
        </form>
      )}

      {/* ITEMS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-y-auto shadow-sm flex-1 transition-colors">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-700 dark:text-slate-300">
            <tr>
              <th className="p-4 font-bold">Item Name</th>
              <th className="p-4 font-bold text-center">Stock</th>
              {/* ✅ Manager Only: Cost Price Column */}
              {user?.role === 'Manager' && <th className="p-4 font-bold text-right">Cost Price</th>}
              <th className="p-4 font-bold text-right">Retail Price</th>
              {user?.role === 'Manager' && <th className="p-4 font-bold text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <p className="font-black text-slate-800 dark:text-white">{item.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{item.isbn_barcode}</p>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.available_qty <= 5 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                    {item.available_qty}
                  </span>
                </td>
                
                {/* ✅ Manager Only: Cost Price Value */}
                {user?.role === 'Manager' && (
                  <td className="p-4 font-bold text-red-500 dark:text-red-400 text-right">LKR {Number(item.cost_price).toFixed(2)}</td>
                )}
                
                <td className="p-4 font-black text-slate-800 dark:text-white text-right">LKR {Number(item.retail_price).toFixed(2)}</td>
                {user?.role === 'Manager' && (
                  <td className="p-4 text-center space-x-2">
                    <button onClick={() => printBarcode(item)} title="Print Label" className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Printer size={18} /></button>
                    <button onClick={() => setDeleteConfirm(item.id)} title="Delete" className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}