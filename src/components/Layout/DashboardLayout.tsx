import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { translations } from '../../utils/translations';
import { DEFAULT_PUBLIC_BOOKING_SLUG } from '../../types';
import {
  LayoutDashboard, Calendar, Clock, Users, GitMerge, Briefcase,
  Stethoscope, BarChart3, Settings, LogOut, Bell, Globe, Building,
  Menu, X, Smile
} from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, currentUser, hasPermission } = useAuth();
  const {
    settings, branches, selectedBranchId, setSelectedBranchId,
    notifications, unreadNotificationCount, refreshData
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const lang = settings?.language || 'en';
  const t = translations[lang];
  const isRtl = settings?.isRtl || false;

  const menuItems = [
    { name: t.dashboard, path: '/admin/dashboard', icon: LayoutDashboard },
    { name: t.calendar, path: '/admin/calendar', icon: Calendar },
    { name: t.waitlist, path: '/admin/waitlist', icon: Clock },
    { name: t.customers, path: '/admin/customers', icon: Users },
    { name: t.leads, path: '/admin/leads', icon: GitMerge },
    { name: t.services, path: '/admin/services', icon: Briefcase },
    { name: t.employees, path: '/admin/employees', icon: Stethoscope },
    ...(hasPermission('BusinessOwner') ? [
      { name: t.reports, path: '/admin/reports', icon: BarChart3 },
      { name: t.settings, path: '/admin/settings', icon: Settings },
    ] : [])
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleMarkAllRead = async () => {
    const org = currentUser?.orgId || 'org-smilecare-pro';
    await db.notifications.markAllAsRead(org);
    setNotifDropdownOpen(false);
    await refreshData();
  };

  const NavButton: React.FC<{ item: typeof menuItems[0] }> = ({ item }) => {
    const Icon = item.icon;
    const active = location.pathname === item.path;
    return (
      <button
        onClick={() => handleNav(item.path)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm ${
          active
            ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-100'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <Icon className={`h-5 w-5 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
        <span>{item.name}</span>
      </button>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-50 ${isRtl ? 'rtl' : 'ltr'}`}>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 shrink-0 z-30">
        <div className="flex items-center gap-2.5 px-2 py-4 mb-4">
          <div className="bg-brand-600 p-2 rounded-xl text-white">
            <Smile className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-slate-900 leading-none">SmileCare</h1>
            <span className="text-[10px] text-brand-600 font-semibold tracking-widest uppercase">Pro</span>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5">
          {menuItems.map(item => <NavButton key={item.path} item={item} />)}
        </nav>

        <div className="border-t border-slate-100 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 py-3 mb-2 bg-slate-50 rounded-xl">
            <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700 text-sm">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium">
            <LogOut className="h-4 w-4" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-1.5 rounded-lg text-white">
            <Smile className="h-4 w-4" />
          </div>
          <span className="font-display font-bold text-slate-900">SmileCare Pro</span>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-1.5 text-slate-500" aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-50 backdrop-blur-sm z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-72 bg-white h-full ml-auto p-4 flex flex-col shadow-elevated animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-bold text-slate-900">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <nav className="space-y-0.5 flex-1">
              {menuItems.map(item => <NavButton key={item.path} item={item} />)}
            </nav>
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium mt-4">
              <LogOut className="h-4 w-4" /><span>{t.logout}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <header className="hidden md:flex items-center justify-between px-6 lg:px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900">{t.welcome}, {currentUser?.name}!</h2>
            {currentUser?.role !== 'Employee' && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Building className="h-4 w-4 text-brand-600" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">{t.allBranches}</option>
                  {branches.map(br => (
                    <option key={br.id} value={br.id}>{br.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 relative">
            <a
              href={`/book/${settings?.publicSlug || DEFAULT_PUBLIC_BOOKING_SLUG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-brand-50 border border-brand-200 text-brand-700 font-semibold px-3 py-1.5 rounded-xl hover:bg-brand-100 transition-all flex items-center gap-1.5"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{t.publicPortal}</span>
            </a>

            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className={`absolute top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-elevated p-4 z-50 ${isRtl ? 'left-0' : 'right-0'} animate-slide-down`}>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                    <button onClick={handleMarkAllRead} className="text-xs text-brand-600 hover:text-brand-700 font-semibold">Mark all read</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`p-3 rounded-xl border text-sm ${notif.read ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-brand-50/50 border-brand-100 text-slate-700'}`}>
                          <p className="font-semibold text-slate-900 text-xs">{notif.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
