import React, { useState } from 'react';
import { Sun, Moon, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Logo, Modal, Button } from './ui';

const REMEMBER_KEY = 'fz_remember_username';
const readRemembered = () => { try { return localStorage.getItem(REMEMBER_KEY) || ''; } catch { return ''; } };

export default function Login({ onLogin, isDarkMode, setIsDarkMode }) { // ✅ Added setIsDarkMode prop
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState(readRemembered);
  const [remember, setRemember] = useState(() => !!readRemembered());
  const [showForgot, setShowForgot] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(''); 
    setSuccessMsg(''); 

    const url = isLogin ? 'http://localhost:5000/api/login' : 'http://localhost:5000/api/signup';
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        if (isLogin) {
          try { if (remember) localStorage.setItem(REMEMBER_KEY, username); else localStorage.removeItem(REMEMBER_KEY); } catch { /* storage unavailable */ }
          onLogin(data.user);
        } else {
          setSuccessMsg(data.message); 
          setIsLogin(true); 
          setUsername(''); 
          setPassword(''); 
        }
      } else {
        setErrorMsg(data.message || 'Error occurred'); 
      }
    } catch (err) {
      setErrorMsg('Failed to connect to the server.'); 
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 transition-colors relative px-4">

      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className="absolute top-6 right-6 flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
      >
        {isDarkMode ? <Sun size={18} className="text-amber-400"/> : <Moon size={18}/>}
      </button>

      {showForgot && (
        <Modal title="Forgot Password?" subtitle="Passwords are reset by a manager" icon={KeyRound} onClose={() => setShowForgot(false)}
          footer={<Button className="w-full" onClick={() => setShowForgot(false)}>Got it</Button>}>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>Ask a <b className="text-slate-900 dark:text-white">Manager</b> to sign in on this computer.</li>
            <li>They open <b className="text-slate-900 dark:text-white">Staff Management</b> and click the key icon next to your name.</li>
            <li>Sign in with the new password, then change it any time from <b className="text-slate-900 dark:text-white">Profile → My Profile</b>.</li>
          </ol>
        </Modal>
      )}

      <Logo isDarkMode={isDarkMode} className="w-80 h-20 mb-6" />

      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none transition-colors">

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isLogin ? 'Login!' : 'Create Account'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
          {isLogin ? 'Please enter your credentials below to continue' : 'Fill in the details below to request an account'}
        </p>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm font-medium text-center">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-lg mb-4 text-sm font-medium text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-colors"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-colors pr-11"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
              </button>
            </div>
          </div>
          {isLogin && (
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-3.5 h-3.5 accent-blue-600" />
                Remember me
              </label>
              <button type="button" onClick={() => setShowForgot(true)} className="text-blue-600 dark:text-blue-500 font-medium hover:underline">Forgot Password?</button>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors !mt-6"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={toggleMode}
            className="text-blue-600 dark:text-blue-500 font-semibold hover:underline"
          >
            {isLogin ? 'Sign Up here' : 'Login here'}
          </button>
        </div>
      </div>
    </div>
  );
}
