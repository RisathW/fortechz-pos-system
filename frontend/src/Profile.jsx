import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, LogOut, CalendarClock, Eye, EyeOff, Save, LogIn, Timer, UserPlus, RotateCcw, Check, Edit } from 'lucide-react';
import { Page, Card, CardHeader, StatCard, Badge, Button, Toast, Avatar, EmptyRow, inputCls, labelCls, thCls, tdCls, trCls, cx } from './ui';
import { PAGES, ROLE_DEFAULTS, parsePermissions } from './access';

const API = 'http://localhost:5000';
const fmtHours = (h) => { const m = Math.round((Number(h) || 0) * 60); return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`; };

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cx(inputCls, 'pr-10')} />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">{show ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
    </div>
  );
}

// ---------------- MY PROFILE ----------------
function MyProfile({ user, showToast }) {
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', address: '' });
  const [pass, setPass] = useState({ next: '', confirm: '' });

  const load = () => fetch(`${API}/api/users`).then(r => r.json()).then(list => {
    const me = Array.isArray(list) ? list.find(u => u.username === user.username) : null;
    if (me) { setRecord(me); setForm({ full_name: me.full_name || '', phone: me.phone || '', email: me.email || '', address: me.address || '' }); }
  }).catch(() => {});
  useEffect(() => { load(); }, []);

  const discard = () => { if (record) setForm({ full_name: record.full_name || '', phone: record.phone || '', email: record.email || '', address: record.address || '' }); setPass({ next: '', confirm: '' }); };

  const save = async () => {
    if (pass.next || pass.confirm) {
      if (pass.next !== pass.confirm) return showToast('Error: passwords do not match.');
      if (pass.next.length < 4) return showToast('Error: password must be at least 4 characters.');
    }
    // Keep manager-controlled fields (salary, shift, notes) exactly as they are.
    const res = await fetch(`${API}/api/users/${encodeURIComponent(user.username)}/profile`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...record, ...form, joined_date: record?.joined_date ? String(record.joined_date).slice(0, 10) : null }),
    });
    if (!res.ok) return showToast('Error saving profile.');
    if (pass.next) {
      const pr = await fetch(`${API}/api/users/${encodeURIComponent(user.username)}/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword: pass.next }) });
      if (!pr.ok) return showToast('Error updating password.');
      setPass({ next: '', confirm: '' });
    }
    showToast(pass.next ? 'Profile and password saved!' : 'Profile saved!');
    load();
  };

  const f = (key, label, span = '') => (
    <div className={span}>
      <label className={labelCls}>{label}</label>
      <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className={inputCls} />
    </div>
  );

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={user.username} size="w-14 h-14 text-lg" />
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{form.full_name || user.username}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username} · <span className="text-blue-600 dark:text-blue-400">{user.role}</span></p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {f('full_name', 'Full Name')}
        {f('email', 'Email Address')}
        {f('phone', 'Phone Number')}
        {f('address', 'Address')}
        <div>
          <label className={labelCls}>New Password</label>
          <PasswordInput value={pass.next} onChange={v => setPass({ ...pass, next: v })} placeholder="Leave blank to keep current" />
        </div>
        <div>
          <label className={labelCls}>Confirm Password</label>
          <PasswordInput value={pass.confirm} onChange={v => setPass({ ...pass, confirm: v })} placeholder="Confirm new password" />
        </div>
      </div>
      {record && (record.shift_start || record.joined_date) && (
        <div className="flex flex-wrap gap-2 mt-5">
          {record.shift_start && <Badge tone="blue"><Timer size={11}/> Shift {record.shift_start} – {record.shift_end || '?'}</Badge>}
          {record.joined_date && <Badge tone="slate">Joined {new Date(record.joined_date).toLocaleDateString()}</Badge>}
        </div>
      )}
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="ghost" onClick={discard}>Discard Changes</Button>
        <Button onClick={save}><Save size={15}/> Save Changes</Button>
      </div>
    </Card>
  );
}

