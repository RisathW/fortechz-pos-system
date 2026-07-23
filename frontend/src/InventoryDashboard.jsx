import React, { useState, useEffect } from 'react';
import { Save, Trash2, Library, Search } from 'lucide-react';

export default function InventoryDashboard({ user }) {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); 
  
  // State updated to handle shelf and row separately
  const [formData, setFormData] = useState({
    title: '', author_name: '', isbn_barcode: '', category: 'Reading Books', retail_price: '', cost_price: '', shelf: '', row: ''
  });

  const categories = ['Reading Books', 'Stationery', 'Exercise Books', 'Water Bottles', 'Trophies', 'Tennis Balls', 'Other'];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchBooks = () => {
    fetch('http://localhost:5000/api/books')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setBooks(data); });
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Auto-format the string based on what the user typed
    let locationString = 'Unassigned';
    if (formData.shelf && formData.row) {
      locationString = `Shelf - ${formData.shelf} Row - ${formData.row}`;
    } else if (formData.shelf) {
      locationString = `Shelf - ${formData.shelf}`;
    } else if (formData.row) {
      locationString = `Row - ${formData.row}`;
    }

    const res = await fetch('http://localhost:5000/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, available_qty: 0, location: locationString }) 
    });

    if (res.ok) {
      showToast("Item added! Use Stock Control to add quantities.");
      fetchBooks();
      setFormData({ title: '', author_name: '', isbn_barcode: '', category: 'Reading Books', retail_price: '', cost_price: '', shelf: '', row: '' });
    } else {
      showToast("Error adding item.");
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const res = await fetch(`http://localhost:5000/api/books/${deleteConfirm.id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchBooks();
      showToast("Item deleted successfully.");
    }
    setDeleteConfirm(null);
  };

  const filteredBooks = books.filter(b => {
    const s = search.toLowerCase();
    return (b.title || '').toLowerCase().includes(s) || 
           (b.isbn_barcode || '').includes(search) || 
           (b.author_name || '').toLowerCase().includes(s) ||
           (b.location || '').toLowerCase().includes(s);
  });

  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative transition-colors">
      
      {toast && (
        <div className="fixed top-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-2xl z-50 font-bold border-l-4 border-emerald-500 animate-pulse">
          {toast}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-6 border border-transparent dark:border-slate-700">
            <h3 className="font-black text-xl mb-4 dark:text-white">Confirm Deletion</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Are you sure you want to delete <span className="font-bold">"{deleteConfirm.title}"</span>?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="w-1/2 bg-slate-200 dark:bg-slate-800 dark:text-white font-bold py-3 rounded-xl transition-colors">Cancel</button>
              <button onClick={executeDelete} className="w-1/2 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <Library className="text-blue-600 dark:text-blue-400" size={32} /> Book & Item Inventory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">View stock levels, pricing, and physical locations.</p>
        </div>
        
        <div className="relative w-80">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Title, Barcode or Location..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-10 p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium shadow-sm transition-colors" 
          />
        </div>
      </div>

      {user?.role === 'Manager' && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <h2 className="font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider text-xs">Manager Control: Add New Item</h2>
          
          <div className="grid grid-cols-5 gap-4 mb-4">
            <input type="text" placeholder="Item Name / Title *" className="col-span-2 p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            <input type="text" placeholder="Barcode / ISBN" className="p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" value={formData.isbn_barcode} onChange={e => setFormData({...formData, isbn_barcode: e.target.value})} />
            
            {/* Split Input Boxes for Shelf and Row */}
            <div className="col-span-1 flex gap-2">
              <input type="text" placeholder="Shelf" className="w-1/2 p-3 border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-amber-700 dark:text-amber-400 text-center" value={formData.shelf} onChange={e => setFormData({...formData, shelf: e.target.value})} />
              <input type="text" placeholder="Row" className="w-1/2 p-3 border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-amber-700 dark:text-amber-400 text-center" value={formData.row} onChange={e => setFormData({...formData, row: e.target.value})} />
            </div>

            <select className="col-span-1 p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <input type="text" placeholder="Author Name (If Book)" className="col-span-2 p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.author_name} onChange={e => setFormData({...formData, author_name: e.target.value})} />
            <input type="number" step="0.01" placeholder="Cost Price (LKR)" className="p-3 border dark:border-slate-700 dark:border-red-800/50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} />
            <div className="flex gap-2">
              <input type="number" step="0.01" placeholder="Retail Price *" className="w-full p-3 border dark:border-slate-700 dark:border-emerald-800/50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" value={formData.retail_price} onChange={e => setFormData({...formData, retail_price: e.target.value})} required />
              <button type="submit" className="bg-blue-600 text-white font-bold px-4 rounded-lg hover:bg-blue-700 transition shadow-sm">
                <Save size={20} />
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex-1 transition-colors">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-700 dark:text-slate-300">
            <tr>
              <th className="p-4 font-bold">Item Details</th>
              <th className="p-4 font-bold">Location</th>
              <th className="p-4 font-bold">Category</th>
              <th className="p-4 font-bold text-center">In Stock</th>
              {/* ✅ Manager Only: Cost Price Column */}
              {user?.role === 'Manager' && <th className="p-4 font-bold text-right">Cost Price</th>}
              <th className="p-4 font-bold text-right">Retail Price</th>
              {user?.role === 'Manager' && <th className="p-4 font-bold text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredBooks.length === 0 && (
              <tr><td colSpan="7" className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">No items found.</td></tr>
            )}
            {filteredBooks.map(b => (
              <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <p className="font-black text-slate-800 dark:text-white">{b.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{b.isbn_barcode}</p>
                </td>
                <td className="p-4">
                  <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 font-bold px-2 py-1 rounded text-xs inline-block uppercase tracking-wide">
                    {b.location === 'Unassigned' ? 'UNASSIGNED' : b.location}
                  </span>
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">{b.category}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${b.available_qty <= 5 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                    {b.available_qty}
                  </span>
                </td>
                
                {/* ✅ Manager Only: Cost Price Value */}
                {user?.role === 'Manager' && (
                  <td className="p-4 font-bold text-red-500 dark:text-red-400 text-right">LKR {Number(b.cost_price).toFixed(2)}</td>
                )}

                <td className="p-4 font-bold text-slate-800 dark:text-white text-right">LKR {Number(b.retail_price).toFixed(2)}</td>
                {user?.role === 'Manager' && (
                  <td className="p-4 text-center">
                    <button onClick={() => setDeleteConfirm(b)} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
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