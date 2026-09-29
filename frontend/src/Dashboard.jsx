import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Wallet, Library, CalendarClock, BookOpen, ArrowRight, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Page, Card, CardHeader, StatCard, Badge, Tabs, Button, money, cx } from './ui';

const API = 'http://localhost:5000';

// "Split (Cash: 500, Card: 250)" -> { cash: 500, card: 250 }
const splitPayment = (sale) => {
  const total = Number(sale.total_amount) || 0;
  const type = sale.payment_type || '';
  if (type.startsWith('Split')) {
    const cash = parseFloat((type.match(/Cash:\s*([\d.]+)/) || [])[1]) || 0;
    const card = parseFloat((type.match(/Card:\s*([\d.]+)/) || [])[1]) || 0;
    const sum = cash + card || 1;
    // scale to net total so returns are reflected
    return { cash: (cash / sum) * total, card: (card / sum) * total };
  }
  return type === 'Card' ? { cash: 0, card: total } : { cash: total, card: 0 };
};

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const ChartTip = ({ active, payload, label }) => active && payload?.length ? (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg shadow-xl text-xs">
      <p className="font-semibold text-slate-900 dark:text-white mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color }}>{p.dataKey}: {money(p.value)}</p>)}
    </div>
  ) : null;

export default function Dashboard({ onNavigate }) {
  const [today, setToday] = useState({ summary: [], items: [] });
  const [month, setMonth] = useState({ summary: [], items: [] });
  const [sales, setSales] = useState([]);
  const [books, setBooks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [range, setRange] = useState('Daily');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const j = (url) => fetch(`${API}${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`).then(r => r.json()).catch(() => null);
    Promise.all([
      j('/api/reports/sales?period=today'),
      j('/api/reports/sales?period=month'),
      j('/api/sales/history'),
      j('/api/books'),
      j('/api/reservations'),
    ]).then(([t, m, s, b, r]) => {
      if (t && !t.error) setToday(t);
      if (m && !m.error) setMonth(m);
      if (Array.isArray(s)) setSales(s);
      if (Array.isArray(b)) setBooks(b);
      if (Array.isArray(r)) setReservations(r);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const sum = (rows) => (rows || []).reduce((a, r) => a + (parseFloat(r.total) || 0), 0);
  const todayRevenue = sum(today.summary);
  const monthRevenue = sum(month.summary);
  const monthProfit = monthRevenue - (Number(month.total_cogs) || 0);

  const lowStock = books.filter(b => Number(b.available_qty) <= 5);
  const totalUnits = books.reduce((a, b) => a + (Number(b.available_qty) || 0), 0);
  const pending = reservations.filter(r => r.status === 'Pending Pickup');
  const depositsHeld = pending.reduce((a, r) => a + (Number(r.advance_paid) || 0), 0);

  // Revenue by day for the last 7 days (sparkline on KPI cards)
  const last7 = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = dayKey(d);
      out.push(sales.filter(s => dayKey(new Date(s.created_at)) === k).reduce((a, s) => a + Number(s.total_amount || 0), 0));
    }
    return out;
  }, [sales]);

  const chartData = useMemo(() => {
    const buckets = [];
    const now = new Date();
    if (range === 'Daily') {
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        const end = new Date(d); end.setDate(end.getDate() + 1);
        buckets.push({ label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), start: d, end });
      }
    } else if (range === 'Weekly') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay() - i * 7);
        const end = new Date(d); end.setDate(end.getDate() + 7);
        buckets.push({ label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), start: d, end });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        buckets.push({ label: d.toLocaleDateString(undefined, { month: 'short' }), start: d, end });
      }
    }
    return buckets.map(b => {
      let cash = 0, card = 0;
      sales.forEach(s => {
        const t = new Date(s.created_at);
        if (t >= b.start && t < b.end) { const p = splitPayment(s); cash += p.cash; card += p.card; }
      });
      return { label: b.label, Cash: Math.round(cash), Card: Math.round(card) };
    });
  }, [sales, range]);

  const topItems = (month.items || []).filter(i => i.title?.trim()).slice(0, 4);
  const recent = sales.slice(0, 4);


  return (
    <Page>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Daily Sales" sub={new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} value={money(todayRevenue)} icon={TrendingUp} bars={last7} />
        <StatCard label="Monthly Revenue" sub={`Profit ${money(monthProfit)}`} value={money(monthRevenue)} icon={Wallet} bars={chartData.map(d => d.Cash + d.Card).slice(-7)} />
        <StatCard label="Books & Items in Stock" sub={`${books.length} titles · ${lowStock.length} running low`} value={totalUnits.toLocaleString()} icon={Library} barTone={lowStock.length ? 'amber' : 'green'} bars={[6, 7, 5, 8, 6, 7, 8]} />
        <StatCard label="Active Pre-Orders" sub={`${money(depositsHeld)} deposits held`} value={pending.length} icon={CalendarClock} tone="purple" barTone="blue" bars={[2, 4, 3, 5, 4, 6, 5]} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Top Selling Books (This Month)">
            <button onClick={() => onNavigate('reports')} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">View report <ArrowRight size={13}/></button>
          </CardHeader>
          <div className="px-5 pb-5 space-y-2.5">
            {topItems.length === 0 && <p className="text-sm text-slate-500 py-6 text-center">No sales recorded this month yet.</p>}
            {topItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                <span className="w-10 h-12 rounded-md bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white shrink-0"><BookOpen size={16}/></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.qty_sold} sold</p>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{money(item.item_revenue)}</p>
                <Badge tone={i === 0 ? 'green' : 'blue'}>#{i + 1}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Transactions">
            <button onClick={() => onNavigate('sales_history')} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">View all <ArrowRight size={13}/></button>
          </CardHeader>
          <div className="px-5 pb-5 space-y-2.5">
            {recent.length === 0 && <p className="text-sm text-slate-500 py-6 text-center">No transactions yet.</p>}
            {recent.map(s => {
              const refunded = Number(s.refunded_amount) > 0;
              const itemCount = (s.items || []).reduce((a, it) => a + (Number(it?.qty) || 0), 0);
              return (
                <div key={s.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                  <span className="w-10 h-12 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 text-[10px] font-bold">{itemCount}x</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono truncate">{s.invoice_number}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{s.created_by} · {new Date(s.created_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{money(s.total_amount)}</p>
                  <Badge tone={refunded ? 'red' : 'green'}>{refunded ? 'Returned' : (s.payment_type || '').startsWith('Split') ? 'Split' : s.payment_type}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <Tabs tabs={['Daily', 'Weekly', 'Monthly']} active={range} onChange={setRange} />
          <Button variant="secondary" size="sm" onClick={load}><RefreshCw size={13} className={cx(loading && 'animate-spin')}/> Refresh</Button>
        </div>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="99%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#6b6e93" strokeOpacity={0.15} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9497b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9497b8' }} tickLine={false} axisLine={false} width={70} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#9497b8', paddingTop: 8 }} />
              <Line type="monotone" dataKey="Cash" stroke="#1d5ff5" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="Card" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </Page>
  );
}
