import React, { useState, useEffect } from 'react';
import { RotateCcw, Eye, Receipt, CalendarDays, Wallet } from 'lucide-react';
import { Page, Card, StatCard, Button, SearchInput, Modal, EmptyRow, Avatar, money, thCls, tdCls, trCls, cx } from './ui';

export default function ReturnsDashboard() {
  const [returns, setReturns] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewReturn, setViewReturn] = useState(null); // State for the popup modal

  useEffect(() => {
    fetch('http://localhost:5000/api/returns/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setReturns(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching returns:", err);
        setIsLoading(false);
      });
  }, []);

  const filteredReturns = returns.filter(r =>
    (r.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.created_by || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalRefunded = returns.reduce((a, r) => a + (Number(r.amount) || 0), 0);
  const now = new Date();
  const thisMonth = returns.filter(r => { const d = new Date(r.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });

  return (
    <Page>
      {viewReturn && (
        <Modal title="Returned Items Breakdown" subtitle={`Invoice: ${viewReturn.invoice_number}`} icon={Receipt} tone="red" width="max-w-xl" onClose={() => setViewReturn(null)}
          footer={
            <div className="w-full flex justify-between items-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Total Cash Refunded</p>
              <span className="font-bold text-xl text-red-600 dark:text-red-400">- {money(viewReturn.amount)}</span>
            </div>
          }>
          <div className="flex justify-between mb-4 text-xs text-slate-500 dark:text-slate-400">
            <p>Processed by <span className="font-semibold text-slate-900 dark:text-white">{viewReturn.created_by}</span></p>
            <p>{new Date(viewReturn.created_at).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className={thCls}>Item Name</th>
                  <th className={cx(thCls, 'text-center')}>Returned Qty</th>
                  <th className={cx(thCls, 'text-right')}>Refund Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  try {
                    const items = JSON.parse(viewReturn.returned_items || '[]');
                    if (items.length === 0) return <EmptyRow colSpan={3}>No item details recorded for this legacy return.</EmptyRow>;

                    return items.map((item, idx) => (
                      <tr key={idx} className={trCls}>
                        <td className={cx(tdCls, 'font-semibold text-slate-900 dark:text-white')}>{item.title}</td>
                        <td className={cx(tdCls, 'text-center font-semibold text-red-600 dark:text-red-400')}>{item.qty}</td>
                        <td className={cx(tdCls, 'text-right font-semibold text-slate-900 dark:text-white')}>
                          {money(item.qty * Number(item.price || 0))}
                        </td>
                      </tr>
                    ));
                  } catch (e) {
                    return <EmptyRow colSpan={3}>Error parsing returned items data.</EmptyRow>;
                  }
                })()}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="Total Returns" sub="All time" value={returns.length} icon={RotateCcw} tone="red" bars={false} />
        <StatCard label="Total Cash Refunded" sub="All time" value={money(totalRefunded)} icon={Wallet} tone="amber" bars={false} />
        <StatCard label="Returns This Month" sub={money(thisMonth.reduce((a, r) => a + (Number(r.amount) || 0), 0))} value={thisMonth.length} icon={CalendarDays} tone="purple" bars={false} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Returns Audit Log</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Secure record of all cash refunded and items restocked</p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search Invoice No or Cashier..." className="w-72" />
        </div>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className={thCls}>Refund Date & Time</th>
              <th className={thCls}>Original Invoice No</th>
              <th className={thCls}>Processed By</th>
              <th className={cx(thCls, 'text-center')}>Returned Items</th>
              <th className={cx(thCls, 'text-right')}>Total Cash Refunded</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <EmptyRow colSpan={5}>Loading returns history...</EmptyRow>
            ) : filteredReturns.length === 0 ? (
              <EmptyRow colSpan={5}>No returns have been processed yet.</EmptyRow>
            ) : (
              filteredReturns.map(ret => (
                <tr key={ret.id} className={trCls}>
                  <td className={tdCls}>
                    {new Date(ret.created_at).toLocaleDateString()}
                    <span className="block text-xs text-slate-400 dark:text-slate-500">{new Date(ret.created_at).toLocaleTimeString()}</span>
                  </td>
                  <td className={cx(tdCls, 'font-semibold text-slate-900 dark:text-white font-mono')}>{ret.invoice_number}</td>
                  <td className={tdCls}><span className="flex items-center gap-2"><Avatar name={ret.created_by} size="w-7 h-7" />{ret.created_by}</span></td>
                  <td className={cx(tdCls, 'text-center')}>
                    <Button variant="secondary" size="sm" onClick={() => setViewReturn(ret)}><Eye size={13} /> View Items</Button>
                  </td>
                  <td className={cx(tdCls, 'text-right font-semibold text-red-600 dark:text-red-400')}>- {money(ret.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </Page>
  );
}
