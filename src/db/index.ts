import type { 
  ICustomerRepository,
  IReservationRepository,
  IServiceRepository,
  IEmployeeRepository,
  IBranchRepository,
  ILeadRepository,
  INotificationRepository,
  IWaitlistRepository,
  IAuditLogRepository,
  ISettingsRepository
} from './interfaces';
import { 
  MockCustomerRepository,
  MockReservationRepository,
  MockServiceRepository,
  MockEmployeeRepository,
  MockBranchRepository,
  MockLeadRepository,
  MockNotificationRepository,
  MockWaitlistRepository,
  MockAuditLogRepository,
  MockSettingsRepository
} from './mockRepository';
import { 
  FirestoreCustomerRepository,
  FirestoreReservationRepository,
  FirestoreServiceRepository,
  FirestoreEmployeeRepository,
  FirestoreBranchRepository,
  FirestoreLeadRepository,
  FirestoreNotificationRepository,
  FirestoreWaitlistRepository,
  FirestoreAuditLogRepository,
  FirestoreSettingsRepository
} from './firestoreRepository';

// Switch Repository source based on env key.
// Default to Mock for zero-configuration startup.
const useFirestore = import.meta.env.VITE_USE_FIRESTORE === 'true';

class RepositoryProvider {
  public branches: IBranchRepository;
  public customers: ICustomerRepository;
  public reservations: IReservationRepository;
  public services: IServiceRepository;
  public employees: IEmployeeRepository;
  public leads: ILeadRepository;
  public notifications: INotificationRepository;
  public waitlist: IWaitlistRepository;
  public auditLogs: IAuditLogRepository;
  public settings: ISettingsRepository;

  constructor() {
    if (useFirestore) {
      this.branches = new FirestoreBranchRepository();
      this.customers = new FirestoreCustomerRepository();
      this.reservations = new FirestoreReservationRepository();
      this.services = new FirestoreServiceRepository();
      this.employees = new FirestoreEmployeeRepository();
      this.leads = new FirestoreLeadRepository();
      this.notifications = new FirestoreNotificationRepository();
      this.waitlist = new FirestoreWaitlistRepository();
      this.auditLogs = new FirestoreAuditLogRepository();
      this.settings = new FirestoreSettingsRepository();
    } else {
      this.branches = new MockBranchRepository();
      this.customers = new MockCustomerRepository();
      this.reservations = new MockReservationRepository();
      this.services = new MockServiceRepository();
      this.employees = new MockEmployeeRepository();
      this.leads = new MockLeadRepository();
      this.notifications = new MockNotificationRepository();
      this.waitlist = new MockWaitlistRepository();
      this.auditLogs = new MockAuditLogRepository();
      this.settings = new MockSettingsRepository();
    }
  }
}

export const db = new RepositoryProvider();
