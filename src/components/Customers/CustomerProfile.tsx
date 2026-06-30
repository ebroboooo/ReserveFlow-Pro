import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { translations } from '../../utils/translations';
import { 
  Phone, 
  Mail, 
  Calendar, 
  Plus, 
  Clock, 
  MessageSquare
} from 'lucide-react';

interface Props {
  customerId: string;
}

export const CustomerProfile: React.FC<Props> = ({ customerId }) => {
  const { customers, reservations, services, employees, settings, refreshData, dispatchAuditLog } = useApp();
  
  const customer = customers.find(c => c.id === customerId);
  const [newNote, setNewNote] = useState('');
  const lang = settings?.language || 'en';
  const t = translations[lang];

  if (!customer) {
    return <div className="text-red-500 text-sm">Patient profile not found.</div>;
  }

  // Filter reservations
  const customerReservations = reservations
    .filter(r => r.customerId === customerId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const upcomingReservations = customerReservations.filter(r => r.status === 'Pending' || r.status === 'Confirmed');
  const pastReservations = customerReservations.filter(r => r.status === 'Completed' || r.status === 'Cancelled' || r.status === 'NoShow');

  const currency = settings?.currency || 'USD';

  // Handle adding notes
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const org = "org-smilecare-pro";
    const updatedNotes = customer.notes 
      ? `${customer.notes}\n\n[${new Date().toLocaleDateString()}] ${newNote}`
      : `[${new Date().toLocaleDateString()}] ${newNote}`;

    await db.customers.update(org, customer.id, { notes: updatedNotes });
    await dispatchAuditLog("Patient Note Added", `Added clinical note for patient ${customer.fullName}`);
    setNewNote('');
    await refreshData();
  };

  // Convert notes text to array of logs for timeline presentation
  const parseNotesTimeline = (notesText: string) => {
    if (!notesText) return [];
    return notesText.split('\n\n').filter(Boolean).map((block, idx) => {
      const dateMatch = block.match(/^\[(.*?)\]\s*(.*)/s);
      if (dateMatch) {
        return {
          id: idx,
          date: dateMatch[1],
          text: dateMatch[2]
        };
      }
      return {
        id: idx,
        date: 'Log Note',
        text: block
      };
    });
  };

  const timelineLogs = parseNotesTimeline(customer.notes).reverse();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Profile Overview Card */}
      <div className="card p-6 rounded-3xl border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-5 z-10">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-violet-600 text-white flex items-center justify-center font-extrabold text-2xl border border-brand-500/20 shadow-lg">
            {customer.fullName.charAt(0)}
          </div>
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-xl font-bold text-slate-900">{customer.fullName}</h3>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{customer.phone}</span>
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{customer.email}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 z-10">
          <div className="card bg-slate-50/60 px-5 py-3 rounded-2xl text-center border-slate-200">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t.revenue}</p>
            <p className="text-xl font-extrabold text-green-400 mt-1">{customer.totalSpending} {currency}</p>
          </div>
          <div className="card bg-slate-50/60 px-5 py-3 rounded-2xl text-center border-slate-200">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Bookings</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{customerReservations.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Booking History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upcoming Section */}
          <div className="card p-5 rounded-2xl border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-brand-600" />
              <span>Upcoming Appointments</span>
            </h4>

            {upcomingReservations.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No upcoming appointments scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcomingReservations.map(res => {
                  const srv = services.find(s => s.id === res.serviceId);
                  const emp = employees.find(e => e.id === res.employeeId);
                  return (
                    <div key={res.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">{srv?.name}</p>
                        <p className="text-[10px] text-slate-400">{res.date} at {res.time} • Staff: {emp?.name}</p>
                      </div>
                      <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {res.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past History Table */}
          <div className="card p-5 rounded-2xl border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-slate-400" />
              <span>Past Booking History</span>
            </h4>

            {pastReservations.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No past records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-450 uppercase tracking-widest text-[9px] font-bold">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Service</th>
                      <th className="py-2.5">Staff</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-slate-700 font-semibold">
                    {pastReservations.map(res => {
                      const srv = services.find(s => s.id === res.serviceId);
                      const emp = employees.find(e => e.id === res.employeeId);
                      return (
                        <tr key={res.id} className="hover:bg-white/10">
                          <td className="py-2.5 font-bold text-slate-400">{res.date}</td>
                          <td className="py-2.5 text-slate-900">{srv?.name}</td>
                          <td className="py-2.5">{emp?.name}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold ${
                              res.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {res.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-bold text-slate-800">
                            {res.paymentDetails?.amount || 0} {currency}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Timeline Notes Diary */}
        <div className="space-y-6">
          <div className="card p-5 rounded-2xl border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-brand-600" />
              <span>Notes Timeline Diary</span>
            </h4>

            {/* Note creation */}
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                placeholder="Enter patient status, allergies, treatment notes, or booking preferences..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                className="w-full input-field text-xs"
              />
              <button 
                type="submit" 
                className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1"
              >
                <Plus className="h-4 w-4" />
                <span>Save Note Log</span>
              </button>
            </form>

            {/* Notes Timeline List */}
            <div className="space-y-4 pt-2">
              {timelineLogs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No notes recorded yet.</p>
              ) : (
                <div className="relative border-l border-slate-200 pl-4 space-y-4">
                  {timelineLogs.map((log) => (
                    <div key={log.id} className="relative space-y-1">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1.5 bg-brand-500 h-2.5 w-2.5 rounded-full border border-slate-900 shadow-sm" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 font-extrabold">{log.date}</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white/20 p-2.5 rounded-xl border border-slate-200">
                        {log.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
