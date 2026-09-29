import React, { useState, useEffect } from 'react';
import { Receipt, Printer, RotateCcw, AlertCircle, Eye, CalendarDays, Wallet } from 'lucide-react';
import { Page, Card, StatCard, Badge, Tabs, Button, IconButton, SearchInput, Modal, Toast, EmptyRow, Avatar, money, thCls, tdCls, trCls, cx } from './ui';

export default function SalesHistory({ user }) {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [reprintSale, setReprintSale] = useState(null);
  const [activeReturn, setActiveReturn] = useState(null);
  const [viewSale, setViewSale] = useState(null); 
  const [returnItems, setReturnItems] = useState([]);

  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 6000); 
  };

  const fetchSales = () => {
    setIsLoading(true);
    fetch(`http://localhost:5000/api/sales/history?t=${Date.now()}`)
      .then(async res => {
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await res.json() : null;
        if (!res.ok) throw new Error(data && data.error ? data.error : "Database connection failed");
        return data;
      })
      .then(data => { 
        if (Array.isArray(data)) setSales(data); 
        else setSales([]);
        setIsLoading(false);
      })
      .catch(err => {
        showToast(`Backend Error: ${err.message}`);
        setIsLoading(false);
      });
  };

  useEffect(() => { fetchSales(); }, []);

  const filteredSales = sales.filter(s => 
    (s.invoice_number || '').toLowerCase().includes(search.toLowerCase()) || 
    (s.created_by || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleReprint = (sale) => {
    setReprintSale(sale);
    setTimeout(() => {
       window.print();
       setTimeout(() => setReprintSale(null), 500); 
    }, 100);
  };

  const openReturnModal = (sale) => {
    const remainingItems = (sale.items || []).reduce((acc, item) => acc + item.qty, 0);
    if (remainingItems === 0) {
      return showToast("All items on this invoice have been completely returned.");
    }
    setActiveReturn(sale);
    const itemsWithTracker = (sale.items || []).map(item => ({ ...item, returnQty: 0 }));
    setReturnItems(itemsWithTracker);
  };

  const updateReturnQty = (index, delta) => {
    setReturnItems(prev => {
      const newItems = [...prev];
      const item = newItems[index];
      const newQty = item.returnQty + delta;
      if (newQty >= 0 && newQty <= item.qty) { item.returnQty = newQty; }
      return newItems;
    });
  };

  const calculateTotalRefund = () => {
    return returnItems.reduce((sum, item) => sum + (item.returnQty * Number(item.price || 0)), 0);
  };

  const processReturn = async () => {
    const totalRefund = calculateTotalRefund();
    if (totalRefund === 0) return showToast("Please select at least one item to return.");

    const res = await fetch('http://localhost:5000/api/returns/process', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice_number: activeReturn.invoice_number,
        items: returnItems,
        total_refund: totalRefund,
        username: currentUser.username || 'System'
      })
    });

    if (res.ok) {
      fetch('http://localhost:5000/api/printer/open-drawer', { method: 'POST' }).catch(e => e);
      showToast(`Successfully processed refund of LKR ${totalRefund.toFixed(2)}!`);
      setActiveReturn(null);
      fetchSales(); 
    } else {
      showToast("Error processing return. Check server logs.");
    }
  };

  const [payFilter, setPayFilter] = useState('All');
  const payKind = (s) => (s.payment_type || '').startsWith('Split') ? 'Split' : s.payment_type;
  const visibleSales = filteredSales.filter(s => payFilter === 'All' || (payFilter === 'Returned' ? Number(s.refunded_amount) > 0 : payKind(s) === payFilter));

  const netRevenue = sales.reduce((a, s) => a + (Number(s.total_amount) || 0), 0);
  const refundedTotal = sales.reduce((a, s) => a + (Number(s.refunded_amount) || 0), 0);
  const todayStr = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.created_at).toDateString() === todayStr);

  return (
    <>
      <Page>
        <Toast message={toast} />

        {/* --- VIEW ITEMS MODAL (Original vs Returned Columns) --- */}
        {viewSale && (
          <Modal title="Invoice Details" subtitle={viewSale.invoice_number} icon={Receipt} width="max-w-3xl" onClose={() => setViewSale(null)}>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th className={thCls}>Item Name</th>
                    <th className={cx(thCls, 'text-center')}>Purchased</th>
                    <th className={cx(thCls, 'text-center !text-red-500')}>Returned</th>
                    <th className={cx(thCls, 'text-center !text-emerald-500')}>Remaining</th>
                    <th className={cx(thCls, 'text-right')}>Unit Price</th>
                    <th className={cx(thCls, 'text-right')}>Net Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viewSale.items.filter(i=>i && i.title).map((item, idx) => {
                    const originalQty = item.original_qty || item.qty;
                    const returnedQty = originalQty - item.qty;
                    return (
                      <tr key={idx} className={trCls}>
                        <td className={cx(tdCls, 'font-semibold text-slate-900 dark:text-white')}>
                           {item.title}
                           {item.qty === 0 && <Badge tone="red" className="ml-2">Fully Returned</Badge>}
                        </td>
                        <td className={cx(tdCls, 'text-center')}>{originalQty}</td>
                        <td className={cx(tdCls, 'text-center text-red-500 dark:text-red-400 font-semibold')}>{returnedQty > 0 ? returnedQty : '-'}</td>
                        <td className={cx(tdCls, 'text-center text-emerald-600 dark:text-emerald-400 font-semibold')}>{item.qty}</td>
                        <td className={cx(tdCls, 'text-right')}>{Number(item.price || (item.subtotal / (item.qty || 1))).toFixed(2)}</td>
                        <td className={cx(tdCls, 'text-right font-semibold text-slate-900 dark:text-white')}>{Number(item.subtotal || 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Modal>
        )}

        {/* --- RETURN MODAL --- */}
        {activeReturn && (
          <Modal title="Process Return" subtitle={`Invoice: ${activeReturn.invoice_number}`} icon={RotateCcw} tone="red" width="max-w-2xl" onClose={() => setActiveReturn(null)}
            footer={
              <div className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Refund Amount</span>
                  <span className="font-bold text-2xl text-red-600 dark:text-red-400">{money(calculateTotalRefund())}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="lg" className="flex-1" onClick={() => setActiveReturn(null)}>Cancel</Button>
                  <Button variant="danger" size="lg" className="flex-1" onClick={processReturn}><RotateCcw size={16}/> Confirm & Restock</Button>
                </div>
              </div>
            }>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th className={thCls}>Item Name</th>
                    <th className={cx(thCls, 'text-center')}>Remaining</th>
                    <th className={cx(thCls, 'text-center')}>Return Qty</th>
                    <th className={cx(thCls, 'text-right')}>Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {returnItems.map((item, idx) => (
                    <tr key={idx} className={trCls}>
                      <td className={cx(tdCls, 'font-semibold text-slate-900 dark:text-white')}>{item.title || 'Unknown Item'}</td>
                      <td className={cx(tdCls, 'text-center')}>{item.qty}</td>
                      <td className={tdCls}>
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => updateReturnQty(idx, -1)} className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 font-bold">-</button>
                          <span className="font-semibold w-4 text-center text-slate-900 dark:text-white">{item.returnQty}</span>
                          <button onClick={() => updateReturnQty(idx, 1)} className="w-7 h-7 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-bold">+</button>
                        </div>
                      </td>
                      <td className={cx(tdCls, 'text-right font-semibold text-slate-900 dark:text-white')}>{money(item.returnQty * Number(item.price || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Modal>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard label="Total Invoices" sub="All time" value={sales.length.toLocaleString()} icon={Receipt} bars={false} />
          <StatCard label="Today's Invoices" sub={money(todaySales.reduce((a, s) => a + Number(s.total_amount || 0), 0))} value={todaySales.length} icon={CalendarDays} tone="green" bars={false} />
          <StatCard label="Net Revenue" sub="After returns" value={money(netRevenue)} icon={Wallet} tone="purple" bars={false} />
          <StatCard label="Refunded" sub={`${sales.filter(s => Number(s.refunded_amount) > 0).length} invoices`} value={money(refundedTotal)} icon={RotateCcw} tone="red" bars={false} />
        </div>

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <Tabs active={payFilter} onChange={setPayFilter} tabs={[
              { key: 'All', label: 'All', count: filteredSales.length },
              { key: 'Cash', label: 'Cash', count: filteredSales.filter(s => payKind(s) === 'Cash').length },
              { key: 'Card', label: 'Card', count: filteredSales.filter(s => payKind(s) === 'Card').length },
              { key: 'Split', label: 'Split', count: filteredSales.filter(s => payKind(s) === 'Split').length },
              { key: 'Returned', label: 'With Returns', count: filteredSales.filter(s => Number(s.refunded_amount) > 0).length },
            ]} />
            <SearchInput value={search} onChange={setSearch} placeholder="Search Invoice No or Cashier..." className="w-72" />
          </div>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className={thCls}>Date & Time</th>
                <th className={thCls}>Invoice No</th>
                <th className={thCls}>Cashier</th>
                <th className={cx(thCls, 'text-center')}>Net Items</th>
                <th className={thCls}>Payment</th>
                <th className={cx(thCls, 'text-right')}>Net Total</th>
                <th className={cx(thCls, 'text-center')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <EmptyRow colSpan={7}>Loading database history...</EmptyRow>
              ) : visibleSales.length === 0 ? (
                <EmptyRow colSpan={7}>No invoices found.</EmptyRow>
              ) : (
                visibleSales.map(sale => {
                  const refundedAmount = Number(sale.refunded_amount) || 0;
                  const remainingItems = (sale.items || []).reduce((acc, item) => acc + item.qty, 0);
                  const isFullyRefunded = remainingItems === 0;

                  // 🐛 FIXED: The backend already accurately calculates the Net Total into total_amount!
                  const netTotal = Number(sale.total_amount);

                  return (
                    <tr key={sale.id} className={trCls}>
                      <td className={tdCls}>
                        {new Date(sale.created_at).toLocaleDateString()}
                        <span className="block text-xs text-slate-400 dark:text-slate-500">{new Date(sale.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className={cx(tdCls, 'font-semibold text-slate-900 dark:text-white font-mono')}>{sale.invoice_number}</td>
                      <td className={tdCls}><span className="flex items-center gap-2"><Avatar name={sale.created_by} size="w-7 h-7" />{sale.created_by}</span></td>
                      <td className={cx(tdCls, 'text-center')}>
                        <Button variant="secondary" size="sm" onClick={() => setViewSale(sale)}>{remainingItems} items <Eye size={13}/></Button>
                      </td>
                      <td className={tdCls}>
                        <Badge tone={payKind(sale) === 'Cash' ? 'green' : payKind(sale) === 'Card' ? 'blue' : 'purple'} className="max-w-[180px] truncate" >{sale.payment_type}</Badge>
                      </td>
                      <td className={cx(tdCls, 'text-right')}>
                        <p className="font-semibold text-slate-900 dark:text-white">{money(netTotal)}</p>
                        {refundedAmount > 0 && <p className="text-[11px] text-red-500 dark:text-red-400 flex items-center justify-end gap-1"><AlertCircle size={11}/> Returned -{refundedAmount.toFixed(2)}</p>}
                      </td>
                      <td className={cx(tdCls, 'text-center whitespace-nowrap')}>
                        <IconButton tone="red" onClick={() => openReturnModal(sale)} title={isFullyRefunded ? "All Items Returned" : "Return Items"} disabled={isFullyRefunded}><RotateCcw size={16} /></IconButton>
                        <IconButton tone="blue" onClick={() => handleReprint(sale)} title="Reprint Receipt"><Printer size={16} /></IconButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>
      </Page>
      
      {/* --- SMART THERMAL RECEIPT REPRINT (Handles Returns Properly) --- */}
      {reprintSale && (
        <div className="hidden print:block w-[80mm] p-4 text-black bg-white font-mono text-sm mx-auto">
          <div className="text-center mb-4">
            <h1 className="font-black text-xl">Nalini Book Shop</h1>
            <p className="text-xs"> No 05,Opposite Bus Station,51000</p>
            <p className="text-xs mt-2 border-b border-black pb-2 border-dashed">
              Date: {new Date(reprintSale.created_at).toLocaleDateString()} {new Date(reprintSale.created_at).toLocaleTimeString()} <br/>
              Cashier: {reprintSale.created_by} <br/>
              Invoice: {reprintSale.invoice_number} <br/>
              <span className="font-black mt-1 inline-block">** DUPLICATE RECEIPT **</span>
            </p>
          </div>
          {(!reprintSale.invoice_number.startsWith('ADV-') && !reprintSale.invoice_number.startsWith('BAL-')) && (
            <table className="w-full mb-4 text-xs">
              <thead><tr className="border-b border-black border-dashed"><th className="text-left pb-1">Item</th><th className="text-center pb-1">Orig Qty</th><th className="text-right pb-1">Amt</th></tr></thead>
              <tbody>
                {(reprintSale.items || []).map((item, idx) => {
                  const originalQty = item.original_qty || item.qty;
                  const itemPrice = item.price || (item.subtotal / (item.qty || 1));
                  const originalSubtotal = originalQty * itemPrice;
                  return (
                    <tr key={idx}>
                      <td className="py-1 break-words">{(item.title || '').substring(0, 15)}</td>
                      <td className="py-1 text-center">{originalQty}</td>
                      <td className="py-1 text-right">{Number(originalSubtotal).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          
          <div className="border-t border-black border-dashed pt-2 flex justify-between font-black text-base">
            <span>ORIGINAL TOTAL:</span>
            <span>LKR {(Number(reprintSale.total_amount) + Number(reprintSale.refunded_amount || 0)).toFixed(2)}</span>
          </div>

          {Number(reprintSale.refunded_amount) > 0 && (
            <>
              <div className="flex justify-between text-sm mt-1 mb-1">
                <span>REFUNDED:</span>
                <span>- LKR {Number(reprintSale.refunded_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-base border-t border-black border-dotted pt-1 mb-4">
                <span>NET TOTAL:</span>
                <span>LKR {Number(reprintSale.total_amount).toFixed(2)}</span>
              </div>
            </>
          )}

          <div className="text-center text-xs mt-6"><p>Thank You, Come Again!</p></div>
        </div>
      )}
    </>
  );
}