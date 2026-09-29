import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { RefreshCw } from 'lucide-react';
import SalesReport from './SalesReport';
import { Page, Card, CardHeader, Tabs, Button, Badge, Avatar, EmptyRow, money, inputCls, thCls, tdCls, trCls, cx } from './ui';

const API = 'http://localhost:5000';
const COLORS = ['#1d5ff5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth(), 1)); };
const fmtHours = (h) => { const m = Math.round((Number(h) || 0) * 60); return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`; };

function RangePicker({ start, end, setStart, setEnd, onRefresh }) {
  return (
    <div className="flex items-center gap-2">
      <input type="date" value={start} onChange={e => setStart(e.target.value)} className={cx(inputCls, 'w-40 py-1.5')} />
      <span className="text-xs text-slate-400">to</span>
      <input type="date" value={end} onChange={e => setEnd(e.target.value)} className={cx(inputCls, 'w-40 py-1.5')} />
      <Button size="sm" onClick={onRefresh}><RefreshCw size={13}/> Generate Report</Button>
    </div>
  );
}

function Donut({ title, total, totalLabel, data, format = (v) => v }) {
  const sum = data.reduce((a, d) => a + d.value, 0);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      <div className="relative" style={{ height: 200 }}>
        <ResponsiveContainer width="99%" height="100%">
          <PieChart>
            <Pie data={sum ? data : [{ name: 'None', value: 1 }]} dataKey="value" innerRadius="62%" outerRadius="85%" paddingAngle={sum ? 3 : 0} stroke="none">
              {(sum ? data : [{}]).map((_, i) => <Cell key={i} fill={sum ? COLORS[i % COLORS.length] : '#26284855'} />)}
            </Pie>
            {sum > 0 && <Tooltip formatter={(v, n) => [format(v), n]} contentStyle={{ background: '#13142b', border: '1px solid #262848', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: '#fff' }} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[11px] text-slate-500">{totalLabel}</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{total}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
        {data.map((d, i) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 truncate">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />{d.name} <b className="text-slate-900 dark:text-white">{format(d.value)}</b>
          </span>
        ))}
      </div>
    </Card>
  );
}

function Trend({ title, data, lines }) {
  return (
    <Card className="p-5 xl:col-span-2">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{title}</h3>
      <div style={{ height: 250 }}>
        <ResponsiveContainer width="99%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#6b6e93" strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9497b8' }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9497b8' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#13142b', border: '1px solid #262848', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#fff' }} />
            {lines.map((l, i) => <Line key={l} type="monotone" dataKey={l} stroke={COLORS[i]} strokeWidth={2.5} dot={false} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const daysBetween = (start, end) => {
  const out = []; const d = new Date(start + 'T00:00:00'); const e = new Date(end + 'T00:00:00');
  while (d <= e && out.length < 400) { out.push(iso(d)); d.setDate(d.getDate() + 1); }
  return out;
};

// ---------------- PRE-ORDER REPORT ----------------
function PreOrderReport() {
  const [start, setStart] = useState(monthStart());
  const [end, setEnd] = useState(iso(new Date()));
  const [all, setAll] = useState([]);
  const load = () => fetch(`${API}/api/reservations`).then(r => r.json()).then(d => Array.isArray(d) && setAll(d)).catch(() => {});
  useEffect(() => { load(); }, []);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const rows = all.filter(r => { const d = iso(new Date(r.created_at)); return d >= start && d <= end; });
  const status = (r) => r.status === 'Picked Up' ? 'Picked Up' : new Date(r.pickup_date) < today ? 'Overdue' : 'Pending';
  const counts = ['Pending', 'Picked Up', 'Overdue'].map(n => ({ name: n, value: rows.filter(r => status(r) === n).length }));

  const trend = useMemo(() => daysBetween(start, end).map(day => ({
    label: new Date(day).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    Created: rows.filter(r => iso(new Date(r.created_at)) === day).length,
    Pickups: rows.filter(r => iso(new Date(r.pickup_date)) === day).length,
  })), [rows, start, end]);

  return (
    <>
      <div className="flex justify-end"><RangePicker start={start} end={end} setStart={setStart} setEnd={setEnd} onRefresh={load} /></div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Donut title="Total Pre-Orders" total={rows.length} totalLabel="Total" data={counts} />
        <Trend title="Pre-Order Demand" data={trend} lines={['Created', 'Pickups']} />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          ['Order Value', money(rows.reduce((a, r) => a + Number(r.total_amount || 0), 0))],
          ['Advances Collected', money(rows.reduce((a, r) => a + Number(r.advance_paid || 0), 0))],
          ['Balance Outstanding', money(rows.filter(r => r.status !== 'Picked Up').reduce((a, r) => a + Number(r.total_amount) - Number(r.advance_paid), 0))],
          ['Pickup Rate', `${rows.length ? Math.round((counts[1].value / rows.length) * 100) : 0}%`],
        ].map(([l, v]) => <Card key={l} className="p-5"><p className="text-xs text-slate-500 dark:text-slate-400">{l}</p><p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{v}</p></Card>)}
      </div>
      <Card className="overflow-hidden">
        <CardHeader title="Detailed Pre-Order Logs" subtitle={`${rows.length} pre-orders created between ${start} and ${end}`} />
        <table className="w-full text-left">
          <thead><tr>
            <th className={thCls}>Reference</th><th className={thCls}>Customer</th><th className={thCls}>Phone</th><th className={thCls}>Created</th><th className={thCls}>Pickup</th><th className={thCls}>Status</th><th className={cx(thCls, 'text-right')}>Total</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={7}>No pre-orders in this period.</EmptyRow>}
            {rows.map(r => (
              <tr key={r.id} className={trCls}>
                <td className={cx(tdCls, 'font-mono text-xs')}>{r.ref_number}</td>
                <td className={tdCls}><span className="flex items-center gap-2"><Avatar name={r.customer_name} size="w-7 h-7" /><span className="font-semibold text-slate-900 dark:text-white">{r.customer_name}</span></span></td>
                <td className={tdCls}>{r.phone}</td>
                <td className={tdCls}>{new Date(r.created_at).toLocaleDateString()}</td>
                <td className={tdCls}>{new Date(r.pickup_date).toLocaleDateString()}</td>
                <td className={tdCls}><Badge tone={status(r) === 'Picked Up' ? 'green' : status(r) === 'Overdue' ? 'red' : 'amber'}>{status(r)}</Badge></td>
                <td className={cx(tdCls, 'text-right font-semibold text-blue-600 dark:text-blue-400')}>{money(r.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// ---------------- STAFF REPORT ----------------
function StaffReport() {
  const [start, setStart] = useState(monthStart());
  const [end, setEnd] = useState(iso(new Date()));
  const [data, setData] = useState({ staff: [], daily: [] });
  const [logs, setLogs] = useState([]);
  const load = () => {
    fetch(`${API}/api/reports/staff?start=${start}&end=${end}`).then(r => r.json()).then(d => d && !d.error && setData(d)).catch(() => {});
    fetch(`${API}/api/attendance?start=${start}&end=${end}`).then(r => r.json()).then(d => Array.isArray(d) && setLogs(d)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const staff = [...data.staff].sort((a, b) => b.revenue - a.revenue);
  const revenueShare = staff.filter(s => s.revenue > 0).map(s => ({ name: s.username, value: Math.round(s.revenue) }));
  const trend = daysBetween(start, end).map(day => ({
    label: new Date(day).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    'Staff on duty': Number(data.daily.find(d => iso(new Date(d.day)) === day)?.staff || 0),
  }));
  const totalRevenue = staff.reduce((a, s) => a + s.revenue, 0);

  return (
    <>
      <div className="flex justify-end"><RangePicker start={start} end={end} setStart={setStart} setEnd={setEnd} onRefresh={load} /></div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Donut title="Sales by Staff" total={money(totalRevenue)} totalLabel="Revenue" data={revenueShare} format={(v) => money(v)} />
        <Trend title="Staff Attendance Trends" data={trend} lines={['Staff on duty']} />
      </div>
      <Card className="overflow-hidden">
        <CardHeader title="Staff Performance" subtitle={`Sales, refunds and hours between ${start} and ${end}`} />
        <table className="w-full text-left">
          <thead><tr>
            <th className={thCls}>Staff</th><th className={thCls}>Role</th><th className={cx(thCls, 'text-center')}>Invoices</th><th className={cx(thCls, 'text-right')}>Revenue</th><th className={cx(thCls, 'text-right')}>Avg. Sale</th><th className={cx(thCls, 'text-right')}>Refunded</th><th className={cx(thCls, 'text-center')}>Shifts</th><th className={cx(thCls, 'text-right')}>Hours</th>
          </tr></thead>
          <tbody>
            {staff.length === 0 && <EmptyRow colSpan={8}>No staff data.</EmptyRow>}
            {staff.map(s => (
              <tr key={s.username} className={trCls}>
                <td className={tdCls}><span className="flex items-center gap-2"><Avatar name={s.username} size="w-7 h-7" /><span><span className="block font-semibold text-slate-900 dark:text-white">{s.full_name || s.username}</span>{s.full_name && <span className="block text-[11px] text-slate-400">@{s.username}</span>}</span></span></td>
                <td className={tdCls}><Badge tone={s.role === 'Manager' ? 'purple' : 'blue'}>{s.role}</Badge></td>
                <td className={cx(tdCls, 'text-center')}>{s.invoices}</td>
                <td className={cx(tdCls, 'text-right font-semibold text-slate-900 dark:text-white')}>{money(s.revenue)}</td>
                <td className={cx(tdCls, 'text-right')}>{money(s.invoices ? s.revenue / s.invoices : 0)}</td>
                <td className={cx(tdCls, 'text-right text-red-500')}>{s.refunded ? `- ${money(s.refunded)}` : '—'}</td>
                <td className={cx(tdCls, 'text-center')}>{s.shifts}</td>
                <td className={cx(tdCls, 'text-right')}>{fmtHours(s.hours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader title="Staff Shift Logs" subtitle="Clock-in and clock-out records" />
        <table className="w-full text-left">
          <thead><tr><th className={thCls}>Staff</th><th className={thCls}>Date</th><th className={thCls}>Clock In</th><th className={thCls}>Clock Out</th><th className={thCls}>Hours</th><th className={thCls}>Status</th></tr></thead>
          <tbody>
            {logs.length === 0 && <EmptyRow colSpan={6}>No shifts logged in this period. Staff can clock in from the top bar.</EmptyRow>}
            {logs.map(l => (
              <tr key={l.id} className={trCls}>
                <td className={tdCls}><span className="flex items-center gap-2"><Avatar name={l.username} size="w-7 h-7" />{l.username}</span></td>
                <td className={tdCls}>{new Date(l.clock_in).toLocaleDateString()}</td>
                <td className={tdCls}>{new Date(l.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td className={tdCls}>{l.clock_out ? new Date(l.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td className={cx(tdCls, 'font-semibold text-slate-900 dark:text-white')}>{fmtHours(l.hours)}</td>
                <td className={tdCls}><Badge tone={l.clock_out ? 'green' : 'blue'}>{l.clock_out ? 'Completed' : 'On shift'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export default function Reports() {
  const [tab, setTab] = useState('revenue');
  const tabs = <Tabs active={tab} onChange={setTab} tabs={[{ key: 'revenue', label: 'Revenue Report' }, { key: 'preorders', label: 'Pre-Order Report' }, { key: 'staff', label: 'Staff Report' }]} />;

  if (tab === 'revenue') {
    return (
      <div className="h-full flex flex-col print:block">
        <div className="px-6 pt-6 print:hidden">{tabs}</div>
        <div className="flex-1 min-h-0"><SalesReport /></div>
      </div>
    );
  }
  return (
    <Page>
      {tabs}
      {tab === 'preorders' ? <PreOrderReport /> : <StaffReport />}
    </Page>
  );
}
