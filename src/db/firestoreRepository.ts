import type {
  Customer, Reservation, Service, Employee, Lead, Notification,
  WaitlistRecord, AuditLog, SystemSettings, Branch
} from '../types';
import type {
  ICustomerRepository, IReservationRepository, IServiceRepository,
  IEmployeeRepository, IBranchRepository, ILeadRepository,
  INotificationRepository, IWaitlistRepository, IAuditLogRepository,
  ISettingsRepository, CreateCustomerInput, CreateReservationInput,
  CreateServiceInput, CreateEmployeeInput, CreateBranchInput,
  CreateLeadInput, CreateNotificationInput, CreateWaitlistInput, CreateAuditLogInput
} from './interfaces';
import { fsGetAll, fsGetById, fsCreate, fsUpdate, fsDelete, fsQuery, fsMarkAllRead } from '../firebase/firestoreHelpers';
import { getPresetSeeds } from './mockRepository';
import { DEFAULT_PUBLIC_BOOKING_SLUG } from '../types';

const COL = {
  branches: 'branches',
  patients: 'patients',
  appointments: 'appointments',
  services: 'services',
  doctors: 'doctors',
  leads: 'leads',
  notifications: 'notifications',
  waitlist: 'waitlist',
  auditLogs: 'auditLogs',
  settings: 'settings',
} as const;

export class FirestoreBranchRepository implements IBranchRepository {
  getAll = (orgId: string) => fsGetAll<Branch>(orgId, COL.branches);
  getById = (orgId: string, id: string) => fsGetById<Branch>(orgId, COL.branches, id);
  create = (orgId: string, data: CreateBranchInput) => fsCreate(orgId, COL.branches, { ...data, orgId });
  update = (orgId: string, id: string, data: Partial<Branch>) => fsUpdate<Branch>(orgId, COL.branches, id, data);
  delete = (orgId: string, id: string) => fsDelete(orgId, COL.branches, id);
}

export class FirestoreCustomerRepository implements ICustomerRepository {
  getAll = (orgId: string) => fsGetAll<Customer>(orgId, COL.patients);
  getById = (orgId: string, id: string) => fsGetById<Customer>(orgId, COL.patients, id);
  create = (orgId: string, data: CreateCustomerInput) =>
    fsCreate(orgId, COL.patients, { ...data, orgId, totalSpending: 0, createdAt: new Date().toISOString() });
  update = (orgId: string, id: string, data: Partial<Customer>) => fsUpdate<Customer>(orgId, COL.patients, id, data);
  delete = (orgId: string, id: string) => fsDelete(orgId, COL.patients, id);
}

export class FirestoreReservationRepository implements IReservationRepository {
  getAll = (orgId: string) => fsGetAll<Reservation>(orgId, COL.appointments);
  getById = (orgId: string, id: string) => fsGetById<Reservation>(orgId, COL.appointments, id);
  create = (orgId: string, data: CreateReservationInput) =>
    fsCreate(orgId, COL.appointments, { ...data, orgId, createdAt: new Date().toISOString() });
  update = (orgId: string, id: string, data: Partial<Reservation>) =>
    fsUpdate<Reservation>(orgId, COL.appointments, id, data);
  delete = (orgId: string, id: string) => fsDelete(orgId, COL.appointments, id);

  async getByDateRange(orgId: string, branchId: string, start: string, end: string): Promise<Reservation[]> {
    const all = await this.getAll(orgId);
    return all.filter(r =>
      (branchId ? r.branchId === branchId : true) && r.date >= start && r.date <= end
    );
  }

  async checkConflict(orgId: string, _branchId: string, employeeId: string, date: string, time: string, duration: number, excludeId?: string): Promise<boolean> {
    const all = await this.getAll(orgId);
    const parseTime = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const targetStart = parseTime(time);
    const targetEnd = targetStart + duration;
    return all.some(r => {
      if (r.id === excludeId || r.employeeId !== employeeId || r.date !== date || r.status === 'Cancelled') return false;
      const start = parseTime(r.time);
      return targetStart < start + r.duration && targetEnd > start;
    });
  }
}

export class FirestoreServiceRepository implements IServiceRepository {
  getAll = (orgId: string) => fsGetAll<Service>(orgId, COL.services);
  getById = (orgId: string, id: string) => fsGetById<Service>(orgId, COL.services, id);
  create = (orgId: string, data: CreateServiceInput) => fsCreate(orgId, COL.services, { ...data, orgId });
  update = (orgId: string, id: string, data: Partial<Service>) => fsUpdate<Service>(orgId, COL.services, id, data);
  delete = (orgId: string, id: string) => fsDelete(orgId, COL.services, id);
}

