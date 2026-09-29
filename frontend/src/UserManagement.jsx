import React, { useState, useEffect } from 'react';
import { Trash2, Key, Edit, CheckCircle, Clock, ShieldAlert, Shield, Users, UserPlus, Save, Eye, FilePen, Mail, Phone, MapPin, Wallet, Timer, CalendarDays } from 'lucide-react';
import { Page, Card, StatCard, Badge, Tabs, SearchInput, Modal, ConfirmModal, Toast, Avatar, IconButton, Button, EmptyRow, Drawer, money, inputCls, labelCls, thCls, tdCls, trCls, cx } from './ui';

export default function UserManagement({ user, username }) {
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState('');

  // ==========================================
  // 🛡️ BULLETPROOF USER DETECTION
  // ==========================================
  const getActiveUsername = () => {
    if (typeof user === 'string') return user;
    if (user?.username) return user.username;
    if (typeof username === 'string') return username;
    try {
      const local = localStorage.getItem('user');
      if (local && local.startsWith('{')) return JSON.parse(local).username;
      return local || '';
    } catch (e) { return ''; }
  };

  const activeUsername = getActiveUsername();
  
  // Find the logged-in user's true role from the database
  const activeUserRecord = users.find(u => u.username === activeUsername) || {};
  const isManager = activeUserRecord.role === 'Manager' || (typeof user === 'object' && user?.role === 'Manager');

  // Modal States
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editUser, setEditUser] = useState(null); 
  const [newUsernameInput, setNewUsernameInput] = useState('');
  
  const [passUser, setPassUser] = useState(null); 
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const [roleUser, setRoleUser] = useState(null); // Used for Promotion/Demotion

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchUsers = () => {
    fetch('http://localhost:5000/api/users')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setUsers(data); });
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- 1. APPROVE ACCOUNT (MANAGERS ONLY) ---
  const handleApprove = async (targetUsername) => {
    const res = await fetch('http://localhost:5000/api/users/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: targetUsername })
    });
    if (res.ok) {
      showToast(`${targetUsername} has been approved!`);
      fetchUsers(); 
    }
  };

  // --- 2. CHANGE USERNAME ---
  const executeUsernameChange = async () => {
    if (!newUsernameInput.trim()) return showToast("Username cannot be empty");
    
    const res = await fetch(`http://localhost:5000/api/users/${editUser}/username`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newUsername: newUsernameInput })
    });
    
    if (res.ok) {
      if (editUser === activeUsername) {
        showToast('Your username was changed! Logging out for security...');
        setTimeout(() => {
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          window.location.reload();
        }, 2000);
      } else {
        showToast('Username updated successfully!');
        setEditUser(null); setNewUsernameInput(''); fetchUsers();
      }
    } else {
      const data = await res.json();
      showToast('Error: ' + data.error);
    }
  };

  // --- 3. CHANGE PASSWORD ---
  const executePasswordChange = async () => {
    if (!newPasswordInput.trim()) return showToast("Password cannot be empty");

    const res = await fetch(`http://localhost:5000/api/users/${passUser}/password`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: newPasswordInput })
    });
    
    if (res.ok) {
      if (passUser === activeUsername) {
        showToast('Your password was changed! Logging out for security...');
        setTimeout(() => {
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          window.location.reload();
        }, 2000);
      } else {
        showToast(`Password for ${passUser} updated successfully!`);
        setPassUser(null); setNewPasswordInput('');
      }
    } else {
      showToast('Error updating password.');
    }
  };

  // --- 4. DELETE USER (MANAGERS ONLY) ---
  const executeDeleteUser = async () => {
    if (deleteConfirm === 'admin') {
      setDeleteConfirm(null);
      return showToast('You cannot delete the master admin account!');
    }

    const res = await fetch(`http://localhost:5000/api/users/${deleteConfirm}`, { method: 'DELETE' });
    
    if (res.ok) {
      showToast('User successfully deleted!');
      setDeleteConfirm(null); fetchUsers();
    } else {
      const data = await res.json();
      showToast('Error: ' + data.error);
    }
  };

  // --- 5. CHANGE ROLE / PROMOTE (MANAGERS ONLY) ---
  const executeRoleChange = async () => {
    const newRole = roleUser.role === 'Manager' ? 'Cashier' : 'Manager';
    
    const res = await fetch(`http://localhost:5000/api/users/${roleUser.username}/role`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newRole })
    });
    
    if (res.ok) {
      if (roleUser.username === activeUsername && newRole === 'Cashier') {
        showToast('You demoted yourself! Logging out for security...');
        setTimeout(() => {
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          window.location.reload();
        }, 2000);
      } else {
        showToast(`${roleUser.username} is now a ${newRole}!`);
        setRoleUser(null); 
        fetchUsers();
      }
    } else {
      const data = await res.json();
      showToast('Error: ' + data.error);
    }
  };

  // --- 6. FORMAT DATE HELPER ---
  const formatLastLogin = (dateString) => {
    if (!dateString) return <span className="text-slate-400 dark:text-slate-500 italic">Never</span>;
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // --- ROLE BASED FILTERING ---
  const displayUsers = users.filter(u => isManager || u.username === activeUsername);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState('staff');
  const [staffDrawer, setStaffDrawer] = useState(null); // { mode: 'add' | 'edit', data }
  const [detailUser, setDetailUser] = useState(null);

  const EMPTY_STAFF = { username: '', password: '', role: 'Cashier', full_name: '', email: '', phone: '', salary: '', joined_date: '', shift_start: '', shift_end: '', address: '', notes: '' };

  const visibleUsers = displayUsers.filter(u => {
    const q = search.toLowerCase();
    if (q && ![u.username, u.full_name, u.email, u.phone].some(v => (v || '').toLowerCase().includes(q))) return false;
    if (filter === 'Manager' || filter === 'Cashier') return u.role === filter;
    if (filter === 'Pending') return !u.is_approved;
    return true;
  });

  const count = (fn) => displayUsers.filter(fn).length;
  const payroll = displayUsers.reduce((a, u) => a + (Number(u.salary) || 0), 0);

  const saveStaff = async () => {
    const { mode, data } = staffDrawer;
    if (mode === 'add') {
      if (!data.username || !data.password) return showToast('Error: username and password are required.');
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, salary: data.salary || null, created_by: activeUsername })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) return showToast('Error: ' + (out.error || 'could not add staff'));
      showToast(`${data.full_name || data.username} added to the team!`);
    } else {
      const res = await fetch(`http://localhost:5000/api/users/${encodeURIComponent(data.username)}/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, salary: data.salary || null })
      });
      if (!res.ok) return showToast('Error saving staff details.');
      showToast('Staff details updated!');
    }
    setStaffDrawer(null);
    fetchUsers();
  };

  const openEdit = (u) => setStaffDrawer({ mode: 'edit', data: {
    ...EMPTY_STAFF, ...Object.fromEntries(Object.entries(u).map(([k, v]) => [k, v ?? ''])),
    joined_date: u.joined_date ? String(u.joined_date).slice(0, 10) : '',
  } });

  const sf = (key, label, props = {}) => (
    <div className={props.span || ''}>
      <label className={labelCls}>{label}</label>
      {props.textarea
        ? <textarea rows={3} value={staffDrawer.data[key]} onChange={e => setStaffDrawer({ ...staffDrawer, data: { ...staffDrawer.data, [key]: e.target.value } })} className={inputCls} placeholder={props.placeholder} />
        : <input type={props.type || 'text'} value={staffDrawer.data[key]} onChange={e => setStaffDrawer({ ...staffDrawer, data: { ...staffDrawer.data, [key]: e.target.value } })} className={inputCls} placeholder={props.placeholder} />}
    </div>
  );

  return (
    <Page>
      <Toast message={toast} />

      {editUser && (
        <Modal title="Change Username" subtitle={`Current: ${editUser}`} icon={Edit} onClose={() => { setEditUser(null); setNewUsernameInput(''); }}
          footer={<>
            <Button variant="secondary" className="flex-1" onClick={() => { setEditUser(null); setNewUsernameInput(''); }}>Cancel</Button>
            <Button className="flex-1" onClick={executeUsernameChange}>Save</Button>
          </>}>
          <label className={labelCls}>New username</label>
          <input type="text" autoFocus value={newUsernameInput} onChange={e => setNewUsernameInput(e.target.value)} className={inputCls} placeholder="New Username"/>
        </Modal>
      )}

      {passUser && (
        <Modal title="Reset Password" subtitle={`For ${passUser}`} icon={Key} onClose={() => { setPassUser(null); setNewPasswordInput(''); }}
          footer={<>
            <Button variant="secondary" className="flex-1" onClick={() => { setPassUser(null); setNewPasswordInput(''); }}>Cancel</Button>
            <Button className="flex-1" onClick={executePasswordChange}>Save</Button>
          </>}>
          <label className={labelCls}>New password</label>
          <input type="text" autoFocus value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} className={inputCls} placeholder="New Password"/>
        </Modal>
      )}

      {roleUser && (
        <ConfirmModal title="Change Role" icon={Shield} tone="purple" confirmLabel="Confirm Change"
          message={<>Change <b className="text-slate-900 dark:text-white">{roleUser.username}</b> from <b className="text-slate-900 dark:text-white">{roleUser.role}</b> to <b className="text-slate-900 dark:text-white">{roleUser.role === 'Manager' ? 'Cashier' : 'Manager'}</b>?</>}
          onConfirm={executeRoleChange} onCancel={() => setRoleUser(null)} />
      )}

      {deleteConfirm && (
        <ConfirmModal title="Confirm Deletion" icon={ShieldAlert} confirmLabel="Delete User"
          message={<>Are you sure you want to delete <b className="text-slate-900 dark:text-white">{deleteConfirm}</b>? They will lose all access immediately.</>}
          onConfirm={executeDeleteUser} onCancel={() => setDeleteConfirm(null)} />
      )}

      {staffDrawer && (
        <Drawer title={staffDrawer.mode === 'add' ? 'Add Staff' : 'Edit Staff Details'} subtitle={staffDrawer.mode === 'edit' ? `@${staffDrawer.data.username}` : 'New accounts are approved immediately'} onClose={() => setStaffDrawer(null)}
          footer={<>
            <Button variant="secondary" className="flex-1" onClick={() => setStaffDrawer(null)}>Cancel</Button>
            <Button className="flex-1" onClick={saveStaff}><Save size={15}/> {staffDrawer.mode === 'add' ? 'Add Staff' : 'Save Changes'}</Button>
          </>}>
          <div className="flex flex-col items-center mb-5">
            <Avatar name={staffDrawer.data.full_name || staffDrawer.data.username || '?'} size="w-16 h-16 text-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {staffDrawer.mode === 'add' && <>
              {sf('username', 'Username *', { placeholder: 'Login name' })}
              {sf('password', 'Password *', { placeholder: 'Set a password' })}
            </>}
            {sf('full_name', 'Full Name', { placeholder: 'e.g. Nimal Perera' })}
            {sf('email', 'Email', { type: 'email', placeholder: 'e.g. nimal@email.com' })}
            {staffDrawer.mode === 'add' ? (
              <div>
                <label className={labelCls}>Role</label>
                <select value={staffDrawer.data.role} onChange={e => setStaffDrawer({ ...staffDrawer, data: { ...staffDrawer.data, role: e.target.value } })} className={inputCls}><option>Cashier</option><option>Manager</option></select>
              </div>
            ) : null}
            {sf('phone', 'Phone Number', { placeholder: 'e.g. 077 123 4567' })}
            {sf('salary', 'Monthly Salary (LKR)', { type: 'number', placeholder: 'e.g. 45000' })}
            {sf('joined_date', 'Joined Date', { type: 'date' })}
            {sf('shift_start', 'Shift Start', { type: 'time' })}
            {sf('shift_end', 'Shift End', { type: 'time' })}
            {sf('address', 'Address', { span: 'col-span-2', placeholder: 'Enter complete address' })}
            {sf('notes', 'Additional Details', { span: 'col-span-2', textarea: true, placeholder: 'Any extra info, emergency contact, skills...' })}
          </div>
        </Drawer>
      )}

      {detailUser && (
        <Drawer title="Staff Details" subtitle={`@${detailUser.username}`} onClose={() => setDetailUser(null)}
          footer={isManager && <Button className="flex-1" onClick={() => { const u = detailUser; setDetailUser(null); openEdit(u); }}><Edit size={15}/> Edit Details</Button>}>
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar name={detailUser.full_name || detailUser.username} size="w-16 h-16 text-xl" />
            <p className="text-base font-semibold text-slate-900 dark:text-white mt-3">{detailUser.full_name || detailUser.username}</p>
            <div className="flex gap-1.5 mt-1.5">
              <Badge tone={detailUser.role === 'Manager' ? 'purple' : 'blue'}>{detailUser.role}</Badge>
              <Badge tone={detailUser.is_approved ? 'green' : 'amber'}>{detailUser.is_approved ? 'Active' : 'Pending'}</Badge>
            </div>
          </div>
          <dl className="space-y-3 text-sm">
            {[
              [Mail, 'Email', detailUser.email], [Phone, 'Phone', detailUser.phone], [MapPin, 'Address', detailUser.address],
              [Wallet, 'Salary', detailUser.salary ? money(detailUser.salary) : null],
              [Timer, 'Shift', detailUser.shift_start ? `${detailUser.shift_start} – ${detailUser.shift_end || '?'}` : null],
              [CalendarDays, 'Joined', detailUser.joined_date ? new Date(detailUser.joined_date).toLocaleDateString() : null],
              [Clock, 'Last Login', detailUser.last_login ? new Date(detailUser.last_login).toLocaleString() : 'Never'],
            ].map(([Icon, label, value]) => (
              <div key={label} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3">
                <Icon size={15} className="text-slate-400 mt-0.5 shrink-0"/>
                <div className="min-w-0"><dt className="text-[11px] text-slate-500">{label}</dt><dd className="text-slate-900 dark:text-white break-words">{value || '—'}</dd></div>
              </div>
            ))}
            {detailUser.notes && <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3"><dt className="text-[11px] text-slate-500">Additional Details</dt><dd className="text-slate-900 dark:text-white whitespace-pre-wrap">{detailUser.notes}</dd></div>}
          </dl>
        </Drawer>
      )}

      {isManager && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard label="Total Staff" sub="All accounts" value={displayUsers.length} icon={Users} bars={false} />
          <StatCard label="Managers / Cashiers" sub="Role split" value={`${count(u => u.role === 'Manager')} / ${count(u => u.role === 'Cashier')}`} icon={Shield} tone="purple" bars={false} />
          <StatCard label="Monthly Payroll" sub="Sum of staff salaries" value={money(payroll)} icon={Wallet} tone="green" bars={false} />
          <StatCard label="Pending Approval" sub="Waiting for a manager" value={count(u => !u.is_approved)} icon={Clock} tone="amber" bars={false} />
        </div>
      )}

      {isManager && (
        <div className="flex items-center justify-between">
          <Tabs active={view} onChange={setView} tabs={[{ key: 'staff', label: 'Staff Management' }, { key: 'attendance', label: 'Attendance' }]} />
          {view === 'staff' && <Button onClick={() => setStaffDrawer({ mode: 'add', data: { ...EMPTY_STAFF } })}><UserPlus size={16}/> Add Staff</Button>}
        </div>
      )}

      {view === 'attendance' && isManager ? <AttendancePanel showToast={showToast} manager={activeUsername} /> : (
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{isManager ? `Staff (${displayUsers.length})` : 'My Account Profile'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{isManager ? 'Control staff accounts, details, passwords and roles.' : 'Update your personal login credentials.'}</p>
          </div>
          {isManager && (
            <div className="flex flex-wrap items-center gap-3">
              <Tabs active={filter} onChange={setFilter} tabs={[
                { key: 'All', label: 'All', count: displayUsers.length },
                { key: 'Manager', label: 'Managers', count: count(u => u.role === 'Manager') },
                { key: 'Cashier', label: 'Cashiers', count: count(u => u.role === 'Cashier') },
                { key: 'Pending', label: 'Pending', count: count(u => !u.is_approved) },
              ]} />
              <SearchInput value={search} onChange={setSearch} placeholder="Search name, phone, email..." className="w-60" />
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className={thCls}>Name</th>
                <th className={thCls}>Contact</th>
                {isManager && <th className={cx(thCls, 'text-right')}>Salary</th>}
                <th className={thCls}>Timings</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Last Login</th>
                <th className={cx(thCls, 'text-right')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length === 0 && <EmptyRow colSpan={7}>No staff match this filter.</EmptyRow>}
              {visibleUsers.map((u, idx) => (
                <tr key={idx} className={trCls}>
                  <td className={tdCls}>
                    <button onClick={() => setDetailUser(u)} className="flex items-center gap-3 text-left">
                      <Avatar name={u.full_name || u.username} />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white hover:text-blue-500">{u.full_name || u.username}</p>
                        <p className="text-[11px]"><span className={u.role === 'Manager' ? 'text-violet-500' : 'text-blue-500'}>{u.role}</span> <span className="text-slate-400">· @{u.username}</span>{u.username === activeUsername && <span className="text-blue-500"> · You</span>}</p>
                      </div>
                    </button>
                  </td>
                  <td className={tdCls}>
                    <p className="text-xs">{u.email || <span className="text-slate-400">No email</span>}</p>
                    <p className="text-xs text-slate-500">{u.phone || '—'}</p>
                  </td>
                  {isManager && <td className={cx(tdCls, 'text-right font-semibold text-slate-900 dark:text-white')}>{u.salary ? money(u.salary) : '—'}</td>}
                  <td className={cx(tdCls, 'text-xs')}>{u.shift_start ? `${u.shift_start} – ${u.shift_end || '?'}` : '—'}</td>
                  <td className={tdCls}>
                    {u.is_approved ? <Badge tone="green"><CheckCircle size={12}/> Active</Badge> : <Badge tone="amber"><Clock size={12}/> Pending</Badge>}
                  </td>
                  <td className={cx(tdCls, 'text-slate-500 dark:text-slate-400 text-xs')}>{formatLastLogin(u.last_login)}</td>
                  <td className={cx(tdCls, 'text-right whitespace-nowrap')}>
                    <IconButton onClick={() => setDetailUser(u)} title="View details"><Eye size={16} /></IconButton>
                    {isManager && <IconButton tone="blue" onClick={() => openEdit(u)} title="Edit details"><FilePen size={16} /></IconButton>}
                    {isManager && !u.is_approved && (
                      <IconButton tone="green" onClick={() => handleApprove(u.username)} title="Approve Account"><CheckCircle size={16} /></IconButton>
                    )}
                    {isManager && u.username !== 'admin' && (
                      <IconButton tone="purple" onClick={() => setRoleUser(u)} title={u.role === 'Manager' ? 'Demote to Cashier' : 'Promote to Manager'}><Shield size={16} /></IconButton>
                    )}
                    <IconButton tone="blue" onClick={() => setEditUser(u.username)} title="Change Username"><Edit size={16} /></IconButton>
                    <IconButton onClick={() => setPassUser(u.username)} title="Change Password"><Key size={16} /></IconButton>
                    {isManager && (
                      <IconButton tone="red" onClick={() => setDeleteConfirm(u.username)} title="Delete User"><Trash2 size={16} /></IconButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}
    </Page>
  );
}

const fmtHours = (h) => { const m = Math.round((Number(h) || 0) * 60); return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`; };
const isoDay = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function AttendancePanel({ showToast, manager }) {
  const [start, setStart] = useState(isoDay(new Date()));
  const [end, setEnd] = useState(isoDay(new Date()));
  const [logs, setLogs] = useState([]);

  const load = () => fetch(`http://localhost:5000/api/attendance?start=${start}&end=${end}`)
    .then(r => r.json()).then(d => Array.isArray(d) && setLogs(d)).catch(() => {});
  useEffect(() => { load(); }, [start, end]);

  const clockOut = async (username) => {
    const res = await fetch('http://localhost:5000/api/attendance/clock-out', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, by: manager }) });
    if (!res.ok) return showToast('Error clocking out.');
    showToast(`${username} clocked out.`);
    load();
  };

  const onDuty = logs.filter(l => !l.clock_out);
  const hours = logs.reduce((a, l) => a + Number(l.hours || 0), 0);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="On Duty Now" sub="Clocked in, not out" value={onDuty.length} icon={Timer} tone="green" bars={false} />
        <StatCard label="Shifts" sub={start === end ? 'Selected day' : 'Selected range'} value={logs.length} icon={CalendarDays} bars={false} />
        <StatCard label="Hours Worked" sub={`${new Set(logs.map(l => l.username)).size} staff`} value={fmtHours(hours)} icon={Clock} tone="purple" bars={false} />
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Attendance Log</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Staff clock in and out from the top bar or their Profile page.</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={start} onChange={e => setStart(e.target.value)} className={cx(inputCls, 'w-40 py-1.5')} />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className={cx(inputCls, 'w-40 py-1.5')} />
          </div>
        </div>
        <table className="w-full text-left">
          <thead><tr><th className={thCls}>Staff</th><th className={thCls}>Date</th><th className={thCls}>Clock In</th><th className={thCls}>Clock Out</th><th className={thCls}>Hours</th><th className={thCls}>Status</th><th className={cx(thCls, 'text-right')}>Action</th></tr></thead>
          <tbody>
            {logs.length === 0 && <EmptyRow colSpan={7}>No attendance records for this period.</EmptyRow>}
            {logs.map(l => (
              <tr key={l.id} className={trCls}>
                <td className={tdCls}><span className="flex items-center gap-2"><Avatar name={l.username} size="w-7 h-7" /><span className="font-medium text-slate-900 dark:text-white">{l.username}</span></span></td>
                <td className={tdCls}>{new Date(l.clock_in).toLocaleDateString()}</td>
                <td className={tdCls}>{new Date(l.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td className={tdCls}>{l.clock_out ? new Date(l.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td className={cx(tdCls, 'font-semibold text-slate-900 dark:text-white')}>{fmtHours(l.hours)}</td>
                <td className={tdCls}><Badge tone={l.clock_out ? 'green' : 'blue'}>{l.clock_out ? 'Completed' : 'On shift'}</Badge></td>
                <td className={cx(tdCls, 'text-right')}>{!l.clock_out && <Button size="sm" variant="secondary" onClick={() => clockOut(l.username)}>Clock out</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
