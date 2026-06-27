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
import { DEFAULT_PUBLIC_BOOKING_SLUG } from '../types';
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
  ISettingsRepository,
  CreateCustomerInput,
  CreateReservationInput,
  CreateServiceInput,
  CreateEmployeeInput,
  CreateBranchInput,
  CreateLeadInput,
  CreateNotificationInput,
  CreateWaitlistInput,
  CreateAuditLogInput
} from './interfaces';

// Helper for generating UUIDs
const uuid = () => Math.random().toString(36).substring(2, 9);

// Default seed structures
const DEFAULT_ORG_ID = "org-reserveflow-pro";

// Standard preset data generator
export const getPresetSeeds = (preset: string, orgId: string = DEFAULT_ORG_ID) => {
  const branches: Branch[] = [
    { id: "br-main", orgId, name: "Main Branch (Downtown)", address: "123 Business Avenue, City Center", phone: "+1 (555) 100-2001", email: "downtown@reserveflow.com", timezone: "UTC+3", isActive: true },
    { id: "br-sub", orgId, name: "North Side Plaza", address: "78 Shopping Mall Plaza, Sector 4", phone: "+1 (555) 100-2002", email: "northside@reserveflow.com", timezone: "UTC+3", isActive: true }
  ];

  const customers: Customer[] = [
    { id: "cust-1", orgId, fullName: "Sarah Jenkins", phone: "+1 (555) 019-2834", email: "sarah.j@example.com", notes: "Prefers morning slots. VIP customer.", tags: ["VIP", "Regular"], status: "Active", totalSpending: 450, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    { id: "cust-2", orgId, fullName: "Michael Thorne", phone: "+1 (555) 018-4729", email: "mthorne@example.com", notes: "Allergic to scented products.", tags: ["Sensitive"], status: "Active", totalSpending: 180, createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
    { id: "cust-3", orgId, fullName: "Farah Al-Amiri", phone: "+966 50 123 4567", email: "farah.amiri@example.sa", notes: "Prefers Arabic-speaking staff.", tags: ["Local"], status: "Active", totalSpending: 890, createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
    { id: "cust-4", orgId, fullName: "David Kim", phone: "+1 (555) 021-9988", email: "dkim@example.com", notes: "", tags: [], status: "Active", totalSpending: 0, createdAt: new Date().toISOString() }
  ];

  let services: Service[] = [];
  let employees: Employee[] = [];

  const defaultWeeklySchedule = (): any[] => {
    return [0, 1, 2, 3, 4, 5, 6].map(day => ({
      dayOfWeek: day,
      start: "09:00",
      end: "17:00",
      isWorking: day !== 0 && day !== 6, // Mon to Fri
      breaks: [{ start: "12:00", end: "13:00" }]
    }));
  };

  if (preset === 'Clinic') {
    services = [
      { id: "srv-1", orgId, branchIds: ["br-main", "br-sub"], name: "General Practitioner Consultation", description: "Standard physical checkup and clinical assessment.", duration: 30, price: 120, category: "Consultation", status: "Active" },
      { id: "srv-2", orgId, branchIds: ["br-main"], name: "Specialist Pediatric Assessment", description: "Dedicated pediatric review and guidance.", duration: 45, price: 180, category: "Pediatrics", status: "Active" },
      { id: "srv-3", orgId, branchIds: ["br-main", "br-sub"], name: "Physiotherapy Session", description: "Therapeutic session to restore movement and physical wellness.", duration: 60, price: 150, category: "Therapy", status: "Active" }
    ];
    employees = [
      { id: "emp-1", orgId, branchIds: ["br-main", "br-sub"], name: "Dr. Amanda Ross", role: "General Practitioner", email: "amanda@clinic.com", phone: "+1 (555) 301-4401", status: "Active", schedule: defaultWeeklySchedule() },
      { id: "emp-2", orgId, branchIds: ["br-main"], name: "Dr. Khalid Mansoor", role: "Pediatric Specialist", email: "khalid@clinic.com", phone: "+1 (555) 301-4402", status: "Active", schedule: defaultWeeklySchedule() },
      { id: "emp-3", orgId, branchIds: ["br-main", "br-sub"], name: "Sarah Connor (PT)", role: "Physiotherapist", email: "sconnor@clinic.com", phone: "+1 (555) 301-4403", status: "Active", schedule: defaultWeeklySchedule() }
    ];
  } else if (preset === 'PlayStation') {
    services = [
      { id: "srv-1", orgId, branchIds: ["br-main", "br-sub"], name: "PS5 Standard Room (1 Hour)", description: "Play solo or dual on 4K TV screens.", duration: 60, price: 15, category: "Standard", status: "Active" },
      { id: "srv-2", orgId, branchIds: ["br-main", "br-sub"], name: "VIP VR Room Experience", description: "Full Virtual Reality room with PSVR2 headset.", duration: 60, price: 35, category: "VIP Room", status: "Active" },
      { id: "srv-3", orgId, branchIds: ["br-main"], name: "4-Player Tournament Room", description: "Exclusive large-screen room for local tournament play.", duration: 120, price: 50, category: "Standard", status: "Active" }
    ];
    employees = [
      { id: "emp-1", orgId, branchIds: ["br-main", "br-sub"], name: "Alex Mercer", role: "Console Support Agent", email: "alex@lounge.com", phone: "+1 (555) 890-1111", status: "Active", schedule: defaultWeeklySchedule() },
      { id: "emp-2", orgId, branchIds: ["br-sub"], name: "Faisal Al-Otaibi", role: "Lounge Host", email: "faisal@lounge.com", phone: "+1 (555) 890-2222", status: "Active", schedule: defaultWeeklySchedule() }
    ];
  } else if (preset === 'Sports') {
    services = [
      { id: "srv-1", orgId, branchIds: ["br-main"], name: "5-a-Side Indoor Pitch (90 min)", description: "Indoor pitch rental with balls, bibs, and water included.", duration: 90, price: 80, category: "Football Pitch", status: "Active" },
      { id: "srv-2", orgId, branchIds: ["br-main", "br-sub"], name: "Tennis Court Rental (1 Hour)", description: "Outdoor clay court rental.", duration: 60, price: 25, category: "Tennis", status: "Active" },
      { id: "srv-3", orgId, branchIds: ["br-main", "br-sub"], name: "Professional Coaching Clinic", description: "One-on-one sessions with senior sports instructors.", duration: 60, price: 60, category: "Coaching", status: "Active" }
    ];
    employees = [
      { id: "emp-1", orgId, branchIds: ["br-main", "br-sub"], name: "Coach Marcus Vance", role: "Tennis Specialist", email: "marcus@sports.com", phone: "+1 (555) 777-1111", status: "Active", schedule: defaultWeeklySchedule() },
      { id: "emp-2", orgId, branchIds: ["br-main"], name: "Sami Ghanam", role: "Football Pitches Coordinator", email: "sami@sports.com", phone: "+1 (555) 777-2222", status: "Active", schedule: defaultWeeklySchedule() }
    ];
  } else {
    // Salon & Barbershop defaults
    services = [
      { id: "srv-1", orgId, branchIds: ["br-main", "br-sub"], name: "Classic Haircut & Style", description: "Standard scissor cut, styling, wash, and style consultation.", duration: 45, price: 40, category: "Haircuts", status: "Active" },
      { id: "srv-2", orgId, branchIds: ["br-main", "br-sub"], name: "Beard Trim & Hot Towel Shave", description: "Relaxing hot towel treatment with razor line edging.", duration: 30, price: 25, category: "Beard Care", status: "Active" },
      { id: "srv-3", orgId, branchIds: ["br-main"], name: "VIP Keratin Treatment", description: "Premium protein smoothening and restoration.", duration: 120, price: 150, category: "Hair Therapy", status: "Active" }
    ];
    employees = [
      { id: "emp-1", orgId, branchIds: ["br-main", "br-sub"], name: "James R.", role: "Master Barber", email: "james@salon.com", phone: "+1 (555) 203-1991", status: "Active", schedule: defaultWeeklySchedule() },
      { id: "emp-2", orgId, branchIds: ["br-main"], name: "Layla Younes", role: "Senior Hair Stylist", email: "layla@salon.com", phone: "+1 (555) 203-1992", status: "Active", schedule: defaultWeeklySchedule() },
      { id: "emp-3", orgId, branchIds: ["br-sub"], name: "Tariq Ali", role: "Styling Assistant", email: "tariq@salon.com", phone: "+1 (555) 203-1993", status: "Active", schedule: defaultWeeklySchedule() }
    ];
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const reservations: Reservation[] = [
    { 
      id: "res-1", orgId, branchId: "br-main", customerId: "cust-1", serviceId: "srv-1", employeeId: "emp-1", 
      date: todayStr, time: "10:00", duration: services[0].duration, notes: "Needs extra care.", status: "Confirmed", 
      paymentStatus: "Paid", paymentDetails: { method: "Stripe", amount: services[0].price, transactionId: "txn_str_123", paidAt: new Date().toISOString() }, 
      createdAt: new Date().toISOString() 
    },
    { 
      id: "res-2", orgId, branchId: "br-main", customerId: "cust-2", serviceId: "srv-2", employeeId: "emp-2", 
      date: todayStr, time: "14:00", duration: services[1].duration, notes: "No fragrance.", status: "Pending", 
      paymentStatus: "Unpaid", paymentDetails: { method: "Cash", amount: services[1].price }, 
      createdAt: new Date().toISOString() 
    },
    { 
      id: "res-3", orgId, branchId: "br-sub", customerId: "cust-3", serviceId: "srv-1", employeeId: "emp-1", 
      date: todayStr, time: "11:30", duration: services[0].duration, notes: "RTL booking test.", status: "Confirmed", 
      paymentStatus: "Authorized", paymentDetails: { method: "PayPal", amount: services[0].price, transactionId: "txn_pay_abc" }, 
      createdAt: new Date().toISOString() 
    }
  ];

  const leads: Lead[] = [
    { id: "lead-1", orgId, branchId: "br-main", fullName: "Robert Smith", phone: "+1 (555) 999-8888", email: "rsmith@web.com", source: "Website Contact Form", status: "New", value: 120, notes: "Interested in recurring VIP treatments.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "lead-2", orgId, branchId: "br-main", fullName: "Yasmin Farooq", phone: "+966 55 987 6543", email: "yasmin@agency.sa", source: "Instagram Promo", status: "Contacted", value: 300, notes: "Inquired about group bookings.", createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
    { id: "lead-3", orgId, branchId: "br-sub", fullName: "George Miller", phone: "+1 (555) 777-6666", email: "gmiller@corp.com", source: "Google Ads", status: "Interested", value: 80, notes: "Called to check court rentals.", createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date().toISOString() }
  ];

  const waitlist: WaitlistRecord[] = [
    { id: "wait-1", orgId, branchId: "br-main", customerId: "cust-4", serviceId: "srv-1", employeeId: "emp-1", date: todayStr, timeSlotPreference: "Morning", notes: "Urgent slot needed", status: "Waiting", createdAt: new Date().toISOString() }
  ];

  const notifications: Notification[] = [
    { id: "not-1", orgId, branchId: "br-main", title: "New Lead Registered", message: "Robert Smith has completed the lead inquiry.", read: false, type: "LeadCreated", createdAt: new Date().toISOString() },
    { id: "not-2", orgId, branchId: "br-sub", title: "Booking Confirmation Paid", message: "Sarah Jenkins completed payment via Stripe.", read: true, type: "BookingCreated", createdAt: new Date(Date.now() - 4 * 3600000).toISOString() }
  ];

  const auditLogs: AuditLog[] = [
    { id: "log-1", orgId, userId: "usr-admin", userName: "Admin", timestamp: new Date().toISOString(), action: "Preset Loaded", details: `Seeded business preset structure: ${preset}` }
  ];

  const settings: SystemSettings = {
    orgId,
    businessName: `Apex ${preset} Pro`,
    publicSlug: DEFAULT_PUBLIC_BOOKING_SLUG,
    address: "777 Grand Boulevard, Suite 500",
    phone: "+1 (555) 880-9900",
    email: `support@apex-${preset.toLowerCase()}.com`,
    currency: preset === 'Sports' || preset === 'Clinic' ? 'SAR' : 'USD',
    language: "en",
    isRtl: false,
    activePreset: preset as any,
    features: {
      stripeEnabled: true,
      paypalEnabled: true,
      waitlistEnabled: true,
      googleCalendarEnabled: true,
      whatsappNotifications: true,
      telegramNotifications: false
    }
  };

  return {
    branches,
    customers,
    services,
    employees,
    reservations,
    leads,
    waitlist,
    notifications,
    auditLogs,
    settings
  };
};

export const getEmptySeeds = (orgId: string = DEFAULT_ORG_ID) => {
  const branches: Branch[] = [
    { id: "br-main", orgId, name: "Main Branch", address: "", phone: "", email: "", timezone: "UTC", isActive: true }
  ];

  const settings: SystemSettings = {
    orgId,
    businessName: "My Business",
    publicSlug: DEFAULT_PUBLIC_BOOKING_SLUG,
    address: "",
    phone: "",
    email: "",
    currency: "USD",
    language: "en",
    isRtl: false,
    features: {
      stripeEnabled: false,
      paypalEnabled: false,
      waitlistEnabled: true,
      googleCalendarEnabled: false,
      whatsappNotifications: false,
      telegramNotifications: false
    }
  };

  return {
    branches,
    customers: [] as Customer[],
    services: [] as Service[],
    employees: [] as Employee[],
    reservations: [] as Reservation[],
    leads: [] as Lead[],
    waitlist: [] as WaitlistRecord[],
    notifications: [] as Notification[],
    auditLogs: [{
      id: "log-fresh",
      orgId,
      userId: "system",
      userName: "System",
      timestamp: new Date().toISOString(),
      action: "Fresh Start",
      details: "Workspace initialized with empty data"
    }] as AuditLog[],
    settings
  };
};

// Mock Engine State Provider
class LocalMockDatabase {
  private key = "reserveflow_db_store";
  public data: any;

  constructor() {
    this.load();
  }

  public load() {
    const saved = localStorage.getItem(this.key);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        this.ensureDemoBusinessSlug();
        return;
      } catch (e) {
        console.error("Failed to load local DB state", e);
      }
    }
    // Default to Salon preset
    this.resetPreset("Salon");
  }

  private ensureDemoBusinessSlug() {
    if (!this.data?.settings) return;
    if (!this.data.settings.publicSlug) {
      this.data.settings.publicSlug = DEFAULT_PUBLIC_BOOKING_SLUG;
      this.save();
    }
  }

  public getPublicBookingSlug(): string {
    return this.data?.settings?.publicSlug || DEFAULT_PUBLIC_BOOKING_SLUG;
  }

  public isValidPublicBookingSlug(slug: string): boolean {
    return slug === this.getPublicBookingSlug();
  }

  public save() {
    localStorage.setItem(this.key, JSON.stringify(this.data));
  }

  public resetPreset(preset: string) {
    this.data = getPresetSeeds(preset);
    this.save();
  }

  public resetEmpty() {
    this.data = getEmptySeeds();
    this.save();
  }
}

export const mockDbInstance = new LocalMockDatabase();

// Repositories Implementations

export class MockBranchRepository implements IBranchRepository {
  async getAll(_orgId: string): Promise<Branch[]> {
    return mockDbInstance.data.branches;
  }
  async getById(_orgId: string, id: string): Promise<Branch | null> {
    return mockDbInstance.data.branches.find((b: Branch) => b.id === id) || null;
  }
  async create(orgId: string, data: CreateBranchInput): Promise<Branch> {
    const record: Branch = { ...data, orgId, id: `br-${uuid()}` };
    mockDbInstance.data.branches.push(record);
    mockDbInstance.save();
    return record;
  }
  async update(_orgId: string, id: string, data: Partial<Branch>): Promise<Branch> {
    const list = mockDbInstance.data.branches;
    const idx = list.findIndex((b: Branch) => b.id === id);
    if (idx === -1) throw new Error("Branch not found");
    list[idx] = { ...list[idx], ...data };
    mockDbInstance.save();
    return list[idx];
  }
  async delete(_orgId: string, id: string): Promise<boolean> {
    mockDbInstance.data.branches = mockDbInstance.data.branches.filter((b: Branch) => b.id !== id);
    mockDbInstance.data.reservations = mockDbInstance.data.reservations.filter((r: Reservation) => r.branchId !== id);
    mockDbInstance.data.waitlist = mockDbInstance.data.waitlist.filter((w: WaitlistRecord) => w.branchId !== id);
    mockDbInstance.data.leads = mockDbInstance.data.leads.filter((l: Lead) => l.branchId !== id);
    mockDbInstance.save();
    return true;
  }
}

export class MockCustomerRepository implements ICustomerRepository {
  async getAll(_orgId: string): Promise<Customer[]> {
    return mockDbInstance.data.customers;
  }
  async getById(_orgId: string, id: string): Promise<Customer | null> {
    return mockDbInstance.data.customers.find((c: Customer) => c.id === id) || null;
  }
  async create(orgId: string, data: CreateCustomerInput): Promise<Customer> {
    const record: Customer = { ...data, orgId, id: `cust-${uuid()}`, totalSpending: 0, createdAt: new Date().toISOString() };
    mockDbInstance.data.customers.push(record);
    mockDbInstance.save();
    return record;
  }
  async update(_orgId: string, id: string, data: Partial<Customer>): Promise<Customer> {
    const list = mockDbInstance.data.customers;
    const idx = list.findIndex((c: Customer) => c.id === id);
    if (idx === -1) throw new Error("Customer not found");
    list[idx] = { ...list[idx], ...data };
    mockDbInstance.save();
    return list[idx];
  }
  async delete(_orgId: string, id: string): Promise<boolean> {
    mockDbInstance.data.customers = mockDbInstance.data.customers.filter((c: Customer) => c.id !== id);
    // Cascade delete associated reservations to prevent orphaned records
    mockDbInstance.data.reservations = mockDbInstance.data.reservations.filter((r: Reservation) => r.customerId !== id);
    mockDbInstance.save();
    return true;
  }
}

export class MockReservationRepository implements IReservationRepository {
  async getAll(_orgId: string): Promise<Reservation[]> {
    return mockDbInstance.data.reservations;
  }
  async getById(_orgId: string, id: string): Promise<Reservation | null> {
    return mockDbInstance.data.reservations.find((r: Reservation) => r.id === id) || null;
  }
  async create(orgId: string, data: CreateReservationInput): Promise<Reservation> {
    const record: Reservation = { ...data, orgId, id: `res-${uuid()}`, createdAt: new Date().toISOString() };
    mockDbInstance.data.reservations.push(record);
    
    // Update Customer spending if completed
    if (record.status === 'Completed' && record.paymentDetails?.amount) {
      const custRepo = new MockCustomerRepository();
      const c = await custRepo.getById(orgId, record.customerId);
      if (c) {
        await custRepo.update(orgId, c.id, { totalSpending: c.totalSpending + record.paymentDetails.amount });
      }
    }

    mockDbInstance.save();
    return record;
  }
  async update(orgId: string, id: string, data: Partial<Reservation>): Promise<Reservation> {
    const list = mockDbInstance.data.reservations;
    const idx = list.findIndex((r: Reservation) => r.id === id);
    if (idx === -1) throw new Error("Reservation not found");
    const prev = list[idx];
    const updated = { ...prev, ...data };
    list[idx] = updated;

    // Check completed transition to adjust customer spending
    if (data.status === 'Completed' && prev.status !== 'Completed' && updated.paymentDetails?.amount) {
      const custRepo = new MockCustomerRepository();
      const c = await custRepo.getById(orgId, updated.customerId);
      if (c) {
        await custRepo.update(orgId, c.id, { totalSpending: c.totalSpending + updated.paymentDetails.amount });
      }
    }

    mockDbInstance.save();
    return updated;
  }
  async delete(_orgId: string, id: string): Promise<boolean> {
    mockDbInstance.data.reservations = mockDbInstance.data.reservations.filter((r: Reservation) => r.id !== id);
    mockDbInstance.save();
    return true;
  }
  async getByDateRange(_orgId: string, branchId: string, start: string, end: string): Promise<Reservation[]> {
    return mockDbInstance.data.reservations.filter((r: Reservation) => 
      (branchId ? r.branchId === branchId : true) && 
      r.date >= start && 
      r.date <= end
    );
  }
  async checkConflict(_orgId: string, _branchId: string, employeeId: string, date: string, time: string, duration: number, excludeId?: string): Promise<boolean> {
    // Parse target start/end minutes
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const targetStart = parseTime(time);
    const targetEnd = targetStart + duration;

    // Filter overlapping records for same employee on same date
    const overlaps = mockDbInstance.data.reservations.filter((r: Reservation) => {
      if (r.id === excludeId) return false;
      if (r.employeeId !== employeeId || r.date !== date) return false;
      if (r.status === 'Cancelled') return false;
      
      const start = parseTime(r.time);
      const end = start + r.duration;

      return (targetStart < end && targetEnd > start);
    });

    return overlaps.length > 0;
  }
}

export class MockServiceRepository implements IServiceRepository {
  async getAll(_orgId: string): Promise<Service[]> {
    return mockDbInstance.data.services;
  }
  async getById(_orgId: string, id: string): Promise<Service | null> {
    return mockDbInstance.data.services.find((s: Service) => s.id === id) || null;
  }
  async create(orgId: string, data: CreateServiceInput): Promise<Service> {
    const record: Service = { ...data, orgId, id: `srv-${uuid()}` };
    mockDbInstance.data.services.push(record);
    mockDbInstance.save();
    return record;
  }
  async update(_orgId: string, id: string, data: Partial<Service>): Promise<Service> {
    const list = mockDbInstance.data.services;
    const idx = list.findIndex((s: Service) => s.id === id);
    if (idx === -1) throw new Error("Service not found");
    list[idx] = { ...list[idx], ...data };
    mockDbInstance.save();
    return list[idx];
  }
  async delete(_orgId: string, id: string): Promise<boolean> {
    mockDbInstance.data.services = mockDbInstance.data.services.filter((s: Service) => s.id !== id);
    mockDbInstance.data.reservations = mockDbInstance.data.reservations.filter((r: Reservation) => r.serviceId !== id);
    mockDbInstance.data.waitlist = mockDbInstance.data.waitlist.filter((w: WaitlistRecord) => w.serviceId !== id);
    mockDbInstance.save();
    return true;
  }
}

export class MockEmployeeRepository implements IEmployeeRepository {
  async getAll(_orgId: string): Promise<Employee[]> {
    return mockDbInstance.data.employees;
  }
  async getById(_orgId: string, id: string): Promise<Employee | null> {
    return mockDbInstance.data.employees.find((e: Employee) => e.id === id) || null;
  }
  async create(orgId: string, data: CreateEmployeeInput): Promise<Employee> {
    const record: Employee = { ...data, orgId, id: `emp-${uuid()}` };
    mockDbInstance.data.employees.push(record);
    mockDbInstance.save();
    return record;
  }
  async update(_orgId: string, id: string, data: Partial<Employee>): Promise<Employee> {
    const list = mockDbInstance.data.employees;
    const idx = list.findIndex((e: Employee) => e.id === id);
    if (idx === -1) throw new Error("Employee not found");
    list[idx] = { ...list[idx], ...data };
    mockDbInstance.save();
    return list[idx];
  }
  async delete(_orgId: string, id: string): Promise<boolean> {
    mockDbInstance.data.employees = mockDbInstance.data.employees.filter((e: Employee) => e.id !== id);
    mockDbInstance.data.reservations = mockDbInstance.data.reservations.filter((r: Reservation) => r.employeeId !== id);
    mockDbInstance.data.waitlist = mockDbInstance.data.waitlist.filter((w: WaitlistRecord) => w.employeeId !== id);
    mockDbInstance.save();
    return true;
  }
}

export class MockLeadRepository implements ILeadRepository {
  async getAll(_orgId: string): Promise<Lead[]> {
    return mockDbInstance.data.leads;
  }
  async getById(_orgId: string, id: string): Promise<Lead | null> {
    return mockDbInstance.data.leads.find((l: Lead) => l.id === id) || null;
  }
  async create(orgId: string, data: CreateLeadInput): Promise<Lead> {
    const record: Lead = { 
      ...data, 
      orgId,
      id: `lead-${uuid()}`, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    };
    mockDbInstance.data.leads.push(record);
    mockDbInstance.save();
    return record;
  }
  async update(_orgId: string, id: string, data: Partial<Lead>): Promise<Lead> {
    const list = mockDbInstance.data.leads;
    const idx = list.findIndex((l: Lead) => l.id === id);
    if (idx === -1) throw new Error("Lead not found");
    list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    mockDbInstance.save();
    return list[idx];
  }
  async delete(_orgId: string, id: string): Promise<boolean> {
    mockDbInstance.data.leads = mockDbInstance.data.leads.filter((l: Lead) => l.id !== id);
    mockDbInstance.save();
    return true;
  }
}

export class MockNotificationRepository implements INotificationRepository {
  async getAll(_orgId: string): Promise<Notification[]> {
    return mockDbInstance.data.notifications;
  }
  async getById(_orgId: string, id: string): Promise<Notification | null> {
    return mockDbInstance.data.notifications.find((n: Notification) => n.id === id) || null;
  }
  async create(orgId: string, data: CreateNotificationInput): Promise<Notification> {
    const record: Notification = { ...data, orgId, id: `not-${uuid()}`, createdAt: new Date().toISOString() };
    mockDbInstance.data.notifications.unshift(record); // Prepend so it is newest first
    mockDbInstance.save();
    return record;
  }
  async update(_orgId: string, id: string, data: Partial<Notification>): Promise<Notification> {
    const list = mockDbInstance.data.notifications;
    const idx = list.findIndex((n: Notification) => n.id === id);
    if (idx === -1) throw new Error("Notification not found");
    list[idx] = { ...list[idx], ...data };
    mockDbInstance.save();
    return list[idx];
  }
  async delete(_orgId: string, id: string): Promise<boolean> {
    mockDbInstance.data.notifications = mockDbInstance.data.notifications.filter((n: Notification) => n.id !== id);
    mockDbInstance.save();
    return true;
  }
  async getUnreadCount(_orgId: string): Promise<number> {
    return mockDbInstance.data.notifications.filter((n: Notification) => !n.read).length;
  }
  async markAllAsRead(_orgId: string): Promise<void> {
    mockDbInstance.data.notifications.forEach((n: Notification) => { n.read = true; });
    mockDbInstance.save();
  }
}

export class MockWaitlistRepository implements IWaitlistRepository {
  async getAll(_orgId: string): Promise<WaitlistRecord[]> {
    return mockDbInstance.data.waitlist;
  }
  async getById(_orgId: string, id: string): Promise<WaitlistRecord | null> {
    return mockDbInstance.data.waitlist.find((w: WaitlistRecord) => w.id === id) || null;
  }
  async create(orgId: string, data: CreateWaitlistInput): Promise<WaitlistRecord> {
    const record: WaitlistRecord = { ...data, orgId, id: `wait-${uuid()}`, createdAt: new Date().toISOString() };
    mockDbInstance.data.waitlist.push(record);
    mockDbInstance.save();
    return record;
  }
  async update(_orgId: string, id: string, data: Partial<WaitlistRecord>): Promise<WaitlistRecord> {
    const list = mockDbInstance.data.waitlist;
    const idx = list.findIndex((w: WaitlistRecord) => w.id === id);
    if (idx === -1) throw new Error("Waitlist record not found");
    list[idx] = { ...list[idx], ...data };
    mockDbInstance.save();
    return list[idx];
  }
  async delete(_orgId: string, id: string): Promise<boolean> {
    mockDbInstance.data.waitlist = mockDbInstance.data.waitlist.filter((w: WaitlistRecord) => w.id !== id);
    mockDbInstance.save();
    return true;
  }
  async getWaiting(_orgId: string, branchId: string): Promise<WaitlistRecord[]> {
    return mockDbInstance.data.waitlist.filter((w: WaitlistRecord) => 
      w.status === 'Waiting' && (branchId ? w.branchId === branchId : true)
    );
  }
}

export class MockAuditLogRepository implements IAuditLogRepository {
  async getAll(_orgId: string): Promise<AuditLog[]> {
    return mockDbInstance.data.auditLogs;
  }
  async create(orgId: string, log: CreateAuditLogInput): Promise<AuditLog> {
    const record: AuditLog = { ...log, orgId, id: `log-${uuid()}`, timestamp: new Date().toISOString() };
    mockDbInstance.data.auditLogs.unshift(record);
    mockDbInstance.save();
    return record;
  }
}

export class MockSettingsRepository implements ISettingsRepository {
  async get(_orgId: string): Promise<SystemSettings> {
    return mockDbInstance.data.settings;
  }
  async update(_orgId: string, settings: Partial<SystemSettings>): Promise<SystemSettings> {
    mockDbInstance.data.settings = { ...mockDbInstance.data.settings, ...settings };
    mockDbInstance.save();
    return mockDbInstance.data.settings;
  }
}
