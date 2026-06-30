import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { PageLoader } from './components/ui/LoadingSpinner';
import { RouteTitle } from './components/ui/RouteTitle';
import { NotFoundPage } from './components/ui/NotFoundPage';
import { mockDbInstance } from './db/mockRepository';
import { Smile, UserCheck, Lock } from 'lucide-react';
import type { UserRole } from './types';

const DashboardLayout = React.lazy(() => import('./components/Layout/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const Dashboard = React.lazy(() => import('./components/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const SmartCalendar = React.lazy(() => import('./components/Calendar/SmartCalendar').then(m => ({ default: m.SmartCalendar })));
const WaitlistQueue = React.lazy(() => import('./components/Waitlist/WaitlistQueue').then(m => ({ default: m.WaitlistQueue })));
const CustomerDatabase = React.lazy(() => import('./components/Customers/CustomerDatabase').then(m => ({ default: m.CustomerDatabase })));
const LeadsPipeline = React.lazy(() => import('./components/Leads/LeadsPipeline').then(m => ({ default: m.LeadsPipeline })));
const ServicesManagement = React.lazy(() => import('./components/Services/ServicesManagement').then(m => ({ default: m.ServicesManagement })));
const EmployeeManagement = React.lazy(() => import('./components/Employees/EmployeeManagement').then(m => ({ default: m.EmployeeManagement })));
const Reports = React.lazy(() => import('./components/Reports/Reports').then(m => ({ default: m.Reports })));
const Settings = React.lazy(() => import('./components/Settings/Settings').then(m => ({ default: m.Settings })));
const BookingPortal = React.lazy(() => import('./components/BookingPortal/BookingPortal').then(m => ({ default: m.BookingPortal })));
const LandingPage = React.lazy(() => import('./components/Landing/LandingPage').then(m => ({ default: m.LandingPage })));

const LazyFallback = () => <PageLoader />;

const GuestOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (currentUser) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
};

const ProtectedAdminRoute: React.FC = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <Suspense fallback={<LazyFallback />}>
      <DashboardLayout>
        <Suspense fallback={<LazyFallback />}>
          <Outlet />
        </Suspense>
      </DashboardLayout>
    </Suspense>
  );
};

const RequireRole: React.FC<{ role: UserRole; children: React.ReactNode }> = ({ role, children }) => {
  const { hasPermission } = useAuth();
  if (!hasPermission(role)) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
};

const Login: React.FC = () => {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@smilecare.com');
  const [role, setRole] = useState<UserRole>('BusinessOwner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) navigate('/admin/dashboard', { replace: true });
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email, role);
      navigate('/admin/dashboard', { replace: true });
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDemo = () => {
    if (window.confirm('This will reset all clinic data and reload the dental demo dataset. Continue?')) {
      mockDbInstance.resetPreset('Dental');
      window.location.reload();
    }
  };

  return (
    <RouteTitle title="Staff Sign In">
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-brand-50 pointer-events-none" />

        <div className="panel w-full max-w-md p-8 shadow-elevated relative space-y-6">
          <div className="text-center space-y-2">
            <div className="bg-brand-600 p-2.5 rounded-2xl w-fit mx-auto text-white shadow-lg">
              <Smile className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">SmileCare Pro</h2>
            <p className="text-xs text-slate-500">Secure access to your clinic dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Email Address</label>
              <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="admin@smilecare.com" autoComplete="email" />
            </div>

            <div>
              <label htmlFor="login-role" className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Access Role</label>
              <select id="login-role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="input-field">
                <option value="SuperAdmin">Super Admin</option>
                <option value="BusinessOwner">Clinic Owner</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Employee">Doctor / Staff</option>
              </select>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">{error}</p>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
              <UserCheck className="h-4 w-4" />
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            <button type="button" disabled className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 py-2 cursor-not-allowed" title="Available in production deployment">
              <Lock className="h-3.5 w-3.5" />
              Forgot password? Contact your clinic administrator
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-400 leading-normal">
              Portfolio demo — select a role to preview permission levels. No password required.
            </p>
            <button onClick={handleResetDemo} type="button" className="text-xs bg-brand-50 border border-brand-200 text-brand-700 font-semibold px-4 py-2 rounded-xl hover:bg-brand-100 transition-all">
              Reset Demo Data
            </button>
            <div>
              <a href="/" className="text-xs text-slate-400 hover:text-brand-600 transition-colors">← Back to patient website</a>
            </div>
          </div>
        </div>
      </div>
    </RouteTitle>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppProvider>
            <Suspense fallback={<LazyFallback />}>
              <Routes>
                <Route path="/" element={
                  <GuestOnlyRoute>
                    <RouteTitle title="Dental Clinic Management">
                      <LandingPage />
                    </RouteTitle>
                  </GuestOnlyRoute>
                } />
                <Route path="/login" element={
                  <GuestOnlyRoute>
                    <Login />
                  </GuestOnlyRoute>
                } />

                <Route element={<ProtectedAdminRoute />}>
                  <Route path="/admin/dashboard" element={<RouteTitle title="Dashboard"><Dashboard /></RouteTitle>} />
                  <Route path="/admin/calendar" element={<RouteTitle title="Appointments Calendar"><SmartCalendar /></RouteTitle>} />
                  <Route path="/admin/waitlist" element={<RouteTitle title="Waitlist"><WaitlistQueue /></RouteTitle>} />
                  <Route path="/admin/customers" element={<RouteTitle title="Patients"><CustomerDatabase /></RouteTitle>} />
                  <Route path="/admin/leads" element={<RouteTitle title="Patient Inquiries"><LeadsPipeline /></RouteTitle>} />
                  <Route path="/admin/services" element={<RouteTitle title="Dental Services"><ServicesManagement /></RouteTitle>} />
                  <Route path="/admin/employees" element={<RouteTitle title="Doctors"><EmployeeManagement /></RouteTitle>} />
                  <Route path="/admin/reports" element={<RequireRole role="BusinessOwner"><RouteTitle title="Reports"><Reports /></RouteTitle></RequireRole>} />
                  <Route path="/admin/settings" element={<RequireRole role="BusinessOwner"><RouteTitle title="Settings"><Settings /></RouteTitle></RequireRole>} />
                </Route>

                <Route path="/book/:slug" element={
                  <RouteTitle title="Book Appointment">
                    <BookingPortal />
                  </RouteTitle>
                } />

                <Route path="*" element={
                  <RouteTitle title="Page Not Found">
                    <NotFoundPage />
                  </RouteTitle>
                } />
              </Routes>
            </Suspense>
          </AppProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
