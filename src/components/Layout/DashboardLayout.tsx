import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { translations } from '../../utils/translations';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  Users, 
  GitMerge, 
  Briefcase, 
  UserCheck, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell, 
  Globe, 
  Building,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, currentUser, hasPermission } = useAuth();
  const { 
    settings, 
    branches, 
    selectedBranchId, 
    setSelectedBranchId, 
    notifications,
    unreadNotificationCount,
    refreshData
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
    { name: t.employees, path: '/admin/employees', icon: UserCheck },
    ...(hasPermission('BusinessOwner') ? [
      { name: t.reports, path: '/admin/reports', icon: BarChart3 },
      { name: t.settings, path: '/admin/settings', icon: Settings },
    ] : [])
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleMarkAllRead = async () => {
    const org = currentUser?.orgId || "org-reserveflow-pro";
    await db.notifications.markAllAsRead(org);
    setNotifDropdownOpen(false);
    await refreshData();
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 ${isRtl ? 'rtl' : 'ltr'}`}>
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-slate-800/80 p-5 shrink-0 z-30">
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="bg-gradient-to-tr from-brand-500 to-violet-500 p-2 rounded-xl text-white shadow-lg shadow-brand-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0 leading-none">ReserveFlow</h1>
            <span className="text-[10px] text-brand-400 font-semibold tracking-widest uppercase">PRO SAAS</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active 
                    ? 'bg-gradient-to-r from-brand-600/30 to-violet-600/20 text-brand-300 border-l-4 border-brand-500 font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-brand-400' : 'text-slate-400'}`} />
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/80 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 py-3 mb-3 bg-slate-900/40 rounded-xl border border-slate-800/30">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-brand-300 border border-slate-700">
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors font-medium text-sm"
          >
            <LogOut className="h-5 w-5" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-brand-500 to-violet-500 p-1.5 rounded-lg text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg text-white">ReserveFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden flex justify-end">
          <div className="w-64 bg-slate-900 border-l border-slate-800 h-full p-5 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-white text-lg">Menu</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        active 
                          ? 'bg-brand-500/20 text-brand-300 font-semibold' 
                          : 'text-slate-400 hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <div>
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium text-sm"
              >
                <LogOut className="h-5 w-5" />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        
        {/* Top Header navbar (Desktop & Tablet) */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-800/60 glass-panel shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-semibold text-white m-0">
              {t.welcome}, {currentUser?.name}!
            </h2>
            
            {/* Branch Selector Dropdown */}
            {currentUser?.role !== 'Employee' && (
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
                <Building className="h-4 w-4 text-brand-400" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-slate-900 text-slate-200">{t.allBranches}</option>
                  {branches.map(br => (
                    <option key={br.id} value={br.id} className="bg-slate-900 text-slate-200">{br.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Public Booking Link */}
            <a 
              href="/book/apex-preset" 
              target="_blank" 
              className="text-xs bg-brand-500/10 border border-brand-500/30 text-brand-300 font-semibold px-3 py-1.5 rounded-xl hover:bg-brand-500/20 transition-all flex items-center gap-1.5"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{t.publicPortal}</span>
            </a>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all relative"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-950 animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {notifDropdownOpen && (
                <div className={`absolute top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 ${isRtl ? 'left-0' : 'right-0'} animate-in fade-in slide-in-from-top-2 duration-150`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="font-bold text-white text-sm">Notifications</span>
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-xs text-brand-400 hover:text-brand-300 font-semibold hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2.5">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`p-2.5 rounded-xl border transition-colors ${notif.read ? 'bg-slate-900/20 border-slate-800/40 text-slate-400' : 'bg-slate-800/40 border-brand-500/20 text-slate-200'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">{notif.type.replace("Created", "")}</span>
                            <span className="text-[9px] text-slate-500">{new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-xs font-semibold text-white">{notif.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Route View Page */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