// ---------------- MY ATTENDANCE ----------------
function MyAttendance({ user, showToast, onAttendanceChange }) {
  const [status, setStatus] = useState({ clockedIn: false, record: null });
  const [logs, setLogs] = useState([]);
  const [, tick] = useState(0);

  const load = () => {
    fetch(`${API}/api/attendance/status?username=${encodeURIComponent(user.username)}`).then(r => r.json()).then(setStatus).catch(() => {});
    fetch(`${API}/api/attendance?username=${encodeURIComponent(user.username)}`).then(r => r.json()).then(d => Array.isArray(d) && setLogs(d)).catch(() => {});
  };
  useEffect(() => { load(); const t = setInterval(() => tick(x => x + 1), 30000); return () => clearInterval(t); }, []);

  const toggle = async () => {
    const res = await fetch(`${API}/api/attendance/${status.clockedIn ? 'clock-out' : 'clock-in'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(`Error: ${data.error || 'could not update attendance'}`);
    showToast(status.clockedIn ? 'Clocked out. Have a good rest!' : 'Clocked in. Have a great shift!');
    load(); onAttendanceChange?.();
  };

  const now = new Date();
  const monthLogs = logs.filter(l => { const d = new Date(l.clock_in); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const monthHours = monthLogs.reduce((a, l) => a + Number(l.hours || 0), 0);
  const running = status.clockedIn && status.record ? (Date.now() - new Date(status.record.clock_in).getTime()) / 3600000 : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Current Status</p>
            <Badge tone={status.clockedIn ? 'green' : 'slate'}>{status.clockedIn ? 'On shift' : 'Off shift'}</Badge>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{status.clockedIn ? fmtHours(running) : '—'}</p>
          <Button variant={status.clockedIn ? 'danger' : 'success'} className="mt-4" onClick={toggle}>
            {status.clockedIn ? <><LogOut size={15}/> Clock Out</> : <><LogIn size={15}/> Clock In</>}
          </Button>
        </Card>
        <StatCard label="Hours This Month" sub={`${monthLogs.length} shifts`} value={fmtHours(monthHours)} icon={Timer} bars={false} />
        <StatCard label="Average Shift" sub="This month" value={fmtHours(monthLogs.length ? monthHours / monthLogs.length : 0)} icon={CalendarClock} tone="purple" bars={false} />
      </div>
      <Card className="overflow-hidden">
        <CardHeader title="My Shift Logs" subtitle="Your last clock-ins and clock-outs" />
        <table className="w-full text-left">
          <thead><tr><th className={thCls}>Date</th><th className={thCls}>Clock In</th><th className={thCls}>Clock Out</th><th className={thCls}>Hours</th><th className={thCls}>Status</th></tr></thead>
          <tbody>
            {logs.length === 0 && <EmptyRow colSpan={5}>No shifts recorded yet. Clock in to start tracking.</EmptyRow>}
            {logs.slice(0, 60).map(l => (
              <tr key={l.id} className={trCls}>
                <td className={tdCls}>{new Date(l.clock_in).toLocaleDateString()}</td>
                <td className={tdCls}>{new Date(l.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td className={tdCls}>{l.clock_out ? new Date(l.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td className={cx(tdCls, 'font-semibold text-slate-900 dark:text-white')}>{fmtHours(l.hours)}</td>
                <td className={tdCls}><Badge tone={l.clock_out ? 'green' : 'blue'}>{l.clock_out ? 'Completed' : 'Active'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ---------------- MANAGE ACCESS (MANAGERS) ----------------
function ManageAccess({ user, showToast }) {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', full_name: '', email: '', role: 'Cashier', password: '' });
  const [editing, setEditing] = useState(null); // username
  const [draft, setDraft] = useState([]);

  const load = () => fetch(`${API}/api/users`).then(r => r.json()).then(d => Array.isArray(d) && setUsers(d)).catch(() => {});
  useEffect(() => { load(); }, []);

  const effective = (u) => parsePermissions(u.permissions) || ROLE_DEFAULTS[u.role] || ROLE_DEFAULTS.Cashier;

  const addUser = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newUser, created_by: user.username }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(`Error: ${data.error || 'could not add user'}`);
    showToast(`${newUser.username} added as ${newUser.role}!`);
    setNewUser({ username: '', full_name: '', email: '', role: 'Cashier', password: '' });
    load();
  };

  const savePermissions = async (username, perms) => {
    const res = await fetch(`${API}/api/users/${encodeURIComponent(username)}/permissions`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permissions: perms }) });
    if (!res.ok) return showToast('Error saving access.');
    showToast(`Access updated for ${username}. It applies at their next login.`);
    setEditing(null); load();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-start">
      <Card className="xl:col-span-2 p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><UserPlus size={16} className="text-blue-500"/> Add New User</h3>
        <form onSubmit={addUser} className="space-y-4">
          <div><label className={labelCls}>Username *</label><input required value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value.trim() })} className={inputCls} placeholder="Login name" /></div>
          <div><label className={labelCls}>Full Name</label><input value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} className={inputCls} placeholder="Enter full name" /></div>
          <div><label className={labelCls}>Email Address</label><input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className={inputCls} placeholder="Enter email address" /></div>
          <div><label className={labelCls}>Role</label>
            <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className={inputCls}><option>Cashier</option><option>Manager</option></select>
          </div>
          <div><label className={labelCls}>Password *</label><PasswordInput value={newUser.password} onChange={v => setNewUser({ ...newUser, password: v })} placeholder="Set a password" /></div>
          <Button type="submit" className="w-full">Add User</Button>
          <p className="text-[11px] text-slate-500">Accounts created here are approved immediately.</p>
        </form>
      </Card>

      <Card className="xl:col-span-3 p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">User Access & Permissions</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Choose which pages each person can open. Changes apply at their next login.</p>
        <div className="space-y-3">
          {users.map(u => {
            const isMaster = u.username === 'admin';
            const perms = editing === u.username ? draft : effective(u);
            const custom = !!parsePermissions(u.permissions);
            return (
              <div key={u.username} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={u.username} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{u.full_name || u.username} <span className="text-xs font-normal text-slate-400">@{u.username}</span></p>
                    <div className="flex gap-1.5 mt-0.5">
                      <Badge tone={u.role === 'Manager' ? 'purple' : 'blue'}>{u.role}</Badge>
                      {custom && <Badge tone="amber">Custom access</Badge>}
                      {!u.is_approved && <Badge tone="red">Pending approval</Badge>}
                    </div>
                  </div>
                  {!isMaster && (editing === u.username ? (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                      <Button size="sm" variant="secondary" onClick={() => savePermissions(u.username, null)}><RotateCcw size={12}/> Role default</Button>
                      <Button size="sm" onClick={() => savePermissions(u.username, draft)}><Check size={13}/> Save</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => { setEditing(u.username); setDraft(effective(u)); }}><Edit size={12}/> Edit access</Button>
                  ))}
                  {isMaster && <Badge tone="green">Full access (master admin)</Badge>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PAGES.map(p => {
                    const on = perms.includes(p.key);
                    const editable = editing === u.username;
                    return (
                      <button key={p.key} disabled={!editable}
                        onClick={() => setDraft(on ? draft.filter(k => k !== p.key) : [...draft, p.key])}
                        className={cx('px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors',
                          on ? 'bg-blue-600/10 border-blue-600/40 text-blue-600 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-400 line-through',
                          editable ? 'cursor-pointer hover:border-blue-500' : 'cursor-default')}>
                        {on ? '✓ ' : ''}{p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default function Profile({ user, onLogout, onAttendanceChange, initialTab = 'profile' }) {
  const [tab, setTab] = useState(initialTab);
  const [toast, setToast] = useState('');
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3500); };
  const isManager = user.role === 'Manager';

  const items = [
    ['profile', 'My Profile', User],
    ['attendance', 'My Attendance', CalendarClock],
    ...(isManager ? [['access', 'Manage Access', ShieldCheck]] : []),
  ];

  return (
    <Page>
      <Toast message={toast} />
      <div className="flex gap-6 items-start">
        <Card className="w-56 shrink-0 p-2">
          {items.map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k)} className={cx('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors',
              tab === k ? 'bg-blue-600/10 text-blue-600 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}>
              <Icon size={16}/> {label}
            </button>
          ))}
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors">
            <LogOut size={16}/> Logout
          </button>
        </Card>
        <div className="flex-1 min-w-0">
          {tab === 'profile' && <MyProfile user={user} showToast={showToast} />}
          {tab === 'attendance' && <MyAttendance user={user} showToast={showToast} onAttendanceChange={onAttendanceChange} />}
          {tab === 'access' && isManager && <ManageAccess user={user} showToast={showToast} />}
        </div>
      </div>
    </Page>
  );
}
