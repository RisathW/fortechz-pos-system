import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Unlock, PauseCircle, PlayCircle, SplitSquareVertical, Banknote, RotateCcw, Coins, CalendarClock, CheckCircle, CreditCard, BookOpen, Package, LayoutGrid, ScanLine, MapPin, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Modal, Button, Toast, money, inputCls, labelCls, cx } from './ui';

export default function CheckoutPos({ user, onNavigate }) {
  const [books, setBooks] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [heldBills, setHeldBills] = useState([]);
  const searchInputRef = useRef(null);

  const [toast, setToast] = useState('');
  
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expense, setExpense] = useState({ desc: '', amount: '' });

  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCash, setSplitCash] = useState('');
  
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [openingCash, setOpeningCash] = useState('');

  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveForm, setReserveForm] = useState({ name: '', phone: '', pickupDate: '', advance: '0', paymentType: 'Cash' });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => { 
    fetch('http://localhost:5000/api/books')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setBooks(data); });
    
    if (searchInputRef.current) searchInputRef.current.focus();

    fetch(`http://localhost:5000/api/drawer/status?username=${user.username}`)
      .then(res => res.json())
      .then(data => {
        if (!data.isOpen) setShowOpeningModal(true);
      })
      .catch(e => console.log("Drawer check error:", e));
  }, [user]);

  const handleStartShift = async () => {
    if (openingCash === '') return showToast("Please enter starting cash amount.");
    try {
      await fetch('http://localhost:5000/api/drawer/open', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: openingCash, username: user.username })
      });
      setShowOpeningModal(false);
      showToast("Shift started successfully!");
      if (searchInputRef.current) searchInputRef.current.focus();
    } catch (e) {
      showToast("Error starting shift.");
    }
  };

  const categories = ['All', ...new Set(books.map(b => b.category).filter(Boolean))];

  const addToCart = (book) => {
    if (book.available_qty <= 0) return showToast("Out of stock!");
    
    const existing = cart.find(item => item.id === book.id);
    if (existing) {
      updateCartQty(book.id, (parseInt(existing.qty) || 0) + 1);
      return; 
    }
    
    setCart([...cart, { ...book, qty: 1 }]);
  };

  const updateCartQty = (id, newQty) => {
    if (newQty === '') {
      setCart(cart.map(item => item.id === id ? { ...item, qty: '' } : item));
      return;
    }

    let qty = parseInt(newQty);
    if (isNaN(qty) || qty < 0) qty = 0; 
    
    setCart(cart.map(item => {
      if (item.id === id) {
        if (qty > item.available_qty) {
          showToast(`Only ${item.available_qty} in stock!`);
          return { ...item, qty: item.available_qty };
        }
        return { ...item, qty: qty };
      }
      return item;
    }));
  };

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      const scannedItem = books.find(b => b.isbn_barcode === search.trim() || b.title.toLowerCase() === search.trim().toLowerCase());
      if (scannedItem) { 
        addToCart(scannedItem); 
        setSearch(''); 
      } else {
        showToast("Barcode not found!");
      }
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  
  const total = cart.reduce((sum, item) => sum + (item.retail_price * (parseInt(item.qty) || 0)), 0);

  const holdCurrentBill = () => {
    const validCart = cart.filter(item => parseInt(item.qty) > 0);
    if (validCart.length === 0) return;
    setHeldBills([...heldBills, { id: Date.now(), cart: [...validCart], total }]); 
    setCart([]);
  };

  const recallBill = (billId) => {
    const billToRecall = heldBills.find(b => b.id === billId);
    if (cart.length > 0) holdCurrentBill(); 
    setCart(billToRecall.cart); 
    setHeldBills(heldBills.filter(b => b.id !== billId));
  };

  const handleAddExpense = async () => {
    if (!expense.desc || !expense.amount) return;
    await fetch('http://localhost:5000/api/expenses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: expense.desc, amount: expense.amount, username: user.username })
    });
    fetch('http://localhost:5000/api/printer/open-drawer', { method: 'POST' }).catch(()=>console.log("No printer"));
    showToast("Expense recorded! Drawer opened to remove cash.");
    setShowExpenseModal(false); 
    setExpense({ desc: '', amount: '' });
  };

  const handleCheckout = async (paymentType) => {
    const validCart = cart.filter(item => parseInt(item.qty) > 0);
    if (validCart.length === 0) return showToast("Cart is empty");
    
    let finalPaymentType = paymentType;
    if (paymentType === 'Split') {
      const cashAmt = parseFloat(splitCash) || 0;
      const cardAmt = total - cashAmt;
      finalPaymentType = `Split (Cash: ${cashAmt}, Card: ${cardAmt})`;
      setShowSplitModal(false);
      setSplitCash('');
    }

    try {
      const response = await fetch('http://localhost:5000/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_type: finalPaymentType, total_amount: total, cart_items: validCart, username: user.username })
      });
      if (response.ok) {
        if (paymentType === 'Cash' || paymentType === 'Split') {
           fetch('http://localhost:5000/api/printer/open-drawer', { method: 'POST' }).catch(()=>console.log("No printer"));
        }
        setShowCashModal(false); window.print(); setCart([]); setCashReceived('');
        if (searchInputRef.current) searchInputRef.current.focus(); 
      }
    } catch (err) { showToast('Server Connection Error'); }
  };

  const handleReserveOrder = async () => {
    const validCart = cart.filter(item => parseInt(item.qty) > 0);
    if (validCart.length === 0) return showToast("Cart is empty");
    if (!reserveForm.name || !reserveForm.phone || !reserveForm.pickupDate) return showToast("Please fill in all customer details.");
    
    const advancePaid = parseFloat(reserveForm.advance) || 0;
    if (advancePaid > total) return showToast("Advance cannot be more than total.");

    try {
      const response = await fetch('http://localhost:5000/api/reservations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customer_name: reserveForm.name, phone: reserveForm.phone, pickup_date: reserveForm.pickupDate, 
          total_amount: total, advance_paid: advancePaid, payment_type: reserveForm.paymentType, 
          cart_items: validCart, username: user.username 
        })
      });
      if (response.ok) {
        if (advancePaid > 0 && reserveForm.paymentType === 'Cash') {
          fetch('http://localhost:5000/api/printer/open-drawer', { method: 'POST' }).catch(e=>e);
        }
        setShowReserveModal(false); setCart([]); showToast("Items Reserved Successfully!");
        setReserveForm({ name: '', phone: '', pickupDate: '', advance: '0', paymentType: 'Cash' });
      }
    } catch (err) { showToast('Server Connection Error'); }
  };

  const changeDue = Math.max(0, (parseFloat(cashReceived) || 0) - total);
  const isCashSufficient = (parseFloat(cashReceived) || 0) >= total;

  const filteredBooks = books.filter(b => {
    const s = search.toLowerCase();
    const matchSearch = 
      (b.title || '').toLowerCase().includes(s) || 
      (b.isbn_barcode || '').toLowerCase().includes(s) || 
      (b.author_name || '').toLowerCase().includes(s) || 
      (b.category || '').toLowerCase().includes(s);
    const matchCat = categoryFilter === 'All' || b.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const cartQty = (id) => parseInt(cart.find(i => i.id === id)?.qty) || 0;
  const itemCount = cart.reduce((a, i) => a + (parseInt(i.qty) || 0), 0);

  const decrement = (book) => {
    const q = cartQty(book.id);
    if (q <= 1) removeFromCart(book.id); else updateCartQty(book.id, q - 1);
  };

  const charge = () => {
    if (paymentMethod === 'Cash') setShowCashModal(true);
    else if (paymentMethod === 'Card') handleCheckout('Card');
    else setShowSplitModal(true);
  };

  const COVER_TONES = ['from-blue-600 to-violet-600', 'from-emerald-600 to-teal-500', 'from-amber-500 to-orange-600', 'from-rose-600 to-pink-500', 'from-cyan-600 to-blue-500', 'from-violet-600 to-fuchsia-500', 'from-slate-600 to-slate-500'];
  const coverTone = (cat) => COVER_TONES[Math.max(0, categories.indexOf(cat || 'Other')) % COVER_TONES.length];

  return (
    <>
      <div className="flex h-full p-6 gap-6 print:hidden relative">
        <Toast message={toast} />

        {/* --- START SHIFT MODAL --- */}
        {showOpeningModal && (
          <Modal title="Start of Day" subtitle="Open the register to begin selling" icon={Banknote} tone="green"
            footer={<Button variant="success" size="lg" className="w-full" onClick={handleStartShift} disabled={!openingCash}>Open Register</Button>}>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Enter the physical cash amount currently sitting inside the cash drawer (Starting Float).</p>
            <input
              type="number"
              autoFocus
              value={openingCash}
              onChange={e => setOpeningCash(e.target.value)}
              className={cx(inputCls, 'text-3xl font-bold text-center py-4')}
              placeholder="0.00"
            />
          </Modal>
        )}

        {/* --- LEFT ITEM GRID PANEL --- */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-6 gap-2.5">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={cx('px-3.5 py-2.5 rounded-xl border text-left transition-colors flex items-center gap-2.5',
                  categoryFilter === c
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-500')}
              >
                <span className={cx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', categoryFilter === c ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800')}>
                  {c === 'All' ? <LayoutGrid size={15}/> : c === 'Reading Books' ? <BookOpen size={15}/> : <Package size={15}/>}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight truncate">{c}</span>
                  <span className={cx('block text-[11px]', categoryFilter === c ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400')}>
                    {c === 'All' ? books.length : books.filter(b => b.category === c).length} Items
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <ScanLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input ref={searchInputRef} type="text" placeholder="Scan barcode or search title, author, category... (Enter to add)" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleBarcodeScan} className={cx(inputCls, 'pl-11 py-3 bg-white dark:bg-slate-900 dark:border-slate-800')} />
          </div>

          <div className="flex-1 overflow-y-auto -mr-2 pr-2">
            <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredBooks.map(book => {
                const inCart = cartQty(book.id);
                const out = book.available_qty <= 0;
                return (
                  <div key={book.id} onClick={() => addToCart(book)}
                    className={cx('bg-white dark:bg-slate-900 border rounded-2xl p-3 cursor-pointer transition-all flex flex-col',
                      inCart ? 'border-blue-600 ring-1 ring-blue-600/40' : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/60',
                      out && 'opacity-50')}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 truncate">{book.category || 'Other'}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 truncate max-w-[55%]"><MapPin size={10}/>{book.location === 'Unassigned' || !book.location ? 'Unassigned' : book.location}</span>
                    </div>
                    <div className={cx('h-24 rounded-xl bg-gradient-to-br flex items-center justify-center text-white/90 relative', coverTone(book.category))}>
                      {book.category === 'Reading Books' ? <BookOpen size={30} strokeWidth={1.5}/> : <Package size={30} strokeWidth={1.5}/>}
                      {inCart > 0 && <span className="absolute top-2 right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-white text-blue-600 text-xs font-bold flex items-center justify-center">{inCart}</span>}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug mt-2.5">{book.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {book.author_name && book.author_name !== 'N/A' ? book.author_name : <span className="font-mono">{book.isbn_barcode}</span>}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{money(book.retail_price)}</p>
                      <span className={cx('text-[11px] font-medium', book.available_qty <= 5 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400')}>{out ? 'Out' : `${book.available_qty} left`}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2.5">
                      <button onClick={(e) => { e.stopPropagation(); decrement(book); }} disabled={!inCart} className="h-7 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 disabled:opacity-40 flex items-center justify-center"><Minus size={14}/></button>
                      <button onClick={(e) => { e.stopPropagation(); addToCart(book); }} className="h-7 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"><Plus size={14}/></button>
                    </div>
                  </div>
                );
              })}
              {filteredBooks.length === 0 && <div className="col-span-full text-center py-16 text-sm text-slate-500">No items found.</div>}
            </div>
          </div>
        </div>

        {/* --- RIGHT CART SIDEBAR --- */}
        <div className="w-[380px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden">

          <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Current Order</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{itemCount} items · Cashier {user.username}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => fetch('http://localhost:5000/api/printer/open-drawer', {method:'POST'}).catch(e=>e)} title="Open cash drawer"><Unlock size={13} /> Drawer</Button>
            </div>

            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              <Button variant="secondary" size="sm" className="whitespace-nowrap" onClick={() => setShowExpenseModal(true)}><Coins size={13}/> Petty Cash</Button>
              <Button variant="secondary" size="sm" className="whitespace-nowrap" onClick={() => onNavigate('sales_history')}><RotateCcw size={13}/> Return</Button>
              {heldBills.map((bill, idx) => (
                <button key={bill.id} onClick={() => recallBill(bill.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"><PlayCircle size={13}/> Recall #{idx + 1} · {Number(bill.total).toFixed(0)}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-10">
                <ShoppingBag size={36} strokeWidth={1.5} className="mb-2"/>
                <p className="text-sm font-medium">No items yet</p>
                <p className="text-xs">Scan a barcode or tap a book to add it</p>
              </div>
            )}
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className={cx('w-9 h-11 rounded-md bg-gradient-to-br flex items-center justify-center text-white shrink-0', coverTone(item.category))}>
                  {item.category === 'Reading Books' ? <BookOpen size={14}/> : <Package size={14}/>}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <button onClick={() => updateCartQty(item.id, (parseInt(item.qty)||0) - 1)} className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 flex items-center justify-center"><Minus size={12}/></button>
                    <input
                      type="number"
                      className="w-9 text-center text-sm font-semibold text-slate-900 dark:text-white bg-transparent outline-none hide-arrows"
                      value={item.qty}
                      onChange={(e) => updateCartQty(item.id, e.target.value)}
                      onBlur={(e) => {
                        if (item.qty === '' || item.qty <= 0) {
                          updateCartQty(item.id, 1);
                        }
                      }}
                    />
                    <button onClick={() => updateCartQty(item.id, (parseInt(item.qty)||0) + 1)} className="w-6 h-6 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"><Plus size={12}/></button>
                    <span className="text-[11px] text-slate-400 ml-1">× {Number(item.retail_price).toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{(item.retail_price * (parseInt(item.qty) || 0)).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 mt-1" title="Remove"><X size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Items</span><span>{itemCount}</span></div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Subtotal</span><span>{money(total)}</span></div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-semibold text-slate-900 dark:text-white">Total</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{money(total)}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {[['Cash', Banknote], ['Card', CreditCard], ['Split', SplitSquareVertical]].map(([m, Icon]) => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className={cx('flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors',
                      paymentMethod === m ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600')}>
                    <Icon size={17}/> {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={holdCurrentBill} disabled={cart.length===0}><PauseCircle size={15}/> Hold</Button>
              <Button variant="secondary" onClick={() => setShowReserveModal(true)} disabled={cart.length===0}><CalendarClock size={15}/> Reserve</Button>
            </div>
            <Button size="lg" className="w-full" onClick={charge} disabled={cart.length===0}>
              <Printer size={16}/> Charge {money(total)}
            </Button>
          </div>
        </div>
      </div>

      {/* --- RESERVE MODAL --- */}
      {showReserveModal && (
        <Modal title="Pre-Order / Reserve Items" subtitle={`Order total ${money(total)}`} icon={CalendarClock} width="max-w-lg" onClose={() => setShowReserveModal(false)}
          footer={<>
            <Button variant="secondary" className="flex-1" onClick={() => setShowReserveModal(false)}>Cancel</Button>
            <Button className="flex-[2]" onClick={handleReserveOrder}>Hold Stock <CheckCircle size={16} /></Button>
          </>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Customer Name *</label>
                <input type="text" value={reserveForm.name} onChange={e => setReserveForm({...reserveForm, name: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone Number *</label>
                <input type="text" value={reserveForm.phone} onChange={e => setReserveForm({...reserveForm, phone: e.target.value})} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Expected Pickup Date *</label>
              <input type="date" value={reserveForm.pickupDate} onChange={e => setReserveForm({...reserveForm, pickupDate: e.target.value})} className={inputCls} />
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <label className={labelCls}>Advance / Deposit Paid (Optional)</label>
              <input type="number" value={reserveForm.advance} onChange={e => setReserveForm({...reserveForm, advance: e.target.value})} className={cx(inputCls, 'text-lg font-semibold')} placeholder="0.00" />
              {parseFloat(reserveForm.advance) > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {['Cash', 'Card'].map(t => (
                    <button key={t} onClick={() => setReserveForm({...reserveForm, paymentType: t})} className={cx('py-2 rounded-lg text-sm font-semibold border transition-colors',
                      reserveForm.paymentType === t ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400')}>{t}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* --- CASH MODAL --- */}
      {showCashModal && (
        <Modal title="Cash Payment" subtitle={`Total due ${money(total)}`} icon={Banknote} tone="green" onClose={() => {setShowCashModal(false); setCashReceived('');}}
          footer={<>
            <Button variant="secondary" className="flex-1" onClick={() => {setShowCashModal(false); setCashReceived('');}}>Cancel</Button>
            <Button variant="success" className="flex-[2]" onClick={() => handleCheckout('Cash')} disabled={!isCashSufficient}>Checkout <Printer size={16}/></Button>
          </>}>
          <input type="number" autoFocus value={cashReceived} onChange={e => setCashReceived(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && isCashSufficient) handleCheckout('Cash'); }} className={cx(inputCls, 'text-2xl font-bold text-center py-4 mb-3')} placeholder="Amount Received" />
          <div className="grid grid-cols-4 gap-2 mb-4">
            <Button variant="secondary" size="sm" onClick={() => setCashReceived(total.toString())}>Exact</Button>
            {[500, 1000, 5000].map(n => (
              <Button key={n} variant="secondary" size="sm" onClick={() => setCashReceived((parseFloat(cashReceived || 0) + n).toString())}>+{n}</Button>
            ))}
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
             <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Change</span>
             <span className={cx('text-2xl font-bold', isCashSufficient ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>{money(changeDue)}</span>
          </div>
        </Modal>
      )}

      {/* --- SPLIT MODAL --- */}
      {showSplitModal && (
        <Modal title="Split Payment" subtitle={`Total due ${money(total)}`} icon={SplitSquareVertical} tone="purple" onClose={() => {setShowSplitModal(false); setSplitCash('');}}
          footer={<>
            <Button variant="secondary" className="flex-1" onClick={() => {setShowSplitModal(false); setSplitCash('');}}>Cancel</Button>
            <Button className="flex-[2]" onClick={() => handleCheckout('Split')}>Complete Split <Printer size={16}/></Button>
          </>}>
          <label className={labelCls}>Cash Amount Received</label>
          <input type="number" autoFocus value={splitCash} onChange={e => setSplitCash(e.target.value)} className={cx(inputCls, 'text-lg font-semibold mb-4')} placeholder="0.00" />
          <label className={labelCls}>Remaining to swipe on Card</label>
          <div className="w-full px-4 py-3 rounded-lg font-bold text-blue-600 dark:text-blue-400 text-lg bg-blue-600/10 border border-blue-600/30">
            {money(Math.max(0, total - (parseFloat(splitCash) || 0)))}
          </div>
        </Modal>
      )}

      {/* --- EXPENSE MODAL --- */}
      {showExpenseModal && (
        <Modal title="Log Petty Cash / Expense" subtitle="The cash drawer will open to remove cash" icon={Coins} tone="amber" onClose={() => setShowExpenseModal(false)}
          footer={<>
            <Button variant="secondary" className="flex-1" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={handleAddExpense}>Save & Open Drawer</Button>
          </>}>
          <label className={labelCls}>Description</label>
          <input type="text" placeholder="e.g. Tea for staff" value={expense.desc} onChange={e=>setExpense({...expense, desc: e.target.value})} className={cx(inputCls, 'mb-4')} />
          <label className={labelCls}>Amount (LKR)</label>
          <input type="number" placeholder="0.00" value={expense.amount} onChange={e=>setExpense({...expense, amount: e.target.value})} className={inputCls} />
        </Modal>
      )}

      {/* --- THERMAL RECEIPT PRINT CONTENT (Remains light mode for printer) --- */}
      <div className="hidden print:block w-[80mm] p-4 text-black bg-white font-mono text-sm mx-auto">
        <div className="text-center mb-4">
          <h1 className="font-black text-xl">Nalini Book Shop</h1>
          <p className="text-xs"> No 05,Opposite Bus Station,51000</p>
          <p className="text-xs mt-2 border-b border-black pb-2 border-dashed">Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} <br/>Cashier: {user.username}</p>
        </div>
        <table className="w-full mb-4 text-xs">
          <thead><tr className="border-b border-black border-dashed"><th className="text-left pb-1">Item</th><th className="text-center pb-1">Qty</th><th className="text-right pb-1">Amt</th></tr></thead>
          <tbody>
            {cart.map((item, idx) => (<tr key={idx}><td className="py-1">{item.title.substring(0, 15)}</td><td className="py-1 text-center">{item.qty}</td><td className="py-1 text-right">{(item.retail_price * (parseInt(item.qty)||0)).toFixed(2)}</td></tr>))}
          </tbody>
        </table>
        <div className="border-t border-black border-dashed pt-2 flex justify-between font-black text-base mb-4"><span>TOTAL:</span><span>LKR {total.toFixed(2)}</span></div>
        {cashReceived && (
          <div className="text-xs text-right mt-1">
            <p>Cash Given: LKR {Number(cashReceived).toFixed(2)}</p>
            <p>Change: LKR {changeDue.toFixed(2)}</p>
          </div>
        )}
        <div className="text-center text-xs mt-6"><p>Thank You, Come Again!</p></div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        input[type=number].hide-arrows::-webkit-inner-spin-button, 
        input[type=number].hide-arrows::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
      `}} />
    </>
  );
}