import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Plus, X, ArrowDownToLine, ArrowUpFromLine, ScanLine, PackageOpen } from 'lucide-react';
import useCategories from './useCategories';
import { Page, Card, Badge, Button, IconButton, Modal, Toast, money, inputCls, labelCls, cx } from './ui';

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

  const { categories } = useCategories();

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


  const removeFromTransaction = (id) => setCart(cart.filter(item => item.id !== id));
  const totalValue = cart.reduce((sum, item) => sum + (item.qty * item.buy_rate), 0);
  const totalUnits = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  return (
    <Page>
      <Toast message={toast} />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">

        {/* LEFT PANEL */}
        <Card className="xl:col-span-3 p-6 space-y-5">
          <div>
            <p className={labelCls}>Transaction Type</p>
            <div className="grid grid-cols-2 gap-3">
              {[['GRN', 'GRN — Stock In', 'Receive items from a supplier', ArrowDownToLine, 'green'], ['PRN', 'PRN — Stock Out', 'Return items to a supplier', ArrowUpFromLine, 'red']].map(([key, title, desc, Icon, tone]) => (
                <button key={key} onClick={() => setFormData({...formData, type: key})}
                  className={cx('flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors',
                    formData.type === key ? 'border-blue-600 bg-blue-600/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700')}>
                  <span className={cx('w-10 h-10 rounded-full flex items-center justify-center shrink-0', tone === 'green' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500')}><Icon size={18}/></span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <label className={labelCls}>Supplier *</label>
            <Search className="absolute left-3 top-[38px] text-slate-400" size={16} />
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
              className={cx(inputCls, 'pl-9', formData.supplier_id && '!border-blue-600 !bg-blue-600/10')}
            />
            {formData.supplier_id && <CheckCircle className="absolute right-3 top-[38px] text-blue-500" size={16} />}

            {showSupplierDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                {filteredSuppliers.length === 0 && <p className="p-3 text-sm text-slate-500">No suppliers found. Add one in Suppliers.</p>}
                {filteredSuppliers.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setFormData({...formData, supplier_id: s.id});
                      setSupplierSearch(s.company_name);
                      setShowSupplierDropdown(false);
                    }}
                    className="px-3 py-2.5 hover:bg-blue-600/10 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    {s.company_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea rows={2} placeholder="Add transaction notes..." className={inputCls} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
            <label className={labelCls}>Add Items</label>
            <div className="flex gap-2 relative">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
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
                  className={cx(inputCls, 'pl-10 py-3.5 font-mono')}
                />

                {showItemDropdown && itemSearch && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                    {filteredBooks.map(b => (
                      <div
                        key={b.id}
                        onClick={() => {
                          addToTransaction(b);
                          setItemSearch('');
                          setShowItemDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-blue-600/10 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 flex justify-between items-center transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{b.title}</p>
                          <p className="text-xs text-slate-400 font-mono">Barcode: {b.isbn_barcode} · {b.available_qty} in stock</p>
                        </div>
                        <Badge tone="blue">Add</Badge>
                      </div>
                    ))}
                    {filteredBooks.length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Item not found in database.</p>
                        <Button className="w-full" onClick={() => setShowAddModal(true)}><Plus size={15}/> Create New Item</Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button variant="outline" className="px-4" onClick={() => setShowAddModal(true)}><Plus size={16} /> New Item</Button>
            </div>
          </div>
        </Card>

        {/* RIGHT PANEL */}
        <Card className="xl:col-span-2 p-6 flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Current Transaction</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{cart.length} items · {totalUnits} units</p>
            </div>
            <Badge tone={formData.type === 'GRN' ? 'green' : 'red'}>{formData.type}</Badge>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="flex text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="flex-1">Item Name</span>
                <span className="w-16 text-center">Qty</span>
                <span className="w-28 text-right">Buy Rate</span>
                <span className="w-8"></span>
            </div>

            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
                 <PackageOpen size={36} strokeWidth={1.5} className="mb-2" />
                 <p className="text-sm font-medium">Transaction is empty.</p>
                 <p className="text-xs">Search and select items on the left.</p>
              </div>
            )}

            {cart.map((item, i) => (
                <div key={i} className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 py-2.5">
                    <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={item.title}>{item.title}</span>
                    <input
                      type="number"
                      className={cx(inputCls, 'w-16 px-2 py-1.5 text-center')}
                      value={item.qty}
                      onChange={(e) => updateQty(item.id, e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className={cx(inputCls, 'w-28 px-2 py-1.5 text-right')}
                      value={item.buy_rate}
                      onChange={(e) => updateBuyRate(item.id, e.target.value)}
                    />
                    <IconButton tone="red" onClick={() => removeFromTransaction(item.id)} title="Remove"><X size={15}/></IconButton>
                </div>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-slate-500 dark:text-slate-400">Total Value</span>
              <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{money(totalValue)}</span>
            </div>
            <Button size="lg" className="w-full" onClick={processStock}>
              Confirm {formData.type}
            </Button>
          </div>
        </Card>
      </div>

      {/* --- QUICK ADD ITEM MODAL --- */}
      {showAddModal && (
        <Modal title="Create New Item" icon={Plus} onClose={() => setShowAddModal(false)}
          footer={<Button size="lg" className="w-full" onClick={handleCreateNewItem}>Save & Add to Transaction</Button>}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Item Name / Title *</label>
              <input type="text" autoFocus className={inputCls} value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="e.g. Atlas CR Book 120 Pages" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Barcode / ISBN</label>
                <input type="text" className={cx(inputCls, 'font-mono')} value={newItem.isbn_barcode} onChange={e => setNewItem({...newItem, isbn_barcode: e.target.value})} placeholder="Scan or type..." />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {newItem.category === 'Reading Books' && (
              <div>
                <label className={labelCls}>Author Name</label>
                <input type="text" className={inputCls} value={newItem.author_name} onChange={e => setNewItem({...newItem, author_name: e.target.value})} placeholder="e.g. Martin Wickramasinghe" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Buy Rate (Cost)</label>
                <input type="number" step="0.01" className={inputCls} value={newItem.cost_price} onChange={e => setNewItem({...newItem, cost_price: e.target.value})} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Retail Price *</label>
                <input type="number" step="0.01" className={inputCls} value={newItem.retail_price} onChange={e => setNewItem({...newItem, retail_price: e.target.value})} placeholder="0.00" />
              </div>
            </div>
          </div>
        </Modal>
      )}

    </Page>
  );
}
