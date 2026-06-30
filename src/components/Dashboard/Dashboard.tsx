import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { translations } from '../../utils/translations';
import { DEFAULT_PUBLIC_BOOKING_SLUG } from '../../types';
import {
  Calendar as CalIcon, TrendingUp, DollarSign, Users, Clock,
  PlusCircle, Activity, ArrowRight, Briefcase, Stethoscope
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { reservations, customers, services, employees, settings, selectedBranchId, auditLogs } = useApp();
  const navigate = useNavigate();
  const lang = settings?.language || 'en';
  const t = translations[lang];

  const {
    todayBookings, totalRevenue, cancellationRate, customerRetentionRate,
    todaysSchedule, upcomingReservations, recentActivity
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
      .reduce((acc, r) => { acc[r.customerId] = (acc[r.customerId] || 0) + 1; return acc; }, {} as Record<string, number>);
    const returningCustomers = Object.values(completedResCustMap).filter(count => count > 1).length;
    const retRate = customers.length > 0 ? Math.round((returningCustomers / customers.length) * 100) : 0;
    const upcoming = filteredRes
      .filter(r => r.date >= todayStr && r.status !== 'Cancelled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 5);
    const activity = auditLogs.slice(0, 8);

    return {
      todayBookings: todaysRes.length, totalRevenue: revenue, cancellationRate: cRate,
      customerRetentionRate: retRate, todaysSchedule: todaysRes,
      upcomingReservations: upcoming, recentActivity: activity
    };
  }, [reservations, customers, selectedBranchId, auditLogs]);

  const getPatientName = (id: string) => customers.find(c => c.id === id)?.fullName || 'Unknown';
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Unknown';
  const getDoctorName = (id: string) => employees.find(e => e.id === id)?.name || 'Unassigned';

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Confirmed: 'badge-info', Pending: 'badge-warning',
      Completed: 'badge-success', Cancelled: 'badge-danger',
    };
    return map[status] || 'badge-neutral';
  };

  const kpis = [
    { label: t.todaysReservations, value: todayBookings, icon: CalIcon, color: 'bg-brand-50 text-brand-600' },
    { label: t.revenue, value: `${totalRevenue.toLocaleString()} ${settings?.currency || 'USD'}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
    { label: t.retentionRate, value: `${customerRetentionRate}%`, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: t.cancellationRate, value: `${cancellationRate}%`, icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900">{settings?.businessName || 'Clinic Dashboard'}</h2>
          <p className="text-sm text-slate-500">Overview of today's clinic operations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/admin/calendar')} className="btn-primary text-sm py-2">
            <PlusCircle className="h-4 w-4" />{t.createReservation}
          </button>
          <button onClick={() => navigate('/admin/customers')} className="btn-secondary text-sm py-2">
            <Users className="h-4 w-4" />{t.newPatient}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="card card-hover p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
              <div className={`p-2 rounded-lg ${kpi.color}`}><kpi.icon className="h-4 w-4" /></div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-600" />
              <h3 className="font-semibold text-slate-900">{t.todaysSchedule}</h3>
            </div>
            <button onClick={() => navigate('/admin/calendar')} className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
              {t.viewCalendar} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {todaysSchedule.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CalIcon className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-slate-500">{t.noAppointmentsToday}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="p-4 font-semibold">{t.time}</th>
                    <th className="p-4 font-semibold">{t.patient}</th>
                    <th className="p-4 font-semibold">{t.service}</th>
                    <th className="p-4 font-semibold">{t.doctor}</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todaysSchedule.map(res => (
                    <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-semibold text-brand-600">{formatTime(res.time)}</td>
                      <td className="p-4 text-slate-900">{getPatientName(res.customerId)}</td>
                      <td className="p-4 text-slate-600">{getServiceName(res.serviceId)}</td>
                      <td className="p-4 text-slate-500">{getDoctorName(res.employeeId)}</td>
                      <td className="p-4"><span className={`badge ${statusBadge(res.status)}`}>{res.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-600" />
            <h3 className="font-semibold text-slate-900">{t.recentActivity}</h3>
          </div>
          <div className="p-5 flex-1 overflow-y-auto max-h-[400px] space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No recent activity.</p>
            ) : recentActivity.map(log => (
              <div key={log.id} className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-brand-500 ring-4 ring-brand-100 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-700 leading-snug">{log.details}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {log.userName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">{t.upcomingAppointments}</h3>
          <div className="space-y-3">
            {upcomingReservations.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">{t.noUpcoming}</p>
            ) : upcomingReservations.map(res => (
              <div key={res.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-50 flex flex-col items-center justify-center text-brand-700">
                    <span className="text-[10px] uppercase font-bold">{new Date(res.date).toLocaleString('en-us', { month: 'short' })}</span>
                    <span className="text-sm font-black">{new Date(res.date).getDate()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{getPatientName(res.customerId)}</p>
                    <p className="text-xs text-slate-500">{getServiceName(res.serviceId)} @ {formatTime(res.time)}</p>
                  </div>
                </div>
                <span className={`badge ${statusBadge(res.status)}`}>{res.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">{t.clinicTools}</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Briefcase, label: t.manageServices, desc: 'Dental services & pricing', path: '/admin/services', color: 'text-brand-600' },
              { icon: Stethoscope, label: t.manageDoctors, desc: 'Doctor schedules', path: '/admin/employees', color: 'text-blue-600' },
              { icon: Activity, label: t.waitlist, desc: 'Pending patients', path: '/admin/waitlist', color: 'text-amber-600' },
              { icon: PlusCircle, label: t.publicPortal, desc: 'Patient booking page', path: `/book/${settings?.publicSlug || DEFAULT_PUBLIC_BOOKING_SLUG}`, color: 'text-emerald-600' },
            ].map(tool => (
              <button key={tool.label} onClick={() => navigate(tool.path)} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-card transition-all text-left group">
                <tool.icon className={`h-5 w-5 ${tool.color} mb-2 group-hover:scale-110 transition-transform`} />
                <p className="text-xs font-semibold text-slate-900">{tool.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{tool.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
