export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number; // in EUR
  description: string;
  popular?: boolean;
  icon?: string;
  available?: boolean; // false if temporarily paused/desactivado
}

export interface WorkerPermissions {
  canViewBookings: boolean;
  canManageBookings: boolean;
  canViewAnalytics: boolean;
  canViewCalendar: boolean;
  canManageServices: boolean;
  canManageTeam: boolean;
  canViewLogs: boolean;
  canViewEmails: boolean;
}

export interface Barber {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  available: boolean;
  specialties?: string[];
  rating?: number;
  username?: string;
  password?: string;
  role?: 'admin' | 'staff';
  permissions?: WorkerPermissions;
}

export interface AdminUserSession {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'staff';
  permissions: WorkerPermissions;
}

export interface MockUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'Administrador' | 'Empleado';
  permissions: string[];
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  duration: number;
  price: number;
  barberId: string;
  barberName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes?: string;
  createdAt: string;
  status: 'confirmed' | 'cancelled';
  googleCalendarEventId?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  adminUser: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
