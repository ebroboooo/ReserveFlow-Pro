import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { 
  Branch, Customer, Service, Employee, Reservation, 
  Lead, Notification, WaitlistRecord, SystemSettings, AuditLog 
} from '../types';
import { db } from '../db';
import { useAuth } from './AuthContext';
import { mockDbInstance } from '../db/mockRepository';

interface AppContextType {
  branches: Branch[];
  customers: Customer[];
  services: Service[];
  employees: Employee[];
  reservations: Reservation[];
  leads: Lead[];
  notifications: Notification[];
  waitlist: WaitlistRecord[];
  settings: SystemSettings | null;
  auditLogs: AuditLog[];
  selectedBranchId: string; // "all" or specific branch ID
  setSelectedBranchId: (id: string) => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  dispatchAuditLog: (action: string, details: string) => Promise<void>;
  seedBusinessPreset: () => Promise<void>;
  resetEmptyWorkspace: () => Promise<void>;
  unreadNotificationCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRecord[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const orgId = currentUser?.orgId || "org-smilecare-pro";

  const refreshData = useCallback(async () => {
    const org = currentUser?.orgId || "org-smilecare-pro";
    try {
      const [
        bList, cList, sList, eList, rList, lList, nList, wList, setts, logs, unread
      ] = await Promise.all([
        db.branches.getAll(org),
        db.customers.getAll(org),
        db.services.getAll(org),
        db.employees.getAll(org),
        db.reservations.getAll(org),
        db.leads.getAll(org),
        db.notifications.getAll(org),
        db.waitlist.getAll(org),
        db.settings.get(org),
        db.auditLogs.getAll(org),
        db.notifications.getUnreadCount(org)
      ]);

      setBranches(bList);
      setCustomers(cList);
      setServices(sList);
      setEmployees(eList);
      setReservations(rList);
      setLeads(lList);
      setNotifications(nList);
      setWaitlist(wList);
      setSettings(setts);
      setAuditLogs(logs);
      setUnreadNotificationCount(unread);
    } catch (e) {
      console.error("Failed to load application data context", e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshData();
  }, [currentUser, refreshData]);

  // Adjust default branch scope based on current user scope
  useEffect(() => {
    if (currentUser?.branchId) {
      setSelectedBranchId(currentUser.branchId);
    } else {
      setSelectedBranchId("all");
    }
  }, [currentUser]);

  const dispatchAuditLog = async (action: string, details: string) => {
    if (!currentUser) return;
    await db.auditLogs.create(orgId, {
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details
    });
    const logs = await db.auditLogs.getAll(orgId);
    setAuditLogs(logs);
  };

  const seedBusinessPreset = async () => {
    setIsLoading(true);
    mockDbInstance.resetPreset('Dental');

    await db.settings.update(orgId, { activePreset: 'Dental' });
    await refreshData();
    await dispatchAuditLog('Demo Data Loaded', 'Loaded SmileCare dental clinic demo dataset');
  };

  const resetEmptyWorkspace = async () => {
    setIsLoading(true);
    mockDbInstance.resetEmpty();
    await db.settings.update(orgId, { activePreset: undefined });
    await refreshData();
    await dispatchAuditLog("Fresh Start", "Workspace reset to empty state");
  };

  // Switch HTML direction dynamically when settings modify language
  useEffect(() => {
    if (settings) {
      const isAr = settings.language === 'ar';
      document.documentElement.setAttribute('dir', isAr ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', settings.language);
    }
  }, [settings]);

  return (
    <AppContext.Provider value={{
      branches,
      customers,
      services,
      employees,
      reservations,
      leads,
      notifications,
      waitlist,
      settings,
      auditLogs,
      selectedBranchId,
      setSelectedBranchId,
      isLoading,
      refreshData,
      dispatchAuditLog,
      seedBusinessPreset,
      resetEmptyWorkspace,
      unreadNotificationCount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside an AppProvider");
  return ctx;
};
