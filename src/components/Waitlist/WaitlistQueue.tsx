import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { Clock, Plus, Trash2, ArrowUpRight } from 'lucide-react';
import type { WaitlistRecord } from '../../types';

export const WaitlistQueue: React.FC = () => {
  const { waitlist, customers, services, employees, branches, refreshData, dispatchAuditLog, selectedBranchId } = useApp();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: customers[0]?.id || '',
    serviceId: services[0]?.id || '',
    employeeId: employees[0]?.id || '',
    branchId: selectedBranchId === 'all' ? (branches[0]?.id || '') : selectedBranchId,
    date: new Date().toISOString().split('T')[0],
    timeSlotPreference: 'Any' as 'Morning' | 'Afternoon' | 'Evening' | 'Any',
    notes: ''
  });

  const filteredWaitlist = waitlist.filter(w => {
    const branchMatch = selectedBranchId === 'all' || w.branchId === selectedBranchId;
    return branchMatch && w.status === 'Waiting';
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const org = "org-smilecare-pro";
    await db.waitlist.create(org, {
      branchId: formData.branchId,
      customerId: formData.customerId,
      serviceId: formData.serviceId,
      employeeId: formData.employeeId || undefined,
      date: formData.date,
      timeSlotPreference: formData.timeSlotPreference,
      notes: formData.notes,
      status: 'Waiting'
    });

    await dispatchAuditLog("Waitlist Created", `Added customer ID ${formData.customerId} to waitlist queue.`);
    setModalOpen(false);
    await refreshData();
  };

  const handlePromote = async (item: WaitlistRecord) => {
    const org = "org-smilecare-pro";
    const selectedSrv = services.find(s => s.id === item.serviceId);
    
    const res = await db.reservations.create(org, {
      branchId: item.branchId,
      customerId: item.customerId,
      serviceId: item.serviceId,
      employeeId: item.employeeId || employees[0]?.id,
      date: item.date,
      time: "09:00",
      duration: selectedSrv ? selectedSrv.duration : 30,
      notes: `Promoted from Waitlist. Notes: ${item.notes}`,
      status: 'Pending',
      paymentStatus: 'Unpaid',
      paymentDetails: {
        method: 'Cash',
        amount: selectedSrv ? selectedSrv.price : 0
      }
    });

    // Mark waitlist as Promoted
    await db.waitlist.update(org, item.id, { status: 'Promoted' });
    await dispatchAuditLog("Waitlist Promoted", `Successfully promoted waitlist ID ${item.id} to Reservation ID ${res.id}`);
    await refreshData();
  };

  const handleCancel = async (id: string) => {
    if (window.confirm("Remove this customer from the waitlist?")) {
      const org = "org-smilecare-pro";
      await db.waitlist.update(org, id, { status: 'Cancelled' });
      await dispatchAuditLog("Waitlist Cancelled", `Cancelled waitlist entry ID ${id}`);
      await refreshData();
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Waitlist Queue Management</h2>
          <p className="text-xs text-slate-500">Track and promote clients waiting for schedule openings</p>
        </div>
        
        <button 
          onClick={() => setModalOpen(true)}
          className="btn-primary px-3 py-2 text-xs flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Add to Waitlist</span>
        </button>
      </div>

      {filteredWaitlist.length === 0 ? (
        <div className="card p-12 text-center border-slate-200 rounded-2xl">
          <Clock className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700">Waitlist is currently empty</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">Clients added to the queue will appear here. When bookings are cancelled, you can promote them instantly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWaitlist.map((item) => {
            const cust = customers.find(c => c.id === item.customerId);
            const srv = services.find(s => s.id === item.serviceId);
            const emp = employees.find(e => e.id === item.employeeId);
            const br = branches.find(b => b.id === item.branchId);

            return (
              <div key={item.id} className="card p-5 rounded-2xl relative border-slate-200 flex flex-col justify-between hover:border-brand-300 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {item.timeSlotPreference} Preference
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{item.date}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{cust?.fullName || 'Unknown Patient'}</h4>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">{srv?.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <span>Preferred Doctor: {emp?.name || 'Any Available'}</span>
                    </p>
                  </div>

                  {item.notes && (
                    <div className="bg-slate-50/40 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-400 font-medium">
                      {item.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 mt-5 pt-3 border-t border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                    {br?.name}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCancel(item.id)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs"
                      title="Cancel Waitlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handlePromote(item)}
                      className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-700 text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 border border-brand-500/20"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>Promote</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add to Waitlist Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add to Waitlist</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Patient</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                  className="w-full input-field text-xs"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Service</label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                  className="w-full input-field text-xs"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Preferred Staff</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full input-field text-xs"
                >
                  <option value="">Any Staff</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Slot Preference</label>
                  <select
                    value={formData.timeSlotPreference}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeSlotPreference: e.target.value as any }))}
                    className="w-full input-field text-xs"
                  >
                    <option value="Any">Any Time</option>
                    <option value="Morning">Morning (09:00 - 12:00)</option>
                    <option value="Afternoon">Afternoon (12:00 - 15:00)</option>
                    <option value="Evening">Evening (15:00 - 18:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full input-field text-xs"
                  placeholder="E.g., urgent booking, VIP customer..."
                />
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
                  Add to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
