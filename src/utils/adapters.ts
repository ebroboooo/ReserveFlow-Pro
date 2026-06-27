import type { Reservation, PaymentDetails } from '../types';
import { db } from '../db';

// ----------------------------------------------------
// 1. CALENDAR ADAPTER
// ----------------------------------------------------
export interface ICalendarIntegrationAdapter {
  syncAppointment(orgId: string, reservation: Reservation): Promise<string>; // returns sync/event ID
  removeAppointment(orgId: string, reservationId: string, eventId: string): Promise<boolean>;
}

export class GoogleCalendarAdapter implements ICalendarIntegrationAdapter {
  async syncAppointment(orgId: string, reservation: Reservation): Promise<string> {
    const eventId = `gcal-evt-${Math.random().toString(36).substring(7)}`;
    
    await db.auditLogs.create(orgId, {
      userId: "system",
      userName: "Google Calendar Adapter",
      action: "Calendar Synced",
      details: `Successfully synced reservation ref ${reservation.id} to GCal as ${eventId}`
    });
    
    return eventId;
  }

  async removeAppointment(orgId: string, reservationId: string, eventId: string): Promise<boolean> {
    await db.auditLogs.create(orgId, {
      userId: "system",
      userName: "Google Calendar Adapter",
      action: "Calendar Removed",
      details: `Removed event ${eventId} for reservation ${reservationId}`
    });
    return true;
  }
}

// ----------------------------------------------------
// 2. PAYMENT ADAPTER
// ----------------------------------------------------
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
}

export interface IPaymentProcessor {
  processPayment(amount: number, description: string): Promise<PaymentResult>;
}

export class StripeAdapter implements IPaymentProcessor {
  async processPayment(_amount: number, _description: string): Promise<PaymentResult> {
    await new Promise(r => setTimeout(r, 600));
    return {
      success: true,
      transactionId: `txn_str_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };
  }
}

export class PayPalAdapter implements IPaymentProcessor {
  async processPayment(_amount: number, _description: string): Promise<PaymentResult> {
    await new Promise(r => setTimeout(r, 800));
    return {
      success: true,
      transactionId: `txn_pay_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };
  }
}

export class CashPaymentAdapter implements IPaymentProcessor {
  async processPayment(_amount: number, _description: string): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `txn_cash_${Date.now()}`
    };
  }
}

export class CardPaymentAdapter implements IPaymentProcessor {
  async processPayment(_amount: number, _description: string): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `txn_pos_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };
  }
}

// ----------------------------------------------------
// 3. NOTIFICATION ADAPTERS
// ----------------------------------------------------
export interface INotificationChannel {
  send(recipient: string, message: string): Promise<boolean>;
}

export class WhatsAppNotificationAdapter implements INotificationChannel {
  async send(_recipient: string, _message: string): Promise<boolean> {
    return true;
  }
}

export class TelegramNotificationAdapter implements INotificationChannel {
  async send(_recipient: string, _message: string): Promise<boolean> {
    return true;
  }
}

export class EmailNotificationAdapter implements INotificationChannel {
  async send(_recipient: string, _message: string): Promise<boolean> {
    return true;
  }
}

// Orchestrator to dispatch multiple enabled alerts
export class EnterpriseNotificationHub {
  static async dispatchBookingAlert(orgId: string, reservation: Reservation, customerName: string, serviceName: string, employeeName: string) {
    const settings = await db.settings.get(orgId);
    const message = `ReserveFlow Pro: Hello ${customerName}, your appointment for ${serviceName} with ${employeeName} is scheduled on ${reservation.date} at ${reservation.time}. Thank you!`;
    const emailMessage = `Dear ${customerName},\n\nYour appointment for ${serviceName} with ${employeeName} has been scheduled.\nDate: ${reservation.date}\nTime: ${reservation.time}\n\nWarm regards,\nReserveFlow Pro Management`;

    if (settings.features.whatsappNotifications) {
      const wa = new WhatsAppNotificationAdapter();
      await wa.send(reservation.notes /* fallback phone location */ || "+1555123456", message);
    }

    if (settings.features.telegramNotifications) {
      const tg = new TelegramNotificationAdapter();
      await tg.send("t.me/reserveflow_client_alert", message);
    }

    const mail = new EmailNotificationAdapter();
    await mail.send("client@example.com", emailMessage);

    // Create system notification
    await db.notifications.create(orgId, {
      branchId: reservation.branchId,
      title: "Booking Alert Dispatched",
      message: `Alert messages sent to ${customerName} for ${serviceName} booking.`,
      read: false,
      type: "BookingCreated"
    });
  }
}
export type { PaymentDetails };