export class FirestoreEmployeeRepository implements IEmployeeRepository {
  getAll = (orgId: string) => fsGetAll<Employee>(orgId, COL.doctors);
  getById = (orgId: string, id: string) => fsGetById<Employee>(orgId, COL.doctors, id);
  create = (orgId: string, data: CreateEmployeeInput) => fsCreate(orgId, COL.doctors, { ...data, orgId });
  update = (orgId: string, id: string, data: Partial<Employee>) => fsUpdate<Employee>(orgId, COL.doctors, id, data);
  delete = (orgId: string, id: string) => fsDelete(orgId, COL.doctors, id);
}

export class FirestoreLeadRepository implements ILeadRepository {
  getAll = (orgId: string) => fsGetAll<Lead>(orgId, COL.leads);
  getById = (orgId: string, id: string) => fsGetById<Lead>(orgId, COL.leads, id);
  create = (orgId: string, data: CreateLeadInput) =>
    fsCreate(orgId, COL.leads, { ...data, orgId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  update = (orgId: string, id: string, data: Partial<Lead>) =>
    fsUpdate<Lead>(orgId, COL.leads, id, { ...data, updatedAt: new Date().toISOString() });
  delete = (orgId: string, id: string) => fsDelete(orgId, COL.leads, id);
}

export class FirestoreNotificationRepository implements INotificationRepository {
  getAll = (orgId: string) => fsGetAll<Notification>(orgId, COL.notifications);
  getById = (orgId: string, id: string) => fsGetById<Notification>(orgId, COL.notifications, id);
  create = (orgId: string, data: CreateNotificationInput) =>
    fsCreate(orgId, COL.notifications, { ...data, orgId, createdAt: new Date().toISOString() });
  update = (orgId: string, id: string, data: Partial<Notification>) =>
    fsUpdate<Notification>(orgId, COL.notifications, id, data);
  delete = (orgId: string, id: string) => fsDelete(orgId, COL.notifications, id);

  async getUnreadCount(orgId: string): Promise<number> {
    const unread = await fsQuery<Notification>(orgId, COL.notifications, 'read', '==', false);
    return unread.length;
  }

  markAllAsRead = (orgId: string) => fsMarkAllRead(orgId);
}

export class FirestoreWaitlistRepository implements IWaitlistRepository {
  getAll = (orgId: string) => fsGetAll<WaitlistRecord>(orgId, COL.waitlist);
  getById = (orgId: string, id: string) => fsGetById<WaitlistRecord>(orgId, COL.waitlist, id);
  create = (orgId: string, data: CreateWaitlistInput) =>
    fsCreate(orgId, COL.waitlist, { ...data, orgId, createdAt: new Date().toISOString() });
  update = (orgId: string, id: string, data: Partial<WaitlistRecord>) =>
    fsUpdate<WaitlistRecord>(orgId, COL.waitlist, id, data);
  delete = (orgId: string, id: string) => fsDelete(orgId, COL.waitlist, id);

  async getWaiting(orgId: string, branchId: string): Promise<WaitlistRecord[]> {
    const all = await this.getAll(orgId);
    return all.filter(w => w.status === 'Waiting' && (branchId ? w.branchId === branchId : true));
  }
}

export class FirestoreAuditLogRepository implements IAuditLogRepository {
  getAll = (orgId: string) => fsGetAll<AuditLog>(orgId, COL.auditLogs);
  create = (orgId: string, log: CreateAuditLogInput) =>
    fsCreate(orgId, COL.auditLogs, { ...log, orgId, timestamp: new Date().toISOString() });
}

export class FirestoreSettingsRepository implements ISettingsRepository {
  async get(orgId: string): Promise<SystemSettings> {
    const settings = await fsGetById<SystemSettings>(orgId, COL.settings, 'main');
    if (settings) return settings;
    const defaults = getPresetSeeds(orgId).settings;
    return defaults;
  }

  async update(orgId: string, settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const current = await this.get(orgId);
    const updated = { ...current, ...settings, orgId, publicSlug: settings.publicSlug || current.publicSlug || DEFAULT_PUBLIC_BOOKING_SLUG };
    try {
      return await fsUpdate<SystemSettings>(orgId, COL.settings, 'main', updated);
    } catch {
      return await fsCreate(orgId, COL.settings, { ...updated, id: 'main' });
    }
  }
}
