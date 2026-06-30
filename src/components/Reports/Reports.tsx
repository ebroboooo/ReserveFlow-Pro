import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { translations } from '../../utils/translations';
import { 
  Download, 
  FileSpreadsheet
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { reservations, services, employees, settings, selectedBranchId } = useApp();
  const { warning, success } = useToast();
  const [dateRange, setDateRange] = useState<'Today' | 'Week' | 'Month' | 'All'>('Month');

  const lang = settings?.language || 'en';
  const t = translations[lang];
  const currency = settings?.currency || 'USD';

  // Filter reservations by date range selection
  const getFilteredData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];

    return reservations.filter(r => {
      const branchMatch = selectedBranchId === 'all' || r.branchId === selectedBranchId;
      if (!branchMatch) return false;

      if (dateRange === 'Today') return r.date === todayStr;
      if (dateRange === 'Week') return r.date >= weekAgoStr;
      if (dateRange === 'Month') return r.date >= monthAgoStr;
      return true;
    });
  };

  const currentReportsData = getFilteredData();

  // Metrics Calculations
  const completedCount = currentReportsData.filter(r => r.status === 'Completed').length;
  const cancelledCount = currentReportsData.filter(r => r.status === 'Cancelled').length;
  const noShowCount = currentReportsData.filter(r => r.status === 'NoShow').length;
  
  const totalBookings = currentReportsData.length;
  const completionRate = totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0;

  const totalRevenueVal = currentReportsData
    .filter(r => r.status === 'Completed' || r.paymentStatus === 'Paid')
    .reduce((sum, r) => sum + (r.paymentDetails?.amount || 0), 0);

  // Top services ranking for range
  const serviceMap = currentReportsData.reduce((acc, r) => {
    acc[r.serviceId] = (acc[r.serviceId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const rankedServices = Object.entries(serviceMap)
    .map(([id, count]) => {
      const srv = services.find(s => s.id === id);
      return {
        name: srv ? srv.name : 'Unknown Service',
        price: srv ? srv.price : 0,
        count,
        revenue: count * (srv ? srv.price : 0)
      };
    })
    .sort((a, b) => b.count - a.count);

  // Employee breakdown
  const employeePerformance = employees.map(emp => {
    const empRes = currentReportsData.filter(r => r.employeeId === emp.id && r.status === 'Completed');
    const revenue = empRes.reduce((sum, r) => sum + (r.paymentDetails?.amount || 0), 0);
    return {
      name: emp.name,
      role: emp.role,
      bookingsCount: empRes.length,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // CSV Exporter
  const handleExportCSV = () => {
    if (currentReportsData.length === 0) {
      warning('No appointment data to export for the selected range.');
      return;
    }

    const headers = ["Appointment ID", "Date", "Time", "Duration", "Status", "Payment Status", "Amount Charged", "Currency"];
    const rows = currentReportsData.map(r => [
      r.id,
      r.date,
      r.time,
      r.duration,
      r.status,
      r.paymentStatus,
      r.paymentDetails?.amount || 0,
      currency
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smilecare_report_${dateRange.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Report exported successfully.');
  };

  // PDF Printing trigger
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Exporters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t.reports}</h2>
          <p className="text-xs text-slate-500">Consolidated reports, financial matrices, and transaction summaries</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={handleExportPDF}
            className="btn-primary px-3 py-2 text-xs flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Date Range selectors */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
        {(['Today', 'Week', 'Month', 'All'] as const).map(range => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              dateRange === range ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            {range === 'All' ? 'All Time' : range}
          </button>
        ))}
      </div>

      {/* Reports Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-5 rounded-2xl border-slate-200 text-center">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Gross Booking Sales</p>
          <h3 className="text-2xl font-bold text-green-400 mt-1">{totalRevenueVal} {currency}</h3>
        </div>
        <div className="card p-5 rounded-2xl border-slate-200 text-center">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Completion Rate</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{completionRate}%</h3>
        </div>
        <div className="card p-5 rounded-2xl border-slate-200 text-center">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Bookings</p>
          <h3 className="text-2xl font-bold text-brand-700 mt-1">{totalBookings}</h3>
        </div>
        <div className="card p-5 rounded-2xl border-slate-200 text-center">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Cancellations / No-Shows</p>
          <h3 className="text-2xl font-bold text-red-400 mt-1">{cancelledCount} / {noShowCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Services Breakdown */}
        <div className="card p-5 rounded-2xl border-slate-200 space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Services Revenue Contribution</h4>
            <p className="text-[10px] text-slate-500">Contributions by service category and purchase counts</p>
          </div>

          <div className="space-y-3.5">
            {rankedServices.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No service transaction data available.</p>
            ) : (
              rankedServices.map((srv, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-900">{srv.name} ({srv.count} sales)</span>
                    <span className="text-brand-700 font-bold">{srv.revenue} {currency}</span>
                  </div>
                  {/* Progress visual bar */}
                  <div className="w-full bg-slate-100/60 rounded-full h-1.5">
                    <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${Math.min((srv.revenue / (totalRevenueVal || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Employee Revenue Share */}
        <div className="card p-5 rounded-2xl border-slate-200 space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Doctor Revenue Leaderboard</h4>
            <p className="text-[10px] text-slate-500">Ranked by completed appointment revenue per doctor</p>
          </div>

          <div className="space-y-3">
            {employeePerformance.map((emp, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-400 border border-slate-200">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">{emp.name}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{emp.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-green-400">{emp.revenue} {currency}</p>
                  <p className="text-[9px] text-slate-500">{emp.bookingsCount} sessions</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
