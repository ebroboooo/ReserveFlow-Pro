import type { 
  Customer, 
  Reservation, 
  Service, 
  Employee, 
  Lead, 
  Notification, 
  WaitlistRecord, 
  AuditLog, 
  SystemSettings,
  Branch
} from '../types';

/** Fields auto-filled by the repository layer on create */
export type CreateCustomerInput = Omit<Customer, 'id' | 'orgId' | 'createdAt' | 'totalSpending'>;
export type CreateReservationInput = Omit<Reservation, 'id' | 'orgId' | 'createdAt'>;
export type CreateServiceInput = Omit<Service, 'id' | 'orgId'>;
export type CreateEmployeeInput = Omit<Employee, 'id' | 'orgId'>;
export type CreateBranchInput = Omit<Branch, 'id' | 'orgId'>;
export type CreateLeadInput = Omit<Lead, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>;
export type CreateNotificationInput = Omit<Notification, 'id' | 'orgId' | 'createdAt'>;
export type CreateWaitlistInput = Omit<WaitlistRecord, 'id' | 'orgId' | 'createdAt'>;
export type CreateAuditLogInput = Omit<AuditLog, 'id' | 'orgId' | 'timestamp'>;

export interface IRepository<T, TCreate = Omit<T, 'id'>> {
  getAll(orgId: string): Promise<T[]>;
  getById(orgId: string, id: string): Promise<T | null>;
  create(orgId: string, data: TCreate): Promise<T>;
  update(orgId: string, id: string, data: Partial<T>): Promise<T>;
  delete(orgId: string, id: string): Promise<boolean>;
}

export interface ICustomerRepository extends IRepository<Customer, CreateCustomerInput> {}

export interface IReservationRepository extends IRepository<Reservation, CreateReservationInput> {
  getByDateRange(orgId: string, branchId: string, start: string, end: string): Promise<Reservation[]>;
  checkConflict(orgId: string, branchId: string, employeeId: string, date: string, time: string, duration: number, excludeId?: string): Promise<boolean>;
}

export interface IServiceRepository extends IRepository<Service, CreateServiceInput> {}

export interface IEmployeeRepository extends IRepository<Employee, CreateEmployeeInput> {}

export interface IBranchRepository extends IRepository<Branch, CreateBranchInput> {}

export interface ILeadRepository extends IRepository<Lead, CreateLeadInput> {}

export interface INotificationRepository extends IRepository<Notification, CreateNotificationInput> {
  getUnreadCount(orgId: string): Promise<number>;
  markAllAsRead(orgId: string): Promise<void>;
}

export interface IWaitlistRepository extends IRepository<WaitlistRecord, CreateWaitlistInput> {
  getWaiting(orgId: string, branchId: string): Promise<WaitlistRecord[]>;
}

export interface IAuditLogRepository {
  getAll(orgId: string): Promise<AuditLog[]>;
  create(orgId: string, log: CreateAuditLogInput): Promise<AuditLog>;
}

export interface ISettingsRepository {
  get(orgId: string): Promise<SystemSettings>;
  update(orgId: string, settings: Partial<SystemSettings>): Promise<SystemSettings>;
}
