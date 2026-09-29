import React, { useState, useEffect } from 'react';
import { CalendarClock, CheckCircle, Trash2, Banknote, CreditCard, Clock, AlertTriangle, Wallet, Phone, Eye, BookOpen, User } from 'lucide-react';
import { Page, Card, StatCard, Badge, Tabs, Button, IconButton, SearchInput, Modal, ConfirmModal, Toast, EmptyRow, Avatar, Drawer, money, thCls, tdCls, trCls, cx } from './ui';

export default function ReservationsDashboard({ user }) {
  const [reservations, setReservations] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  // Tab State for tracking 'Pending' vs 'History'
  const [activeTab, setActiveTab] = useState('Pending');

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedRes, setSelectedRes] = useState(null);
  const [paymentType, setPaymentType] = useState('Cash');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [detail, setDetail] = useState(null);

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
    setCancelTarget(null);
    try {
      const res = await fetch(`http://localhost:5000/api/reservations/${id}`, { method: 'DELETE' });
      if (res.ok) { showToast("Reservation cancelled. Stock restocked."); fetchReservations(); }
    } catch (err) { showToast("Error cancelling."); }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isOverdue = (r) => r.status === 'Pending Pickup' && new Date(r.pickup_date) < today;

  // FILTER: Apply search, then separate into the correct Tabs
  const searchFiltered = reservations.filter(r =>
    r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    r.phone.includes(search) ||
    r.ref_number.toLowerCase().includes(search.toLowerCase())
  );

  const displayedReservations = searchFiltered.filter(r =>
    activeTab === 'Pending' ? r.status === 'Pending Pickup' : activeTab === 'Overdue' ? isOverdue(r) : r.status === 'Picked Up'
  );

  const pending = reservations.filter(r => r.status === 'Pending Pickup');
  const overdue = reservations.filter(isOverdue);
  const depositsHeld = pending.reduce((a, r) => a + (Number(r.advance_paid) || 0), 0);
  const balanceDue = pending.reduce((a, r) => a + (Number(r.total_amount) - Number(r.advance_paid) || 0), 0);

  return (
    <Page>
      <Toast message={toast} />

      {cancelTarget && (
        <ConfirmModal title="Cancel Pre-Order" icon={Trash2} confirmLabel="Cancel Pre-Order"
          message={<>Cancel <b className="text-slate-900 dark:text-white">{cancelTarget.customer_name}</b>'s pre-order ({cancelTarget.ref_number})? The items will be returned to normal stock.</>}
          onConfirm={() => handleCancel(cancelTarget.id)} onCancel={() => setCancelTarget(null)} />
      )}

      {detail && (() => {
        const bal = Number(detail.total_amount) - Number(detail.advance_paid);
        const st = detail.status === 'Picked Up' ? 'Picked Up' : isOverdue(detail) ? 'Overdue' : 'Pending Pickup';
        const Field = ({ label, value, tone }) => (
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-3.5 py-2.5">
            <p className="text-[11px] text-slate-500">{label}</p>
            <p className={cx('text-sm font-semibold', tone || 'text-slate-900 dark:text-white')}>{value}</p>
          </div>
        );
        return (
          <Drawer title="Pre-Order Details" subtitle={detail.ref_number} width="max-w-lg" onClose={() => setDetail(null)}
            footer={detail.status === 'Pending Pickup' ? <>
              <Button variant="ghost" className="text-red-500 hover:!bg-red-500/10" onClick={() => { setDetail(null); setCancelTarget(detail); }}><Trash2 size={15}/> Cancel Pre-Order</Button>
              <Button className="flex-1" onClick={() => { setSelectedRes(detail); setPaymentType('Cash'); setShowCompleteModal(true); setDetail(null); }}><CheckCircle size={15}/> Complete Pickup</Button>
            </> : null}>
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 p-5 text-white mb-5">
              <p className="text-xs opacity-80">Pre-Order</p>
              <p className="text-xl font-bold font-mono">{detail.ref_number}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm">{(detail.items || []).reduce((a, i) => a + (Number(i?.qty) || 0), 0)} items</span>
                <span className="text-xs font-semibold bg-white/20 rounded-md px-2 py-0.5">{st}</span>
              </div>
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Pre-Order Details</h4>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <Field label="Created" value={new Date(detail.created_at).toLocaleDateString()} />
              <Field label="Pickup Date" value={new Date(detail.pickup_date).toLocaleDateString()} tone={isOverdue(detail) ? 'text-red-500' : undefined} />
              <Field label="Created By" value={detail.created_by || '—'} />
              <Field label="Advance Paid Via" value={Number(detail.advance_paid) > 0 ? detail.payment_type : '—'} />
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Customer Details</h4>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <Field label="Full Name" value={detail.customer_name} />
              <Field label="Phone Number" value={detail.phone} />
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Reserved Items</h4>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 mb-5">
              {(detail.items || []).filter(Boolean).map((i, idx) => (
                <div key={idx} className="flex items-center gap-3 px-3.5 py-2.5">
                  <span className="w-8 h-10 rounded-md bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white shrink-0"><BookOpen size={13}/></span>
                  <span className="flex-1 min-w-0 text-sm text-slate-900 dark:text-white truncate">{i.title}</span>
                  <span className="text-xs text-slate-500">× {i.qty}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white w-24 text-right">{money(i.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500"><span>Order Total</span><span className="text-slate-900 dark:text-white font-semibold">{money(detail.total_amount)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Advance Paid</span><span className="text-emerald-600 dark:text-emerald-400 font-semibold">- {money(detail.advance_paid)}</span></div>
              <div className="flex justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800"><span className="font-semibold text-slate-900 dark:text-white">{detail.status === 'Picked Up' ? 'Balance Collected' : 'Balance Due'}</span><span className="text-lg font-bold text-blue-600 dark:text-blue-400">{money(bal)}</span></div>
            </div>
          </Drawer>
        );
      })()}

      {showCompleteModal && selectedRes && (
        <Modal title="Complete Pickup" subtitle={selectedRes.ref_number} icon={CheckCircle} tone="green" onClose={() => setShowCompleteModal(false)}
          footer={<>
            <Button variant="secondary" className="flex-1" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
            <Button variant="success" className="flex-[2]" onClick={handleCompletePickup}>Confirm Pickup <CheckCircle size={16}/></Button>
          </>}>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-semibold text-slate-900 dark:text-white">{selectedRes.customer_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Order total</span><span className="font-semibold text-slate-900 dark:text-white">{money(selectedRes.total_amount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Advance paid</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{money(selectedRes.advance_paid)}</span></div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl mb-4">
             <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Remaining Balance Due</p>
             <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{money(selectedRes.total_amount - selectedRes.advance_paid)}</p>
          </div>

          {(selectedRes.total_amount - selectedRes.advance_paid) > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {[['Cash', Banknote], ['Card', CreditCard]].map(([t, Icon]) => (
                <button key={t} onClick={() => setPaymentType(t)} className={cx('font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 border-2 transition-colors',
                  paymentType === t ? 'border-blue-600 bg-blue-600/10 text-blue-600 dark:text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600')}>
                  <Icon size={17}/> {t}
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Active Pre-Orders" sub="Waiting for pickup" value={pending.length} icon={CalendarClock} bars={false} />
        <StatCard label="Overdue Pickups" sub="Past pickup date" value={overdue.length} icon={AlertTriangle} tone="red" bars={false} />
        <StatCard label="Deposits Held" sub="Advance payments" value={money(depositsHeld)} icon={Wallet} tone="green" bars={false} />
        <StatCard label="Balance to Collect" sub="On active pre-orders" value={money(balanceDue)} icon={Banknote} tone="amber" bars={false} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <Tabs active={activeTab} onChange={setActiveTab} tabs={[
            { key: 'Pending', label: 'Active Pre-Orders', count: pending.length },
            { key: 'Overdue', label: 'Overdue', count: overdue.length },
            { key: 'Picked Up', label: 'Completed History', count: reservations.filter(r => r.status === 'Picked Up').length },
          ]} />
          <SearchInput value={search} onChange={setSearch} placeholder="Search Customer, Phone or Ref..." className="w-72" />
        </div>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className={thCls}>Customer & Ref</th>
              <th className={thCls}>Pickup Date</th>
              <th className={thCls}>Financials</th>
              <th className={thCls}>Status</th>
              <th className={cx(thCls, 'text-right')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedReservations.length === 0 && <EmptyRow colSpan={5}>No {activeTab === 'Picked Up' ? 'completed' : activeTab === 'Overdue' ? 'overdue' : 'active'} reservations found.</EmptyRow>}
            {displayedReservations.map(r => {
              const balance = parseFloat(r.total_amount) - parseFloat(r.advance_paid);
              return (
                <tr key={r.id} className={trCls}>
                  <td className={tdCls}>
                    <button onClick={() => setDetail(r)} className="flex items-center gap-3 text-left">
                      <Avatar name={r.customer_name} />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{r.customer_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Phone size={11}/>{r.phone} · <span className="font-mono">{r.ref_number}</span></p>
                      </div>
                    </button>
                  </td>
                  <td className={tdCls}>
                    <Badge tone={isOverdue(r) ? 'red' : 'slate'}><Clock size={11}/> {new Date(r.pickup_date).toLocaleDateString()}</Badge>
                  </td>
                  <td className={tdCls}>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total {money(r.total_amount)}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Advance {money(r.advance_paid)}</p>
                    {balance > 0 && r.status === 'Pending Pickup' && <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-0.5">Due {money(balance)}</p>}
                  </td>
                  <td className={tdCls}>
                    <Badge tone={r.status === 'Picked Up' ? 'green' : isOverdue(r) ? 'red' : 'amber'}>{isOverdue(r) ? 'Overdue' : r.status}</Badge>
                  </td>
                  <td className={cx(tdCls, 'text-right whitespace-nowrap')}>
                    {r.status === 'Pending Pickup' ? (
                      <div className="inline-flex items-center gap-1">
                        <IconButton onClick={() => setDetail(r)} title="View details"><Eye size={16}/></IconButton>
                        <Button size="sm" onClick={() => { setSelectedRes(r); setPaymentType('Cash'); setShowCompleteModal(true); }}>Complete Pickup</Button>
                        <IconButton tone="red" onClick={() => setCancelTarget(r)} title="Cancel pre-order"><Trash2 size={16}/></IconButton>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-2"><IconButton onClick={() => setDetail(r)} title="View details"><Eye size={16}/></IconButton><span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs inline-flex items-center gap-1"><CheckCircle size={14}/> Handed Over</span></span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </Page>
  );
}
