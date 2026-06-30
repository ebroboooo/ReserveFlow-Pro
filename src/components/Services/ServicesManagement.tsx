import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import type { Service } from '../../types';
import { Plus, Edit3, Trash2, DollarSign, Clock } from 'lucide-react';

export const ServicesManagement: React.FC = () => {
  const { services, branches, refreshData, dispatchAuditLog, settings } = useApp();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    duration: 30,
    price: 50,
    category: 'General',
    status: 'Active' as 'Active' | 'Inactive',
    selectedBranches: [] as string[]
  });

  const currency = settings?.currency || 'USD';

  const handleOpenCreate = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      duration: 30,
      price: 50,
      category: 'General',
      status: 'Active',
      selectedBranches: branches.map(b => b.id)
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (srv: Service) => {
    setFormData({
      id: srv.id,
      name: srv.name,
      description: srv.description,
      duration: srv.duration,
      price: srv.price,
      category: srv.category,
      status: srv.status,
      selectedBranches: srv.branchIds || []
    });
    setModalOpen(true);
  };

  const handleBranchToggle = (branchId: string) => {
    setFormData(prev => {
      const active = prev.selectedBranches.includes(branchId)
        ? prev.selectedBranches.filter(id => id !== branchId)
        : [...prev.selectedBranches, branchId];
      return { ...prev, selectedBranches: active };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const org = "org-smilecare-pro";
    const payload = {
      name: formData.name,
      description: formData.description,
      duration: Number(formData.duration),
      price: Number(formData.price),
      category: formData.category,
      status: formData.status,
      branchIds: formData.selectedBranches
    };

    if (formData.id) {
      await db.services.update(org, formData.id, payload);
      await dispatchAuditLog("Service Updated", `Modified service details: ${formData.name}`);
    } else {
      await db.services.create(org, payload);
      await dispatchAuditLog("Service Created", `Added new service option: ${formData.name}`);
    }

    setModalOpen(false);
    await refreshData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove the service: ${name}?`)) {
      const org = "org-smilecare-pro";
      await db.services.delete(org, id);
      await dispatchAuditLog("Service Deleted", `Removed service: ${name}`);
      await refreshData();
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Services Catalog</h2>
          <p className="text-xs text-slate-500">Configure bookable services, default prices, and durations</p>
        </div>
        
        <button 
          onClick={handleOpenCreate}
          className="btn-primary px-3 py-2 text-xs flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Add Dental Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(srv => (
          <div key={srv.id} className="card p-5 rounded-2xl border-slate-200 flex flex-col justify-between hover:border-brand-300 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  {srv.category}
                </span>
                <span className={`h-2.5 w-2.5 rounded-full ${srv.status === 'Active' ? 'bg-green-500' : 'bg-slate-650'}`} />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-base">{srv.name}</h4>
                <p className="text-xs text-slate-400 font-semibold line-clamp-2 mt-1 leading-relaxed">
                  {srv.description}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 pt-1">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-brand-600" /> {srv.duration} min</span>
                <span className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-green-500" /> {srv.price} {currency}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-6 pt-3 border-t border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium">
                Active in {srv.branchIds?.length || 0} branches
              </span>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(srv)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-700/80 text-slate-700 hover:text-slate-900 rounded-lg text-xs"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(srv.id, srv.name)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save Service Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {formData.id ? 'Edit Service' : 'Add Dental Service'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="w-full input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Price ({currency})</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full input-field text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Branch Scope Assignment</label>
                <div className="space-y-2 mt-2 max-h-24 overflow-y-auto border border-slate-200 p-2 rounded-xl">
                  {branches.map(b => (
                    <label key={b.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.selectedBranches.includes(b.id)}
                        onChange={() => handleBranchToggle(b.id)}
                        className="rounded bg-slate-50 border-slate-200 text-brand-500 focus:ring-brand-500/30"
                      />
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full input-field text-xs"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 text-xs"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
