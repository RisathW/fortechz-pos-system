import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react'; // ✅ Imported icons
import logo from './assets/logo.png';
import logoDark from './assets/logo02.png';

export default function Login({ onLogin, isDarkMode, setIsDarkMode }) { // ✅ Added setIsDarkMode prop
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors relative">
      
      {/* ✅ THEME TOGGLE BUTTON (Absolute positioned to top-right of screen) */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)} 
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className="absolute top-6 right-6 flex items-center justify-center p-3 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
      >
        {isDarkMode ? <Sun size={24} className="text-amber-400"/> : <Moon size={24} className="text-slate-500"/>}
      </button>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg w-96 border border-slate-200 dark:border-slate-800 transition-colors">
        
        <div className="flex justify-center mb-6">
          <img src={isDarkMode ? logoDark : logo} alt="Logo" className="h-24 w-auto" />
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 dark:text-white text-center mb-6">
          {isLogin ? 'Sign In to POS' : 'Create Account'}
        </h2>
        
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm font-bold text-center">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-lg mb-4 text-sm font-bold text-center">
            {successMsg}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Username</label>
            <input 
              type="text" 
              required 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="w-full px-4 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              placeholder="Enter password"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button 
            onClick={toggleMode} 
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            {isLogin ? 'Sign Up here' : 'Login here'}
          </button>
        </div>
      </div>
    </div>
  );
}