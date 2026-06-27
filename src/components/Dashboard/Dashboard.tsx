import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { translations } from '../../utils/translations';
import { 
  Calendar as CalIcon, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock,
  PlusCircle,
  Activity,
  ArrowRight,
  Briefcase
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { reservations, customers, services, employees, settings, selectedBranchId, auditLogs } = useApp();
  const navigate = useNavigate();

  const lang = settings?.language || 'en';
  const t = translations[lang];

  // Performance Optimization: useMemo for calculations
  const {
    todayBookings,
    totalRevenue,
    cancellationRate,
    customerRetentionRate,
    todaysSchedule,
    upcomingReservations,
    recentActivity
  } = useMemo(() => {
    const filteredRes = reservations.filter(r => 
      selectedBranchId === 'all' || r.branchId === selectedBranchId
    );
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysRes = filteredRes.filter(r => r.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
    
    const revenue = filteredRes
      .filter(r => r.status === 'Completed' || r.paymentStatus === 'Paid')
      .reduce((sum, r) => sum + (r.paymentDetails?.amount || 0), 0);

    const cancelledCount = filteredRes.filter(r => r.status === 'Cancelled').length;
    const cRate = filteredRes.length > 0 ? Math.round((cancelledCount / filteredRes.length) * 100) : 0;

    const completedResCustMap = filteredRes
      .filter(r => r.status === 'Completed')
      .reduce((acc, r) => {
        acc[r.customerId] = (acc[r.customerId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    const returningCustomers = Object.values(completedResCustMap).filter(count => count > 1).length;
    const retRate = customers.length > 0 ? Math.round((returningCustomers / customers.length) * 100) : 0;

    const upcoming = filteredRes
      .filter(r => r.date >= todayStr && r.status !== 'Cancelled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 5);

    const activity = auditLogs
      .filter(log => selectedBranchId === 'all' || log.orgId) // Simplified filter
      .slice(0, 8);

    return {
      todayBookings: todaysRes.length,
      totalRevenue: revenue,
      cancellationRate: cRate,
      customerRetentionRate: retRate,
      todaysSchedule: todaysRes,
      upcomingReservations: upcoming,
      recentActivity: activity
    };
  }, [reservations, customers, selectedBranchId, auditLogs]);

  // View helpers
  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.fullName || 'Unknown';
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Unknown';
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unassigned';

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hr12 = hour % 12 || 12;
    return `${hr12}:${m} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Confirmed': return 'text-brand-400 bg-brand-500/10 border-brand-500/20';
      case 'Pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'Completed': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'Cancelled': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-800/50 border-slate-700/50';
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-200 pb-8">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">{settings?.businessName || 'Business Dashboard'}</h2>
          <p className="text-xs text-slate-400">Overview of today's operations and recent activity.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={() => navigate('/admin/calendar')} className="flex-1 md:flex-none glass-btn-primary py-2 px-4 text-xs flex items-center justify-center gap-1.5 shadow-brand-500/20 shadow-lg">
            <PlusCircle className="h-4 w-4" />
            <span>New Booking</span>
          </button>
          <button onClick={() => navigate('/admin/customers')} className="flex-1 md:flex-none glass-btn-secondary py-2 px-4 text-xs flex items-center justify-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <div className="glass-card glass-card-hover p-4 md:p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.todaysReservations}</span>
            <div className="p-1.5 md:p-2 bg-brand-500/10 text-brand-400 rounded-lg">
              <CalIcon className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
          <h3 className="text-xl md:text-3xl font-extrabold text-white">{todayBookings}</h3>
        </div>

        <div className="glass-card glass-card-hover p-4 md:p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="p-1.5 md:p-2 bg-green-500/10 text-green-400 rounded-lg">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
          <h3 className="text-xl md:text-3xl font-extrabold text-white">
            {totalRevenue.toLocaleString()} <span className="text-sm font-semibold text-slate-500">{settings?.currency}</span>
          </h3>
        </div>

        <div className="glass-card glass-card-hover p-4 md:p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer Retention</span>
            <div className="p-1.5 md:p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
          <h3 className="text-xl md:text-3xl font-extrabold text-white">{customerRetentionRate}%</h3>
        </div>

        <div className="glass-card glass-card-hover p-4 md:p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">Cancellation Rate</span>
            <div className="p-1.5 md:p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
          <h3 className="text-xl md:text-3xl font-extrabold text-white">{cancellationRate}%</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Schedule */}
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-800/60 bg-slate-900/40 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-400" />
              <h3 className="text-sm font-bold text-white">Today's Schedule</h3>
            </div>
            <button onClick={() => navigate('/admin/calendar')} className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1">
              View Calendar <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            {todaysSchedule.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CalIcon className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-semibold">No appointments scheduled for today.</p>
                <p className="text-xs mt-1">Create a new booking to get started.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800/60">
                    <th className="p-4 font-bold">Time</th>
                    <th className="p-4 font-bold">Customer</th>
                    <th className="p-4 font-bold">Service</th>
                    <th className="p-4 font-bold">Staff</th>
                    <th className="p-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {todaysSchedule.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 whitespace-nowrap text-brand-300 font-bold">{formatTime(res.time)}</td>
                      <td className="p-4 font-medium text-white">{getCustomerName(res.customerId)}</td>
                      <td className="p-4 text-slate-300">{getServiceName(res.serviceId)}</td>
                      <td className="p-4 text-slate-400">{getEmployeeName(res.employeeId)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getStatusColor(res.status)}`}>
                          {res.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="glass-card rounded-2xl flex flex-col h-full overflow-hidden">
          <div className="p-5 border-b border-slate-800/60 bg-slate-900/40 flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-400" />
            <h3 className="text-sm font-bold text-white">Recent Activity</h3>
          </div>
          <div className="p-5 flex-1 overflow-y-auto max-h-[400px] space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-xs">No recent activity.</p>
              </div>
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="flex gap-3">
                  <div className="mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-brand-500 ring-4 ring-brand-500/20"></div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-white leading-snug">{log.details}</p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {log.userName}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Upcoming & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Reservations */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-4">Upcoming Reservations</h3>
          <div className="space-y-3">
            {upcomingReservations.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No upcoming reservations found.</p>
            ) : (
              upcomingReservations.map(res => (
                <div key={res.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 flex flex-col items-center justify-center text-brand-400">
                      <span className="text-[10px] uppercase font-bold leading-none mb-0.5">
                        {new Date(res.date).toLocaleString('en-us', { month: 'short' })}
                      </span>
                      <span className="text-sm font-black leading-none">
                        {new Date(res.date).getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{getCustomerName(res.customerId)}</p>
                      <p className="text-[10px] text-slate-400">{getServiceName(res.serviceId)} @ {formatTime(res.time)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${getStatusColor(res.status)}`}>
                    {res.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Business Tools */}
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-4">Business Tools</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/admin/services')} className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800 hover:border-brand-500/30 transition-all text-left group flex flex-col gap-2">
              <Briefcase className="h-5 w-5 text-brand-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Manage Services</span>
              <span className="text-[10px] text-slate-500">Add or edit offerings</span>
            </button>
            <button onClick={() => navigate('/admin/employees')} className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800 hover:border-brand-500/30 transition-all text-left group flex flex-col gap-2">
              <Users className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Manage Staff</span>
              <span className="text-[10px] text-slate-500">Schedules & roles</span>
            </button>
            <button onClick={() => navigate('/admin/waitlist')} className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800 hover:border-brand-500/30 transition-all text-left group flex flex-col gap-2">
              <Activity className="h-5 w-5 text-yellow-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white">Waitlist Queue</span>
              <span className="text-[10px] text-slate-500">Review pending clients</span>
            </button>
            <button onClick={() => navigate('/book/apex-preset')} className="p-4 rounded-xl border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/20 transition-all text-left group flex flex-col gap-2">
              <PlusCircle className="h-5 w-5 text-brand-300 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-brand-100">Public Portal</span>
              <span className="text-[10px] text-brand-300/70">View booking page</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
