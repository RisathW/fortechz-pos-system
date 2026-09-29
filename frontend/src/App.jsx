import UserManagement from './UserManagement';
import GeneralInventory from './GeneralInventory';
import StockManagement from './StockManagement';
import StockHistory from './StockHistory';
import SalesHistory from './SalesHistory';
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, LayoutDashboard, Truck, LogOut, PieChart, Users, Package, ArrowLeftRight, FileText, Receipt, Settings, CalendarClock, Moon, Sun, RotateCcw, Bell, Library, FileCheck2, LogIn, Timer } from 'lucide-react';
import CheckoutPos from './CheckoutPos';
import InventoryDashboard from './InventoryDashboard';
import SupplierDirectory from './SupplierDirectory';
import Reports from './Reports';
import Profile from './Profile';
import Notifications, { loadNotifications, NotificationIcon, markNotificationsRead, isNotificationRead } from './Notifications';
import { canAccess } from './access';
import Login from './Login';
import ReservationsDashboard from './ReservationsDashboard';
import ReturnsDashboard from './ReturnsDashboard';
import Dashboard from './Dashboard';
import { Logo, Modal, Button, Avatar, Toast, inputCls, cx } from './ui';

const PAGE_TITLES = {
  dashboard: ['Dashboard', 'Welcome to your ForTechZ POS overview'],
  checkout: ['Checkout', 'Scan books and process customer checkout'],
  reservations: ['Pre-Orders', 'Track reserved items and customer deposits'],
  inventory: ['Inventory', 'Monitor books, stock levels, pricing and shelf locations'],
  general: ['General Items', 'Stationery and general store stock'],
  suppliers: ['Suppliers', 'Manage your vendors and contact information'],
  stock: ['Stock Control', 'Receive (GRN) and return (PRN) supplier stock'],
  history: ['Stock History', 'Audit trail of every GRN and PRN transaction'],
  sales_history: ['Checkout History', 'Every invoice, reprint and return in one place'],
  returns: ['Returns & Refunds', 'Secure record of all refunds and restocked items'],
  reports: ['Reports', 'Revenue, pre-order and staff performance reports'],
  users: ['Staff Management', 'Manage your team members, attendance and details'],
  notifications: ['Notifications', 'Stock alerts, overdue pre-orders and recent activity'],
  profile: ['Profile', 'Manage your profile, attendance and permissions'],
};

const NAV_ORDER = ['dashboard', 'checkout', 'reservations', 'inventory', 'general', 'suppliers', 'notifications', 'stock', 'history', 'sales_history', 'returns', 'reports', 'users'];

