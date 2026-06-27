import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SmartCalendar } from './components/Calendar/SmartCalendar';
import { WaitlistQueue } from './components/Waitlist/WaitlistQueue';
import { CustomerDatabase } from './components/Customers/CustomerDatabase';
import { LeadsPipeline } from './components/Leads/LeadsPipeline';
import { ServicesManagement } from './components/Services/ServicesManagement';
import { EmployeeManagement } from './components/Employees/EmployeeManagement';
import { Reports } from './components/Reports/Reports';
import { Settings } from './components/Settings/Settings';
import { BookingPortal } from './components/BookingPortal/BookingPortal';
import { mockDbInstance } from './db/mockRepository';
import { Sparkles, UserCheck } from 'lucide-react';
import type { UserRole } from './types';

// Protected admin routes wrapper
const ProtectedAdminRoute: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

const RequireRole: React.FC<{ role: UserRole, children: React.ReactNode }> = ({ role, children }) => {
  const { hasPermission } = useAuth();
  if (!hasPermission(role)) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
};

// Login Component
const Login: React.FC = () => {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@reserveflow.com');
  const [role, setRole] = useState<UserRole>('BusinessOwner');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await login(email, role);
    setIsSubmitting(false);
  };

  const handleResetDemo = () => {
    if (window.confirm("This will erase all current data and seed the database with a realistic business scenario. Continue?")) {
      mockDbInstance.resetPreset('Salon');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl border-slate-800 shadow-2xl relative space-y-6">
        
        <div className="text-center space-y-2">
          <div className="bg-gradient-to-tr from-brand-500 to-violet-500 p-2.5 rounded-2xl w-fit mx-auto text-white shadow-xl">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">ReserveFlow Pro</h2>
          <p className="text-xs text-slate-550">Sign in to your organization workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass-input text-xs"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1.5">User Role Scope (SaaS Demo)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full glass-input text-xs"
            >
              <option value="SuperAdmin">Super Admin (Global access)</option>
              <option value="BusinessOwner">Business Owner (Workspace Admin)</option>
              <option value="Receptionist">Receptionist (Branch scope)</option>
              <option value="Employee">Employee (Staff view)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="glass-btn-primary w-full py-3 text-xs flex items-center justify-center gap-1.5 mt-2"
          >
            <UserCheck className="h-4 w-4" />
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In Workspace'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-slate-850/60 text-center space-y-3">
          <p className="text-[10px] text-slate-500 leading-normal">
            For evaluation, select any role to instantly preview matching access-control layers in the dashboard shell.
          </p>
          <button 
            onClick={handleResetDemo}
            type="button"
            className="text-xs bg-brand-500/10 border border-brand-500/30 text-brand-300 font-semibold px-4 py-2 rounded-xl hover:bg-brand-500/20 transition-all mx-auto"
          >
            Reset Demo Data (Salon Preset)
          </button>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Admin Dashboard Protected paths */}
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/calendar" element={<SmartCalendar />} />
              <Route path="/admin/waitlist" element={<WaitlistQueue />} />
              <Route path="/admin/customers" element={<CustomerDatabase />} />
              <Route path="/admin/leads" element={<LeadsPipeline />} />
              <Route path="/admin/services" element={<ServicesManagement />} />
              <Route path="/admin/employees" element={<EmployeeManagement />} />
              <Route path="/admin/reports" element={<RequireRole role="BusinessOwner"><Reports /></RequireRole>} />
              <Route path="/admin/settings" element={<RequireRole role="BusinessOwner"><Settings /></RequireRole>} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            {/* Public Booking Portal Checkout */}
            <Route path="/book/:slug" element={<BookingPortal />} />

            {/* Default Landing */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
};
export default App;
