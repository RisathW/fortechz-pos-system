import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Plus, X } from 'lucide-react';

export default function StockManagement({ user }) {
  const [suppliers, setSuppliers] = useState([]);
  const [books, setBooks] = useState([]);
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({ supplier_id: '', type: 'GRN', notes: '' });
  
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ 
    title: '', author_name: '', category: 'Reading Books', 
    isbn_barcode: '', retail_price: '', cost_price: '' 
  });
  
  // ✅ NEW: Toast Notification State
  const [toast, setToast] = useState('');

  const categories = ['Reading Books', 'Stationery', 'Exercise Books', 'Water Bottles', 'Trophies', 'Tennis Balls', 'Other'];

  // ✅ NEW: Toast Helper Function
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchBooks = () => {
    return fetch('http://localhost:5000/api/books')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setBooks(data); return data; });
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/suppliers')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSuppliers(data); });
    fetchBooks();
  }, []);

  const addToTransaction = (book) => {
    if (cart.find(item => item.id === book.id)) return showToast("Item already in transaction!"); 
    setCart([...cart, { ...book, qty: 1, buy_rate: parseFloat(book.cost_price) || 0 }]);
  };

  const updateQty = (id, newQty) => {
    setCart(cart.map(item => item.id === id ? {...item, qty: parseInt(newQty) || 0} : item));
  };

  const updateBuyRate = (id, newRate) => {
    setCart(cart.map(item => item.id === id ? {...item, buy_rate: parseFloat(newRate) || 0} : item));
  };

  const handleCreateNewItem = async () => {
    if (!newItem.title || !newItem.retail_price) return showToast("Item Name and Retail Price are required."); 
    
    const res = await fetch('http://localhost:5000/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, available_qty: 0 })
    });
    
    if (res.ok) {
      const updatedBooks = await fetchBooks();
      const justAdded = updatedBooks.find(b => b.title === newItem.title && b.isbn_barcode === newItem.isbn_barcode);
      
      if (justAdded) addToTransaction(justAdded);
      
      setShowAddModal(false);
      setNewItem({ title: '', author_name: '', category: 'Reading Books', isbn_barcode: '', retail_price: '', cost_price: '' });
      setItemSearch('');
      setShowItemDropdown(false);
      showToast("New item created!");
    } else {
      showToast("Error creating new item."); 
    }
  };

  const processStock = async () => {
    if (!formData.supplier_id) return showToast("Select a supplier!"); 
    if (cart.length === 0) return showToast("Add at least one item to the transaction!"); 

    const total = cart.reduce((sum, item) => sum + (item.qty * item.buy_rate), 0);
    const res = await fetch('http://localhost:5000/api/stock/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, items: cart, total_cost: total })
    });
    
    if (res.ok) { 
      showToast(`Stock ${formData.type} processed successfully!`); 
      setCart([]); 
      setFormData({...formData, supplier_id: '', notes: ''}); 
      setSupplierSearch(''); 
      setItemSearch('');
      fetchBooks();
    } else {
      showToast("Error processing stock. Please check the console."); 
    }
  };

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const searchTxt = itemSearch.trim().toLowerCase();
      const scannedItem = books.find(b => 
        (b.isbn_barcode || '') === searchTxt || 
        (b.title || '').toLowerCase() === searchTxt
      );
      
      if (scannedItem) {
        addToTransaction(scannedItem);
        setItemSearch(''); 
        setShowItemDropdown(false);
      } else {
        setNewItem({ ...newItem, isbn_barcode: itemSearch.trim() });
        setShowAddModal(true);
        setItemSearch('');
        setShowItemDropdown(false);
      }
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    (s.company_name || '').toLowerCase().includes((supplierSearch || '').toLowerCase())
  );

  const filteredBooks = books.filter(b => 
    (b.title || '').toLowerCase().includes((itemSearch || '').toLowerCase()) || 
    (b.isbn_barcode || '').includes(itemSearch || '')
  );

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 h-full overflow-y-auto relative transition-colors">
      
      {/* ✅ FLOATING TOAST NOTIFICATION INSTEAD OF NATIVE ALERT */}
      {toast && (
        <div className="fixed top-6 right-6 bg-slate-800 dark:bg-slate-900 text-white px-6 py-3 rounded-lg shadow-2xl z-50 font-bold border-l-4 border-emerald-500 animate-pulse">
          {toast}
        </div>
      )}

      <h1 className="text-3xl font-black mb-6 text-slate-800 dark:text-white">Stock Control (GRN/PRN)</h1>
      
      <div className="grid grid-cols-2 gap-8">
        
        {/* LEFT PANEL */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          
          <div className="flex gap-4 mb-4">
            <div className="relative w-2/3">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Search Supplier</label>
              <Search className="absolute left-3 top-9 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Type to search supplier..." 
                value={supplierSearch} 
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setShowSupplierDropdown(true);
                  if (formData.supplier_id) setFormData({...formData, supplier_id: ''}); 
                }} 
                onFocus={() => setShowSupplierDropdown(true)}
                onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)} 
                className={`w-full pl-10 p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-colors ${formData.supplier_id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800/50 text-blue-700 dark:text-blue-400' : ''}`} 
              />
              {formData.supplier_id && <CheckCircle className="absolute right-3 top-9 text-blue-500 dark:text-blue-400" size={18} />}

              {showSupplierDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredSuppliers.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => {
                        setFormData({...formData, supplier_id: s.id});
                        setSupplierSearch(s.company_name); 
                        setShowSupplierDropdown(false);
                      }}
                      className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {s.company_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-1/3">
               <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Type</label>
               <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-3 border dark:border-slate-700 rounded-lg font-black bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors">
                <option value="GRN">GRN (Stock In)</option>
                <option value="PRN">PRN (Stock Out)</option>
              </select>
            </div>
          </div>
          
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Notes</label>
          <textarea placeholder="Add transaction notes..." className="w-full p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          
          <div className="border-t dark:border-slate-800 pt-6 transition-colors">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Add Items</label>
            
            <div className="flex gap-2 relative">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-4 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search item or scan barcode..." 
                  value={itemSearch} 
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    setShowItemDropdown(true);
                  }} 
                  onFocus={() => setShowItemDropdown(true)}
                  onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
                  onKeyDown={handleBarcodeScan}
                  className="w-full pl-10 p-4 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-lg transition-all" 
                />

                {showItemDropdown && itemSearch && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                    {filteredBooks.map(b => (
                      <div 
                        key={b.id} 
                        onClick={() => {
                          addToTransaction(b);
                          setItemSearch(''); 
                          setShowItemDropdown(false);
                        }}
                        className="p-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{b.title}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">Barcode: {b.isbn_barcode}</p>
                        </div>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">Add</span>
                      </div>
                    ))}
                    {filteredBooks.length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-3">Item not found in database.</p>
                        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 text-sm w-full transition-colors">
                          + Create New Item
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowAddModal(true)} 
                className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-800/50 px-4 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 flex flex-col items-center justify-center transition-colors"
              >
                <Plus size={20} />
                <span className="text-xs">New</span>
              </button>

            </div>
          </div>
        </div>
        
        {/* RIGHT PANEL */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col transition-colors">
          <h2 className="font-bold text-xl mb-4 text-slate-800 dark:text-white">Current Transaction</h2>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            <div className="flex font-bold text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider border-b dark:border-slate-800 pb-2 transition-colors">
                <span className="flex-1">Item Name</span>
                <span className="w-16 text-center">Qty</span>
                <span className="w-28 text-right">Buy Rate (LKR)</span>
            </div>
            
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-500">
                 <p className="font-bold">Transaction is empty.</p>
                 <p className="text-sm">Search and select items on the left.</p>
              </div>
            )}

            {cart.map((item, i) => (
                <div key={i} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 pb-3 pt-1 transition-colors">
                    <span className="flex-1 font-bold text-slate-700 dark:text-slate-200 truncate pr-2" title={item.title}>{item.title}</span>
                    <input 
                      type="number" 
                      className="w-16 border dark:border-slate-700 rounded-lg p-2 text-center font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                      value={item.qty} 
                      onChange={(e) => updateQty(item.id, e.target.value)} 
                    />
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-28 border border-red-200 dark:border-red-900/50 rounded-lg p-2 text-right ml-2 font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" 
                      value={item.buy_rate} 
                      onChange={(e) => updateBuyRate(item.id, e.target.value)} 
                    />
                </div>
            ))}
          </div>
          
          <div className="pt-4 mt-4 border-t dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-slate-500 dark:text-slate-400">Total Value:</span>
              <span className="font-black text-2xl text-slate-800 dark:text-white">
                LKR {cart.reduce((sum, item) => sum + (item.qty * item.buy_rate), 0).toFixed(2)}
              </span>
            </div>
            <button onClick={processStock} className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
              Confirm {formData.type}
            </button>
          </div>
        </div>
      </div>

      {/* --- QUICK ADD ITEM MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="p-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center transition-colors">
              <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-2">
                <Plus className="text-blue-600 dark:text-blue-400"/> Create New Item
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                <X size={24}/>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Item Name / Title *</label>
                <input type="text" className="w-full p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-colors" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="e.g. Atlas CR Book 120 Pages" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Barcode / ISBN</label>
                  <input type="text" className="w-full p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm transition-colors" value={newItem.isbn_barcode} onChange={e => setNewItem({...newItem, isbn_barcode: e.target.value})} placeholder="Scan or type..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Category</label>
                  <select className="w-full p-3 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-colors" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {newItem.category === 'Reading Books' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Author Name</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-colors" 
                    value={newItem.author_name} 
                    onChange={e => setNewItem({...newItem, author_name: e.target.value})} 
                    placeholder="e.g. Martin Wickramasinghe" 
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Buy Rate (Cost)</label>
                  <input type="number" step="0.01" className="w-full p-3 border border-red-200 dark:border-red-900/50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 transition-colors" value={newItem.cost_price} onChange={e => setNewItem({...newItem, cost_price: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Retail Price *</label>
                  <input type="number" step="0.01" className="w-full p-3 border border-emerald-200 dark:border-emerald-900/50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 transition-colors" value={newItem.retail_price} onChange={e => setNewItem({...newItem, retail_price: e.target.value})} placeholder="0.00" />
                </div>
              </div>

              <button onClick={handleCreateNewItem} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-colors mt-2 shadow-sm">
                Save & Add to Transaction
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}