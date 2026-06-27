export type UserRole = 'SuperAdmin' | 'BusinessOwner' | 'Employee' | 'Receptionist';

export interface User {
  id: string;
  orgId: string;
  email: string;
  role: UserRole;
  name: string;
  branchId?: string | null; // Null means global admin / accesses all branches
  isActive: boolean;
}

export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  subscriptionPlan: 'Free' | 'Growth' | 'Enterprise';
  status: 'Active' | 'Suspended';
  createdAt: string;
}

export interface Branch {
  id: string;
  orgId: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  orgId: string;
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  tags: string[];
  status: 'Active' | 'Inactive';
  totalSpending: number;
  createdAt: string;
}

export type ReservationStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'NoShow';
export type PaymentStatus = 'Unpaid' | 'Authorized' | 'Paid' | 'Refunded';

export interface PaymentDetails {
  method: 'Stripe' | 'PayPal' | 'Cash' | 'Card';
  transactionId?: string;
  amount: number;
  paidAt?: string;
}

export interface Reservation {
  id: string;
  orgId: string;
  branchId: string;
  customerId: string;
  serviceId: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // in minutes
  notes: string;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  paymentDetails?: PaymentDetails;
  createdAt: string;
}

export interface Service {
  id: string;
  orgId: string;
  branchIds: string[]; // List of branch IDs supporting this service
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  category: string;
  status: 'Active' | 'Inactive';
}

export interface EmployeeSchedule {
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  start: string; // HH:MM
  end: string; // HH:MM
  isWorking: boolean;
  breaks: Array<{ start: string; end: string }>;
}

export interface Employee {
  id: string;
  orgId: string;
  branchIds: string[]; // Branches assigned to
  name: string;
  role: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  schedule: EmployeeSchedule[];
}

export type LeadStatus = 'New' | 'Contacted' | 'Interested' | 'Converted' | 'Lost';

export interface Lead {
  id: string;
  orgId: string;
  branchId: string;
  fullName: string;
  phone: string;
  email: string;
  source: string;
  status: LeadStatus;
  value: number; // Projected booking value
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'BookingCreated' | 'BookingCancelled' | 'LeadCreated' | 'System';

export interface Notification {
  id: string;
  orgId: string;
  branchId?: string | null;
  title: string;
  message: string;
  read: boolean;
  type: NotificationType;
  createdAt: string;
}

export interface HolidayOverride {
  id: string;
  orgId: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Eid Holiday", "Maintenance"
  preventBookings: boolean;
}

export interface WaitlistRecord {
  id: string;
  orgId: string;
  branchId: string;
  customerId: string;
  serviceId: string;
  employeeId?: string; // Optional preferred employee
  date: string; // YYYY-MM-DD
  timeSlotPreference: 'Morning' | 'Afternoon' | 'Evening' | 'Any';
  notes: string;
  status: 'Waiting' | 'Promoted' | 'Cancelled';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  timestamp: string;
  action: string;
  details: string;
}

export const DEFAULT_PUBLIC_BOOKING_SLUG = 'apex-preset';

export interface SystemSettings {
  orgId: string;
  businessName: string;
  publicSlug?: string;
  logoUrl?: string;
  address: string;
  phone: string;
  email: string;
  currency: string; // e.g., USD, AED, SAR, EGP
  language: 'en' | 'ar';
  isRtl: boolean;
  activePreset?: 'Clinic' | 'Salon' | 'Barbershop' | 'PlayStation' | 'Sports' | 'Consultation';
  // Enabled modules
  features: {
    stripeEnabled: boolean;
    paypalEnabled: boolean;
    waitlistEnabled: boolean;
    googleCalendarEnabled: boolean;
    whatsappNotifications: boolean;
    telegramNotifications: boolean;
  };
}
