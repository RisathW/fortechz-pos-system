import React, { useState, useEffect } from 'react';
import { Trash2, Key, Edit, CheckCircle, Clock, ShieldAlert, Shield } from 'lucide-react';

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

  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative transition-colors">
      
      {toast && (
        <div className="fixed top-6 right-6 bg-slate-800 dark:bg-slate-900 text-white px-6 py-3 rounded-lg shadow-2xl z-50 font-bold border-l-4 border-blue-500 animate-pulse transition-colors">
          {toast}
        </div>
      )}

      {/* EDIT USERNAME MODAL */}
      {editUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-6 border border-transparent dark:border-slate-700 transition-colors">
            <h3 className="font-black text-xl mb-4 text-slate-800 dark:text-white">Change Username</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm font-medium">Enter a new username for <span className="font-bold text-slate-800 dark:text-white">{editUser}</span>:</p>
            <input type="text" autoFocus value={newUsernameInput} onChange={e => setNewUsernameInput(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl mb-6 font-bold focus:border-blue-500 outline-none transition-colors" placeholder="New Username"/>
            <div className="flex gap-2">
              <button onClick={() => {setEditUser(null); setNewUsernameInput('');}} className="w-1/2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={executeUsernameChange} className="w-1/2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-6 border border-transparent dark:border-slate-700 transition-colors">
            <h3 className="font-black text-xl mb-4 text-slate-800 dark:text-white">Reset Password</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm font-medium">Enter a new password for <span className="font-bold text-slate-800 dark:text-white">{passUser}</span>:</p>
            <input type="text" autoFocus value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl mb-6 font-bold focus:border-blue-500 outline-none transition-colors" placeholder="New Password"/>
            <div className="flex gap-2">
              <button onClick={() => {setPassUser(null); setNewPasswordInput('');}} className="w-1/2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={executePasswordChange} className="w-1/2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE ROLE (PROMOTE) MODAL */}
      {roleUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-6 border border-transparent dark:border-slate-700 transition-colors">
            <h3 className="font-black text-xl mb-4 text-purple-600 dark:text-purple-400 flex items-center gap-2"><Shield size={24}/> Change Role</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to change <span className="font-bold text-slate-800 dark:text-white">{roleUser.username}</span> from <strong className="dark:text-white">{roleUser.role}</strong> to <strong className="dark:text-white">{roleUser.role === 'Manager' ? 'Cashier' : 'Manager'}</strong>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setRoleUser(null)} className="w-1/2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={executeRoleChange} className="w-1/2 bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors">Confirm Change</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-6 border border-transparent dark:border-slate-700 transition-colors">
            <h3 className="font-black text-xl mb-4 text-red-600 dark:text-red-400 flex items-center gap-2"><ShieldAlert size={24}/> Confirm Deletion</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-white">{deleteConfirm}</span>? They will lose all access immediately.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="w-1/2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={executeDeleteUser} className="w-1/2 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors">Delete User</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white">
          {isManager ? 'User Management' : 'My Account Profile'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          {isManager ? 'Control staff accounts, reset passwords, and manage access.' : 'Update your personal login credentials.'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex-1 transition-colors">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
            <tr>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Username</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Role</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Status</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Last Login</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {displayUsers.map((u, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-bold text-slate-800 dark:text-white">{u.username}</td>
                <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${u.role === 'Manager' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 transition-colors ${u.is_approved ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                    {u.is_approved ? <><CheckCircle size={14}/> Approved</> : 'Pending'}
                  </span>
                </td>
                
                <td className="p-4 text-slate-600 dark:text-slate-400 font-medium text-sm flex items-center gap-2 mt-1">
                  <Clock size={16} className="text-slate-400 dark:text-slate-500" />
                  {formatLastLogin(u.last_login)}
                </td>

                <td className="p-4 text-right space-x-2">
                  
                  {/* Approve Button (MANAGERS ONLY) */}
                  {isManager && !u.is_approved && (
                    <button onClick={() => handleApprove(u.username)} title="Approve Account" className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors">
                      <CheckCircle size={18} />
                    </button>
                  )}

                  {/* Change Role / Promote (MANAGERS ONLY, EXCEPT MASTER ADMIN) */}
                  {isManager && u.username !== 'admin' && (
                    <button onClick={() => setRoleUser(u)} title={u.role === 'Manager' ? 'Demote to Cashier' : 'Promote to Manager'} className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-lg transition-colors">
                      <Shield size={18} />
                    </button>
                  )}

                  {/* Edit Username (EVERYONE) */}
                  <button onClick={() => setEditUser(u.username)} title="Edit Username" className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-colors">
                    <Edit size={18} />
                  </button>

                  {/* Change Password (EVERYONE) */}
                  <button onClick={() => setPassUser(u.username)} title="Change Password" className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Key size={18} />
                  </button>

                  {/* Delete User (MANAGERS ONLY) */}
                  {isManager && (
                    <button onClick={() => setDeleteConfirm(u.username)} title="Delete User" className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}