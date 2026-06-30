import type { Employee, EmployeeSchedule, Reservation } from '../types';

export function isPastDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(dateStr + 'T00:00:00');
  return selected < today;
}

export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getDay();
}

export function isDoctorAvailable(
  employee: Employee,
  dateStr: string,
  time: string,
  duration: number
): boolean {
  const dayOfWeek = getDayOfWeek(dateStr);
  const schedule = employee.schedule.find(s => s.dayOfWeek === dayOfWeek);
  if (!schedule || !schedule.isWorking) return false;

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const slotStart = toMinutes(time);
  const slotEnd = slotStart + duration;
  const workStart = toMinutes(schedule.start);
  const workEnd = toMinutes(schedule.end);

  if (slotStart < workStart || slotEnd > workEnd) return false;

  for (const brk of schedule.breaks) {
    const breakStart = toMinutes(brk.start);
    const breakEnd = toMinutes(brk.end);
    if (slotStart < breakEnd && slotEnd > breakStart) return false;
  }

  return true;
}

export function isSlotBooked(
  reservations: Reservation[],
  employeeId: string,
  dateStr: string,
  time: string,
  duration: number,
  excludeId?: string
): boolean {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const slotStart = toMinutes(time);
  const slotEnd = slotStart + duration;

  return reservations.some(r => {
    if (r.id === excludeId) return false;
    if (r.employeeId !== employeeId || r.date !== dateStr) return false;
    if (r.status === 'Cancelled') return false;

    const resStart = toMinutes(r.time);
    const resEnd = resStart + r.duration;
    return slotStart < resEnd && slotEnd > resStart;
  });
}

export function generateTimeSlots(
  schedule: EmployeeSchedule,
  duration: number,
  interval = 30
): string[] {
  if (!schedule.isWorking) return [];

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const toTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const slots: string[] = [];
  const start = toMinutes(schedule.start);
  const end = toMinutes(schedule.end);

  for (let t = start; t + duration <= end; t += interval) {
    const slotEnd = t + duration;
    let inBreak = false;
    for (const brk of schedule.breaks) {
      const bs = toMinutes(brk.start);
      const be = toMinutes(brk.end);
      if (t < be && slotEnd > bs) { inBreak = true; break; }
    }
    if (!inBreak) slots.push(toTime(t));
  }

  return slots;
}

export function getAvailableSlots(
  employee: Employee,
  dateStr: string,
  duration: number,
  reservations: Reservation[],
  excludeId?: string
): string[] {
  const dayOfWeek = getDayOfWeek(dateStr);
  const schedule = employee.schedule.find(s => s.dayOfWeek === dayOfWeek);
  if (!schedule) return [];

  const allSlots = generateTimeSlots(schedule, duration);
  return allSlots.filter(
    slot => !isSlotBooked(reservations, employee.id, dateStr, slot, duration, excludeId)
  );
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 7;
}

export interface BookingFormErrors {
  branch?: string;
  doctor?: string;
  service?: string;
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  email?: string;
}

export function validateBookingForm(
  data: {
    doctorId: string;
    serviceId: string;
    date: string;
    time: string;
    name: string;
    phone: string;
    email: string;
  },
  employee: Employee | undefined,
  duration: number,
  reservations: Reservation[]
): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (!data.doctorId) errors.doctor = 'Please select a doctor';
  if (!data.serviceId) errors.service = 'Please select a dental service';
  if (!data.date) errors.date = 'Please select a date';
  else if (isPastDate(data.date)) errors.date = 'Cannot book appointments in the past';
  if (!data.time) errors.time = 'Please select a time slot';
  else if (employee && data.date) {
    if (!isDoctorAvailable(employee, data.date, data.time, duration)) {
      errors.time = 'Selected doctor is not available at this time';
    } else if (isSlotBooked(reservations, employee.id, data.date, data.time, duration)) {
      errors.time = 'This time slot is already booked';
    }
  }
  if (!data.name.trim()) errors.name = 'Full name is required';
  if (!data.phone.trim()) errors.phone = 'Phone number is required';
  else if (!validatePhone(data.phone)) errors.phone = 'Please enter a valid phone number';
  if (!data.email.trim()) errors.email = 'Email is required';
  else if (!validateEmail(data.email)) errors.email = 'Please enter a valid email address';

  return errors;
}
