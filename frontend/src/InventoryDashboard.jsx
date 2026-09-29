import React, { useState, useEffect } from 'react';
import { Save, Trash2, Plus, BookOpen, LayoutGrid, List, MapPin, Package, FilePen, Tags } from 'lucide-react';
import useCategories from './useCategories';
import { Page, Card, Badge, Button, IconButton, SearchInput, Modal, ConfirmModal, Toast, EmptyRow, money, inputCls, labelCls, thCls, tdCls, trCls, cx } from './ui';

const COVER_TONES = ['from-blue-600 to-violet-600', 'from-emerald-600 to-teal-500', 'from-amber-500 to-orange-600', 'from-rose-600 to-pink-500', 'from-cyan-600 to-blue-500', 'from-violet-600 to-fuchsia-500', 'from-slate-600 to-slate-500'];

export default function InventoryDashboard({ user }) {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [catDelete, setCatDelete] = useState(null);
  const [view, setView] = useState('grid');

  // Filters
  const [stockFilter, setStockFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // State updated to handle shelf and row separately
  const [formData, setFormData] = useState({
    title: '', author_name: '', isbn_barcode: '', category: 'Reading Books', retail_price: '', cost_price: '', shelf: '', row: ''
  });

  const { categories, categoryRows, reloadCategories } = useCategories();
  const EMPTY_FORM = { title: '', author_name: '', isbn_barcode: '', category: 'Reading Books', retail_price: '', cost_price: '', shelf: '', row: '' };
  const isManager = user?.role === 'Manager';

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

    const res = editItem
      ? await fetch(`http://localhost:5000/api/books/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, location: locationString, username: user?.username })
        })
      : await fetch('http://localhost:5000/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, available_qty: 0, location: locationString })
        });

    if (res.ok) {
      showToast(editItem ? "Item updated!" : "Item added! Use Stock Control to add quantities.");
      fetchBooks();
      reloadCategories();
      closeForm();
    } else {
      showToast(editItem ? "Error updating item." : "Error adding item.");
    }
  };

  const closeForm = () => { setShowAddModal(false); setEditItem(null); setFormData(EMPTY_FORM); };

  const openEdit = (b) => {
    const loc = b.location || '';
    const shelf = (loc.match(/Shelf - (.*?)(?: Row - |$)/) || [])[1] || '';
    const row = (loc.match(/Row - (.+)$/) || [])[1] || '';
    setFormData({
      title: b.title || '', author_name: b.author_name && b.author_name !== 'N/A' ? b.author_name : '', isbn_barcode: b.isbn_barcode || '',
      category: b.category || 'Other', retail_price: b.retail_price ?? '', cost_price: b.cost_price ?? '', shelf: shelf.trim(), row: row.trim(),
    });
    setEditItem(b);
  };

  const addCategory = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategory }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showToast('Error: ' + (data.error || 'could not add category'));
    showToast(`Category "${newCategory}" added.`);
    setNewCategory('');
    reloadCategories();
  };

  const deleteCategory = async () => {
    const res = await fetch(`http://localhost:5000/api/categories/${catDelete.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    setCatDelete(null);
    if (!res.ok) return showToast('Error: ' + (data.error || 'could not delete category'));
    showToast('Category deleted.');
    reloadCategories();
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

  const stockOf = (b) => Number(b.available_qty) || 0;
  const stockStatus = (b) => stockOf(b) <= 0 ? 'Out' : stockOf(b) <= 5 ? 'Low' : 'In';

  const filteredBooks = books.filter(b => {
    const s = search.toLowerCase();
    const matchSearch = (b.title || '').toLowerCase().includes(s) ||
           (b.isbn_barcode || '').includes(search) ||
           (b.author_name || '').toLowerCase().includes(s) ||
           (b.location || '').toLowerCase().includes(s);
    if (!matchSearch) return false;
    if (stockFilter !== 'All' && stockStatus(b) !== stockFilter) return false;
    if (categoryFilter !== 'All' && b.category !== categoryFilter) return false;
    const price = Number(b.retail_price) || 0;
    if (minPrice !== '' && price < Number(minPrice)) return false;
    if (maxPrice !== '' && price > Number(maxPrice)) return false;
    return true;
  });

  const counts = {
    All: books.length,
    In: books.filter(b => stockStatus(b) === 'In').length,
    Low: books.filter(b => stockStatus(b) === 'Low').length,
    Out: books.filter(b => stockStatus(b) === 'Out').length,
  };

  const resetFilters = () => { setStockFilter('All'); setCategoryFilter('All'); setMinPrice(''); setMaxPrice(''); setSearch(''); };

  const StockBadge = ({ b }) => {
    const st = stockStatus(b);
    return <Badge tone={st === 'In' ? 'green' : st === 'Low' ? 'amber' : 'red'}>{st === 'In' ? 'In Stock' : st === 'Low' ? 'Low Stock' : 'Out of Stock'}</Badge>;
  };

  const Location = ({ b }) => (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
      <MapPin size={11}/>{b.location === 'Unassigned' || !b.location ? 'Unassigned' : b.location}
    </span>
  );

  return (
    <Page>
      <Toast message={toast} />

      {deleteConfirm && (
        <ConfirmModal title="Confirm Deletion" icon={Trash2} confirmLabel="Delete"
          message={<>Are you sure you want to delete <b className="text-slate-900 dark:text-white">"{deleteConfirm.title}"</b>?</>}
          onConfirm={executeDelete} onCancel={() => setDeleteConfirm(null)} />
      )}

      {catDelete && (
        <ConfirmModal title="Delete Category" icon={Trash2} confirmLabel="Delete"
          message={<>Delete the category <b className="text-slate-900 dark:text-white">"{catDelete.name}"</b>? Only empty categories can be deleted.</>}
          onConfirm={deleteCategory} onCancel={() => setCatDelete(null)} />
      )}

      {showCategories && (
        <Modal title="Manage Categories" subtitle="Used in Inventory, Checkout and Stock Control" icon={Tags} width="max-w-lg" onClose={() => setShowCategories(false)}>
          <form onSubmit={addCategory} className="flex gap-2 mb-4">
            <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name, e.g. Children's Books" className={inputCls} required />
            <Button type="submit" className="shrink-0"><Plus size={15}/> Add Category</Button>
          </form>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {categoryRows.map(c => (
              <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="flex items-center gap-2 text-sm text-slate-900 dark:text-white"><Tags size={14} className="text-blue-500"/>{c.name}</span>
                <span className="flex items-center gap-2">
                  <Badge tone={Number(c.item_count) ? 'blue' : 'slate'}>{c.item_count} items</Badge>
                  <IconButton tone="red" disabled={Number(c.item_count) > 0} onClick={() => setCatDelete(c)} title={Number(c.item_count) ? 'Move or delete its items first' : 'Delete category'}><Trash2 size={15}/></IconButton>
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {(showAddModal || editItem) && (
        <Modal title={editItem ? 'Edit Inventory Item' : 'Add New Inventory'} subtitle={editItem ? `Stock level (${editItem.available_qty}) is changed through Stock Control` : 'Quantities are added later through Stock Control (GRN)'} icon={editItem ? FilePen : Plus} width="max-w-2xl" onClose={closeForm}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Item Name / Title *</label>
                <input type="text" className={inputCls} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required autoFocus />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Author Name (If Book)</label>
                <input type="text" className={inputCls} value={formData.author_name} onChange={e => setFormData({...formData, author_name: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}>Barcode / ISBN</label>
                <input type="text" className={cx(inputCls, 'font-mono')} value={formData.isbn_barcode} onChange={e => setFormData({...formData, isbn_barcode: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Shelf</label>
                <input type="text" className={inputCls} value={formData.shelf} onChange={e => setFormData({...formData, shelf: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}>Row</label>
                <input type="text" className={inputCls} value={formData.row} onChange={e => setFormData({...formData, row: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}>Cost Price (LKR)</label>
                <input type="number" step="0.01" className={inputCls} value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}>Retail Price (LKR) *</label>
                <input type="number" step="0.01" className={inputCls} value={formData.retail_price} onChange={e => setFormData({...formData, retail_price: e.target.value})} required />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={closeForm}>Cancel</Button>
              <Button type="submit" className="flex-1"><Save size={16} /> {editItem ? 'Save Changes' : 'Save Item'}</Button>
            </div>
          </form>
        </Modal>
      )}

      <div className="flex gap-6 items-start">
        {/* FILTER PANEL */}
        <Card className="w-64 shrink-0 p-5 space-y-5 sticky top-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filters</h3>
          <div>
            <p className={labelCls}>Product Status</p>
            <div className="flex flex-wrap gap-1.5">
              {[['All', 'All'], ['In', 'In Stock'], ['Low', 'Low'], ['Out', 'Out']].map(([k, l]) => (
                <button key={k} onClick={() => setStockFilter(k)}
                  className={cx('px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors',
                    stockFilter === k ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white')}>
                  {l} {counts[k]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={inputCls}>
              <option value="All">Category: All</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Price range (LKR)</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className={inputCls} />
              <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className={inputCls} />
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={resetFilters}>Reset Filters</Button>
        </Card>

        {/* RESULTS */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-semibold text-slate-900 dark:text-white">{filteredBooks.length} <span className="text-slate-500 dark:text-slate-400 font-normal text-sm">of {books.length} total products</span></p>
            <div className="flex items-center gap-2">
              <SearchInput value={search} onChange={setSearch} placeholder="Search title, author, barcode or location..." className="w-80" />
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                <IconButton onClick={() => setView('grid')} title="Grid view" className={view === 'grid' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white' : ''}><LayoutGrid size={16}/></IconButton>
                <IconButton onClick={() => setView('list')} title="List view" className={view === 'list' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white' : ''}><List size={16}/></IconButton>
              </div>
              {isManager && <Button variant="secondary" onClick={() => setShowCategories(true)}><Tags size={16}/> Categories</Button>}
              {isManager && <Button onClick={() => { setFormData(EMPTY_FORM); setShowAddModal(true); }}><Plus size={16}/> Add New Inventory</Button>}
            </div>
          </div>

          {view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredBooks.length === 0 && <Card className="col-span-full p-12 text-center text-sm text-slate-500">No items found.</Card>}
              {filteredBooks.map(b => (
                <Card key={b.id} className="p-3 flex flex-col hover:border-blue-500/60 transition-colors">
                  <div className={cx('h-28 rounded-xl bg-gradient-to-br flex items-center justify-center text-white/90 relative', COVER_TONES[Math.max(0, categories.indexOf(b.category)) % COVER_TONES.length])}>
                    {b.category === 'Reading Books' ? <BookOpen size={34} strokeWidth={1.5}/> : <Package size={34} strokeWidth={1.5}/>}
                    <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/25 rounded px-1.5 py-0.5">{b.category || 'Other'}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 mt-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">{b.title}</p>
                    {isManager && (
                      <span className="flex -mt-1 -mr-1 shrink-0">
                        <IconButton tone="blue" onClick={() => openEdit(b)} title="Edit item"><FilePen size={15}/></IconButton>
                        <IconButton tone="red" onClick={() => setDeleteConfirm(b)} title="Delete"><Trash2 size={15}/></IconButton>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {b.author_name && b.author_name !== 'N/A' ? b.author_name : 'Stocked Product'} · {stockOf(b)} in stock
                  </p>
                  <div className="mt-1"><Location b={b} /></div>
                  <div className="flex items-end justify-between mt-auto pt-3">
                    <StockBadge b={b} />
                    <div className="text-right">
                      {isManager && <p className="text-[10px] text-slate-400">Cost {money(b.cost_price)}</p>}
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{money(b.retail_price)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className={thCls}>Item Details</th>
                    <th className={thCls}>Location</th>
                    <th className={thCls}>Category</th>
                    <th className={cx(thCls, 'text-center')}>In Stock</th>
                    {isManager && <th className={cx(thCls, 'text-right')}>Cost Price</th>}
                    <th className={cx(thCls, 'text-right')}>Retail Price</th>
                    {isManager && <th className={cx(thCls, 'text-center')}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.length === 0 && <EmptyRow colSpan={7}>No items found.</EmptyRow>}
                  {filteredBooks.map(b => (
                    <tr key={b.id} className={trCls}>
                      <td className={tdCls}>
                        <p className="font-semibold text-slate-900 dark:text-white">{b.title}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{b.isbn_barcode}</p>
                      </td>
                      <td className={tdCls}><Location b={b} /></td>
                      <td className={tdCls}>{b.category}</td>
                      <td className={cx(tdCls, 'text-center')}><Badge tone={stockStatus(b) === 'In' ? 'green' : stockStatus(b) === 'Low' ? 'amber' : 'red'}>{stockOf(b)}</Badge></td>
                      {isManager && <td className={cx(tdCls, 'text-right text-slate-500')}>{money(b.cost_price)}</td>}
                      <td className={cx(tdCls, 'text-right font-semibold text-slate-900 dark:text-white')}>{money(b.retail_price)}</td>
                      {isManager && (
                        <td className={cx(tdCls, 'text-center')}>
                          <IconButton tone="blue" onClick={() => openEdit(b)} title="Edit item"><FilePen size={16} /></IconButton>
                          <IconButton tone="red" onClick={() => setDeleteConfirm(b)} title="Delete"><Trash2 size={16} /></IconButton>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
