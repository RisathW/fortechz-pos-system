import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, UserPlus, RotateCcw, PackageCheck, CheckCheck, X, RefreshCw } from 'lucide-react';
import { Page, Card, Tabs, Button, IconButton, Badge, cx } from './ui';
import { canAccess } from './access';

const API = 'http://localhost:5000';
const READ_KEY = 'fz_read_notifications';
const DISMISS_KEY = 'fz_dismissed_notifications';

const readSet = (key) => { try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); } };
const saveSet = (key, set) => { try { localStorage.setItem(key, JSON.stringify([...set].slice(-500))); } catch { /* storage unavailable */ } };

export const markNotificationsRead = (ids) => { const s = readSet(READ_KEY); ids.forEach(i => s.add(i)); saveSet(READ_KEY, s); };
export const isNotificationRead = (id) => readSet(READ_KEY).has(id);

const get = (url) => fetch(`${API}${url}`).then(r => r.json()).then(d => (Array.isArray(d) ? d : [])).catch(() => []);

// Builds the alert + activity feed from live data, filtered to what this user can open.
export async function loadNotifications(user) {
  const [books, reservations, users, returns, stock] = await Promise.all([
    get('/api/books'), get('/api/reservations'),
    user?.role === 'Manager' ? get('/api/users') : Promise.resolve([]),
    canAccess(user, 'returns') ? get('/api/returns/history') : Promise.resolve([]),
    canAccess(user, 'history') ? get('/api/stock/history') : Promise.resolve([]),
  ]);
  const list = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const now = new Date().toISOString();

  users.filter(u => !u.is_approved).forEach(u => list.push({
    id: `approve-${u.username}`, kind: 'alert', type: 'staff', tab: 'users', time: u.last_login || now,
    title: `New staff sign-up: ${u.username}`, detail: 'Waiting for a manager to approve this account',
  }));

  reservations.filter(r => r.status === 'Pending Pickup' && new Date(r.pickup_date) < today).forEach(r => list.push({
    id: `overdue-${r.id}`, kind: 'alert', type: 'overdue', tab: 'reservations', time: r.pickup_date,
    title: `Overdue pre-order: ${r.customer_name}`, detail: `${r.ref_number} · pickup was ${new Date(r.pickup_date).toLocaleDateString()} · ${r.phone}`,
  }));

  books.filter(b => Number(b.available_qty) <= 5).sort((a, b) => a.available_qty - b.available_qty).forEach(b => list.push({
    id: `stock-${b.id}-${b.available_qty}`, kind: 'alert', type: Number(b.available_qty) <= 0 ? 'out' : 'low', tab: 'inventory', time: now,
    title: Number(b.available_qty) <= 0 ? `Out of stock: ${b.title}` : `Low inventory: ${b.title}`,
    detail: Number(b.available_qty) <= 0 ? 'Reorder through Stock Control (GRN)' : `Only ${b.available_qty} left in stock`,
  }));

  returns.slice(0, 15).forEach(r => list.push({
    id: `return-${r.id}`, kind: 'activity', type: 'return', tab: 'returns', time: r.created_at,
    title: `Refund issued on ${r.invoice_number}`, detail: `LKR ${Number(r.amount).toFixed(2)} refunded by ${r.created_by}`,
  }));

  const grns = {};
  stock.filter(s => s.type === 'GRN').forEach(s => { (grns[s.id] = grns[s.id] || { ...s, lines: 0, units: 0 }); grns[s.id].lines++; grns[s.id].units += Number(s.quantity) || 0; });
  Object.values(grns).slice(0, 15).forEach(g => list.push({
    id: `grn-${g.id}`, kind: 'activity', type: 'restock', tab: 'history', time: g.created_at,
    title: 'Inventory restocked successfully', detail: `${g.units} units across ${g.lines} items from ${g.supplier || 'supplier'}`,
  }));

  const dismissed = readSet(DISMISS_KEY);
  const t = (n) => new Date(n.time).getTime() || 0;
  const alerts = list.filter(n => n.kind === 'alert');
  const activity = list.filter(n => n.kind === 'activity').sort((x, y) => t(y) - t(x));
  return [...alerts, ...activity].filter(n => canAccess(user, n.tab) && !dismissed.has(n.id));
}

