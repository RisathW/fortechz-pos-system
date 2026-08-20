import logo from './assets/logo.png';
import logoDark from './assets/logo02.png'; 
import UserManagement from './UserManagement';
import GeneralInventory from './GeneralInventory';
import StockManagement from './StockManagement';
import StockHistory from './StockHistory';
import SalesHistory from './SalesHistory';
import React, { useState, useEffect } from 'react';
import { ShoppingCart, LayoutDashboard, Truck, LogOut, PieChart, Users, Package, ArrowLeftRight, FileText, Receipt, Settings, CalendarClock, Moon, Sun, RotateCcw } from 'lucide-react';
import CheckoutPos from './CheckoutPos';
import InventoryDashboard from './InventoryDashboard';
import SupplierDirectory from './SupplierDirectory';
import SalesReport from './SalesReport';
import Login from './Login';
import ReservationsDashboard from './ReservationsDashboard';
import ReturnsDashboard from './ReturnsDashboard'; // ✅ New Import

export default function App() {
  const [activeTab, setActiveTab] = useState('checkout');
  const [user, setUser] = useState(null);
  
  // Dark Mode State (Checks localStorage first so it remembers the user's choice)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
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

  const generateZReport = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/reports/shift?username=${user.username}`);
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
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
      alert("Error generating report."); 
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
        <img src={isDarkMode ? logoDark : logo} alt="Logo" className="h-16 w-auto mb-4 animate-pulse" />
        <p className="text-blue-600 dark:text-blue-400 font-bold animate-pulse">Initializing Database & Tables...</p>
      </div>
    );
  }

  if (isFirstRun) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-950 transition-colors">
        <form onSubmit={handleSetupAdmin} className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl w-96 border border-transparent dark:border-slate-800">
          <div className="flex justify-center mb-6">
            <img src={isDarkMode ? logoDark : logo} alt="Logo" className="h-16 w-auto" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-blue-600 dark:text-blue-400 text-center">First Time Setup</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 font-bold text-center">Create the Master Manager account to initialize.</p>

          {setupError && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded mb-4 font-bold text-sm text-center border border-red-200 dark:border-red-800">{setupError}</div>}
          {setupSuccess && <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded mb-4 font-bold text-sm text-center border border-emerald-200 dark:border-emerald-800">{setupSuccess}</div>}

          <input type="text" placeholder="Admin Username" value={setupUsername} onChange={e => setSetupUsername(e.target.value)} className="w-full p-3 border dark:border-slate-700 rounded-lg mb-4 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required/>
          <input type="password" placeholder="Admin Password" value={setupPassword} onChange={e => setSetupPassword(e.target.value)} className="w-full p-3 border dark:border-slate-700 rounded-lg mb-6 bg-slate-50 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" required/>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">Create Admin Account</button>
        </form>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
  }

  const getBtnClass = (tabName) => {
    return `w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
      activeTab === tabName 
      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold' 
      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;
  };

  return (
    <>
      {showShiftConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-6 border dark:border-slate-700">
            <h3 className="font-black text-xl mb-4 text-center dark:text-white">Close Shift</h3>
            <p className="text-slate-600 dark:text-slate-300 text-center mb-6 font-medium">Are you sure you want to close your shift and generate the Z-Report?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowShiftConfirm(false)} className="w-1/2 bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 font-bold py-3 rounded-xl transition-colors">Cancel</button>
              <button onClick={generateZReport} className="w-1/2 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {zReportData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="font-black text-2xl mb-4 text-center text-slate-800 dark:text-white border-b dark:border-slate-700 pb-2">Shift Report</h3>
            <pre className="text-sm bg-slate-50 dark:bg-slate-800 p-4 rounded-lg whitespace-pre-wrap font-mono mb-6 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              {zReportData}
            </pre>
            <button onClick={() => {
              setZReportData(null);
              setUser(null);
              window.location.reload(); 
            }} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 shadow-sm transition-colors">
              Acknowledge & Logout
            </button>
          </div>
        </div>
      )}

      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 print:bg-white print:h-auto transition-colors">
        
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col print:hidden transition-colors">
          <div className="flex justify-center mb-6">
            <img src={isDarkMode ? logoDark : logo} alt="Nalini Book Shop Logo" className="h-20 w-auto" />
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] dark:[scrollbar-color:#334155_transparent]">
            <button onClick={() => setActiveTab('checkout')} className={getBtnClass('checkout')}><ShoppingCart size={20}/> Checkout</button>
            <button onClick={() => setActiveTab('reservations')} className={getBtnClass('reservations')}><CalendarClock size={20}/> Pre-Orders</button>
            <button onClick={() => setActiveTab('inventory')} className={getBtnClass('inventory')}><LayoutDashboard size={20}/> Inventory</button>
            <button onClick={() => setActiveTab('general')} className={getBtnClass('general')}><Package size={20}/> General Items</button>
            <button onClick={() => setActiveTab('suppliers')} className={getBtnClass('suppliers')}><Truck size={20}/> Suppliers</button>
            
            {user.role === 'Manager' && (
              <>
                <div className="border-t my-2 border-slate-100 dark:border-slate-800"></div>
                <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Admin Controls</p>
                
                <button onClick={() => setActiveTab('stock')} className={getBtnClass('stock')}><ArrowLeftRight size={20}/> Stock Control</button>
                <button onClick={() => setActiveTab('history')} className={getBtnClass('history')}><FileText size={20}/> Stock History</button>
                <button onClick={() => setActiveTab('sales_history')} className={getBtnClass('sales_history')}><Receipt size={20}/> Checkout History</button>
                {/* ✅ Added the new Returns Dashboard button here */}
                <button onClick={() => setActiveTab('returns')} className={getBtnClass('returns')}><RotateCcw size={20}/> Returns & Refunds</button>
                <button onClick={() => setActiveTab('reports')} className={getBtnClass('reports')}><PieChart size={20}/> Reports</button>
                <button onClick={() => setActiveTab('users')} className={getBtnClass('users')}><Users size={20}/> Manage Users</button>
              </>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 pb-2 space-y-4 mt-auto transition-colors">
            
            {/* CURRENT USER INFO */}
            <div className="px-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current User</p>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{user.username}</p>
              </div>
            </div>
            
            <div className="px-4">
               <button onClick={() => setShowShiftConfirm(true)} className="w-full bg-slate-800 dark:bg-slate-700 text-white font-bold py-2.5 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm">
                 <FileText size={16}/> Close Shift
               </button>
            </div>
            
            {/* ICON-ONLY CONTROL ROW (Settings restored!) */}
            <div className="px-4 flex items-center justify-between gap-2">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="flex-1 flex justify-center p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {isDarkMode ? <Sun size={20} className="text-amber-400"/> : <Moon size={20} className="text-slate-500"/>}
              </button>
              
              <button 
                onClick={() => setActiveTab('users')} 
                title="Account Settings" 
                className="flex-1 flex justify-center p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Settings size={20} />
              </button>

              <button 
                onClick={() => setUser(null)} 
                title="Sign Out"
                className="flex-1 flex justify-center p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <LogOut size={20}/>
              </button>
            </div>

          </div>
        </aside>
        
        <main className="flex-1 overflow-hidden print:overflow-visible relative">
          {activeTab === 'checkout' && <CheckoutPos user={user} onNavigate={setActiveTab} />}
          {activeTab === 'reservations' && <ReservationsDashboard user={user} />}
          {activeTab === 'inventory' && <InventoryDashboard user={user} />}
          {activeTab === 'suppliers' && <SupplierDirectory />}
          {activeTab === 'general' && <GeneralInventory user={user} />}
          {activeTab === 'stock' && <StockManagement user={user} />}
          {activeTab === 'history' && <StockHistory />}
          {activeTab === 'sales_history' && <SalesHistory user={user} />}
          {/* ✅ Loaded the new component */}
          {activeTab === 'returns' && <ReturnsDashboard user={user} />}
          {activeTab === 'reports' && <SalesReport />}
          {activeTab === 'users' && <UserManagement user={user} />}
        </main>
      </div>
    </>
  );
}