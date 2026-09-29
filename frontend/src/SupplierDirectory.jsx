import React, { useState, useEffect } from 'react';
import { Save, Trash2, Building2, Plus, Phone, Mail, MapPin, CreditCard } from 'lucide-react';
import { Page, Card, StatCard, Button, IconButton, SearchInput, Modal, ConfirmModal, Toast, EmptyRow, Avatar, money, inputCls, labelCls, thCls, tdCls, trCls, cx } from './ui';

export default function SupplierDirectory() {
  const [suppliers, setSuppliers] = useState([]);
  const [toast, setToast] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

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
      setShowAddModal(false);
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

  const q = search.toLowerCase();
  const filtered = suppliers.filter(s =>
    [s.company_name, s.contact_person, s.phone_number, s.city, s.email].some(v => (v || '').toLowerCase().includes(q))
  );
  const cities = new Set(suppliers.map(s => (s.city || '').trim()).filter(Boolean));
  const totalCredit = suppliers.reduce((a, s) => a + (Number(s.credit_limit) || 0), 0);

  const field = (key, label, props = {}) => (
    <div className={props.span || ''}>
      <label className={labelCls}>{label}</label>
      <input type={props.type || 'text'} step={props.step} className={inputCls} value={formData[key]} onChange={e => setFormData({...formData, [key]: e.target.value})} required={props.required} autoFocus={props.autoFocus} />
    </div>
  );

  return (
    <Page>
      <Toast message={toast} />

      {deleteConfirm && (
        <ConfirmModal title="Confirm Deletion" icon={Trash2} confirmLabel="Delete"
          message={<>Are you sure you want to delete <b className="text-slate-900 dark:text-white">"{deleteConfirm.company_name}"</b>?</>}
          onConfirm={executeDelete} onCancel={() => setDeleteConfirm(null)} />
      )}

      {showAddModal && (
        <Modal title="Add Supplier" subtitle="Vendor contact and credit details" icon={Building2} width="max-w-2xl" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {field('company_name', 'Company Name *', { required: true, autoFocus: true })}
              {field('contact_person', 'Contact Person')}
              {field('phone_number', 'Phone Number')}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {field('address', 'Address', { span: 'col-span-2' })}
              {field('city', 'City')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field('email', 'Email Address', { type: 'email' })}
              {field('credit_limit', 'Credit Limit (LKR)', { type: 'number', step: '0.01' })}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1"><Save size={16} /> Save Supplier</Button>
            </div>
          </form>
        </Modal>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="Total Suppliers" sub="Active vendors" value={suppliers.length} icon={Building2} bars={false} />
        <StatCard label="Cities Covered" sub="Supplier locations" value={cities.size} icon={MapPin} tone="green" bars={false} />
        <StatCard label="Total Credit Limit" sub="Across all suppliers" value={money(totalCredit)} icon={CreditCard} tone="purple" bars={false} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Supplier Directory</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{filtered.length} of {suppliers.length} suppliers</p>
          </div>
          <div className="flex gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search company, contact, city..." className="w-72" />
            <Button onClick={() => setShowAddModal(true)}><Plus size={16}/> Add Supplier</Button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className={thCls}>Company</th>
              <th className={thCls}>Contact</th>
              <th className={thCls}>Phone</th>
              <th className={thCls}>Email</th>
              <th className={thCls}>City</th>
              <th className={cx(thCls, 'text-right')}>Credit Limit</th>
              <th className={cx(thCls, 'text-center')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <EmptyRow colSpan={7}>{suppliers.length ? 'No suppliers match your search.' : 'No suppliers added yet.'}</EmptyRow>}
            {filtered.map(s => (
              <tr key={s.id} className={trCls}>
                <td className={tdCls}>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.company_name} />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{s.company_name}</p>
                      {s.address && <p className="text-xs text-slate-400 truncate max-w-[220px]">{s.address}</p>}
                    </div>
                  </div>
                </td>
                <td className={tdCls}>{s.contact_person || '-'}</td>
                <td className={cx(tdCls, 'font-mono')}>{s.phone_number ? <span className="inline-flex items-center gap-1.5"><Phone size={12} className="text-slate-400"/>{s.phone_number}</span> : '-'}</td>
                <td className={tdCls}>{s.email ? <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"><Mail size={12}/>{s.email}</a> : '-'}</td>
                <td className={tdCls}>{s.city || '-'}</td>
                <td className={cx(tdCls, 'text-right font-semibold text-slate-900 dark:text-white')}>{money(s.credit_limit)}</td>
                <td className={cx(tdCls, 'text-center')}>
                  <IconButton tone="red" onClick={() => setDeleteConfirm({ id: s.id, company_name: s.company_name })} title="Delete"><Trash2 size={16} /></IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Page>
  );
}
