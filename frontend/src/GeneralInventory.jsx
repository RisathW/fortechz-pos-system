import React, { useState, useEffect } from 'react';
import { Trash2, Package, AlertTriangle, Printer, Plus, Boxes, Wallet } from 'lucide-react';
import useCategories from './useCategories';
import { Page, Card, StatCard, Badge, Button, IconButton, SearchInput, Tabs, Modal, ConfirmModal, Toast, EmptyRow, money, inputCls, labelCls, thCls, tdCls, trCls, cx } from './ui';

export default function GeneralInventory({ user }) {
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ title: '', category: 'Stationery', cost_price: '', retail_price: '', available_qty: '' });
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Custom non-blocking alert & confirm states
  const [toast, setToast] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // General items = every non-book category (managed in Inventory → Categories)
  const { categories: allCategories } = useCategories();
  const categories = allCategories.filter(c => c !== 'Reading Books' && c !== 'Other');
  const [allBooks, setAllBooks] = useState([]);
  const items = allBooks.filter(item => categories.includes(item.category));
  const isManager = user?.role === 'Manager';

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchItems = () => {
    fetch('http://localhost:5000/api/books').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setAllBooks(data);
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
      setShowAddModal(false);
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

  const filteredItems = items.filter(item =>
    (search === '' || (item.title || '').toLowerCase().includes(search.toLowerCase())) &&
    (categoryFilter === 'All' || item.category === categoryFilter)
  );
  const lowStockItems = items.filter(i => i.available_qty <= 5);
  const stockValue = items.reduce((a, i) => a + (Number(i.retail_price) || 0) * (Number(i.available_qty) || 0), 0);

  return (
    <Page>
      <Toast message={toast} />

      {deleteConfirm && (
        <ConfirmModal title="Confirm Deletion" icon={Trash2} confirmLabel="Delete"
          message="Are you sure you want to delete this item? This action cannot be undone."
          onConfirm={executeDelete} onCancel={() => setDeleteConfirm(null)} />
      )}

      {showAddModal && (
        <Modal title="Add General Item" icon={Plus} width="max-w-lg" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Item Name *</label>
              <input required autoFocus value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={inputCls}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Opening Qty *</label>
                <input type="number" required value={formData.available_qty} onChange={e => setFormData({...formData, available_qty: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Buy Rate (LKR)</label>
                <input type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Retail Price (LKR) *</label>
                <input type="number" step="0.01" required value={formData.retail_price} onChange={e => setFormData({...formData, retail_price: e.target.value})} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1">Add Item</Button>
            </div>
          </form>
        </Modal>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="General Items" sub="Stationery & store products" value={items.length} icon={Package} bars={false} />
        <StatCard label="Units in Stock" sub="Across all categories" value={items.reduce((a, i) => a + (Number(i.available_qty) || 0), 0).toLocaleString()} icon={Boxes} tone="green" bars={false} />
        <StatCard label={isManager ? 'Retail Stock Value' : 'Low Stock Items'} sub={isManager ? 'Qty × retail price' : '5 or less remaining'} value={isManager ? money(stockValue) : lowStockItems.length} icon={isManager ? Wallet : AlertTriangle} tone={isManager ? 'purple' : 'amber'} bars={false} />
      </div>

      {/* LOW STOCK ALERT BANNER */}
      {isManager && lowStockItems.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3">
          <span className="w-9 h-9 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0"><AlertTriangle size={17}/></span>
          <div>
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Low Stock Warning ({lowStockItems.length} items)</h3>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">5 or less in stock: {lowStockItems.slice(0,5).map(i=>i.title).join(', ')}{lowStockItems.length > 5 ? '...' : ''}</p>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <Tabs active={categoryFilter} onChange={setCategoryFilter}
            tabs={[{ key: 'All', label: 'All', count: items.length }, ...categories.map(c => ({ key: c, label: c, count: items.filter(i => i.category === c).length }))]} />
          <div className="flex gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search general items..." className="w-64" />
            {isManager && <Button onClick={() => setShowAddModal(true)}><Plus size={16}/> Add Item</Button>}
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className={thCls}>Item Name</th>
              <th className={thCls}>Category</th>
              <th className={cx(thCls, 'text-center')}>Stock</th>
              {isManager && <th className={cx(thCls, 'text-right')}>Cost Price</th>}
              <th className={cx(thCls, 'text-right')}>Retail Price</th>
              {isManager && <th className={cx(thCls, 'text-center')}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 && <EmptyRow colSpan={6}>No general items found.</EmptyRow>}
            {filteredItems.map(item => (
              <tr key={item.id} className={trCls}>
                <td className={tdCls}>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"><Package size={16}/></span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{item.isbn_barcode}</p>
                    </div>
                  </div>
                </td>
                <td className={tdCls}>{item.category}</td>
                <td className={cx(tdCls, 'text-center')}>
                  <Badge tone={item.available_qty <= 5 ? 'red' : 'green'}>{item.available_qty}</Badge>
                </td>
                {isManager && <td className={cx(tdCls, 'text-right text-slate-500')}>{money(item.cost_price)}</td>}
                <td className={cx(tdCls, 'text-right font-semibold text-slate-900 dark:text-white')}>{money(item.retail_price)}</td>
                {isManager && (
                  <td className={cx(tdCls, 'text-center whitespace-nowrap')}>
                    <IconButton tone="blue" onClick={() => printBarcode(item)} title="Print Label"><Printer size={16} /></IconButton>
                    <IconButton tone="red" onClick={() => setDeleteConfirm(item.id)} title="Delete"><Trash2 size={16} /></IconButton>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Page>
  );
}
