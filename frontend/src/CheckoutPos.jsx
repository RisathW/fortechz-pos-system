import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Printer, Unlock, PauseCircle, PlayCircle, SplitSquareVertical, Banknote, RotateCcw, Coins, CalendarClock, CheckCircle } from 'lucide-react';

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

  return (
    <>
      <div className="flex h-full p-6 gap-6 bg-slate-50 dark:bg-slate-950 print:hidden relative transition-colors">
        
        {toast && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-2xl z-50 font-bold border-l-4 border-amber-500 animate-pulse">
            {toast}
          </div>
        )}

        {/* --- START SHIFT MODAL --- */}
        {showOpeningModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[100] print:hidden">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-8 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-center mb-4"><Banknote size={48} className="text-emerald-500" /></div>
              <h3 className="font-black text-2xl mb-2 text-center text-slate-800 dark:text-white">Start of Day</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-6 font-medium text-sm">Enter the physical cash amount currently sitting inside the cash drawer (Starting Float).</p>
              
              <input 
                type="number" 
                autoFocus 
                value={openingCash} 
                onChange={e => setOpeningCash(e.target.value)} 
                className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-500 outline-none font-black text-slate-800 dark:text-white text-3xl mb-6 text-center bg-slate-50 dark:bg-slate-800" 
                placeholder="0.00" 
              />
              
              <button 
                onClick={handleStartShift} 
                disabled={!openingCash}
                className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
              >
                Open Register
              </button>
            </div>
          </div>
        )}

        {/* --- LEFT ITEM GRID PANEL --- */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 flex gap-4 items-center">
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)} 
              className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-white transition-colors"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input ref={searchInputRef} type="text" placeholder="Search Title, Author, or Barcode..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleBarcodeScan} className="w-full pl-10 p-3 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-white transition-colors" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-3 gap-4">
              {filteredBooks.map(book => (
                <div key={book.id} onClick={() => addToCart(book)} className="p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 rounded-xl cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-mono mb-1">{book.isbn_barcode}</p>
                    <p className="font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight">{book.title}</p>
                    {book.author_name && book.author_name !== 'N/A' && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">{book.author_name}</p>
                    )}
                    <div className="mt-2 inline-block bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 px-2 py-1 rounded shadow-sm">
                      <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 tracking-wide uppercase">
                        {book.location === 'Unassigned' ? 'UNASSIGNED' : book.location}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-end border-t border-slate-100 dark:border-slate-700/50 pt-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{book.category || 'Other'}</span>
                    <p className="text-blue-600 dark:text-blue-400 font-black text-lg">LKR {Number(book.retail_price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {filteredBooks.length === 0 && <div className="col-span-3 text-center py-10 text-slate-500 font-bold">No items found.</div>}
            </div>
          </div>
        </div>

        {/* --- RIGHT CART SIDEBAR --- */}
        <div className="w-[380px] bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col transition-colors">
          
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-black text-slate-800 dark:text-white">Order</h2>
             <button onClick={() => fetch('http://localhost:5000/api/printer/open-drawer', {method:'POST'}).catch(e=>e)} className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Unlock size={14} /> Open</button>
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setShowExpenseModal(true)} className="flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 font-bold text-xs py-2 px-3 rounded-lg border border-rose-200 dark:border-rose-800/50 whitespace-nowrap hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"><Coins size={14}/> Petty Cash</button>
            <button onClick={() => onNavigate('sales_history')} className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-bold text-xs py-2 px-3 rounded-lg border border-orange-200 dark:border-orange-800/50 whitespace-nowrap hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
              <RotateCcw size={14}/> Return
            </button>
            {heldBills.map((bill, idx) => (
              <button key={bill.id} onClick={() => recallBill(bill.id)} className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-bold text-xs py-2 px-3 rounded-lg border border-amber-200 dark:border-amber-800/50 whitespace-nowrap hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors"><PlayCircle size={14}/> Recall #{idx + 1}</button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 border-t border-b border-slate-100 dark:border-slate-800 py-3">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50 transition-colors">
                
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-bold text-sm truncate dark:text-white">{item.title}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">LKR {(item.retail_price * (parseInt(item.qty) || 0)).toFixed(2)}</p>
                </div>
                
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-sm mr-2">
                  <button onClick={() => updateCartQty(item.id, (parseInt(item.qty)||0) - 1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-black transition-colors">-</button>
                  <input 
                    type="number" 
                    className="w-10 text-center text-sm font-bold text-slate-800 dark:text-white bg-transparent outline-none hide-arrows" 
                    value={item.qty} 
                    onChange={(e) => updateCartQty(item.id, e.target.value)}
                    onBlur={(e) => {
                      if (item.qty === '' || item.qty <= 0) {
                        updateCartQty(item.id, 1);
                      }
                    }}
                  />
                  <button onClick={() => updateCartQty(item.id, (parseInt(item.qty)||0) + 1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-black transition-colors">+</button>
                </div>

                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors"><X size={16} /></button>
              </div>
            ))}
          </div>
          
          {/* ✅ FIXED BOTTOM CART ALIGNMENT */}
          <div className="pt-4 mt-auto">
             <div className="flex justify-between items-center mb-5">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Total Amount</span>
                <span className="text-4xl font-black text-slate-800 dark:text-white leading-none tracking-tight">LKR {total.toFixed(2)}</span>
             </div>

             <div className="grid grid-cols-3 gap-2 mb-2">
               <button onClick={holdCurrentBill} disabled={cart.length===0} className="w-full flex flex-col items-center justify-center gap-1 bg-amber-500 text-white font-bold py-2.5 rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs shadow-sm">
                 <PauseCircle size={18}/> Hold
               </button>
               <button onClick={() => setShowSplitModal(true)} disabled={cart.length===0} className="w-full flex flex-col items-center justify-center gap-1 bg-purple-500 text-white font-bold py-2.5 rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs shadow-sm">
                 <SplitSquareVertical size={18}/> Split
               </button>
               <button onClick={() => setShowReserveModal(true)} disabled={cart.length===0} className="w-full flex flex-col items-center justify-center gap-1 bg-blue-500 text-white font-bold py-2.5 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs shadow-sm">
                 <CalendarClock size={18}/> Reserve
               </button>
             </div>

             <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => setShowCashModal(true)} disabled={cart.length===0} className="bg-emerald-500 text-white font-black py-4 rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-sm">
                    Cash <Printer size={16} className="opacity-70"/>
                 </button>
                 <button onClick={() => handleCheckout('Card')} disabled={cart.length===0} className="bg-blue-500 text-white font-black py-4 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-sm">
                    Card <Printer size={16} className="opacity-70"/>
                 </button>
             </div>
          </div>
        </div>
      </div>

      {/* --- RESERVE MODAL --- */}
      {showReserveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[450px] p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="font-black text-xl mb-4 text-slate-800 dark:text-white border-b dark:border-slate-700 pb-2 flex items-center gap-2"><CalendarClock className="text-blue-600 dark:text-blue-400" /> Pre-Order / Reserve Items</h3>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">Order Total: <span className="text-xl text-black dark:text-white">LKR {total.toFixed(2)}</span></p>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Customer Name *</label>
                <input type="text" value={reserveForm.name} onChange={e => setReserveForm({...reserveForm, name: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Phone Number *</label>
                <input type="text" value={reserveForm.phone} onChange={e => setReserveForm({...reserveForm, phone: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Expected Pickup Date *</label>
              <input type="date" value={reserveForm.pickupDate} onChange={e => setReserveForm({...reserveForm, pickupDate: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Advance / Deposit Paid (Optional)</label>
              <input type="number" value={reserveForm.advance} onChange={e => setReserveForm({...reserveForm, advance: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-black text-emerald-600 dark:text-emerald-400 text-lg mb-2" placeholder="0.00" />
              {parseFloat(reserveForm.advance) > 0 && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setReserveForm({...reserveForm, paymentType: 'Cash'})} className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-colors ${reserveForm.paymentType === 'Cash' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>Cash</button>
                  <button onClick={() => setReserveForm({...reserveForm, paymentType: 'Card'})} className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-colors ${reserveForm.paymentType === 'Card' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>Card</button>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowReserveModal(false)} className="w-1/3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleReserveOrder} className="w-2/3 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors">Hold Stock <CheckCircle size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {/* --- CASH MODAL --- */}
      {showCashModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4 border-b dark:border-slate-700 pb-2"><Banknote className="text-emerald-600 dark:text-emerald-400" size={24} /><h3 className="font-black text-xl text-slate-800 dark:text-white">Cash Payment</h3></div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">Total Due: <span className="text-xl text-black dark:text-white">LKR {total.toFixed(2)}</span></p>
            <input type="number" autoFocus value={cashReceived} onChange={e => setCashReceived(e.target.value)} className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl focus:border-emerald-500 outline-none font-black text-2xl mb-3 text-center" placeholder="Amount Received" />
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button onClick={() => setCashReceived(total.toString())} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold py-2 rounded-lg text-sm border dark:border-slate-700 dark:text-white transition-colors">Exact</button>
              <button onClick={() => setCashReceived((parseFloat(cashReceived || 0) + 1000).toString())} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold py-2 rounded-lg text-sm border border-emerald-200 dark:border-emerald-800 transition-colors">+1000</button>
              <button onClick={() => setCashReceived((parseFloat(cashReceived || 0) + 5000).toString())} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold py-2 rounded-lg text-sm border border-emerald-200 dark:border-emerald-800 transition-colors">+5000</button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-slate-700 mb-6 flex justify-between items-center">
               <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-xs">Change</span>
               <span className={`text-2xl font-black ${isCashSufficient ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>LKR {changeDue.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {setShowCashModal(false); setCashReceived('');}} className="w-1/3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors">Cancel</button>
              <button onClick={() => handleCheckout('Cash')} disabled={!isCashSufficient} className="w-2/3 bg-emerald-600 text-white font-black py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">Checkout <Printer size={16}/></button>
            </div>
          </div>
        </div>
      )}

      {/* --- SPLIT MODAL --- */}
      {showSplitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="font-black text-xl mb-4 text-slate-800 dark:text-white border-b dark:border-slate-700 pb-2">Split Payment</h3>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">Total Due: <span className="text-xl text-black dark:text-white">LKR {total.toFixed(2)}</span></p>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cash Amount Received</label>
            <input type="number" autoFocus value={splitCash} onChange={e => setSplitCash(e.target.value)} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-black text-emerald-600 dark:text-emerald-400 text-lg mb-4 bg-emerald-50 dark:bg-emerald-900/20" placeholder="0.00" />
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Remaining to swipe on Card</label>
            <div className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg font-black text-blue-600 dark:text-blue-400 text-lg mb-6 bg-blue-50 dark:bg-blue-900/20">
              LKR {Math.max(0, total - (parseFloat(splitCash) || 0)).toFixed(2)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => {setShowSplitModal(false); setSplitCash('');}} className="w-1/3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={() => handleCheckout('Split')} className="w-2/3 bg-purple-600 text-white font-black py-3 rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors">Complete Split <Printer size={16}/></button>
            </div>
          </div>
        </div>
      )}

      {/* --- EXPENSE MODAL --- */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="font-black text-xl mb-4 dark:text-white">Log Petty Cash / Expense</h3>
            <input type="text" placeholder="Description (e.g. Tea for staff)" value={expense.desc} onChange={e=>setExpense({...expense, desc: e.target.value})} className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg mb-3 outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" placeholder="Amount (LKR)" value={expense.amount} onChange={e=>setExpense({...expense, amount: e.target.value})} className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg mb-6 outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-2">
              <button onClick={() => setShowExpenseModal(false)} className="w-1/2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleAddExpense} className="w-1/2 bg-rose-600 text-white font-bold py-3 rounded-xl transition-colors">Save & Open Drawer</button>
            </div>
          </div>
        </div>
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