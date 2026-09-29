import React, { useState, useEffect } from 'react';
import { ClipboardList, ArrowDownToLine, ArrowUpFromLine, Wallet } from 'lucide-react';
import { Page, Card, StatCard, Badge, Tabs, SearchInput, EmptyRow, money, thCls, tdCls, trCls, cx } from './ui';

export default function StockHistory() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    fetch('http://localhost:5000/api/stock/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(err => console.error("Failed to fetch stock history"));
  }, []);

  const filteredHistory = history.filter(h =>
    (typeFilter === 'All' || h.type === typeFilter) && (
      (h.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (h.supplier || '').toLowerCase().includes(search.toLowerCase()) ||
      (h.notes || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const units = (type) => history.filter(h => h.type === type).reduce((a, h) => a + (Number(h.quantity) || 0), 0);
  const grnValue = history.filter(h => h.type === 'GRN').reduce((a, h) => a + (Number(h.quantity) || 0) * (Number(h.buy_rate) || 0), 0);

  return (
    <Page>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="Units Received (GRN)" sub={`${history.filter(h => h.type === 'GRN').length} entries`} value={units('GRN').toLocaleString()} icon={ArrowDownToLine} tone="green" bars={false} />
        <StatCard label="Units Returned (PRN)" sub={`${history.filter(h => h.type === 'PRN').length} entries`} value={units('PRN').toLocaleString()} icon={ArrowUpFromLine} tone="red" bars={false} />
        <StatCard label="Total Purchase Value" sub="GRN qty × buy rate" value={money(grnValue)} icon={Wallet} tone="purple" bars={false} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><ClipboardList size={17}/></span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Stock Audit History</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Log of all GRN (Stock In) and PRN (Stock Out) transactions</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <Tabs active={typeFilter} onChange={setTypeFilter} tabs={[
              { key: 'All', label: 'All', count: history.length },
              { key: 'GRN', label: 'GRN (In)', count: history.filter(h => h.type === 'GRN').length },
              { key: 'PRN', label: 'PRN (Out)', count: history.filter(h => h.type === 'PRN').length },
            ]} />
            <SearchInput value={search} onChange={setSearch} placeholder="Search item, supplier, or notes..." className="w-72" />
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className={thCls}>Date & Time</th>
              <th className={thCls}>Type</th>
              <th className={thCls}>Supplier</th>
              <th className={thCls}>Item Name</th>
              <th className={cx(thCls, 'text-center')}>Qty</th>
              <th className={cx(thCls, 'text-right')}>Buy Rate (LKR)</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <EmptyRow colSpan={6}>No stock transactions found.</EmptyRow>
            ) : (
              filteredHistory.map((log, idx) => (
                <tr key={idx} className={trCls}>
                  <td className={tdCls}>
                    {new Date(log.created_at).toLocaleDateString()}
                    <span className="block text-xs text-slate-400 dark:text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </td>
                  <td className={tdCls}>
                    {log.type === 'GRN' ? (
                      <Badge tone="green"><ArrowDownToLine size={12}/> GRN (In)</Badge>
                    ) : (
                      <Badge tone="red"><ArrowUpFromLine size={12}/> PRN (Out)</Badge>
                    )}
                  </td>
                  <td className={cx(tdCls, 'font-medium text-slate-900 dark:text-slate-200')}>{log.supplier || 'N/A'}</td>
                  <td className={tdCls}>
                    <p className="font-semibold text-slate-900 dark:text-white">{log.title}</p>
                    {log.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 italic">Note: {log.notes}</p>}
                  </td>
                  <td className={cx(tdCls, 'text-center font-semibold text-slate-900 dark:text-white')}>{log.quantity}</td>
                  <td className={cx(tdCls, 'text-right font-semibold text-slate-900 dark:text-white')}>
                    {Number(log.buy_rate).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </Page>
  );
}
