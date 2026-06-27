import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import type { LeadStatus } from '../../types';
import { Plus, MoveRight, CheckCircle2 } from 'lucide-react';

const STAGES: LeadStatus[] = ['New', 'Contacted', 'Interested', 'Converted', 'Lost'];

export const LeadsPipeline: React.FC = () => {
  const { leads, refreshData, dispatchAuditLog, settings } = useApp();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    source: 'Google Ads',
    value: 100,
    notes: ''
  });

  const currency = settings?.currency || 'USD';

  // Calculate stats
  const totalPipelineVal = leads.reduce((sum, l) => sum + l.value, 0);
  const activeLeads = leads.filter(l => l.status !== 'Converted' && l.status !== 'Lost').length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const org = "org-reserveflow-pro";
    await db.leads.create(org, {
      branchId: "br-main",
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      source: formData.source,
      status: 'New',
      value: Number(formData.value),
      notes: formData.notes
    });

    await dispatchAuditLog("Lead Captured", `Captured new CRM Lead: ${formData.fullName} ($${formData.value})`);
    setModalOpen(false);
    // Reset Form
    setFormData({ fullName: '', phone: '', email: '', source: 'Google Ads', value: 100, notes: '' });
    await refreshData();
  };

  const handleUpdateStatus = async (id: string, name: string, nextStatus: LeadStatus) => {
    const org = "org-reserveflow-pro";
    await db.leads.update(org, id, { status: nextStatus });
    await dispatchAuditLog("Lead Advanced", `Moved CRM Lead ${name} status to ${nextStatus}`);
    await refreshData();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Lead Management Pipeline</h2>
          <p className="text-xs text-slate-500">Nurture and convert customer leads into verified appointments</p>
        </div>
        
        <button 
          onClick={() => setModalOpen(true)}
          className="glass-btn-primary px-3 py-2 text-xs flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Lead</span>
        </button>
      </div>

      {/* CRM Stats Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 rounded-2xl border-slate-800/60 bg-gradient-to-b from-slate-900/60 to-slate-950/40">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Pipeline Value</p>
          <h4 className="text-2xl font-bold text-brand-300 mt-1">{totalPipelineVal.toLocaleString()} {currency}</h4>
        </div>
        <div className="glass-card p-5 rounded-2xl border-slate-800/60 bg-gradient-to-b from-slate-900/60 to-slate-950/40">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Deals</p>
          <h4 className="text-2xl font-bold text-white mt-1">{activeLeads} Leads</h4>
        </div>
        <div className="glass-card p-5 rounded-2xl border-slate-800/60 bg-gradient-to-b from-slate-900/60 to-slate-950/40">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Lead Acquisition Rate</p>
          <h4 className="text-2xl font-bold text-green-400 mt-1">+24% month-on-month</h4>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage);
          
          return (
            <div key={stage} className="bg-slate-900/20 border border-slate-850 p-4 rounded-2xl min-w-[220px] space-y-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <span className="text-xs font-bold text-white tracking-wide">{stage}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] min-h-[150px]">
                {stageLeads.length === 0 ? (
                  <p className="text-[10px] text-slate-600 text-center py-8">Drop leads here</p>
                ) : (
                  stageLeads.map(lead => (
                    <div key={lead.id} className="glass-card p-4 rounded-xl border-slate-800 flex flex-col justify-between gap-3 bg-slate-900/40 hover:border-brand-500/20 transition-all">
                      <div>
                        <h5 className="text-xs font-bold text-white">{lead.fullName}</h5>
                        <p className="text-[9px] text-brand-400 font-bold mt-0.5">{lead.source}</p>
                        <p className="text-xs font-bold text-slate-200 mt-1">{lead.value} {currency}</p>
                      </div>

                      {lead.notes && (
                        <p className="text-[10px] text-slate-400 italic line-clamp-2 leading-relaxed bg-slate-950/30 p-2 rounded-lg">
                          {lead.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-850/60">
                        <span className="text-[9px] text-slate-500 font-semibold">
                          {new Date(lead.createdAt).toLocaleDateString([], {month:'short', day:'numeric'})}
                        </span>

                        <div className="flex items-center gap-1">
                          {stage !== 'Converted' && (
                            <button
                              onClick={() => handleUpdateStatus(lead.id, lead.fullName, 'Converted')}
                              className="p-1 hover:bg-green-500/10 text-green-500 rounded"
                              title="Mark Converted"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {stage !== 'Lost' && stage !== 'Converted' && (
                            <button
                              onClick={() => {
                                const currIdx = STAGES.indexOf(stage);
                                const nextStage = STAGES[currIdx + 1];
                                if (nextStage) handleUpdateStatus(lead.id, lead.fullName, nextStage);
                              }}
                              className="p-1 hover:bg-brand-500/10 text-brand-400 rounded"
                              title="Advance Lead"
                            >
                              <MoveRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-4">Add CRM Lead</h3>

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Lead Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full glass-input text-xs"
                  >
                    <option value="Google Ads">Google Ads</option>
                    <option value="Instagram Promo">Instagram Promo</option>
                    <option value="Website Contact Form">Website Form</option>
                    <option value="Walk-in Referral">Walk-in Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Forecast Value ({currency})</label>
                  <input
                    type="number"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full glass-input text-xs"
                  placeholder="Details of client requirements..."
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
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
