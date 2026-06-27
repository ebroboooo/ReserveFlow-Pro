import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { CustomerProfile } from './CustomerProfile';
import { Search, UserPlus, Filter, Phone, Mail, Award } from 'lucide-react';

export const CustomerDatabase: React.FC = () => {
  const { customers, refreshData, dispatchAuditLog, settings } = useApp();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  
  // Add Customer modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    notes: '',
    tags: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const currency = settings?.currency || 'USD';

  // Get unique tags for filtering
  const allTags = Array.from(
    new Set(customers.flatMap(c => c.tags || []))
  );

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.phone.includes(searchQuery) || 
                          c.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = tagFilter === 'all' || c.tags.includes(tagFilter);
    return matchesSearch && matchesTag;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const org = "org-reserveflow-pro";
    
    const tagArray = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    await db.customers.create(org, {
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      notes: formData.notes,
      tags: tagArray,
      status: formData.status
    });

    await dispatchAuditLog("Customer Registered", `Added new customer profile: ${formData.fullName}`);
    setModalOpen(false);
    // Reset form
    setFormData({ fullName: '', phone: '', email: '', notes: '', tags: '', status: 'Active' });
    await refreshData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete profile for ${name}?`)) {
      const org = "org-reserveflow-pro";
      await db.customers.delete(org, id);
      await dispatchAuditLog("Customer Deleted", `Removed customer profile: ${name}`);
      if (selectedCustomerId === id) setSelectedCustomerId(null);
      await refreshData();
    }
  };

  if (selectedCustomerId) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedCustomerId(null)}
          className="glass-btn-secondary px-4 py-2 text-xs"
        >
          ← Back to Customer Database
        </button>
        <CustomerProfile customerId={selectedCustomerId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Customer Database</h2>
          <p className="text-xs text-slate-500">Manage client contact details, tags, logs, and total spendings</p>
        </div>
        
        <button 
          onClick={() => setModalOpen(true)}
          className="glass-btn-primary px-3 py-2 text-xs flex items-center gap-1.5"
        >
          <UserPlus className="h-4 w-4" />
          <span>Register Customer</span>
        </button>
      </div>

      {/* Search & Filter Header Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input text-xs pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Filter by Tag (All)</option>
            {allTags.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Directory List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center border-slate-800/60 rounded-2xl">
            <Search className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-300">No customers found</h4>
            <p className="text-xs text-slate-550 mt-1">Refine your search parameters or register a new customer.</p>
          </div>
        ) : (
          filteredCustomers.map(cust => (
            <div 
              key={cust.id} 
              className="glass-card p-5 rounded-2xl border-slate-850 flex flex-col justify-between hover:border-brand-500/30 hover:-translate-y-0.5 transition-all group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850/60 pb-3">
                  <div>
                    <h4 
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className="font-bold text-white text-base hover:text-brand-300 cursor-pointer transition-colors"
                    >
                      {cust.fullName}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{cust.status}</span>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-slate-850 flex items-center justify-center font-extrabold text-brand-300 border border-slate-800">
                    {cust.fullName.charAt(0)}
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-400">
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    <span>{cust.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    <span className="truncate max-w-[200px]">{cust.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Award className="h-3.5 w-3.5 text-green-500" />
                    <span className="font-semibold text-slate-200">Spending: {cust.totalSpending} {currency}</span>
                  </p>
                </div>

                {/* Tags */}
                {cust.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cust.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-bold bg-slate-900/60 text-slate-400 px-2 py-0.5 rounded-md border border-slate-850/40">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 mt-6 pt-3 border-t border-slate-850/60">
                <button
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className="text-xs text-brand-400 hover:text-brand-300 font-bold tracking-wide"
                >
                  View Profile Timeline →
                </button>
                
                <button
                  onClick={() => handleDelete(cust.id, cust.fullName)}
                  className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-400 font-semibold transition-opacity"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Register Customer Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-4">Register Customer</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="VIP, Regular, Local..."
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="glass-btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-btn-primary px-4 py-2 text-xs"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
