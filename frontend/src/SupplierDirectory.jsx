import React, { useState, useEffect } from 'react';
import { Save, Trash2, Building2 } from 'lucide-react';

export default function SupplierDirectory() {
  const [suppliers, setSuppliers] = useState([]);
  const [toast, setToast] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone_number: '',
    address: '',
    city: '',
    email: '',
    credit_limit: ''
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchSuppliers = () => {
    fetch('http://localhost:5000/api/suppliers')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSuppliers(data); })
      .catch(err => console.error("Error fetching suppliers"));
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name) return showToast("Company Name is required!");

    const res = await fetch('http://localhost:5000/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        credit_limit: parseFloat(formData.credit_limit) || 0
      })
    });

    if (res.ok) {
      showToast("Supplier added successfully!");
      fetchSuppliers();
      setFormData({
        company_name: '', contact_person: '', phone_number: '',
        address: '', city: '', email: '', credit_limit: ''
      });
    } else {
      showToast("Error adding supplier.");
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const res = await fetch(`http://localhost:5000/api/suppliers/${deleteConfirm.id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchSuppliers();
      showToast("Supplier deleted.");
    } else {
      showToast("Error deleting supplier.");
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative transition-colors">
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-2xl z-50 font-bold border-l-4 border-blue-500 animate-pulse">
          {toast}
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-96 p-6 border border-transparent dark:border-slate-700">
            <h3 className="font-black text-xl mb-4 dark:text-white">Confirm Deletion</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Are you sure you want to delete <span className="font-bold">"{deleteConfirm.company_name}"</span>?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="w-1/2 bg-slate-200 dark:bg-slate-800 dark:text-white font-bold py-3 rounded-xl transition-colors">Cancel</button>
              <button onClick={executeDelete} className="w-1/2 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          <Building2 className="text-blue-600 dark:text-blue-400" size={32} /> Supplier Directory
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your vendors and contact information.</p>
      </div>

      {/* ADD SUPPLIER FORM */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input type="text" placeholder="Company Name *" className="p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} required />
          <input type="text" placeholder="Contact Person" className="p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
          <input type="text" placeholder="Phone Number" className="p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input type="text" placeholder="Address" className="col-span-2 p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          <input type="text" placeholder="City" className="p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <input type="email" placeholder="Email Address" className="p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="number" step="0.01" placeholder="Credit Limit (LKR)" className="p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 dark:text-slate-300" value={formData.credit_limit} onChange={e => setFormData({...formData, credit_limit: e.target.value})} />
          <button type="submit" className="bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm">
            <Save size={20} /> Save Supplier
          </button>
        </div>
      </form>

      {/* SUPPLIERS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex-1 transition-colors">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-700 dark:text-slate-300">
            <tr>
              <th className="p-4 font-bold">Company</th>
              <th className="p-4 font-bold">Contact</th>
              <th className="p-4 font-bold">Phone</th>
              <th className="p-4 font-bold">Email</th>
              <th className="p-4 font-bold">City</th>
              <th className="p-4 font-bold text-right">Credit Limit</th>
              <th className="p-4 font-bold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {suppliers.length === 0 && (
              <tr><td colSpan="7" className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">No suppliers added yet.</td></tr>
            )}
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4 font-black text-slate-800 dark:text-white">{s.company_name}</td>
                <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">{s.contact_person || '-'}</td>
                <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{s.phone_number || '-'}</td>
                <td className="p-4 text-blue-600 dark:text-blue-400 font-medium">{s.email || '-'}</td>
                <td className="p-4 text-slate-600 dark:text-slate-300">{s.city || '-'}</td>
                <td className="p-4 font-bold text-slate-700 dark:text-slate-200 text-right">
                  LKR {Number(s.credit_limit || 0).toFixed(2)}
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => setDeleteConfirm({ id: s.id, company_name: s.company_name })} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}