function NavItem({ tab, active, onSelect, icon: Icon, label, count }) {
  return (
    <button onClick={() => onSelect(tab)}
      className={cx('w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-colors border',
        active === tab
          ? 'bg-blue-50 dark:bg-blue-600/15 border-blue-200 dark:border-blue-600/40 text-blue-700 dark:text-white font-semibold'
          : 'border-transparent text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white')}>
      <Icon size={18} className={active === tab ? 'text-blue-600 dark:text-blue-400' : ''} />
      <span className="flex-1">{label}</span>
      {count > 0 && <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">{count}</span>}
    </button>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('checkout');
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState('');

  // Dark Mode State (Checks localStorage first so it remembers the user's choice)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light'; // Fortechz design is dark-first
  });

  // First-Time Setup States
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [setupUsername, setSetupUsername] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');

  // Shift Close & Z-Report States
  const [showShiftConfirm, setShowShiftConfirm] = useState(false);
  const [zReportData, setZReportData] = useState(null);

  // Notifications (low stock, overdue pre-orders, approvals, activity)
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifTick, setNotifTick] = useState(0);
  const notifRef = useRef(null);

  // Attendance (clock in / out) for the signed-in user
  const [attendance, setAttendance] = useState({ clockedIn: false, record: null });
  const [, setClockTick] = useState(0);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  // Effect to apply dark mode to HTML tag and save preference
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Continuous check until the Database finishes building
  useEffect(() => {
    const checkDatabase = () => {
      fetch('http://localhost:5000/api/setup/status')
        .then(res => {
          if (!res.ok) throw new Error("Backend not ready yet");
          return res.json();
        })
        .then(data => {
          setIsFirstRun(data.isFirstRun);
          setIsLoading(false);
        })
        .catch(err => {
          console.log("Database is still building... retrying in 1 second.");
          setTimeout(checkDatabase, 1000);
        });
    };

    checkDatabase();
  }, []);

  // Poll for notifications while logged in
  useEffect(() => {
    if (!user) return;
    const load = () => loadNotifications(user).then(setNotifications).catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [user, activeTab, notifTick]);

  const refreshAttendance = () => {
    if (!user) return;
    fetch(`http://localhost:5000/api/attendance/status?username=${encodeURIComponent(user.username)}`)
      .then(r => r.json()).then(d => d && !d.error && setAttendance(d)).catch(() => {});
  };
  useEffect(() => {
    refreshAttendance();
    const t = setInterval(() => setClockTick(x => x + 1), 60000);
    return () => clearInterval(t);
  }, [user]);

  const toggleClock = async () => {
    const res = await fetch(`http://localhost:5000/api/attendance/${attendance.clockedIn ? 'clock-out' : 'clock-in'}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showToast(`Error: ${data.error || 'attendance update failed'}`);
    showToast(attendance.clockedIn ? 'Clocked out. See you next shift!' : 'Clocked in. Have a great shift!');
    refreshAttendance();
  };

  useEffect(() => {
    const close = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSetupAdmin = async (e) => {
    e.preventDefault();
    setSetupError('');
    const res = await fetch('http://localhost:5000/api/setup/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: setupUsername, password: setupPassword })
    });
    const data = await res.json();

    if (data.success) {
      setSetupSuccess(data.message);
      setTimeout(() => setIsFirstRun(false), 2000);
    } else {
      setSetupError(data.message);
    }
  };

  const handleLogin = (u) => {
    setUser(u);
    setActiveTab(NAV_ORDER.find(k => canAccess(u, k)) || 'profile');
  };

  const generateZReport = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/reports/shift?username=${user.username}`);
      const data = await res.json();

      if (data.error) {
        showToast(data.error);
        setShowShiftConfirm(false);
        return;
      }

      let reportText = `=== FINAL SHIFT REPORT ===\nCashier: ${user.username}\nDate: ${new Date().toLocaleDateString()}\n\n`;
      let cashSales = 0; let totalSales = 0;

      data.sales.forEach(row => {
        reportText += `${row.payment_type} Sales: LKR ${Number(row.total).toFixed(2)}\n`;
        if (row.payment_type === 'Cash') cashSales += Number(row.total);
        totalSales += Number(row.total);
      });

      const exp = Number(data.expenses);
      const ret = Number(data.returns);
      const openingFloat = Number(data.opening_balance || 0);

      const expectedDrawer = openingFloat + cashSales - exp - ret;

      reportText += `\n(+) Opening Cash Float: LKR ${openingFloat.toFixed(2)}`;
      reportText += `\n(+) Total Revenue: LKR ${totalSales.toFixed(2)}`;
      reportText += `\n(-) Cash Expenses: LKR ${exp.toFixed(2)}`;
      reportText += `\n(-) Cash Refunds:  LKR ${ret.toFixed(2)}`;
      reportText += `\n\nEXPECTED CASH IN DRAWER:\nLKR ${expectedDrawer.toFixed(2)}\n========================`;

      setShowShiftConfirm(false);
      setZReportData(reportText);
    } catch (err) {
      showToast("Error generating report.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <Logo isDarkMode={isDarkMode} className="w-72 h-20 animate-pulse" />
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium animate-pulse mt-4">Initializing database & tables...</p>
      </div>
    );
  }

  if (isFirstRun) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 transition-colors px-4">
        <Logo isDarkMode={isDarkMode} className="w-72 h-20 mb-6" />
        <form onSubmit={handleSetupAdmin} className="bg-white dark:bg-slate-900 p-8 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">First Time Setup</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">Create the master Manager account to initialize.</p>

          {setupError && <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 font-medium text-sm text-center border border-red-500/30">{setupError}</div>}
          {setupSuccess && <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg mb-4 font-medium text-sm text-center border border-emerald-500/30">{setupSuccess}</div>}

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Admin Username</label>
          <input type="text" placeholder="Enter a username" value={setupUsername} onChange={e => setSetupUsername(e.target.value)} className={cx(inputCls, 'mb-4')} required/>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Admin Password</label>
          <input type="password" placeholder="Enter a password" value={setupPassword} onChange={e => setSetupPassword(e.target.value)} className={cx(inputCls, 'mb-6')} required/>
          <Button type="submit" className="w-full">Create Admin Account</Button>
        </form>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
  }

  const isManager = user.role === 'Manager';
  const [pageTitle, pageSubtitle] = PAGE_TITLES[activeTab] || ['', ''];


  const overdueCount = notifications.filter(n => n.type === 'overdue').length;
  const stockAlertCount = notifications.filter(n => n.type === 'low' || n.type === 'out').length;
  const unreadCount = notifications.filter(n => !isNotificationRead(n.id)).length;
  const can = (k) => canAccess(user, k);
  const hasAdmin = ['stock', 'history', 'sales_history', 'returns', 'reports', 'users'].some(can);
  const shiftHours = attendance.clockedIn && attendance.record ? (Date.now() - new Date(attendance.record.clock_in).getTime()) / 3600000 : 0;

  return (
    <>
      <Toast message={toast} />

      {showShiftConfirm && (
        <Modal title="Close Shift" subtitle="This will generate your Z-Report" icon={FileCheck2} onClose={() => setShowShiftConfirm(false)}
          footer={<>
            <Button variant="secondary" className="flex-1" onClick={() => setShowShiftConfirm(false)}>Cancel</Button>
            <Button className="flex-1" onClick={generateZReport}>Confirm</Button>
          </>}>
          <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to close your shift and generate the Z-Report?</p>
        </Modal>
      )}

      {zReportData && (
        <Modal title="Shift Report" subtitle={`Cashier: ${user.username}`} icon={FileText}
          footer={<Button size="lg" className="w-full" onClick={() => { setZReportData(null); setUser(null); window.location.reload(); }}>Acknowledge & Logout</Button>}>
          <pre className="text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-xl whitespace-pre-wrap font-mono border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            {zReportData}
          </pre>
        </Modal>
      )}

      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 print:bg-white print:h-auto transition-colors">

        <aside className="w-60 shrink-0 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 px-4 py-5 flex flex-col print:hidden transition-colors">
          <Logo isDarkMode={isDarkMode} className="w-full h-12 mb-6" />

          <nav className="flex-1 space-y-1 overflow-y-auto pr-1 -mr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin]">
            {can('dashboard') && <NavItem active={activeTab} onSelect={setActiveTab} tab="dashboard" icon={LayoutDashboard} label="Dashboard" />}
            {can('checkout') && <NavItem active={activeTab} onSelect={setActiveTab} tab="checkout" icon={ShoppingCart} label="Checkout" />}
            {can('reservations') && <NavItem active={activeTab} onSelect={setActiveTab} tab="reservations" icon={CalendarClock} label="Pre-Orders" count={overdueCount} />}
            {can('inventory') && <NavItem active={activeTab} onSelect={setActiveTab} tab="inventory" icon={Library} label="Inventory" count={isManager ? stockAlertCount : 0} />}
            {can('general') && <NavItem active={activeTab} onSelect={setActiveTab} tab="general" icon={Package} label="General Items" />}
            {can('suppliers') && <NavItem active={activeTab} onSelect={setActiveTab} tab="suppliers" icon={Truck} label="Suppliers" />}
            {can('notifications') && <NavItem active={activeTab} onSelect={setActiveTab} tab="notifications" icon={Bell} label="Notifications" count={unreadCount} />}

            {hasAdmin && (
              <>
                <p className="px-3 pt-5 pb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Admin Controls</p>
                {can('stock') && <NavItem active={activeTab} onSelect={setActiveTab} tab="stock" icon={ArrowLeftRight} label="Stock Control" />}
                {can('history') && <NavItem active={activeTab} onSelect={setActiveTab} tab="history" icon={FileText} label="Stock History" />}
                {can('sales_history') && <NavItem active={activeTab} onSelect={setActiveTab} tab="sales_history" icon={Receipt} label="Checkout History" />}
                {can('returns') && <NavItem active={activeTab} onSelect={setActiveTab} tab="returns" icon={RotateCcw} label="Returns & Refunds" />}
                {can('reports') && <NavItem active={activeTab} onSelect={setActiveTab} tab="reports" icon={PieChart} label="Reports" />}
                {can('users') && <NavItem active={activeTab} onSelect={setActiveTab} tab="users" icon={Users} label="Staff Management" />}
              </>
            )}
          </nav>

          <div className="pt-4 mt-2 space-y-1 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setShowShiftConfirm(true)} className="w-full px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">
              <FileCheck2 size={18}/> Close Shift
            </button>
            <button onClick={() => setUser(null)} className="w-full px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors">
              <LogOut size={18}/> Logout
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-[72px] shrink-0 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 print:hidden transition-colors">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{pageTitle}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{pageSubtitle}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={toggleClock} title={attendance.clockedIn ? 'Clock out' : 'Clock in'}
                className={cx('h-9 px-3 rounded-full flex items-center gap-2 text-xs font-semibold transition-colors border',
                  attendance.clockedIn ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500')}>
                {attendance.clockedIn
                  ? <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><Timer size={14}/> On shift {Math.floor(shiftHours)}h {String(Math.round((shiftHours % 1) * 60)).padStart(2, '0')}m</>
                  : <><LogIn size={14}/> Clock In</>}
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {isDarkMode ? <Sun size={17} className="text-amber-400"/> : <Moon size={17}/>}
              </button>

              <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifications(!showNotifications)} title="Notifications" className="relative w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <Bell size={17}/>
                  {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-950">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-11 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                      <button onClick={() => { markNotificationsRead(notifications.map(n => n.id)); setNotifTick(x => x + 1); }} className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">You're all caught up.</p>}
                      {notifications.slice(0, 8).map(n => (
                        <button key={n.id} onClick={() => { markNotificationsRead([n.id]); setNotifTick(x => x + 1); if (can(n.tab)) setActiveTab(n.tab); setShowNotifications(false); }} className="w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                          <NotificationIcon type={n.type} />
                          <span className="min-w-0 flex-1">
                            <span className={cx('block text-sm truncate', isNotificationRead(n.id) ? 'text-slate-500 dark:text-slate-400' : 'font-medium text-slate-800 dark:text-white')}>{n.title}</span>
                            <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{n.detail}</span>
                          </span>
                          {!isNotificationRead(n.id) && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                    {can('notifications') && (
                      <button onClick={() => { setActiveTab('notifications'); setShowNotifications(false); }} className="w-full py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60">View all notifications</button>
                    )}
                  </div>
                )}
              </div>

              {(
                <button onClick={() => setActiveTab('profile')} title="Profile & Access Settings" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <Settings size={17}/>
                </button>
              )}

              <button onClick={() => setActiveTab('profile')} title="My Profile" className="flex items-center gap-3 pl-3 ml-1 border-l border-slate-200 dark:border-slate-800">
                <Avatar name={user.username} />
                <span className="leading-tight text-left">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">{user.username}</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">{user.role}</span>
                </span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-hidden print:overflow-visible relative">
            {activeTab === 'dashboard' && can('dashboard') && <Dashboard onNavigate={setActiveTab} />}
            {activeTab === 'checkout' && can('checkout') && <CheckoutPos user={user} onNavigate={setActiveTab} />}
            {activeTab === 'reservations' && can('reservations') && <ReservationsDashboard user={user} />}
            {activeTab === 'inventory' && can('inventory') && <InventoryDashboard user={user} />}
            {activeTab === 'suppliers' && can('suppliers') && <SupplierDirectory />}
            {activeTab === 'general' && can('general') && <GeneralInventory user={user} />}
            {activeTab === 'notifications' && can('notifications') && <Notifications user={user} onNavigate={(t) => can(t) && setActiveTab(t)} onChange={() => setNotifTick(x => x + 1)} />}
            {activeTab === 'stock' && can('stock') && <StockManagement user={user} />}
            {activeTab === 'history' && can('history') && <StockHistory />}
            {activeTab === 'sales_history' && can('sales_history') && <SalesHistory user={user} />}
            {activeTab === 'returns' && can('returns') && <ReturnsDashboard user={user} />}
            {activeTab === 'reports' && can('reports') && <Reports />}
            {activeTab === 'users' && can('users') && <UserManagement user={user} />}
            {activeTab === 'profile' && <Profile key={user.username} user={user} onLogout={() => setUser(null)} onAttendanceChange={refreshAttendance} />}
          </main>
        </div>
      </div>
    </>
  );
}