const ICONS = {
  staff: [UserPlus, 'bg-violet-500/15 text-violet-500'],
  overdue: [Clock, 'bg-amber-500/15 text-amber-500'],
  out: [AlertTriangle, 'bg-red-500/15 text-red-500'],
  low: [AlertTriangle, 'bg-blue-500/15 text-blue-500'],
  return: [RotateCcw, 'bg-rose-500/15 text-rose-500'],
  restock: [PackageCheck, 'bg-emerald-500/15 text-emerald-500'],
};

export function NotificationIcon({ type }) {
  const [Icon, cls] = ICONS[type] || [Bell, 'bg-slate-500/15 text-slate-500'];
  return <span className={cx('w-9 h-9 rounded-full flex items-center justify-center shrink-0', cls)}><Icon size={16}/></span>;
}

const timeAgo = (t) => {
  const d = new Date(t); const diff = (Date.now() - d.getTime()) / 1000;
  if (isNaN(diff) || diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return d.toLocaleDateString();
};

export default function Notifications({ user, onNavigate, onChange }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [, force] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); loadNotifications(user).then(l => { setItems(l); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const read = readSet(READ_KEY);
  const unread = items.filter(i => !read.has(i.id));
  const shown = items.filter(i => filter === 'All' || (filter === 'Unread' ? !read.has(i.id) : filter === 'Alerts' ? i.kind === 'alert' : i.kind === 'activity'));

  const markAll = () => { markNotificationsRead(items.map(i => i.id)); force(x => x + 1); onChange?.(); };
  const dismiss = (id) => { const s = readSet(DISMISS_KEY); s.add(id); saveSet(DISMISS_KEY, s); setItems(items.filter(i => i.id !== id)); onChange?.(); };
  const open = (n) => { markNotificationsRead([n.id]); onChange?.(); onNavigate(n.tab); };

  return (
    <Page>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
          <Tabs active={filter} onChange={setFilter} tabs={[
            { key: 'All', label: 'All', count: items.length },
            { key: 'Unread', label: 'Unread', count: unread.length },
            { key: 'Alerts', label: 'Alerts', count: items.filter(i => i.kind === 'alert').length },
            { key: 'Activity', label: 'Activity', count: items.filter(i => i.kind === 'activity').length },
          ]} />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={load}><RefreshCw size={13} className={cx(loading && 'animate-spin')}/> Refresh</Button>
            <Button variant="secondary" size="sm" onClick={markAll} disabled={!unread.length}><CheckCheck size={14}/> Mark all as read</Button>
          </div>
        </div>
        <div>
          {shown.length === 0 && <p className="px-5 py-16 text-center text-sm text-slate-500">{loading ? 'Loading notifications...' : "You're all caught up."}</p>}
          {shown.map(n => {
            const isRead = read.has(n.id);
            return (
              <div key={n.id} className={cx('flex items-center gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors', !isRead && 'bg-blue-600/[0.04]')}>
                <NotificationIcon type={n.type} />
                <button onClick={() => open(n)} className="flex-1 min-w-0 text-left">
                  <p className={cx('text-sm truncate', isRead ? 'text-slate-600 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-white')}>{n.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{n.detail}</p>
                </button>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(n.time)}</span>
                {!isRead ? <Badge tone="blue">New</Badge> : <Badge tone="slate">Read</Badge>}
                <IconButton onClick={() => dismiss(n.id)} title="Dismiss"><X size={15}/></IconButton>
              </div>
            );
          })}
        </div>
      </Card>
    </Page>
  );
}
