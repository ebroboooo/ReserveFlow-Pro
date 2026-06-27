import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { translations } from '../../utils/translations';
import { 
  Building, 
  ToggleLeft,
  ToggleRight,
  ShieldAlert
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, refreshData, seedBusinessPreset, resetEmptyWorkspace, auditLogs, dispatchAuditLog } = useApp();
  
  const lang = settings?.language || 'en';
  const t = translations[lang];

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
    if (window.confirm("This will erase all current data and start with a completely empty workspace. Continue?")) {
      await resetEmptyWorkspace();
      alert("Fresh start complete. Your workspace is now empty.");
    }
  };

  const handlePresetApply = async (preset: 'Clinic' | 'Salon' | 'Barbershop' | 'PlayStation' | 'Sports' | 'Consultation') => {
    if (window.confirm(`Warning: Applying the "${preset}" preset will reset and override your current services, employee, and reservation data configurations. Proceed?`)) {
      await seedBusinessPreset(preset);
      alert(`Successfully loaded ${preset} template presets!`);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const org = "org-reserveflow-pro";
    await db.settings.update(org, {
      ...profileData,
      isRtl: profileData.language === 'ar'
    });

    await dispatchAuditLog("Settings Changed", `Updated business profile information.`);
    await refreshData();
    alert("Settings updated successfully!");
  };

  // Toggle individual integration features
  const handleToggleFeature = async (featureKey: string) => {
    if (!settings) return;
    const org = "org-reserveflow-pro";
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
        <h2 className="text-xl font-bold text-white">{t.settings}</h2>
        <p className="text-xs text-slate-500">Configure business information, preset layouts, feature integrations, and view audits</p>
      </div>

      {/* Sub tabs nav bar */}
      <div className="flex border-b border-slate-800">
        {(['profile', 'preset', 'modules', 'audit'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition-all capitalize ${
              activeSubTab === tab ? 'border-brand-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'preset' ? t.presetSeeding : tab === 'modules' ? 'Integrations' : tab === 'audit' ? 'Audit Logs' : 'Profile'}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      
      {/* 1. Profile Settings Form */}
      {activeSubTab === 'profile' && (
        <div className="glass-card p-6 rounded-2xl border-slate-800/60 max-w-lg">
          <form onSubmit={handleProfileSave} className="space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
              <Building className="h-4.5 w-4.5 text-brand-400" />
              <span>Business Contact Information</span>
            </h4>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Business Brand Name</label>
              <input
                type="text"
                required
                value={profileData.businessName}
                onChange={(e) => setProfileData(prev => ({ ...prev, businessName: e.target.value }))}
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.address}</label>
              <input
                type="text"
                required
                value={profileData.address}
                onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full glass-input text-xs"
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
                  className="w-full glass-input text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.email}</label>
                <input
                  type="email"
                  required
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{t.currency}</label>
                <select
                  value={profileData.currency}
                  onChange={(e) => setProfileData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full glass-input text-xs"
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
                  className="w-full glass-input text-xs"
                >
                  <option value="en">English (LTR)</option>
                  <option value="ar">العربية - Arabic (RTL)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button type="submit" className="glass-btn-primary px-5 py-2.5 text-xs">
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
            <h4 className="text-white font-bold text-sm">{t.presetSeeding}</h4>
            <p className="text-xs text-slate-500 mt-1">{t.presetSeedingDesc}</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border-slate-850 max-w-md">
            <h5 className="font-bold text-white text-base">Fresh Start</h5>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Start with a completely empty workspace — no customers, services, employees, or reservations.
            </p>
            <button
              onClick={handleFreshStart}
              className="glass-btn-secondary py-2 text-xs font-bold mt-4 w-full border-red-500/30 text-red-300 hover:bg-red-500/10"
            >
              Reset to Empty Workspace
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(['Clinic', 'Salon', 'Barbershop', 'PlayStation', 'Sports', 'Consultation'] as const).map(preset => (
              <div 
                key={preset} 
                className={`glass-card p-5 rounded-2xl border-slate-850 flex flex-col justify-between hover:border-brand-500/30 transition-all ${
                  settings?.activePreset === preset ? 'border-brand-500/60 bg-brand-500/5' : ''
                }`}
              >
                <div>
                  <h5 className="font-bold text-white text-base">{preset} Preset Template</h5>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Loads default categories, custom branch names, duration timings, prices, and sample client reservations.
                  </p>
                </div>
                <button
                  onClick={() => handlePresetApply(preset)}
                  className="glass-btn-secondary py-2 text-xs font-bold mt-5 w-full"
                >
                  {settings?.activePreset === preset ? 'Active (Re-seed)' : 'Apply Preset'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Integration Modules toggles */}
      {activeSubTab === 'modules' && (
        <div className="glass-card p-6 rounded-2xl border-slate-800/60 max-w-xl space-y-5">
          <div>
            <h4 className="font-bold text-white text-sm">Enterprise System Integrations</h4>
            <p className="text-[10px] text-slate-500">Toggle SaaS connectors and sync adapters</p>
          </div>

          {settings && (
            <div className="divide-y divide-slate-850 space-y-4">
              
              {/* Stripe */}
              <div className="flex items-center justify-between py-2 pt-0">
                <div>
                  <p className="text-xs font-bold text-white">{t.stripePayments}</p>
                  <p className="text-[10px] text-slate-400">Accept credit card deposits upon public scheduling checkout</p>
                </div>
                <button onClick={() => handleToggleFeature('stripeEnabled')}>
                  {settings.features.stripeEnabled 
                    ? <ToggleRight className="h-9 w-9 text-brand-400" />
                    : <ToggleLeft className="h-9 w-9 text-slate-650" />
                  }
                </button>
              </div>

              {/* PayPal */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-bold text-white">{t.paypalPayments}</p>
                  <p className="text-[10px] text-slate-400">Enable PayPal wallet Checkout support</p>
                </div>
                <button onClick={() => handleToggleFeature('paypalEnabled')}>
                  {settings.features.paypalEnabled 
                    ? <ToggleRight className="h-9 w-9 text-brand-400" />
                    : <ToggleLeft className="h-9 w-9 text-slate-650" />
                  }
                </button>
              </div>

              {/* Google Calendar */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-bold text-white">{t.googleCalendar}</p>
                  <p className="text-[10px] text-slate-400">Synchronize appointment schedules directly to staff Google calendars</p>
                </div>
                <button onClick={() => handleToggleFeature('googleCalendarEnabled')}>
                  {settings.features.googleCalendarEnabled 
                    ? <ToggleRight className="h-9 w-9 text-brand-400" />
                    : <ToggleLeft className="h-9 w-9 text-slate-650" />
                  }
                </button>
              </div>

              {/* WhatsApp notifications */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-bold text-white">{t.whatsappAlerts}</p>
                  <p className="text-[10px] text-slate-400">Dispatch automated reminders to clients on confirmation or rescheduling</p>
                </div>
                <button onClick={() => handleToggleFeature('whatsappNotifications')}>
                  {settings.features.whatsappNotifications 
                    ? <ToggleRight className="h-9 w-9 text-brand-400" />
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
        <div className="glass-card p-5 rounded-2xl border-slate-800/60 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-3">
            <div>
              <h4 className="font-bold text-white text-sm">{t.auditLogs}</h4>
              <p className="text-[10px] text-slate-500">Security event history for tenant verification</p>
            </div>
            <ShieldAlert className="h-5 w-5 text-slate-500" />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-950/40 border border-slate-850/60 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                  <span className="text-brand-300">{log.action}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-white font-semibold">{log.details}</p>
                <p className="text-[10px] text-slate-500">Triggered by: {log.userName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
