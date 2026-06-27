import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { mockDbInstance } from '../../db/mockRepository';
import { BusinessNotFound } from './BusinessNotFound';
import { StripeAdapter, PayPalAdapter } from '../../utils/adapters';
import { 
  Building, 
  Briefcase, 
  User, 
  Calendar as CalIcon, 
  CreditCard, 
  Sparkles,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

export const BookingPortal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { branches, services, employees, settings, refreshData, isLoading } = useApp();

  // Booking Flow Steps: 1 (Details Select), 2 (User details), 3 (Payment checkout), 4 (Success Receipt)
  const [step, setStep] = useState(1);
  
  // Selection states
  const [selBranch, setSelBranch] = useState('');
  const [selService, setSelService] = useState('');
  const [selEmployee, setSelEmployee] = useState('');
  const [selDate, setSelDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]); // default tomorrow
  const [selTime, setSelTime] = useState('10:00');

  // Client Details states
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // Payment states
  const [payMethod, setPayMethod] = useState<'Stripe' | 'PayPal' | 'Cash'>('Cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');

  // Set defaults when lists render
  useEffect(() => {
    if (branches.length > 0) setSelBranch(branches[0].id);
    if (services.length > 0) setSelService(services[0].id);
    if (employees.length > 0) setSelEmployee(employees[0].id);
  }, [branches, services, employees]);

  const activeService = services.find(s => s.id === selService);
  const activeEmployee = employees.find(e => e.id === selEmployee);
  const activeBranch = branches.find(b => b.id === selBranch);
  const currency = settings?.currency || 'USD';

  // Available slots based on shift hours config
  const availableSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!slug || !mockDbInstance.isValidPublicBookingSlug(slug)) {
    return <BusinessNotFound slug={slug} />;
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const org = "org-reserveflow-pro";

    // 1. Process payment via adapter
    let txnId = "";
    if (payMethod === 'Stripe') {
      const stripe = new StripeAdapter();
      const res = await stripe.processPayment(activeService?.price || 0, activeService?.name || "Booking");
      if (res.success) txnId = res.transactionId || "";
    } else if (payMethod === 'PayPal') {
      const paypal = new PayPalAdapter();
      const res = await paypal.processPayment(activeService?.price || 0, activeService?.name || "Booking");
      if (res.success) txnId = res.transactionId || "";
    }

    // 2. Create customer profile
    const registeredCust = await db.customers.create(org, {
      fullName: clientName,
      phone: clientPhone,
      email: clientEmail,
      notes: "Registered via Public Booking Portal",
      tags: ["Portal-Booking"],
      status: "Active"
    });

    const booking = await db.reservations.create(org, {
      branchId: selBranch,
      customerId: registeredCust.id,
      serviceId: selService,
      employeeId: selEmployee,
      date: selDate,
      time: selTime,
      duration: activeService?.duration || 30,
      notes: clientNotes,
      status: 'Pending',
      paymentStatus: payMethod === 'Cash' ? 'Unpaid' : 'Paid',
      paymentDetails: {
        method: payMethod === 'Cash' ? 'Cash' : payMethod === 'Stripe' ? 'Stripe' : 'PayPal',
        amount: activeService?.price || 0,
        transactionId: txnId || undefined,
        paidAt: payMethod === 'Cash' ? undefined : new Date().toISOString()
      }
    });

    await db.notifications.create(org, {
      branchId: selBranch,
      title: "New Public Portal Booking",
      message: `${clientName} booked ${activeService?.name} on ${selDate} at ${selTime}.`,
      read: false,
      type: "BookingCreated"
    });

    setReceiptNumber(booking.id);
    setIsProcessing(false);
    setStep(4);
    await refreshData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.12),transparent_50%)] pointer-events-none" />
      
      <div className="max-w-2xl w-full mx-auto space-y-8 z-10">
        
        {/* Portal Header */}
        <div className="text-center space-y-2">
          <div className="bg-gradient-to-tr from-brand-500 to-violet-500 p-2.5 rounded-2xl w-fit mx-auto text-white shadow-xl shadow-brand-500/20 mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight m-0">
            {settings?.businessName || 'ReserveFlow Scheduling'}
          </h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Public Booking Portal</p>
        </div>

        {/* Portal Step Card Wrapper */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border-slate-800 shadow-2xl relative">
          
          {/* Progress Indicators */}
          {step < 4 && (
            <div className="flex items-center justify-between mb-8 border-b border-slate-850 pb-4">
              {[1, 2, 3].map(num => (
                <div key={num} className="flex items-center gap-2">
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    step === num ? 'bg-brand-500 text-white' : step > num ? 'bg-green-500/20 text-green-400' : 'bg-slate-850 text-slate-500'
                  }`}>
                    {num}
                  </span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${
                    step === num ? 'text-slate-200' : 'text-slate-500'
                  }`}>
                    {num === 1 ? 'Select' : num === 2 ? 'Details' : 'Checkout'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* STEP 1: Select Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Branch */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-brand-400" />
                    <span>Select Branch location</span>
                  </label>
                  <select
                    value={selBranch}
                    onChange={(e) => setSelBranch(e.target.value)}
                    className="w-full glass-input text-xs"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Service */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-brand-400" />
                    <span>Select Service</span>
                  </label>
                  <select
                    value={selService}
                    onChange={(e) => setSelService(e.target.value)}
                    className="w-full glass-input text-xs"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.price} {currency})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-brand-400" />
                    <span>Select Specialist / Instructor</span>
                  </label>
                  <select
                    value={selEmployee}
                    onChange={(e) => setSelEmployee(e.target.value)}
                    className="w-full glass-input text-xs"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1">
                    <CalIcon className="h-3.5 w-3.5 text-brand-400" />
                    <span>Select Appointment Date</span>
                  </label>
                  <input
                    type="date"
                    value={selDate}
                    onChange={(e) => setSelDate(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              {/* Time Slots Availability selection */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-brand-400" />
                  <span>Choose Available Time Slot</span>
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {availableSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelTime(time)}
                      className={`text-xs py-2 rounded-xl font-bold border transition-all ${
                        selTime === time 
                          ? 'bg-brand-600 border-brand-500 text-white shadow-md' 
                          : 'bg-slate-900/40 border-slate-850 text-slate-300 hover:border-slate-800'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service details summary card */}
              {activeService && (
                <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">{activeService.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{activeService.duration} mins • With {activeEmployee?.name}</p>
                  </div>
                  <span className="text-lg font-bold text-brand-300">{activeService.price} {currency}</span>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                className="glass-btn-primary w-full py-3 text-xs flex items-center justify-center gap-1.5"
              >
                <span>Continue booking</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Client details forms */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-white font-bold text-sm mb-2">Enter Your Personal Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full glass-input text-xs"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full glass-input text-xs"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full glass-input text-xs"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Special Requirements / Notes (Optional)</label>
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  rows={3}
                  className="w-full glass-input text-xs"
                  placeholder="Notes for the operator..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="glass-btn-secondary w-1/3 text-xs"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!clientName || !clientPhone || !clientEmail) {
                      alert("Please complete name, phone, and email.");
                      return;
                    }
                    setStep(3);
                  }}
                  className="glass-btn-primary flex-1 py-3 text-xs"
                >
                  Continue to checkout
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Checkout */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-white font-bold text-sm mb-2">Secure Payment Checkout</h3>

              {/* Order total info */}
              <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">{activeService?.name}</span>
                  <span className="text-white">{activeService?.price} {currency}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-t border-slate-850 pt-2 text-white">
                  <span>Total Amount Due</span>
                  <span className="text-brand-300 text-sm">{activeService?.price} {currency}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Select Payment Option</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPayMethod('Cash')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      payMethod === 'Cash' ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-slate-850 bg-slate-950/40 text-slate-400'
                    }`}
                  >
                    <span>Pay at Venue</span>
                  </button>

                  <button
                    onClick={() => setPayMethod('Stripe')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      payMethod === 'Stripe' ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-slate-850 bg-slate-950/40 text-slate-400'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Pay with Card</span>
                  </button>

                  <button
                    onClick={() => setPayMethod('PayPal')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      payMethod === 'PayPal' ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-slate-850 bg-slate-950/40 text-slate-400'
                    }`}
                  >
                    <span>PayPal Wallet</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="glass-btn-secondary w-1/3 text-xs"
                >
                  Back
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="glass-btn-primary flex-1 py-3 text-xs"
                >
                  {isProcessing ? 'Verifying payment...' : `Confirm & Pay ${activeService?.price} ${currency}`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success Receipt */}
          {step === 4 && (
            <div className="text-center space-y-5 py-6">
              <div className="h-14 w-14 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 flex items-center justify-center mx-auto shadow-lg shadow-green-500/5">
                <CheckCircle className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Booking Confirmed!</h3>
                <p className="text-xs text-slate-400">Your reservation details have been successfully registered.</p>
              </div>

              <div className="bg-slate-900/30 border border-slate-850 p-4 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between font-semibold"><span className="text-slate-500">Appointment Code</span><span className="text-white font-mono font-bold uppercase">{receiptNumber}</span></div>
                <div className="flex justify-between font-semibold"><span className="text-slate-500">Branch</span><span className="text-white">{activeBranch?.name}</span></div>
                <div className="flex justify-between font-semibold"><span className="text-slate-500">Date & Time</span><span className="text-brand-300 font-bold">{selDate} at {selTime}</span></div>
                <div className="flex justify-between font-semibold"><span className="text-slate-500">Specialist</span><span className="text-white">{activeEmployee?.name}</span></div>
                <div className="flex justify-between font-semibold border-t border-slate-850 pt-2"><span className="text-slate-500">Payment Status</span><span className="text-green-400 font-bold uppercase">{payMethod === 'Cash' ? 'Unpaid (Pay at Venue)' : 'Paid online'}</span></div>
              </div>

              <button
                onClick={() => setStep(1)}
                className="glass-btn-secondary px-6 py-2.5 text-xs font-bold"
              >
                Book Another Appointment
              </button>
            </div>
          )}

        </div>

        {/* Portal Footer */}
        <div className="text-center text-[10px] text-slate-500 font-medium">
          Powered by ReserveFlow Pro SaaS. Clean Spacing and Glassmorphism Layouts.
        </div>

      </div>
    </div>
  );
};
