import React, { useState, useEffect } from 'react';
import { CalendarClock, CheckCircle, Trash2, Banknote, CreditCard, Search, Clock, CheckSquare } from 'lucide-react';

export default function ReservationsDashboard({ user }) {
  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  // Tab State for tracking 'Pending' vs 'History'
  const [activeTab, setActiveTab] = useState('Pending');

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedRes, setSelectedRes] = useState(null);
  const [paymentType, setPaymentType] = useState('Cash');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchReservations = () => {
    fetch('http://localhost:5000/api/reservations')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setReservations(data); })
      .catch(e => console.error(e));
  };

  useEffect(() => { fetchReservations(); }, []);

  const handleCompletePickup = async () => {
    const balance = parseFloat(selectedRes.total_amount) - parseFloat(selectedRes.advance_paid);
    try {
      const res = await fetch(`http://localhost:5000/api/reservations/${selectedRes.id}/pickup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          balance_paid: balance, 
          payment_type: paymentType, 
          username: user.username,
          ref_number: selectedRes.ref_number
        })
      });
      if (res.ok) {
        if (balance > 0 && paymentType === 'Cash') {
          fetch('http://localhost:5000/api/printer/open-drawer', {method: 'POST'}).catch(e=>e);
        }
        showToast("Order marked as picked up! Moved to History.");
        setShowCompleteModal(false);
        fetchReservations(); // Refresh the list
      }
    } catch (err) { showToast("Error completing reservation."); }
  };

  const handleCancel = async (id) => {
    if(!window.confirm("Are you sure you want to cancel this? The items will be returned to normal stock.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/reservations/${id}`, { method: 'DELETE' });
      if (res.ok) { showToast("Reservation cancelled. Stock restocked."); fetchReservations(); }
    } catch (err) { showToast("Error cancelling."); }
  };

  // FILTER: Apply search, then separate into the correct Tabs
  const searchFiltered = reservations.filter(r => 
    r.customer_name.toLowerCase().includes(search.toLowerCase()) || 
    r.phone.includes(search) || 
    r.ref_number.toLowerCase().includes(search.toLowerCase())
  );

  const displayedReservations = searchFiltered.filter(r => 
    activeTab === 'Pending' ? r.status === 'Pending Pickup' : r.status === 'Picked Up'
  );

  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative transition-colors">
      
      {toast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-2xl z-50 font-bold border-l-4 border-emerald-500 animate-pulse">
          {toast}
        </div>
      )}

      {showCompleteModal && selectedRes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-6 border border-transparent dark:border-slate-700 transition-colors">
            <h3 className="font-black text-xl mb-4 text-slate-800 dark:text-white border-b dark:border-slate-700 pb-2">Complete Pickup</h3>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Customer: <span className="text-black dark:text-white">{selectedRes.customer_name}</span></p>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">Advance Paid: <span className="text-emerald-600 dark:text-emerald-400">LKR {Number(selectedRes.advance_paid).toFixed(2)}</span></p>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl mb-6 transition-colors">
               <p className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wide mb-1">Remaining Balance Due</p>
               <p className="text-3xl font-black text-amber-900 dark:text-amber-400">LKR {(selectedRes.total_amount - selectedRes.advance_paid).toFixed(2)}</p>
            </div>

            {(selectedRes.total_amount - selectedRes.advance_paid) > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-6">
                <button onClick={() => setPaymentType('Cash')} className={`font-bold py-3 rounded-xl flex items-center justify-center gap-2 border-2 transition-colors ${paymentType === 'Cash' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Banknote size={18}/> Cash</button>
                <button onClick={() => setPaymentType('Card')} className={`font-bold py-3 rounded-xl flex items-center justify-center gap-2 border-2 transition-colors ${paymentType === 'Card' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><CreditCard size={18}/> Card</button>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowCompleteModal(false)} className="w-1/3 bg-slate-200 dark:bg-slate-800 font-bold py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleCompletePickup} className="w-2/3 bg-emerald-600 text-white font-black py-3 rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2 transition-colors">Confirm Pickup <CheckCircle size={18}/></button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <CalendarClock className="text-blue-600 dark:text-blue-400" size={32} /> Pre-Orders & Layaways
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Track separated items and customer deposits.</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input type="text" placeholder="Search Customer or Ref..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium shadow-sm transition-colors" />
        </div>
      </div>

      {/* TABS TO SWITCH VIEWS */}
      <div className="flex gap-4">
        <button 
          onClick={() => setActiveTab('Pending')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-colors ${activeTab === 'Pending' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border-t-2 border-x-2 border-blue-500 shadow-sm z-10 -mb-[1px]' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
        >
          <Clock size={18}/> Active Pre-Orders
        </button>
        <button 
          onClick={() => setActiveTab('Picked Up')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-colors ${activeTab === 'Picked Up' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border-t-2 border-x-2 border-blue-500 shadow-sm z-10 -mb-[1px]' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
        >
          <CheckSquare size={18}/> Completed History
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-b-2xl rounded-tr-2xl shadow-sm overflow-hidden flex-1 relative -top-[1px] transition-colors">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-700 dark:text-slate-300">
            <tr>
              <th className="p-4 font-bold">Customer & Ref</th>
              <th className="p-4 font-bold">Pickup Date</th>
              <th className="p-4 font-bold">Financials</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayedReservations.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold">No {activeTab === 'Pending' ? 'active' : 'completed'} reservations found.</td></tr>}
            {displayedReservations.map(r => {
              const balance = parseFloat(r.total_amount) - parseFloat(r.advance_paid);
              return (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <p className="font-black text-slate-800 dark:text-white text-base">{r.customer_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">{r.phone}</p>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{r.ref_number}</span>
                  </td>
                  <td className="p-4">
                    <span className={`font-black px-3 py-1 rounded-full text-xs ${new Date(r.pickup_date) < new Date() && r.status === 'Pending Pickup' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
                      {new Date(r.pickup_date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Total: LKR {Number(r.total_amount).toFixed(2)}</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Advance: LKR {Number(r.advance_paid).toFixed(2)}</p>
                    {balance > 0 && r.status === 'Pending Pickup' && <p className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">Due: LKR {balance.toFixed(2)}</p>}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${r.status === 'Picked Up' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-center flex items-center justify-center gap-2">
                    {r.status === 'Pending Pickup' ? (
                      <>
                        <button onClick={() => { setSelectedRes(r); setShowCompleteModal(true); }} className="bg-blue-600 text-white font-bold px-3 py-2 rounded-lg hover:bg-blue-700 text-xs shadow-sm transition-colors">Complete Pickup</button>
                        <button onClick={() => handleCancel(r.id)} className="bg-slate-100 dark:bg-slate-800 text-red-500 dark:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-200 dark:hover:border-red-800/50 border border-transparent transition-colors"><Trash2 size={16}/></button>
                      </>
                    ) : (
                      <span className="text-emerald-500 dark:text-emerald-400 font-bold text-sm flex items-center gap-1"><CheckCircle size={16}/> Handed Over</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}