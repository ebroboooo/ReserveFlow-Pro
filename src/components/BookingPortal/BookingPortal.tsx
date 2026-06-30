import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { mockDbInstance } from '../../db/mockRepository';
import { BusinessNotFound } from './BusinessNotFound';
import { StripeAdapter, PayPalAdapter } from '../../utils/adapters';
import {
  getAvailableSlots, validateBookingForm, isPastDate, type BookingFormErrors
} from '../../utils/bookingValidation';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import {
  Building, Briefcase, Stethoscope, Calendar as CalIcon,
  CreditCard, Smile, CheckCircle, Clock, ArrowRight, ArrowLeft
} from 'lucide-react';

export const BookingPortal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { branches, services, employees, reservations, settings, refreshData, isLoading } = useApp();

  const [step, setStep] = useState(1);
  const [selBranch, setSelBranch] = useState('');
  const [selService, setSelService] = useState('');
  const [selEmployee, setSelEmployee] = useState('');
  const [selDate, setSelDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [selTime, setSelTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [payMethod, setPayMethod] = useState<'Stripe' | 'PayPal' | 'Cash'>('Cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [errors, setErrors] = useState<BookingFormErrors>({});

  useEffect(() => {
    if (branches.length > 0 && !selBranch) setSelBranch(branches[0].id);
    if (services.length > 0 && !selService) setSelService(services[0].id);
    if (employees.length > 0 && !selEmployee) setSelEmployee(employees[0].id);
  }, [branches, services, employees, selBranch, selService, selEmployee]);

  const activeService = services.find(s => s.id === selService);
  const activeEmployee = employees.find(e => e.id === selEmployee);
  const activeBranch = branches.find(b => b.id === selBranch);
  const currency = settings?.currency || 'USD';
  const todayStr = new Date().toISOString().split('T')[0];

  const availableDoctors = useMemo(() =>
    employees.filter(e => e.status === 'Active' && e.branchIds.includes(selBranch)),
    [employees, selBranch]
  );

  const availableServices = useMemo(() =>
    services.filter(s => s.status === 'Active' && s.branchIds.includes(selBranch)),
    [services, selBranch]
  );

  const availableSlots = useMemo(() => {
    if (!activeEmployee || !activeService || !selDate || isPastDate(selDate)) return [];
    return getAvailableSlots(activeEmployee, selDate, activeService.duration, reservations);
  }, [activeEmployee, activeService, selDate, reservations]);

  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.includes(selTime)) {
      setSelTime(availableSlots[0]);
    } else if (availableSlots.length === 0) {
      setSelTime('');
    }
  }, [availableSlots, selTime]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading booking portal..." />
      </div>
    );
  }

  if (!slug || !mockDbInstance.isValidPublicBookingSlug(slug)) {
    return <BusinessNotFound slug={slug} />;
  }

  const validateStep1 = (): boolean => {
    const errs: BookingFormErrors = {};
    if (!selBranch) errs.branch = 'Please select a clinic location';
    if (!selService) errs.service = 'Please select a dental service';
    if (!selEmployee) errs.doctor = 'Please select a doctor';
    if (!selDate) errs.date = 'Please select a date';
    else if (isPastDate(selDate)) errs.date = 'Cannot book appointments in the past';
    if (!selTime) errs.time = availableSlots.length === 0 ? 'No available time slots for this date' : 'Please select a time slot';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs = validateBookingForm(
      { doctorId: selEmployee, serviceId: selService, date: selDate, time: selTime, name: clientName, phone: clientPhone, email: clientEmail },
      activeEmployee, activeService?.duration || 30, reservations
    );
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsProcessing(true);
    const org = 'org-smilecare-pro';

    const hasConflict = await db.reservations.checkConflict(org, selBranch, selEmployee, selDate, selTime, activeService?.duration || 30);
    if (hasConflict) {
      setErrors({ time: 'This time slot was just booked. Please select another.' });
      setIsProcessing(false);
      return;
    }

    let txnId = '';
    if (payMethod === 'Stripe') {
      const res = await new StripeAdapter().processPayment(activeService?.price || 0, activeService?.name || 'Appointment');
      if (res.success) txnId = res.transactionId || '';
    } else if (payMethod === 'PayPal') {
      const res = await new PayPalAdapter().processPayment(activeService?.price || 0, activeService?.name || 'Appointment');
      if (res.success) txnId = res.transactionId || '';
    }

    const patient = await db.customers.create(org, {
      fullName: clientName, phone: clientPhone, email: clientEmail,
      notes: 'Registered via Patient Booking Portal', tags: ['Portal-Booking'], status: 'Active'
    });

    const booking = await db.reservations.create(org, {
      branchId: selBranch, customerId: patient.id, serviceId: selService, employeeId: selEmployee,
      date: selDate, time: selTime, duration: activeService?.duration || 30, notes: clientNotes,
      status: 'Pending',
      paymentStatus: payMethod === 'Cash' ? 'Unpaid' : 'Paid',
      paymentDetails: {
        method: payMethod === 'Cash' ? 'Cash' : payMethod,
        amount: activeService?.price || 0,
        transactionId: txnId || undefined,
        paidAt: payMethod === 'Cash' ? undefined : new Date().toISOString()
      }
    });

    await db.notifications.create(org, {
      branchId: selBranch,
      title: 'New Patient Appointment',
      message: `${clientName} booked ${activeService?.name} on ${selDate} at ${selTime}.`,
      read: false, type: 'BookingCreated'
    });

    setReceiptNumber(booking.id);
    setIsProcessing(false);
    setStep(4);
    await refreshData();
  };

  const stepLabels = ['Select Details', 'Your Information', 'Confirmation'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="bg-brand-600 p-2 rounded-xl text-white"><Smile className="h-5 w-5" /></div>
          </Link>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900">
            {settings?.businessName || 'SmileCare Dental Clinic'}
          </h2>
          <p className="text-sm text-slate-500">Book your dental appointment online</p>
        </div>

        <div className="panel p-6 md:p-8 shadow-elevated">
          {step < 4 && (
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === i + 1 ? 'bg-brand-600 text-white' : step > i + 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}>{i + 1}</span>
                  <span className={`text-xs font-semibold hidden sm:inline ${step === i + 1 ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" /> Clinic Location
                  </label>
                  <select value={selBranch} onChange={(e) => { setSelBranch(e.target.value); setSelService(''); setSelEmployee(''); }} className="input-field">
                    {branches.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> Dental Service
                  </label>
                  <select value={selService} onChange={(e) => setSelService(e.target.value)} className="input-field">
                    {availableServices.map(s => <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>)}
                  </select>
                  {errors.service && <p className="text-xs text-red-500 mt-1">{errors.service}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                    <Stethoscope className="h-3.5 w-3.5" /> Doctor
                  </label>
                  <select value={selEmployee} onChange={(e) => setSelEmployee(e.target.value)} className="input-field">
                    {availableDoctors.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
                  </select>
                  {errors.doctor && <p className="text-xs text-red-500 mt-1">{errors.doctor}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                    <CalIcon className="h-3.5 w-3.5" /> Appointment Date
                  </label>
                  <input type="date" value={selDate} min={todayStr} onChange={(e) => setSelDate(e.target.value)} className="input-field" />
                  {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Available Time Slots
                </label>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    No available slots for this doctor on the selected date. Try a different date or doctor.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {availableSlots.map(time => (
                      <button key={time} type="button" onClick={() => setSelTime(time)}
                        className={`text-xs py-2.5 rounded-xl font-semibold border transition-all ${
                          selTime === time ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300'
                        }`}>{time}</button>
                    ))}
                  </div>
                )}
                {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
              </div>

              {activeService && (
                <div className="p-4 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{activeService.name}</h4>
                    <p className="text-xs text-slate-500">{activeService.duration} min · Dr. {activeEmployee?.name?.replace('Dr. ', '')}</p>
                  </div>
                  <span className="text-lg font-bold text-brand-700">${activeService.price}</span>
                </div>
              )}

              <button onClick={() => { if (validateStep1()) setStep(2); }} className="btn-primary w-full py-3">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h3 className="font-semibold text-slate-900">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name *</label>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="input-field" placeholder="John Doe" />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number *</label>
                  <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="input-field" placeholder="+1 (555) 000-0000" />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email Address *</label>
                <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="input-field" placeholder="john@example.com" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes (Optional)</label>
                <textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} rows={3} className="input-field resize-y" placeholder="Allergies, dental anxiety, special requests..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1"><ArrowLeft className="h-4 w-4" /> Back</button>
                <button onClick={() => { if (validateStep2()) setStep(3); }} className="btn-primary flex-[2]">Continue to Payment</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleCheckout} className="space-y-5">
              <h3 className="font-semibold text-slate-900">Confirm & Pay</h3>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">{activeService?.name}</span><span className="font-semibold">${activeService?.price}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Doctor</span><span>{activeEmployee?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date & Time</span><span className="font-semibold text-brand-700">{selDate} at {selTime}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold"><span>Total</span><span className="text-brand-700">${activeService?.price} {currency}</span></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Cash', 'Stripe', 'PayPal'] as const).map(method => (
                    <button key={method} type="button" onClick={() => setPayMethod(method)}
                      className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                        payMethod === method ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}>
                      {method === 'Cash' ? 'Pay at Clinic' : method === 'Stripe' ? <><CreditCard className="h-4 w-4 mx-auto mb-1" />Card</> : 'PayPal'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                <button type="submit" disabled={isProcessing} className="btn-primary flex-[2]">
                  {isProcessing ? 'Processing...' : `Confirm Appointment`}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="text-center space-y-5 py-4 animate-fade-in">
              <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-slate-900">Appointment Confirmed!</h3>
                <p className="text-sm text-slate-500 mt-1">We look forward to seeing you at the clinic.</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl max-w-sm mx-auto text-left text-sm space-y-2">
                <div className="flex justify-between"><span className="text-slate-500">Reference</span><span className="font-mono font-bold uppercase">{receiptNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Clinic</span><span>{activeBranch?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date & Time</span><span className="font-semibold text-brand-700">{selDate} at {selTime}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Doctor</span><span>{activeEmployee?.name}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Payment</span><span className="font-semibold text-emerald-600">{payMethod === 'Cash' ? 'Pay at Clinic' : 'Paid Online'}</span></div>
              </div>
              <button onClick={() => { setStep(1); setErrors({}); }} className="btn-secondary">Book Another Appointment</button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">Powered by SmileCare Pro</p>
      </div>
    </div>
  );
};
