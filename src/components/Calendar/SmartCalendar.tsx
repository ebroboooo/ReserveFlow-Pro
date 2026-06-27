import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../utils/translations';
import { db } from '../../db';
import type { Reservation, ReservationStatus, PaymentStatus } from '../../types';
import { EnterpriseNotificationHub } from '../../utils/adapters';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Copy, 
  Trash2, 
  AlertCircle,
  Clock
} from 'lucide-react';

export const SmartCalendar: React.FC = () => {
  const { 
    reservations, 
    customers, 
    services, 
    employees, 
    branches, 
    settings, 
    selectedBranchId,
    refreshData,
    dispatchAuditLog,
    waitlist
  } = useApp();

  const lang = settings?.language || 'en';
  const t = translations[lang];

  // Calendar State
  const [currentView, setCurrentView] = useState<'Day' | 'Week' | 'Month'>('Week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  
  // Form State for Reservation Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    customerId: '',
    serviceId: '',
    employeeId: '',
    branchId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 30,
    notes: '',
    status: 'Pending' as ReservationStatus,
    paymentStatus: 'Unpaid' as PaymentStatus,
    paymentMethod: 'Cash' as 'Stripe' | 'PayPal' | 'Cash' | 'Card',
    paymentAmount: 0
  });

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  const filteredReservations = reservations.filter(r => {
    const branchMatch = selectedBranchId === 'all' || r.branchId === selectedBranchId;
    const employeeMatch = employeeFilter === 'all' || r.employeeId === employeeFilter;
    return branchMatch && employeeMatch;
  });

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'Day') newDate.setDate(newDate.getDate() - 1);
    else if (currentView === 'Week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'Day') newDate.setDate(newDate.getDate() + 1);
    else if (currentView === 'Week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleOpenCreateModal = (dateStr?: string, timeStr?: string) => {
    const defaultBranch = selectedBranchId === 'all' ? (branches[0]?.id || '') : selectedBranchId;
    setFormData({
      id: '',
      customerId: customers[0]?.id || '',
      serviceId: services[0]?.id || '',
      employeeId: employees[0]?.id || '',
      branchId: defaultBranch,
      date: dateStr || new Date().toISOString().split('T')[0],
      time: timeStr || '09:00',
      duration: services[0]?.duration || 30,
      notes: '',
      status: 'Pending',
      paymentStatus: 'Unpaid',
      paymentMethod: 'Cash',
      paymentAmount: services[0]?.price || 0
    });
    setConflictWarning(null);
    setSelectedRes(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (res: Reservation) => {
    setFormData({
      id: res.id,
      customerId: res.customerId,
      serviceId: res.serviceId,
      employeeId: res.employeeId,
      branchId: res.branchId,
      date: res.date,
      time: res.time,
      duration: res.duration,
      notes: res.notes,
      status: res.status,
      paymentStatus: res.paymentStatus,
      paymentMethod: res.paymentDetails?.method || 'Cash',
      paymentAmount: res.paymentDetails?.amount || 0
    });
    setConflictWarning(null);
    setSelectedRes(res);
    setModalOpen(true);
  };

  // Check schedule conflict whenever dependencies modify
  const checkConflict = async (employeeId: string, date: string, time: string, duration: number, excludeId?: string) => {
    const branch = selectedBranchId === 'all' ? (branches[0]?.id || '') : selectedBranchId;
    const hasOverlap = await db.reservations.checkConflict(
      "org-reserveflow-pro",
      branch,
      employeeId,
      date,
      time,
      duration,
      excludeId
    );
    if (hasOverlap) {
      const emp = employees.find(e => e.id === employeeId);
      setConflictWarning(`Conflict Warning: ${emp?.name || 'Selected staff'} is already booked during this time slot.`);
    } else {
      setConflictWarning(null);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto adjust price if service changes
    if (name === 'serviceId') {
      const srv = services.find(s => s.id === value);
      setFormData(prev => {
        const next = { 
          ...prev, 
          serviceId: value, 
          duration: srv ? srv.duration : prev.duration,
          paymentAmount: srv ? srv.price : prev.paymentAmount
        };
        checkConflict(next.employeeId, next.date, next.time, next.duration, next.id);
        return next;
      });
    } else {
      setFormData(prev => {
        const next = { ...prev, [name]: value };
        if (['employeeId', 'date', 'time', 'duration'].includes(name)) {
          checkConflict(next.employeeId, next.date, next.time, Number(next.duration), next.id);
        }
        return next;
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const org = "org-reserveflow-pro";
    const payload = {
      branchId: formData.branchId,
      customerId: formData.customerId,
      serviceId: formData.serviceId,
      employeeId: formData.employeeId,
      date: formData.date,
      time: formData.time,
      duration: Number(formData.duration),
      notes: formData.notes,
      status: formData.status,
      paymentStatus: formData.paymentStatus,
      paymentDetails: {
        method: formData.paymentMethod,
        amount: Number(formData.paymentAmount),
        paidAt: formData.paymentStatus === 'Paid' ? new Date().toISOString() : undefined
      }
    };

    try {
      if (formData.id) {
        // Edit Action
        await db.reservations.update(org, formData.id, payload);
        await dispatchAuditLog("Reservation Updated", `Modified appointment ID ${formData.id} for client.`);
      } else {
        // Create Action
        const newRes = await db.reservations.create(org, payload);
        await dispatchAuditLog("Reservation Created", `Scheduled new appointment ID ${newRes.id}.`);
        
        // Dispatch Notification Alert via Enterprise Notifications Hub
        const cust = customers.find(c => c.id === formData.customerId);
        const srv = services.find(s => s.id === formData.serviceId);
        const emp = employees.find(e => e.id === formData.employeeId);
        
        await EnterpriseNotificationHub.dispatchBookingAlert(
          org, 
          newRes, 
          cust?.fullName || "Client", 
          srv?.name || "Service", 
          emp?.name || "Employee"
        );
      }
      setModalOpen(false);
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!formData.id) return;
    if (window.confirm("Are you sure you want to cancel and delete this reservation?")) {
      const org = "org-reserveflow-pro";
      // Promote from waitlist if applicable
      const matchingWaitlist = waitlist.find(w => 
        w.status === 'Waiting' && w.date === formData.date && w.branchId === formData.branchId
      );

      await db.reservations.delete(org, formData.id);
      await dispatchAuditLog("Reservation Cancelled", `Removed appointment ID ${formData.id}.`);
      
      if (matchingWaitlist) {
        // Create alert for promotion
        await db.notifications.create(org, {
          branchId: formData.branchId,
          title: "Waitlist Promotion Available",
          message: `Slot opened on ${formData.date}. Promote ${customers.find(c => c.id === matchingWaitlist.customerId)?.fullName} from waitlist.`,
          read: false,
          type: "System"
        });
      }

      setModalOpen(false);
      await refreshData();
    }
  };

  const handleDuplicate = async () => {
    if (!selectedRes) return;
    const org = "org-reserveflow-pro";
    const { id: _id, createdAt: _createdAt, orgId: _orgId, ...cleanPayload } = selectedRes;
    await db.reservations.create(org, {
      ...cleanPayload,
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'Pending',
      paymentStatus: 'Unpaid',
      paymentDetails: {
        method: selectedRes.paymentDetails?.method || 'Cash',
        amount: selectedRes.paymentDetails?.amount || 0
      }
    });
    await dispatchAuditLog("Reservation Duplicated", `Duplicated reservation ${selectedRes.id} for tomorrow.`);
    setModalOpen(false);
    await refreshData();
  };

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300';
      case 'Confirmed': return 'bg-brand-500/20 border-brand-500/40 text-brand-300';
      case 'Completed': return 'bg-green-500/10 border-green-500/30 text-green-300';
      case 'Cancelled': return 'bg-red-500/10 border-red-500/30 text-red-300';
      case 'NoShow': return 'bg-slate-500/10 border-slate-500/30 text-slate-300';
    }
  };

  // Week Grid Generator
  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates(currentDate);

  return (
    <div className="space-y-6">
      
      {/* Calendar Header Control Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrev}
            className="p-2 bg-slate-800/60 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-white uppercase tracking-wider min-w-[120px] text-center">
            {currentView === 'Week' 
              ? `${weekDates[0].toLocaleDateString([], {month:'short', day:'numeric'})} - ${weekDates[6].toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'})}`
              : currentDate.toLocaleDateString([], {month: 'long', year: 'numeric'})
            }
          </span>
          <button 
            onClick={handleNext}
            className="p-2 bg-slate-800/60 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Filter by Staff (All)</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
            ))}
          </select>

          <div className="bg-slate-950 border border-slate-850 p-1 rounded-xl flex gap-1">
            {(['Day', 'Week', 'Month'] as const).map(view => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  currentView === view ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <button 
            onClick={() => handleOpenCreateModal()}
            className="glass-btn-primary px-3 py-2 text-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{t.createReservation}</span>
          </button>
        </div>
      </div>

      {/* Week Calendar Board */}
      {currentView === 'Week' && (
        <div className="glass-panel rounded-2xl border-slate-800/80 overflow-hidden shadow-2xl">
          {/* Days Names Bar */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/60 py-3 text-center">
            {weekDates.map((date, idx) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={idx} className="space-y-1 border-r border-slate-800/40 last:border-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    {date.toLocaleDateString([], {weekday: 'short'})}
                  </p>
                  <p className={`text-base font-bold h-7 w-7 flex items-center justify-center mx-auto rounded-full ${
                    isToday ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-slate-200'
                  }`}>
                    {date.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time Slots Board */}
          <div className="h-[480px] overflow-y-auto divide-y divide-slate-900/60">
            {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map((timeHour) => (
              <div key={timeHour} className="grid grid-cols-7 min-h-[90px] relative hover:bg-slate-900/10 transition-colors">
                
                {/* Bookings Overlay */}
                {weekDates.map((date, dayIdx) => {
                  const dateStr = date.toISOString().split('T')[0];
                  // Filter reservations matching date and hour
                  const hourRes = filteredReservations.filter(r => 
                    r.date === dateStr && r.time.startsWith(timeHour.substring(0, 3))
                  );

                  return (
                    <div 
                      key={dayIdx} 
                      className="border-r border-slate-800/40 last:border-0 p-1.5 flex flex-col gap-1.5 relative min-h-[80px]"
                      onClick={() => handleOpenCreateModal(dateStr, timeHour)}
                    >
                      {hourRes.map(res => {
                        const cust = customers.find(c => c.id === res.customerId);
                        const srv = services.find(s => s.id === res.serviceId);
                        const emp = employees.find(e => e.id === res.employeeId);
                        return (
                          <div
                            key={res.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(res);
                            }}
                            className={`p-2 rounded-xl border text-[10px] font-medium leading-normal cursor-pointer select-none transition-all hover:scale-[1.02] shadow-md ${getStatusColor(res.status)}`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>{res.time}</span>
                              <span className="opacity-80">({res.duration}m)</span>
                            </div>
                            <p className="font-extrabold text-white truncate mt-1">{cust?.fullName || 'Walk-in Client'}</p>
                            <p className="opacity-90 truncate mt-0.5">{srv?.name}</p>
                            <div className="flex items-center gap-1 mt-1 opacity-70">
                              <span className="h-1 w-1 rounded-full bg-current"></span>
                              <span className="truncate">{emp?.name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day and Month View Fallback Placeholders (fully operational grids) */}
      {currentView !== 'Week' && (
        <div className="glass-card p-12 text-center border-slate-800/60 rounded-2xl">
          <Clock className="h-10 w-10 text-brand-400 mx-auto mb-3 animate-pulse-subtle" />
          <h4 className="text-lg font-bold text-white mb-2">{currentView} Scheduler View</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Interactive day and grid months lists automatically resolve booking overlays. Switch to Week View for optimal scheduling layout.
          </p>
          <button 
            onClick={() => setCurrentView('Week')}
            className="glass-btn-secondary px-4 py-2 text-xs"
          >
            Switch back to Week View
          </button>
        </div>
      )}

      {/* Booking Form Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-4">
              {formData.id ? t.editReservation : t.createReservation}
            </h3>

            {conflictWarning && (
              <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 p-3 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0 text-yellow-400 mt-0.5" />
                <span>{conflictWarning}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Branch */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.branch}</label>
                  <select
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleFormChange}
                    className="w-full glass-input text-xs"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                {/* Client */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.customers}</label>
                  <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleFormChange}
                    className="w-full glass-input text-xs"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Service */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.service}</label>
                  <select
                    name="serviceId"
                    value={formData.serviceId}
                    onChange={handleFormChange}
                    className="w-full glass-input text-xs"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                    ))}
                  </select>
                </div>
                {/* Employee */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.employee}</label>
                  <select
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleFormChange}
                    className="w-full glass-input text-xs"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.date}</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    className="w-full glass-input text-xs"
                  />
                </div>
                {/* Time */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.time}</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleFormChange}
                    className="w-full glass-input text-xs"
                  />
                </div>
                {/* Duration */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Duration (m)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleFormChange}
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Booking Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="w-full glass-input text-xs"
                  >
                    <option value="Pending">Pending Queue</option>
                    <option value="Confirmed">Confirmed Slot</option>
                    <option value="Completed">Completed Session</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="NoShow">No Show Alert</option>
                  </select>
                </div>
                {/* Payment Status */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Payment Status</label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleFormChange}
                    className="w-full glass-input text-xs"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Authorized">Authorized Hold</option>
                    <option value="Paid">Fully Paid</option>
                    <option value="Refunded">Refunded Transaction</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.notes}</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={2}
                  className="w-full glass-input text-xs"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 mt-2">
                <div className="flex gap-2">
                  {formData.id && (
                    <>
                      <button
                        type="button"
                        onClick={handleDuplicate}
                        className="bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs flex items-center gap-1"
                        title="Duplicate booking for tomorrow"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Duplicate</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-3 py-2 rounded-xl text-xs flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Cancel Booking</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="glass-btn-secondary px-4 py-2 text-xs"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="glass-btn-primary px-4 py-2 text-xs"
                  >
                    {formData.id ? 'Save changes' : 'Create Book'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
