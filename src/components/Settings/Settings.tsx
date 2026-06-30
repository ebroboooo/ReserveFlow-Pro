import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../db';
import { translations } from '../../utils/translations';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  Building,
  ToggleLeft,
  ToggleRight,
  ShieldAlert
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, refreshData, seedBusinessPreset, resetEmptyWorkspace, auditLogs, dispatchAuditLog } = useApp();
  const { success } = useToast();
  
  const lang = settings?.language || 'en';
  const t = translations[lang];

  const [confirmFreshStart, setConfirmFreshStart] = useState(false);
  const [confirmDemoLoad, setConfirmDemoLoad] = useState(false);

  // Forms states
  const [profileData, setProfileData] = useState({
    businessName: settings?.businessName || '',
    address: settings?.address || '',
    phone: settings?.phone || '',
    email: settings?.email || '',
    currency: settings?.currency || 'USD',
    language: settings?.language || 'en'
  });

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'preset' | 'modules' | 'audit'>('profile');

  useEffect(() => {
    if (settings) {
      setProfileData({
        businessName: settings.businessName,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        currency: settings.currency,
        language: settings.language
      });
    }
  }, [settings]);

  const handleFreshStart = async () => {
    await resetEmptyWorkspace();
    success('Workspace reset. Your clinic data is now empty.');
    setConfirmFreshStart(false);
  };

  const handleDemoLoad = async () => {
    await seedBusinessPreset();
    success('Dental clinic demo data loaded successfully.');
    setConfirmDemoLoad(false);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const org = "org-smilecare-pro";
    await db.settings.update(org, {
      ...profileData,
      isRtl: profileData.language === 'ar'
    });

    await dispatchAuditLog("Settings Changed", `Updated clinic profile information.`);
    await refreshData();
    success('Settings saved successfully.');
  };

  // Toggle individual integration features
  const handleToggleFeature = async (featureKey: string) => {
    if (!settings) return;
    const org = "org-smilecare-pro";
    const updatedFeatures = {
      ...settings.features,
      [featureKey]: !((settings.features as any)[featureKey])
    };

    await db.settings.update(org, { features: updatedFeatures });
    await dispatchAuditLog("Integration Toggled", `Updated toggle for feature integration: ${featureKey}`);
    await refreshData();
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t.settings}</h2>
        <p className="text-xs text-slate-500">Configure clinic information, demo data, integrations, and activity logs</p>
      </div>

      {/* Sub tabs nav bar */}
      <div className="flex border-b border-slate-200">
        {(['profile', 'preset', 'modules', 'audit'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition-all capitalize ${
              activeSubTab === tab ? 'border-brand-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-800'
            }`}
          >
            {tab === 'preset' ? t.presetSeeding : tab === 'modules' ? 'Integrations' : tab === 'audit' ? t.auditLogs : 'Clinic Profile'}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      
      {/* 1. Profile Settings Form */}
      {activeSubTab === 'profile' && (
        <div className="card p-6 rounded-2xl border-slate-200 max-w-lg">
          <form onSubmit={handleProfileSave} className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
              <Building className="h-4.5 w-4.5 text-brand-600" />
              <span>Clinic Contact Information</span>
            </h4>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Clinic Name</label>
              <input
                type="text"
                required
                value={profileData.businessName}
                onChange={(e) => setProfileData(prev => ({ ...prev, businessName: e.target.value }))}
                className="w-full input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.address}</label>
              <input
                type="text"
                required
                value={profileData.address}
                onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full input-field text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.phone}</label>
                <input
                  type="tel"
                  required
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full input-field text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.email}</label>
                <input
                  type="email"
                  required
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full input-field text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.currency}</label>
                <select
                  value={profileData.currency}
                  onChange={(e) => setProfileData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full input-field text-xs"
                >
                  <option value="USD">USD ($)</option>
                  <option value="SAR">SAR (ر.س)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="EGP">EGP (ج.م)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.language}</label>
                <select
                  value={profileData.language}
                  onChange={(e) => setProfileData(prev => ({ ...prev, language: e.target.value as any }))}
                  className="w-full input-field text-xs"
                >
                  <option value="en">English (LTR)</option>
                  <option value="ar">العربية - Arabic (RTL)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button type="submit" className="btn-primary px-5 py-2.5 text-xs">
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Preset Layout Seeder presets */}
      {activeSubTab === 'preset' && (
        <div className="space-y-6">
          <div className="max-w-xl">
            <h4 className="text-slate-900 font-bold text-sm">{t.presetSeeding}</h4>
            <p className="text-xs text-slate-500 mt-1">{t.presetSeedingDesc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div className="card p-5 rounded-2xl border-slate-200 flex flex-col justify-between hover:border-brand-300 transition-all border-brand-500/60 bg-brand-500/5">
              <div>
                <h5 className="font-bold text-slate-900 text-base">Dental Clinic Demo</h5>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Load sample patients, doctors, dental services, appointments, and inquiries for SmileCare Pro.
                </p>
              </div>
              <button
                onClick={() => setConfirmDemoLoad(true)}
                className="btn-secondary py-2 text-xs font-bold mt-5 w-full"
              >
                {settings?.activePreset === 'Dental' ? 'Reload Demo Data' : 'Load Demo Data'}
              </button>
            </div>

            <div className="card p-5 rounded-2xl border-slate-200 flex flex-col justify-between">
              <div>
                <h5 className="font-bold text-slate-900 text-base">Fresh Start</h5>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Start with an empty workspace — no patients, services, doctors, or appointments.
                </p>
              </div>
              <button
                onClick={() => setConfirmFreshStart(true)}
                className="btn-secondary py-2 text-xs font-bold mt-5 w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                Reset to Empty Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Integration Modules toggles */}
      {activeSubTab === 'modules' && (
        <div className="card p-6 rounded-2xl border-slate-200 max-w-xl space-y-5">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Enterprise System Integrations</h4>
            <p className="text-[10px] text-slate-500">Toggle SaaS connectors and sync adapters</p>
          </div>

          {settings && (
            <div className="divide-y divide-slate-850 space-y-4">
              
              {/* Stripe */}
              <div className="flex items-center justify-between py-2 pt-0">
                <div>
                  <p className="text-xs font-bold text-slate-900">{t.stripePayments}</p>
                  <p className="text-[10px] text-slate-400">Accept credit card deposits upon public scheduling checkout</p>
                </div>
                <button onClick={() => handleToggleFeature('stripeEnabled')}>
                  {settings.features.stripeEnabled 
                    ? <ToggleRight className="h-9 w-9 text-brand-600" />
                    : <ToggleLeft className="h-9 w-9 text-slate-650" />
                  }
                </button>
              </div>

              {/* PayPal */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">{t.paypalPayments}</p>
                  <p className="text-[10px] text-slate-400">Enable PayPal wallet Checkout support</p>
                </div>
                <button onClick={() => handleToggleFeature('paypalEnabled')}>
                  {settings.features.paypalEnabled 
                    ? <ToggleRight className="h-9 w-9 text-brand-600" />
                    : <ToggleLeft className="h-9 w-9 text-slate-650" />
                  }
                </button>
              </div>

              {/* Google Calendar */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">{t.googleCalendar}</p>
                  <p className="text-[10px] text-slate-400">Synchronize appointment schedules directly to staff Google calendars</p>
                </div>
                <button onClick={() => handleToggleFeature('googleCalendarEnabled')}>
                  {settings.features.googleCalendarEnabled 
                    ? <ToggleRight className="h-9 w-9 text-brand-600" />
                    : <ToggleLeft className="h-9 w-9 text-slate-650" />
                  }
                </button>
              </div>

              {/* WhatsApp notifications */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">{t.whatsappAlerts}</p>
                  <p className="text-[10px] text-slate-400">Dispatch automated reminders to patients on confirmation or rescheduling</p>
                </div>
                <button onClick={() => handleToggleFeature('whatsappNotifications')}>
                  {settings.features.whatsappNotifications 
                    ? <ToggleRight className="h-9 w-9 text-brand-600" />
                    : <ToggleLeft className="h-9 w-9 text-slate-650" />
                  }
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* 4. Audit Log list view */}
      {activeSubTab === 'audit' && (
        <div className="card p-5 rounded-2xl border-slate-200 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{t.auditLogs}</h4>
              <p className="text-[10px] text-slate-500">Security event history for tenant verification</p>
            </div>
            <ShieldAlert className="h-5 w-5 text-slate-500" />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50/40 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                  <span className="text-brand-700">{log.action}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-slate-900 font-semibold">{log.details}</p>
                <p className="text-[10px] text-slate-500">Triggered by: {log.userName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmFreshStart}
        title="Reset to Empty Workspace?"
        message="This will erase all patients, doctors, services, and appointments. This action cannot be undone."
        confirmLabel="Reset Workspace"
        variant="danger"
        onConfirm={handleFreshStart}
        onClose={() => setConfirmFreshStart(false)}
      />

      <ConfirmDialog
        isOpen={confirmDemoLoad}
        title="Load Dental Demo Data?"
        message="This will replace your current clinic data with the SmileCare dental demo dataset."
        confirmLabel="Load Demo Data"
        variant="warning"
        onConfirm={handleDemoLoad}
        onClose={() => setConfirmDemoLoad(false)}
      />
    </div>
  );
};
