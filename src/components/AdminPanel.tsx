import React, { useState, useEffect } from 'react';
import { Booking, Service, Barber, AuditLog, AdminUserSession, WorkerPermissions, MockUser } from '../types';
import { EmailPreviewModal, SentEmailData } from './EmailPreviewModal';
import { demoConfig } from '../demoConfig';

export const DEFAULT_MOCK_USERS: MockUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: '1234',
    name: 'Administrador Principal',
    role: 'Administrador',
    permissions: [
      'Vista Calendario',
      'Gestión de Citas',
      'Estimaciones & Gráficos',
      'Servicios',
      'Equipo & Permisos',
      'Correos Enviados',
      'Logs Auditoría'
    ]
  },
  {
    id: 'user-empleado',
    username: 'empleado',
    password: '0000',
    name: 'Empleado Demo',
    role: 'Empleado',
    permissions: ['Vista Calendario', 'Gestión de Citas']
  }
];

export const getStoredMockUsers = (): MockUser[] => {
  try {
    const raw = localStorage.getItem('mockUsersDB');
    if (!raw) {
      localStorage.setItem('mockUsersDB', JSON.stringify(DEFAULT_MOCK_USERS));
      return DEFAULT_MOCK_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem('mockUsersDB', JSON.stringify(DEFAULT_MOCK_USERS));
    return DEFAULT_MOCK_USERS;
  } catch (err) {
    return DEFAULT_MOCK_USERS;
  }
};

export const convertPermissionsArrayToWorkerPermissions = (
  permissions: string[] = [],
  role: 'Administrador' | 'Empleado' | 'admin' | 'staff'
): WorkerPermissions => {
  if (role === 'Administrador' || role === 'admin') {
    return {
      canViewBookings: true,
      canManageBookings: true,
      canViewAnalytics: true,
      canViewCalendar: true,
      canManageServices: true,
      canManageTeam: true,
      canViewLogs: true,
      canViewEmails: true,
    };
  }

  const pLower = permissions.map((p) => p.toLowerCase());
  return {
    canViewBookings: pLower.some((p) => p.includes('cita') || p.includes('booking') || p.includes('canviewbookings')),
    canManageBookings: pLower.some((p) => p.includes('cita') || p.includes('booking') || p.includes('canmanagebookings')),
    canViewAnalytics: pLower.some((p) => p.includes('gráfico') || p.includes('grafico') || p.includes('analyt') || p.includes('factura') || p.includes('estimacion') || p.includes('canviewanalytics')),
    canViewCalendar: pLower.some((p) => p.includes('calendario') || p.includes('calendar') || p.includes('canviewcalendar')),
    canManageServices: pLower.some((p) => p.includes('servicio') || p.includes('service') || p.includes('canmanageservices')),
    canManageTeam: pLower.some((p) => p.includes('equipo') || p.includes('team') || p.includes('permiso') || p.includes('canmanageteam')),
    canViewLogs: pLower.some((p) => p.includes('log') || p.includes('auditor') || p.includes('canviewlogs')),
    canViewEmails: pLower.some((p) => p.includes('correo') || p.includes('email') || p.includes('mail') || p.includes('canviewemails')),
  };
};

export const mapCheckboxesToPermissionsList = (permissions: WorkerPermissions, role: 'admin' | 'staff'): string[] => {
  if (role === 'admin') {
    return [
      'Vista Calendario',
      'Gestión de Citas',
      'Estimaciones & Gráficos',
      'Servicios',
      'Equipo & Permisos',
      'Correos Enviados',
      'Logs Auditoría'
    ];
  }
  const list: string[] = [];
  if (permissions.canViewCalendar) list.push('Vista Calendario');
  if (permissions.canViewBookings || permissions.canManageBookings) list.push('Gestión de Citas');
  if (permissions.canViewAnalytics) list.push('Estimaciones & Gráficos');
  if (permissions.canManageServices) list.push('Servicios');
  if (permissions.canManageTeam) list.push('Equipo & Permisos');
  if (permissions.canViewEmails) list.push('Correos Enviados');
  if (permissions.canViewLogs) list.push('Logs Auditoría');
  return list;
};
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';

export const AdminPanel: React.FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<AdminUserSession | null>(null);
  const [loginError, setLoginError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'bookings' | 'analytics' | 'calendar' | 'services' | 'barbers' | 'logs' | 'emails'>('bookings');
  const [analyticsDate, setAnalyticsDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'day' | 'week' | 'month'>('day');

  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [emails, setEmails] = useState<SentEmailData[]>([]);
  const [selectedEmailModal, setSelectedEmailModal] = useState<SentEmailData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals inside Admin
  const [showNewBookingModal, setShowNewBookingModal] = useState<boolean>(false);
  const [showNewServiceModal, setShowNewServiceModal] = useState<boolean>(false);
  const [showNewBarberModal, setShowNewBarberModal] = useState<boolean>(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  // Forms
  const [bookingForm, setBookingForm] = useState({
    serviceName: 'Corte Clásico',
    price: 15,
    duration: 30,
    barberName: 'Alejandro',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: ''
  });

  const [serviceForm, setServiceForm] = useState({
    name: '',
    duration: 30,
    price: 20,
    description: '',
    popular: false,
    available: true,
    icon: 'content_cut'
  });

  const defaultWorkerPermissions: WorkerPermissions = {
    canViewBookings: true,
    canManageBookings: true,
    canViewAnalytics: false,
    canViewCalendar: true,
    canManageServices: false,
    canManageTeam: false,
    canViewLogs: false,
    canViewEmails: false
  };

  const [barberForm, setBarberForm] = useState({
    name: '',
    title: 'Barbero / Estilista',
    avatarUrl: '',
    available: true,
    username: '',
    password: '',
    role: 'staff' as 'admin' | 'staff',
    permissions: { ...defaultWorkerPermissions }
  });

  // Simulador RBAC: Inicialización y verificación de sesión en localStorage
  useEffect(() => {
    // 1. Asegurar estado inicial de mockUsersDB en localStorage
    getStoredMockUsers();

    // 2. Verificar si hay sesión activa en localStorage
    const storedSession = localStorage.getItem('currentUserSession');
    if (storedSession) {
      try {
        const userObj: MockUser = JSON.parse(storedSession);
        setCurrentUser({
          id: userObj.id,
          username: userObj.username,
          name: userObj.name,
          role: userObj.role === 'Administrador' ? 'admin' : 'staff',
          permissions: convertPermissionsArrayToWorkerPermissions(userObj.permissions, userObj.role)
        });
        setAuthenticated(true);
        fetchAdminData();
      } catch (err) {
        localStorage.removeItem('currentUserSession');
        setAuthenticated(false);
      }
    } else {
      setAuthenticated(false);
      setCurrentUser(null);
    }
  }, []);

  const perms: WorkerPermissions = currentUser?.permissions || {
    canViewBookings: true,
    canManageBookings: true,
    canViewAnalytics: currentUser?.role === 'admin' || !currentUser,
    canViewCalendar: true,
    canManageServices: currentUser?.role === 'admin' || !currentUser,
    canManageTeam: currentUser?.role === 'admin' || !currentUser,
    canViewLogs: currentUser?.role === 'admin' || !currentUser,
    canViewEmails: currentUser?.role === 'admin' || !currentUser,
  };

  const isAdmin = currentUser ? currentUser.role === 'admin' : true;

  // Validador de Renderizado de Pestañas (El Filtro RBAC)
  const hasTabPermission = (tabId: string): boolean => {
    if (!currentUser) return false;

    // Si el rol es 'Administrador', ignora el array de permisos y muestra siempre todas las pestañas
    const storedSession = localStorage.getItem('currentUserSession');
    let permissionsArray: string[] = [];

    if (storedSession) {
      try {
        const parsed: MockUser = JSON.parse(storedSession);
        if (parsed.role === 'Administrador' || (parsed.role as any) === 'admin') {
          return true;
        }
        if (Array.isArray(parsed.permissions)) {
          permissionsArray = parsed.permissions;
        }
      } catch (e) {}
    }

    if (currentUser.role === 'admin') return true;

    // Diccionario o mapeo de checkboxes/permisos con las pestañas del menú superior
    const TAB_PERM_MAP: Record<string, string[]> = {
      calendar: ['Vista Calendario', 'calendario', 'canViewCalendar', '🗓️ Ver Calendario de Horarios'],
      bookings: ['Gestión de Citas', 'citas', 'canViewBookings', 'canManageBookings', '📅 Ver Citas de Clientes', '✏️ Gestionar / Cancelar Citas'],
      analytics: ['Estimaciones & Gráficos', 'Ver Gráficos & Facturación', 'graficos', 'facturacion', 'canViewAnalytics', '📊 Ver Gráficos & Facturación'],
      services: ['Servicios', 'servicios', 'canManageServices', '✂️ Gestionar Servicios'],
      barbers: ['Equipo & Permisos', 'equipo', 'canManageTeam', '👥 Gestionar Equipo y Permisos'],
      emails: ['Correos Enviados', 'emails', 'canViewEmails', '✉️ Ver Historial de Correos'],
      logs: ['Logs Auditoría', 'logs', 'canViewLogs', '📜 Ver Logs de Auditoría']
    };

    const validKeys = TAB_PERM_MAP[tabId] || [];
    const hasInArray = permissionsArray.some((p) =>
      validKeys.some((k) => k.toLowerCase() === p.trim().toLowerCase())
    );
    if (hasInArray) return true;

    // Validación secundaria de respaldo por flags
    if (tabId === 'calendar' && perms.canViewCalendar) return true;
    if (tabId === 'bookings' && (perms.canViewBookings || perms.canManageBookings)) return true;
    if (tabId === 'analytics' && perms.canViewAnalytics) return true;
    if (tabId === 'services' && perms.canManageServices) return true;
    if (tabId === 'barbers' && perms.canManageTeam) return true;
    if (tabId === 'emails' && perms.canViewEmails) return true;
    if (tabId === 'logs' && perms.canViewLogs) return true;

    return false;
  };

  // Cambio automático a primera pestaña permitida si la actual queda inaccesible
  useEffect(() => {
    if (authenticated && currentUser) {
      if (!hasTabPermission(activeTab)) {
        const order: ('calendar' | 'bookings' | 'analytics' | 'services' | 'barbers' | 'emails' | 'logs')[] = [
          'calendar',
          'bookings',
          'analytics',
          'services',
          'barbers',
          'emails',
          'logs'
        ];
        const firstAllowed = order.find((tab) => hasTabPermission(tab));
        if (firstAllowed) {
          setActiveTab(firstAllowed);
        }
      }
    }
  }, [authenticated, currentUser, activeTab]);

  // Login Dinámico buscando en mockUsersDB de localStorage
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedUser = username.trim().toLowerCase();
    const mockUsers = getStoredMockUsers();

    // Buscar coincidencia en mockUsersDB en localStorage
    const matchedUser = mockUsers.find(
      (u) => u.username.toLowerCase() === trimmedUser && u.password === password
    );

    if (matchedUser) {
      const sessionUser: AdminUserSession = {
        id: matchedUser.id,
        name: matchedUser.name,
        username: matchedUser.username,
        role: matchedUser.role === 'Administrador' ? 'admin' : 'staff',
        permissions: convertPermissionsArrayToWorkerPermissions(matchedUser.permissions, matchedUser.role)
      };

      localStorage.setItem('currentUserSession', JSON.stringify(matchedUser));
      sessionStorage.setItem('admin_token', 'mock_token_' + matchedUser.id);
      sessionStorage.setItem('admin_user', JSON.stringify(sessionUser));
      setCurrentUser(sessionUser);
      setAuthenticated(true);
      fetchAdminData();
      return;
    }

    // Validación alternativa contra el backend si se ingresan credenciales del servidor
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const role = data.user.role === 'admin' ? 'Administrador' : 'Empleado';
        const permsList = mapCheckboxesToPermissionsList(data.user.permissions, data.user.role);
        const userObj: MockUser = {
          id: data.user.id || `user-${Date.now()}`,
          username: data.user.username,
          password: password,
          name: data.user.name,
          role: role,
          permissions: permsList
        };
        localStorage.setItem('currentUserSession', JSON.stringify(userObj));
        sessionStorage.setItem('admin_token', data.token || 'token');
        sessionStorage.setItem('admin_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setAuthenticated(true);
        fetchAdminData();
        return;
      }
    } catch (err) {}

    setLoginError('Usuario o contraseña incorrectos. Verifica tus credenciales en el simulador.');
  };

  // Botón Cerrar Sesión: Limpia localStorage y devuelve a la pantalla de Login
  const handleLogout = () => {
    localStorage.removeItem('currentUserSession');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    setAuthenticated(false);
    setCurrentUser(null);
    setUsername('');
    setPassword('');
    setLoginError('');
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [resB, resS, resBarbers, resL, resE] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/services'),
        fetch('/api/barbers'),
        fetch('/api/logs'),
        fetch('/api/emails')
      ]);
      const dataB = await resB.json();
      const dataS = await resS.json();
      const dataBarbers = await resBarbers.json();
      const dataL = await resL.json();
      const dataE = await resE.json();

      setBookings(dataB);
      setServices(dataS);
      setBarbers(dataBarbers);
      setLogs(dataL);
      setEmails(dataE);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create Manual Booking (Admin)
  const handleCreateBookingAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingForm,
          isAdminCreated: true
        })
      });
      if (res.ok) {
        setShowNewBookingModal(false);
        setBookingForm({
          serviceName: 'Corte Caballero',
          price: 25,
          duration: 45,
          barberName: 'Sergio Márquez',
          date: new Date().toISOString().split('T')[0],
          time: '12:00',
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          notes: ''
        });
        fetchAdminData();
      } else {
        alert('Error al crear la cita');
      }
    } catch (err) {
      alert('Error al guardar cita');
    }
  };

  // Update Booking (Admin)
  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    try {
      const res = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBooking)
      });
      if (res.ok) {
        setEditingBooking(null);
        fetchAdminData();
      }
    } catch (err) {
      alert('Error al actualizar cita');
    }
  };

  // Delete/Cancel Booking (Admin)
  const handleDeleteBooking = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar/cancelar esta cita?')) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      alert('Error al cancelar cita');
    }
  };

  // Toggle Service Availability (Pause / Activate)
  const handleToggleServiceAvailability = async (srv: Service) => {
    const newStatus = srv.available === false ? true : false;
    try {
      const res = await fetch(`/api/services/${srv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: newStatus })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      alert('Error al cambiar la disponibilidad del servicio');
    }
  };

  // Create Service (Admin)
  const handleCreateServiceAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm)
      });
      if (res.ok) {
        setShowNewServiceModal(false);
        setServiceForm({
          name: '',
          duration: 30,
          price: 20,
          description: '',
          popular: false,
          available: true,
          icon: 'content_cut'
        });
        fetchAdminData();
      }
    } catch (err) {
      alert('Error al guardar servicio');
    }
  };

  // Update Service (Admin)
  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      const res = await fetch(`/api/services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingService)
      });
      if (res.ok) {
        setEditingService(null);
        fetchAdminData();
      }
    } catch (err) {
      alert('Error al modificar servicio');
    }
  };

  // Delete Service (Admin)
  const handleDeleteService = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este servicio?')) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      alert('Error al eliminar servicio');
    }
  };

  // Toggle Barber Availability (Pause/Reactivate)
  const handleToggleBarberAvailability = async (barber: Barber) => {
    const newStatus = barber.available === false;
    try {
      const res = await fetch(`/api/barbers/${barber.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: newStatus })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      alert('Error al cambiar disponibilidad del trabajador');
    }
  };

  // Create Barber (Admin) con Guardado Dinámico en mockUsersDB de localStorage
  const handleCreateBarberAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberForm.name.trim()) {
      alert('Por favor introduce el nombre del barbero o trabajador.');
      return;
    }

    const cleanUsername = barberForm.username.trim().toLowerCase() || `usuario_${Date.now().toString().slice(-4)}`;
    const cleanPassword = barberForm.password || '1234';
    const roleName: 'Administrador' | 'Empleado' = barberForm.role === 'admin' ? 'Administrador' : 'Empleado';
    const permissionsList = mapCheckboxesToPermissionsList(barberForm.permissions, barberForm.role);

    // 1. Guardado Dinámico en mockUsersDB dentro de localStorage
    const currentMockUsers = getStoredMockUsers();
    const newMockUser: MockUser = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      password: cleanPassword,
      name: barberForm.name,
      role: roleName,
      permissions: permissionsList
    };

    const updatedUsers = currentMockUsers.filter((u) => u.username.toLowerCase() !== cleanUsername).concat(newMockUser);
    localStorage.setItem('mockUsersDB', JSON.stringify(updatedUsers));

    // 2. Persistir en el backend de la app
    try {
      const res = await fetch('/api/barbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...barberForm,
          username: cleanUsername,
          password: cleanPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowNewBarberModal(false);
        setBarberForm({
          name: '',
          title: 'Barbero / Estilista',
          avatarUrl: '',
          available: true,
          username: '',
          password: '',
          role: 'staff',
          permissions: { ...defaultWorkerPermissions }
        });
        fetchAdminData();
      } else {
        alert(data.error || 'Error al añadir trabajador');
      }
    } catch (err) {
      alert('Error al añadir trabajador');
    }
  };

  // Update Barber (Admin) con sincronización en mockUsersDB de localStorage
  const handleUpdateBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarber) return;

    const cleanUsername = (editingBarber.username || '').trim().toLowerCase();
    const roleName: 'Administrador' | 'Empleado' = editingBarber.role === 'admin' ? 'Administrador' : 'Empleado';
    const permissionsList = mapCheckboxesToPermissionsList(
      editingBarber.permissions || { ...defaultWorkerPermissions },
      editingBarber.role || 'staff'
    );

    // Sincronizar en mockUsersDB
    if (cleanUsername) {
      const currentMockUsers = getStoredMockUsers();
      const updatedUsers = currentMockUsers.map((u) => {
        if (u.username.toLowerCase() === cleanUsername) {
          return {
            ...u,
            name: editingBarber.name,
            password: editingBarber.password || u.password,
            role: roleName,
            permissions: permissionsList
          };
        }
        return u;
      });
      localStorage.setItem('mockUsersDB', JSON.stringify(updatedUsers));
    }

    try {
      const res = await fetch(`/api/barbers/${editingBarber.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBarber)
      });
      const data = await res.json();
      if (res.ok) {
        setEditingBarber(null);
        fetchAdminData();
      } else {
        alert(data.error || 'Error al actualizar información del trabajador');
      }
    } catch (err) {
      alert('Error al modificar información del trabajador');
    }
  };

  // Delete Barber (Admin) con eliminación en mockUsersDB
  const handleDeleteBarber = async (id: string) => {
    if (id === 'cualquiera') {
      alert('No se puede eliminar el perfil comodín "Cualquiera".');
      return;
    }
    const target = barbers.find((b) => b.id === id);
    if (!confirm('¿Seguro que deseas eliminar este trabajador del sistema?')) return;

    if (target && target.username) {
      const currentMockUsers = getStoredMockUsers();
      const filtered = currentMockUsers.filter((u) => u.username.toLowerCase() !== target.username?.toLowerCase());
      localStorage.setItem('mockUsersDB', JSON.stringify(filtered));
    }

    try {
      const res = await fetch(`/api/barbers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar trabajador');
      }
    } catch (err) {
      alert('Error al eliminar trabajador');
    }
  };

  // Pantalla de Login Corporativo (Simulador RBAC con localStorage)
  if (!authenticated) {
    const availableMockUsers = getStoredMockUsers();

    return (
      <div className="min-h-screen bg-[#F4F6F8] text-[#1A1A1A] flex items-center justify-center p-6">
        <div className="bg-[#0F232C] border border-[#0F232C] rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 text-white">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-[#39B54A] mb-3">
              <span className="material-symbols-outlined text-3xl">content_cut</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-white">
              The Arsenal Barber Co.
            </h1>
            <p className="font-sans text-xs uppercase tracking-widest text-[#39B54A] mt-1 font-bold">
              Autenticación & Control de Roles (RBAC)
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-900/60 border border-red-500 rounded-[8px] text-red-100 text-xs text-center font-sans">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-sans text-white uppercase tracking-wider mb-1.5 font-semibold">
                Nombre de Usuario
              </label>
              <input
                type="text"
                required
                placeholder="Ej: admin, empleado..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#163340] border border-stone-600 rounded-[8px] px-4 py-2.5 text-sm text-white outline-none focus:border-[#39B54A]"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-white uppercase tracking-wider mb-1.5 font-semibold">
                Contraseña
              </label>
              <input
                type="password"
                required
                placeholder="Introduce tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#163340] border border-stone-600 rounded-[8px] px-4 py-2.5 text-sm text-white outline-none focus:border-[#39B54A]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#39B54A] text-white py-3 rounded-[8px] font-sans text-xs uppercase font-bold tracking-wider hover:bg-[#32a242] transition-colors shadow active:scale-95"
            >
              Iniciar Sesión
            </button>
          </form>

          {/* Selector Rápido de Usuarios Mock (mockUsersDB en localStorage) */}
          <div className="bg-[#163340]/90 border border-white/10 p-3.5 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">badge</span>
                Cuentas de Prueba (mockUsersDB):
              </span>
              <span className="text-[10px] text-stone-400 font-sans">1 Clic para probar</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {availableMockUsers.map((u) => (
                <button
                  key={u.id || u.username}
                  type="button"
                  onClick={() => {
                    setUsername(u.username);
                    setPassword(u.password);
                    setLoginError('');
                  }}
                  className="w-full text-left bg-white/5 hover:bg-white/15 border border-white/10 hover:border-emerald-500/40 p-2.5 rounded-[8px] text-xs flex items-center justify-between transition-all group"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                      <span>{u.role === 'Administrador' ? '👑' : '✂️'}</span>
                      <span>{u.name}</span>
                      <code className="text-[10px] bg-black/40 text-stone-300 px-1.5 py-0.5 rounded font-mono">
                        {u.username}
                      </code>
                    </div>
                    <div className="text-[10px] text-stone-300">
                      Rol: <strong className={u.role === 'Administrador' ? 'text-amber-300' : 'text-emerald-300'}>{u.role}</strong> • Clave: <code className="text-white font-mono">{u.password}</code>
                    </div>
                    {u.role === 'Empleado' && (
                      <div className="text-[9px] text-stone-400">
                        Permisos: {u.permissions.join(', ')}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] bg-[#39B54A]/20 text-[#39B54A] border border-[#39B54A]/40 px-2.5 py-1 rounded font-bold group-hover:bg-[#39B54A] group-hover:text-white transition-colors">
                    Rellenar
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 text-center">
            <a href="/" className="text-xs text-stone-300 hover:text-white transition-colors">
              ← Volver a la web principal
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Export to CSV utility for accounting and records
  const exportToCSV = (filename: string, rows: (string | number)[][]) => {
    const csvContent = "\uFEFF" + rows.map(e => e.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBookingsCSV = () => {
    const rows: (string | number)[][] = [
      ['LISTADO DE CITAS - THE ARSENAL BARBER CO.'],
      ['Fecha de Exportación', new Date().toLocaleString('es-ES')],
      ['Total de Citas Exportadas', filteredBookings.length],
      [''],
      ['ID Cita', 'Cliente', 'Email', 'Teléfono', 'Servicio', 'Fecha', 'Hora', 'Barbero / Trabajador', 'Precio (€)', 'Estado', 'Fecha Creación']
    ];

    filteredBookings.forEach((b) => {
      rows.push([
        b.id,
        b.customerName,
        b.customerEmail,
        b.customerPhone,
        b.serviceName,
        b.date,
        b.time,
        b.barberName || 'Sin asignar',
        b.price,
        b.status === 'confirmed' ? 'Confirmada' : 'Cancelada',
        b.createdAt ? new Date(b.createdAt).toLocaleString('es-ES') : ''
      ]);
    });

    const dateStr = new Date().toISOString().split('T')[0];
    exportToCSV(`Listado_Citas_TheArsenalBarberCo_${dateStr}.csv`, rows);
  };

  // Helper to format date and time cleanly (e.g., "24 Sept 2026 | 11:00 h")
  const formatBookingDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr) return timeStr ? `${timeStr} h` : '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sept', 'Oct', 'Nov', 'Dic'];
      const monthIdx = parseInt(month, 10) - 1;
      const monthName = months[monthIdx] || month;
      return `${parseInt(day, 10)} ${monthName} ${year} | ${timeStr} h`;
    }
    return `${dateStr} | ${timeStr} h`;
  };

  // Filtered Bookings: Sorted so the newest / most recent booking appears on the top row
  const filteredBookings = [...bookings]
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      const dtA = `${a.date || ''}T${a.time || '00:00'}`;
      const dtB = `${b.date || ''}T${b.time || '00:00'}`;
      return dtB.localeCompare(dtA);
    })
    .filter((b) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        b.customerName.toLowerCase().includes(term) ||
        (b.customerEmail && b.customerEmail.toLowerCase().includes(term)) ||
        b.customerPhone.toLowerCase().includes(term) ||
        b.serviceName.toLowerCase().includes(term) ||
        b.date.includes(term)
      );
    });

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#1A1A1A] font-sans flex flex-col justify-between">
      <div>
      {/* Top Admin Header */}
      <header className="bg-[#0F232C] border-b border-[#0F232C] px-6 py-4 sticky top-0 z-30 shadow-md text-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl font-bold text-white tracking-wide">
              Panel de Control - The Arsenal Barber Co.
            </span>
            <span className="bg-[#39B54A]/20 text-[#39B54A] text-[10px] font-bold px-2.5 py-0.5 rounded border border-[#39B54A]/40 uppercase tracking-widest">
              Live Demo
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2.5 bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg text-xs text-white">
                <span className="material-symbols-outlined text-[#39B54A] text-lg">account_circle</span>
                <div>
                  <div className="font-bold text-white leading-none">{currentUser.name}</div>
                  <div className="text-[10px] text-stone-300 flex items-center gap-1 mt-0.5">
                    {currentUser.role === 'admin' ? (
                      <span className="text-[#39B54A] font-bold">👑 Administrador</span>
                    ) : (
                      <span className="text-emerald-300 font-bold">✂️ Empleado</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={fetchAdminData}
              className="text-white hover:text-[#39B54A] text-xs flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded border border-white/20 transition-colors"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Actualizar
            </button>
            <button
              onClick={handleLogout}
              className="text-red-300 hover:text-red-200 text-xs font-semibold bg-red-950/60 border border-red-800/40 px-3 py-1.5 rounded transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Admin Navigation Tabs - Filtrado dinámico según rol y permisos (RBAC) */}
        <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-4 mb-8">
          {/* 1. Vista Calendario */}
          {hasTabPermission('calendar') && (
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-5 py-2.5 rounded-[8px] font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'calendar'
                  ? 'bg-[#39B54A] text-white shadow-[0_4px_6px_rgba(0,0,0,0.04)]'
                  : 'bg-[#0F232C] text-white hover:bg-[#183846]'
              }`}
            >
              <span className="material-symbols-outlined text-base">event</span>
              Vista Calendario
            </button>
          )}

          {/* 2. Gestión de Citas */}
          {hasTabPermission('bookings') && (
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-5 py-2.5 rounded-[8px] font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'bookings'
                  ? 'bg-[#39B54A] text-white shadow-[0_4px_6px_rgba(0,0,0,0.04)]'
                  : 'bg-[#0F232C] text-white hover:bg-[#183846]'
              }`}
            >
              <span className="material-symbols-outlined text-base">calendar_month</span>
              Gestión de Citas
            </button>
          )}

          {/* 3. Estimaciones & Gráficos */}
          {hasTabPermission('analytics') && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-5 py-2.5 rounded-[8px] font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-[#39B54A] text-white shadow-[0_4px_6px_rgba(0,0,0,0.04)]'
                  : 'bg-[#0F232C] text-white hover:bg-[#183846]'
              }`}
            >
              <span className="material-symbols-outlined text-base">analytics</span>
              Estimaciones & Gráficos
            </button>
          )}

          {/* 4. Servicios */}
          {hasTabPermission('services') && (
            <button
              onClick={() => setActiveTab('services')}
              className={`px-5 py-2.5 rounded-[8px] font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'services'
                  ? 'bg-[#39B54A] text-white shadow-[0_4px_6px_rgba(0,0,0,0.04)]'
                  : 'bg-[#0F232C] text-white hover:bg-[#183846]'
              }`}
            >
              <span className="material-symbols-outlined text-base">content_cut</span>
              Servicios
            </button>
          )}

          {/* 5. Equipo & Permisos */}
          {hasTabPermission('barbers') && (
            <button
              onClick={() => setActiveTab('barbers')}
              className={`px-5 py-2.5 rounded-[8px] font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'barbers'
                  ? 'bg-[#39B54A] text-white shadow-[0_4px_6px_rgba(0,0,0,0.04)]'
                  : 'bg-[#0F232C] text-white hover:bg-[#183846]'
              }`}
            >
              <span className="material-symbols-outlined text-base">badge</span>
              Equipo & Permisos
            </button>
          )}

          {/* 6. Correos Enviados */}
          {hasTabPermission('emails') && (
            <button
              onClick={() => setActiveTab('emails')}
              className={`px-5 py-2.5 rounded-[8px] font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'emails'
                  ? 'bg-[#39B54A] text-white shadow-[0_4px_6px_rgba(0,0,0,0.04)]'
                  : 'bg-[#0F232C] text-white hover:bg-[#183846]'
              }`}
            >
              <span className="material-symbols-outlined text-base">mail</span>
              Correos Enviados
            </button>
          )}

          {/* 7. Logs Auditoría */}
          {hasTabPermission('logs') && (
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-5 py-2.5 rounded-[8px] font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'logs'
                  ? 'bg-[#39B54A] text-white shadow-[0_4px_6px_rgba(0,0,0,0.04)]'
                  : 'bg-[#0F232C] text-white hover:bg-[#183846]'
              }`}
            >
              <span className="material-symbols-outlined text-base">history</span>
              Logs Auditoría
            </button>
          )}
        </div>

        {/* TAB 1: BOOKINGS MANAGEMENT */}
        {activeTab === 'bookings' && hasTabPermission('bookings') && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Buscar por cliente, teléfono, fecha o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-96 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] px-4 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#39B54A] shadow-[0_4px_6px_rgba(0,0,0,0.04)]"
                />
                <span className="text-xs font-sans font-semibold bg-white text-stone-700 px-3 py-2 rounded-[8px] border border-[#E5E7EB] shadow-2xs whitespace-nowrap">
                  ({bookings.length} {bookings.length === 1 ? 'cita' : 'citas'})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleExportBookingsCSV}
                  className="bg-[#0F232C] text-white hover:bg-[#163340] border border-[#39B54A] px-4 py-2.5 rounded-[8px] font-sans text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_6px_rgba(0,0,0,0.04)] transition-all active:scale-95"
                  title="Exportar listado de citas a archivo CSV para contabilidad"
                >
                  <span className="material-symbols-outlined text-base text-[#39B54A]">download</span>
                  Exportar CSV
                </button>

                <button
                  onClick={() => setShowNewBookingModal(true)}
                  className="bg-[#39B54A] text-white px-4 py-2.5 rounded-[8px] font-sans text-xs font-bold uppercase tracking-wider hover:bg-[#32a242] flex items-center gap-1 shadow-[0_4px_6px_rgba(0,0,0,0.04)] transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Nueva Cita Manual
                </button>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] overflow-x-auto shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
              <table className="w-full text-left text-xs bg-[#FFFFFF]">
                <thead className="bg-[#0F232C] text-white uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5 text-white">Cliente</th>
                    <th className="p-3.5 text-white">Servicio</th>
                    <th className="p-3.5 text-white">Fecha y Hora</th>
                    <th className="p-3.5 text-white">Barbero</th>
                    <th className="p-3.5 text-white">Precio</th>
                    <th className="p-3.5 text-white">Estado</th>
                    <th className="p-3.5 text-right text-white">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] bg-[#FFFFFF]">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-500 italic">
                        No hay citas registradas que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((bk) => (
                      <tr key={bk.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5">
                          <p className="font-bold text-[#1A1A1A] text-sm">{bk.customerName}</p>
                          <p className="text-stone-600 text-[11px]">{bk.customerPhone}{bk.customerEmail ? ` • ${bk.customerEmail}` : ''}</p>
                          {bk.notes && <p className="text-stone-500 text-[10px] italic">Nota: {bk.notes}</p>}
                        </td>
                        <td className="p-3.5 font-semibold text-[#1A1A1A]">
                          {bk.serviceName}
                        </td>
                        <td className="p-3.5 font-sans text-[#1A1A1A] font-medium whitespace-nowrap">
                          {formatBookingDateTime(bk.date, bk.time)}
                        </td>
                        <td className="p-3.5 text-stone-700 font-medium">
                          {bk.barberName}
                        </td>
                        <td className="p-3.5 font-bold text-[#1A1A1A]">
                          {bk.price}€
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                              bk.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {bk.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => setEditingBooking(bk)}
                            className="bg-stone-100 hover:bg-[#0F232C] hover:text-white text-[#1A1A1A] border border-stone-200 px-3 py-1 rounded text-[11px] font-semibold transition-colors"
                          >
                            Editar
                          </button>
                          {bk.status === 'confirmed' && (
                            <button
                              onClick={() => handleDeleteBooking(bk.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded text-[11px] font-semibold transition-colors"
                            >
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: ESTIMACIONES & GRÁFICOS */}
        {activeTab === 'analytics' && hasTabPermission('analytics') && (() => {
          let dateRangeLabel = '';
          let filteredBookings: Booking[] = [];

          if (analyticsPeriod === 'day') {
            filteredBookings = bookings.filter((b) => b.date === analyticsDate);
            dateRangeLabel = `Día: ${analyticsDate}`;
          } else if (analyticsPeriod === 'week') {
            const refDate = new Date(analyticsDate + 'T00:00:00');
            const dayOfWeek = refDate.getDay(); // 0 = Sun, 1 = Mon ...
            const distToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const monday = new Date(refDate);
            monday.setDate(refDate.getDate() + distToMonday);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const startStr = monday.toISOString().split('T')[0];
            const endStr = sunday.toISOString().split('T')[0];

            filteredBookings = bookings.filter((b) => b.date && b.date >= startStr && b.date <= endStr);
            dateRangeLabel = `Semana del ${startStr} al ${endStr}`;
          } else {
            // Month
            const monthPrefix = analyticsDate.substring(0, 7); // "YYYY-MM"
            const [yearStr, monthStr] = monthPrefix.split('-');
            const monthNames = [
              'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            const monthName = monthNames[parseInt(monthStr, 10) - 1] || monthStr;

            filteredBookings = bookings.filter((b) => b.date && b.date.startsWith(monthPrefix));
            dateRangeLabel = `Mes de ${monthName} ${yearStr}`;
          }

          const confirmedBookings = filteredBookings.filter((b) => b.status === 'confirmed');
          const cancelledBookings = filteredBookings.filter((b) => b.status === 'cancelled');

          const estimatedRevenue = confirmedBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
          const avgTicket = confirmedBookings.length > 0 ? (estimatedRevenue / confirmedBookings.length).toFixed(1) : '0';

          const barberRevenueMap: Record<string, number> = {};
          confirmedBookings.forEach((b) => {
            const barber = b.barberName || 'Sin asignar';
            barberRevenueMap[barber] = (barberRevenueMap[barber] || 0) + (Number(b.price) || 0);
          });

          // Dynamic chart data depending on period
          let chartTitle = '';
          let chartData: { label: string; Ingresos: number; Citas: number }[] = [];

          if (analyticsPeriod === 'day') {
            chartTitle = `Distribución Horaria de Ingresos (${analyticsDate})`;
            const hoursList = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
            chartData = hoursList.map((h) => {
              const hConfirmed = confirmedBookings.filter((b) => b.time && b.time.startsWith(h.substring(0, 2)));
              const hRevenue = hConfirmed.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
              return {
                label: h,
                Ingresos: hRevenue,
                Citas: hConfirmed.length
              };
            });
          } else if (analyticsPeriod === 'week') {
            const refDate = new Date(analyticsDate + 'T00:00:00');
            const dayOfWeek = refDate.getDay();
            const distToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const monday = new Date(refDate);
            monday.setDate(refDate.getDate() + distToMonday);

            chartTitle = `Distribución Diaria de Ingresos (Semana)`;
            const weekDayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            chartData = weekDayNames.map((dName, idx) => {
              const d = new Date(monday);
              d.setDate(monday.getDate() + idx);
              const dStr = d.toISOString().split('T')[0];
              const dConfirmed = confirmedBookings.filter((b) => b.date === dStr);
              const dRevenue = dConfirmed.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
              return {
                label: `${dName} ${dStr.substring(8, 10)}`,
                Ingresos: dRevenue,
                Citas: dConfirmed.length
              };
            });
          } else {
            // Month
            const [yearStr, monthStr] = analyticsDate.substring(0, 7).split('-');
            const daysInMonth = new Date(Number(yearStr), Number(monthStr), 0).getDate();
            chartTitle = `Evolución de Ingresos en el Mes (${dateRangeLabel})`;

            chartData = Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = i + 1;
              const dayFormatted = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
              const dStr = `${yearStr}-${monthStr}-${dayFormatted}`;
              const dConfirmed = confirmedBookings.filter((b) => b.date === dStr);
              const dRevenue = dConfirmed.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
              return {
                label: `${dayNum}`,
                Ingresos: dRevenue,
                Citas: dConfirmed.length
              };
            });
          }

          // Aggregate per-worker statistics for the active period
          const workerDataMap: Record<string, { barber: string; revenue: number; count: number }> = {};

          // Seed currently active barbers in workerDataMap
          barbers.forEach((b) => {
            if (b.name) {
              workerDataMap[b.name] = { barber: b.name, revenue: 0, count: 0 };
            }
          });

          // Aggregate confirmed bookings in this filtered period
          confirmedBookings.forEach((b) => {
            const bName = b.barberName || 'Sin asignar';
            if (!workerDataMap[bName]) {
              workerDataMap[bName] = { barber: bName, revenue: 0, count: 0 };
            }
            workerDataMap[bName].revenue += (Number(b.price) || 0);
            workerDataMap[bName].count += 1;
          });

          const workerDataList = Object.values(workerDataMap).sort((a, b) => b.revenue - a.revenue);
          const totalWorkerRevenue = workerDataList.reduce((acc, w) => acc + w.revenue, 0);
          const totalWorkerAppointments = workerDataList.reduce((acc, w) => acc + w.count, 0);

          const serviceDemandMap: Record<string, { total: number; confirmed: number; cancelled: number; revenue: number }> = {};
          services.forEach((s) => {
            serviceDemandMap[s.name] = { total: 0, confirmed: 0, cancelled: 0, revenue: 0 };
          });

          bookings.forEach((b) => {
            const sName = b.serviceName || 'Otros';
            if (!serviceDemandMap[sName]) {
              serviceDemandMap[sName] = { total: 0, confirmed: 0, cancelled: 0, revenue: 0 };
            }
            serviceDemandMap[sName].total += 1;
            if (b.status === 'confirmed') {
              serviceDemandMap[sName].confirmed += 1;
              serviceDemandMap[sName].revenue += Number(b.price) || 0;
            } else {
              serviceDemandMap[sName].cancelled += 1;
            }
          });

          const serviceDemandList = Object.entries(serviceDemandMap).map(([name, stats]) => ({
            name,
            total: stats.total,
            confirmed: stats.confirmed,
            cancelled: stats.cancelled,
            revenue: stats.revenue
          })).sort((a, b) => b.total - a.total);

          const topService = serviceDemandList.length > 0 && serviceDemandList[0].total > 0 ? serviceDemandList[0] : null;
          const leastService = serviceDemandList.length > 0 ? serviceDemandList[serviceDemandList.length - 1] : null;

          const PIE_COLORS = ['#0F232C', '#39B54A', '#B8860B', '#2A6F97', '#468FAF', '#014F86'];

          return (
            <div className="space-y-8">
              {/* SECTION 1: Estimación de Ingresos (Día / Semana / Mes) */}
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-6 shadow-[0_4px_6px_rgba(0,0,0,0.04)] space-y-6">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-[#E5E7EB] pb-4">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
                      <span>Estimación de Ingresos</span>
                      <span className="text-xs font-sans font-normal text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
                        {analyticsPeriod === 'day' ? 'Modo Diario' : analyticsPeriod === 'week' ? 'Modo Semanal' : 'Modo Mensual'}
                      </span>
                    </h3>
                    <p className="text-xs text-stone-600 mt-1">
                      <strong className="text-[#1A1A1A]">{dateRangeLabel}</strong> • Calculado en tiempo real según las citas confirmadas.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Switcher Día / Semana / Mes */}
                    <div className="flex bg-stone-100 border border-stone-200 rounded-[8px] p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setAnalyticsPeriod('day')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                          analyticsPeriod === 'day'
                            ? 'bg-[#0F232C] text-white shadow-sm'
                            : 'text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">today</span>
                        <span>Día</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnalyticsPeriod('week')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                          analyticsPeriod === 'week'
                            ? 'bg-[#0F232C] text-white shadow-sm'
                            : 'text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">date_range</span>
                        <span>Semana</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnalyticsPeriod('month')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                          analyticsPeriod === 'month'
                            ? 'bg-[#0F232C] text-white shadow-sm'
                            : 'text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        <span>Mes</span>
                      </button>
                    </div>

                    {/* Selector de fecha */}
                    <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] px-3 py-1.5 shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
                      <label htmlFor="analyticsDateInput" className="text-[11px] text-stone-700 font-bold flex items-center gap-1">
                        <span>Fecha:</span>
                      </label>
                      <input
                        id="analyticsDateInput"
                        type="date"
                        value={analyticsDate}
                        onChange={(e) => setAnalyticsDate(e.target.value)}
                        className="bg-transparent text-xs text-[#1A1A1A] outline-none cursor-pointer font-mono font-medium"
                      />
                    </div>

                    {/* Botón Exportar Informe CSV */}
                    <button
                      type="button"
                      onClick={() => {
                        const rows: (string | number)[][] = [
                          [`INFORME DE CONTABILIDAD Y FACTURACIÓN - ${demoConfig.shopName.toUpperCase()}`],
                          ['Fecha de Generación', new Date().toLocaleString('es-ES')],
                          ['Período del Informe', dateRangeLabel],
                          ['Modo de Análisis', analyticsPeriod === 'day' ? 'Diario' : analyticsPeriod === 'week' ? 'Semanal' : 'Mensual'],
                          ['Fecha de Referencia', analyticsDate],
                          [''],
                          ['RESUMEN FINANCIERO'],
                          ['Facturación / Ingreso Estimado (€)', estimatedRevenue],
                          ['Citas Confirmadas', confirmedBookings.length],
                          ['Citas Canceladas', cancelledBookings.length],
                          ['Ticket Medio por Cita (€)', avgTicket],
                          [''],
                          ['DESGLOSE POR TRABAJADOR / BARBERO'],
                          ['Trabajador / Barbero', 'Citas Atendidas', 'Facturación Total (€)', 'Cuota de Facturación (%)'],
                          ...workerDataList.map((w) => [
                            w.barber,
                            w.count,
                            w.revenue,
                            totalWorkerRevenue > 0 ? `${Math.round((w.revenue / totalWorkerRevenue) * 100)}%` : '0%'
                          ]),
                          [''],
                          ['DETALLE DE CITAS EN EL PERÍODO'],
                          ['ID Cita', 'Fecha', 'Hora', 'Cliente', 'Email', 'Teléfono', 'Servicio', 'Barbero', 'Precio (€)', 'Estado']
                        ];

                        filteredBookings.forEach((b) => {
                          rows.push([
                            b.id,
                            b.date,
                            b.time,
                            b.customerName,
                            b.customerEmail,
                            b.customerPhone,
                            b.serviceName,
                            b.barberName || 'Sin asignar',
                            b.price,
                            b.status === 'confirmed' ? 'Confirmada' : 'Cancelada'
                          ]);
                        });

                        exportToCSV(`Informe_Contabilidad_${analyticsPeriod}_${analyticsDate}.csv`, rows);
                      }}
                      className="bg-[#0F232C] text-white hover:bg-[#163340] border border-[#39B54A] px-3.5 py-1.5 rounded-[8px] text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_4px_6px_rgba(0,0,0,0.04)] active:scale-95"
                      title="Descargar informe contable en CSV para Excel / Google Sheets"
                    >
                      <span className="material-symbols-outlined text-sm text-[#39B54A]">download</span>
                      <span>Exportar Informe CSV</span>
                    </button>
                  </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-4 rounded-[8px] flex flex-col justify-between shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
                    <span className="text-xs text-stone-600 uppercase tracking-wider font-semibold">Ingreso Estimado</span>
                    <span className="font-serif text-3xl font-bold text-[#0F232C] my-2">{estimatedRevenue}€</span>
                    <span className="text-[11px] text-stone-500 truncate">{dateRangeLabel}</span>
                  </div>

                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-4 rounded-[8px] flex flex-col justify-between shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
                    <span className="text-xs text-stone-600 uppercase tracking-wider font-semibold">Citas Confirmadas</span>
                    <span className="font-serif text-3xl font-bold text-emerald-700 my-2">{confirmedBookings.length}</span>
                    <span className="text-[11px] text-emerald-600">Generan el total estimado</span>
                  </div>

                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-4 rounded-[8px] flex flex-col justify-between shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
                    <span className="text-xs text-stone-600 uppercase tracking-wider font-semibold">Citas Canceladas</span>
                    <span className="font-serif text-3xl font-bold text-red-600 my-2">{cancelledBookings.length}</span>
                    <span className="text-[11px] text-red-500">Excluidas del cálculo</span>
                  </div>

                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-4 rounded-[8px] flex flex-col justify-between shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
                    <span className="text-xs text-stone-600 uppercase tracking-wider font-semibold">Ticket Medio</span>
                    <span className="font-serif text-3xl font-bold text-[#1A1A1A] my-2">{avgTicket}€</span>
                    <span className="text-[11px] text-stone-500">Promedio por cita confirmada</span>
                  </div>
                </div>

                {/* Desglose por Barbero & Gráfico de Ingresos */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-[#E5E7EB]">
                  <div className="lg:col-span-1 bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB] shadow-[0_4px_6px_rgba(0,0,0,0.04)] space-y-3">
                    <h4 className="font-serif text-base font-bold text-[#1A1A1A] flex items-center justify-between">
                      <span>Estimación por Especialista</span>
                      <span className="text-[10px] text-stone-500 font-sans font-normal">Total acumulado</span>
                    </h4>
                    {Object.keys(barberRevenueMap).length === 0 ? (
                      <p className="text-xs text-stone-500 italic py-4 text-center">No hay citas confirmadas para el período seleccionado.</p>
                    ) : (
                      Object.entries(barberRevenueMap).map(([barber, rev]) => (
                        <div key={barber} className="flex justify-between items-center text-xs border-b border-[#E5E7EB] pb-2">
                          <span className="text-[#1A1A1A] font-semibold">{barber}</span>
                          <span className="text-[#0F232C] font-bold text-sm">{rev}€</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="lg:col-span-2 bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB] shadow-[0_4px_6px_rgba(0,0,0,0.04)] space-y-3">
                    <h4 className="font-serif text-base font-bold text-[#1A1A1A]">{chartTitle}</h4>
                    <div className="h-52 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="label" stroke="#6b7280" fontSize={10} interval={analyticsPeriod === 'month' ? 2 : 0} />
                          <YAxis stroke="#6b7280" fontSize={11} unit="€" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#e5e7eb', color: '#1A1A1A', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(val: number) => [`${val}€`, 'Ingresos']}
                          />
                          <Bar dataKey="Ingresos" fill="#0F232C" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Rendimiento e Ingresos por Barbero / Trabajador */}
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-6 shadow-[0_4px_6px_rgba(0,0,0,0.04)] space-y-6">
                <div className="border-b border-[#E5E7EB] pb-4 flex flex-col md:flex-row justify-between md:items-center gap-2">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
                      <span className="material-symbols-outlined text-2xl text-[#0F232C]">badge</span>
                      <span>Rendimiento e Ingresos por Barbero / Trabajador</span>
                    </h3>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Comparativa de facturación y volumen de citas por profesional en <strong className="text-[#1A1A1A]">{dateRangeLabel}</strong>. Acumula las ventas reales incluso si un trabajador es modificado o eliminado.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de Barras Horizontales de Ingresos por Barbero */}
                  <div className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB] shadow-[0_4px_6px_rgba(0,0,0,0.04)] space-y-3">
                    <h4 className="font-serif text-base font-bold text-[#1A1A1A] flex items-center justify-between">
                      <span>Facturación por Profesional (€)</span>
                      <span className="text-xs text-stone-600 font-sans font-normal">Total: <strong className="text-[#0F232C]">{totalWorkerRevenue}€</strong></span>
                    </h4>
                    <div className="h-64 w-full pt-2">
                      {workerDataList.length === 0 || totalWorkerRevenue === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-stone-500 italic">
                          No hay facturación registrada para este período.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={workerDataList} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" stroke="#6b7280" fontSize={11} unit="€" />
                            <YAxis dataKey="barber" type="category" stroke="#6b7280" fontSize={11} width={110} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#e5e7eb', color: '#1A1A1A', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              formatter={(val: number, name: string) => [
                                name === 'revenue' ? `${val}€` : val,
                                name === 'revenue' ? 'Facturación' : 'Citas'
                              ]}
                            />
                            <Bar dataKey="revenue" name="revenue" fill="#39B54A" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Lista de Distribución de Cuota y Porcentajes */}
                  <div className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB] shadow-[0_4px_6px_rgba(0,0,0,0.04)] space-y-4">
                    <h4 className="font-serif text-base font-bold text-[#1A1A1A] flex items-center justify-between">
                      <span>Cuota de Trabajo y Rendimiento</span>
                      <span className="text-xs text-stone-600 font-sans font-normal">{totalWorkerAppointments} Citas Totales</span>
                    </h4>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {workerDataList.length === 0 ? (
                        <p className="text-xs text-stone-500 italic text-center py-8">Sin datos en el período seleccionado.</p>
                      ) : (
                        workerDataList.map((item) => {
                          const sharePercent = totalWorkerRevenue > 0 ? Math.round((item.revenue / totalWorkerRevenue) * 100) : 0;
                          return (
                            <div key={item.barber} className="space-y-1.5 bg-[#FFFFFF] p-3 rounded-[8px] border border-[#E5E7EB] shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
                              <div className="flex justify-between items-center text-xs font-semibold">
                                <span className="text-[#1A1A1A] flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#39B54A]" />
                                  {item.barber}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="text-stone-500 text-[11px]">{item.count} citas</span>
                                  <span className="text-[#0F232C] font-bold">{item.revenue}€ ({sharePercent}%)</span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#39B54A] rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(sharePercent, item.revenue > 0 ? 3 : 0)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Análisis de Demanda por Tipo de Servicio */}
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-6 shadow-[0_4px_6px_rgba(0,0,0,0.04)] space-y-6">
                <div className="border-b border-[#E5E7EB] pb-4">
                  <h3 className="font-serif text-2xl font-bold text-[#1A1A1A]">
                    Demanda y Popularidad de Servicios
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Permite identificar los servicios más cotizados y los de menor demanda para optimizar precios y promociones.
                  </p>
                </div>

                {/* Highlights Top vs Menor Demanda */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-4 rounded-[8px] shadow-[0_4px_6px_rgba(0,0,0,0.04)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                      <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider">Servicio Más Demandado</span>
                      <h4 className="font-serif text-lg font-bold text-[#1A1A1A]">{topService ? topService.name : 'N/A'}</h4>
                      <p className="text-xs text-stone-600">
                        {topService ? `${topService.total} reservas (${topService.revenue}€ recaudados)` : 'Sin datos suficientes'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-4 rounded-[8px] shadow-[0_4px_6px_rgba(0,0,0,0.04)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center text-stone-600">
                      <span className="material-symbols-outlined text-2xl">trending_down</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase font-bold text-stone-600 tracking-wider">Servicio Menos Demandado</span>
                      <h4 className="font-serif text-lg font-bold text-[#1A1A1A]">{leastService ? leastService.name : 'N/A'}</h4>
                      <p className="text-xs text-stone-600">
                        {leastService ? `${leastService.total} reservas acumuladas` : 'Sin datos suficientes'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recharts BarChart & PieChart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <div className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB] shadow-[0_4px_6px_rgba(0,0,0,0.04)] space-y-3">
                    <h4 className="font-serif text-base font-bold text-[#1A1A1A]">Comparativa de Reservas por Servicio</h4>
                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={serviceDemandList} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" stroke="#6b7280" fontSize={11} />
                          <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} width={110} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#e5e7eb', color: '#1A1A1A', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="total" name="Total Reservas" fill="#0F232C" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E7EB] shadow-[0_4px_6px_rgba(0,0,0,0.04)] space-y-3">
                    <h4 className="font-serif text-base font-bold text-[#1A1A1A]">Distribución de Ingresos Generados</h4>
                    <div className="h-64 w-full pt-2 flex items-center justify-center">
                      {(() => {
                        const pieData = serviceDemandList.filter((s) => s.revenue > 0);
                        if (pieData.length === 0) {
                          return (
                            <div className="text-center text-xs text-stone-500 italic py-12">
                              No hay ingresos registrados aún con citas confirmadas.
                            </div>
                          );
                        }
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="revenue"
                                nameKey="name"
                                cx="50%"
                                cy="45%"
                                outerRadius={75}
                                innerRadius={35}
                                paddingAngle={4}
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#e5e7eb', color: '#1A1A1A', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(val: number) => [`${val}€`, 'Ingresos Generados']}
                              />
                              <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => <span style={{ color: '#1A1A1A', fontSize: '11px', fontWeight: 500 }}>{value}</span>}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 2: CALENDAR VIEW */}
        {activeTab === 'calendar' && hasTabPermission('calendar') && (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-6 space-y-6 shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-4">
              <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">
                Agenda de la Barbería
              </h3>
              <p className="text-xs text-stone-600">
                Visualiza las citas agendadas por horario para gestionar el calendario del negocio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['09:00', '10:00', '11:00', '12:00', '14:00', '15:30', '17:00', '18:00'].map((timeSlot) => {
                const slotBookings = bookings.filter((b) => b.time === timeSlot && b.status === 'confirmed');
                return (
                  <div
                    key={timeSlot}
                    className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-4 space-y-2 shadow-[0_4px_6px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-2">
                      <span className="font-mono text-sm font-bold text-[#0F232C]">{timeSlot} hs</span>
                      <span className="text-[10px] text-stone-500 font-medium">
                        {slotBookings.length} cita(s)
                      </span>
                    </div>

                    {slotBookings.length === 0 ? (
                      <p className="text-[11px] text-stone-400 italic py-2">Disponible</p>
                    ) : (
                      slotBookings.map((bk) => (
                        <div
                          key={bk.id}
                          className="p-2.5 bg-[#FFFFFF] rounded-[8px] border border-[#E5E7EB] text-xs space-y-1 shadow-[0_4px_6px_rgba(0,0,0,0.04)]"
                        >
                          <p className="font-bold text-[#1A1A1A]">{bk.customerName}</p>
                          <p className="text-[11px] text-stone-700 font-medium">{bk.serviceName} ({bk.barberName})</p>
                          <p className="text-[10px] text-stone-500">Tel: {bk.customerPhone}</p>
                          <div className="pt-1 flex justify-end gap-1">
                            <button
                              onClick={() => handleDeleteBooking(bk.id)}
                              className="text-[10px] text-red-600 hover:underline font-semibold"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SERVICES MANAGEMENT */}
        {activeTab === 'services' && hasTabPermission('services') && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
                Catálogo de Servicios Ofrecidos
                <span className="text-xs font-sans font-semibold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full border border-stone-200">
                  ({services.length} activos)
                </span>
              </h3>
              <button
                onClick={() => setShowNewServiceModal(true)}
                className="bg-[#39B54A] text-white px-4 py-2.5 rounded-[8px] font-sans text-xs font-bold uppercase tracking-wider hover:bg-[#32a242] flex items-center gap-1 shadow-[0_4px_6px_rgba(0,0,0,0.04)] transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Añadir Servicio
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map((srv) => {
                const isAvailable = srv.available !== false;
                return (
                  <div
                    key={srv.id}
                    className={`border border-[#E5E7EB] rounded-[8px] p-5 flex flex-col justify-between space-y-4 shadow-[0_4px_6px_rgba(0,0,0,0.04)] transition-all ${
                      !isAvailable
                        ? 'bg-[#FFFFFF] border-amber-300/80 opacity-90'
                        : 'bg-[#FFFFFF]'
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                        <h4 className="font-serif text-lg font-bold text-[#1A1A1A]">{srv.name}</h4>
                        <div className="flex items-center gap-1">
                          {srv.popular && (
                            <span className="bg-[#0F232C] text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                              Popular
                            </span>
                          )}
                          {isAvailable ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                              Activo
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                              ⚠️ Pausado
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed mb-3">{srv.description}</p>
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-stone-600">{srv.duration} Minutos</span>
                        <span className="text-lg text-[#0F232C]">{srv.price}€</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
                      <button
                        onClick={() => handleToggleServiceAvailability(srv)}
                        className={`w-full py-1.5 rounded-[8px] text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                          !isAvailable
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isAvailable ? 'pause_circle' : 'play_circle'}
                        </span>
                        {isAvailable ? 'Pausar Servicio' : 'Reactivar Servicio'}
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingService(srv)}
                          className="flex-1 bg-stone-100 hover:bg-[#0F232C] hover:text-white text-[#1A1A1A] border border-[#E5E7EB] py-1.5 rounded-[8px] text-xs font-bold transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteService(srv.id)}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-1.5 rounded-[8px] text-xs font-bold transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: BARBERS / TEAM MANAGEMENT */}
        {activeTab === 'barbers' && hasTabPermission('barbers') && (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-6 space-y-6 shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
                  Equipo, Roles y Permisos
                  <span className="text-xs font-sans font-semibold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full border border-stone-200">
                    ({barbers.length} profesionales)
                  </span>
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Crea perfiles para cada barbero/empleado, asigna su rol (Admin o Empleado) y configura qué secciones del panel pueden ver y tocar.
                </p>
              </div>
              <button
                onClick={() => setShowNewBarberModal(true)}
                className="bg-[#39B54A] text-white px-4 py-2.5 rounded-[8px] font-sans text-xs font-bold uppercase tracking-wider hover:bg-[#32a242] flex items-center gap-1 shadow-[0_4px_6px_rgba(0,0,0,0.04)] self-start md:self-auto transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                Añadir Trabajador
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {barbers.map((barber) => {
                const isAvailable = barber.available !== false;
                const isWildcard = barber.id === 'cualquiera';
                const role = barber.role || 'staff';
                const bPerms = barber.permissions || {
                  canViewBookings: true,
                  canManageBookings: true,
                  canViewAnalytics: role === 'admin',
                  canViewCalendar: true,
                  canManageServices: role === 'admin',
                  canManageTeam: role === 'admin',
                  canViewLogs: role === 'admin',
                  canViewEmails: role === 'admin',
                };

                // Only render permissions that are enabled; inactive ones are omitted completely from HTML
                const activePermissionsList = [
                  { key: 'canViewBookings', label: '📅 Citas', enabled: bPerms.canViewBookings },
                  { key: 'canManageBookings', label: '✏️ Editar Citas', enabled: bPerms.canManageBookings },
                  { key: 'canViewAnalytics', label: '📊 Métricas', enabled: bPerms.canViewAnalytics },
                  { key: 'canViewCalendar', label: '🗓️ Calendario', enabled: bPerms.canViewCalendar },
                  { key: 'canManageServices', label: '✂️ Servicios', enabled: bPerms.canManageServices },
                  { key: 'canManageTeam', label: '👥 Equipo', enabled: bPerms.canManageTeam },
                  { key: 'canViewLogs', label: '📜 Logs', enabled: bPerms.canViewLogs },
                  { key: 'canViewEmails', label: '✉️ Emails', enabled: bPerms.canViewEmails },
                ].filter((p) => Boolean(p.enabled));

                return (
                  <div
                    key={barber.id}
                    className={`border border-[#E5E7EB] rounded-[8px] p-5 flex flex-col justify-between space-y-4 shadow-[0_4px_6px_rgba(0,0,0,0.04)] transition-all bg-[#F8F9FA] hover:shadow-md ${
                      !isAvailable
                        ? 'border-amber-300/80 opacity-90'
                        : 'border-[#E5E7EB]'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full overflow-hidden border-2 bg-white flex items-center justify-center shrink-0 ${
                            !isAvailable ? 'border-amber-400' : 'border-[#0F232C]'
                          }`}>
                            {barber.avatarUrl ? (
                              <img src={barber.avatarUrl} alt={barber.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-2xl text-stone-600">groups</span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-serif text-lg font-bold text-[#1A1A1A]">{barber.name}</h4>
                            <p className="text-xs text-stone-600">{barber.title}</p>
                          </div>
                        </div>

                        {isAvailable ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase px-2 py-0.5 rounded shrink-0">
                            Activo
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold uppercase px-2 py-0.5 rounded shrink-0">
                            ⚠️ Pausado
                          </span>
                        )}
                      </div>

                      {isWildcard ? (
                        <p className="text-[11px] text-stone-500 italic bg-white p-3 rounded-[8px] border border-[#E5E7EB]">
                          Perfil comodín genérico para asignación automática al barbero disponible.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2 text-xs bg-white p-3.5 rounded-[8px] border border-[#E5E7EB] shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-700 text-[11px] font-semibold">Rol Asignado:</span>
                            {role === 'admin' ? (
                              <span className="bg-[#0F232C] text-white font-bold text-[10px] px-2.5 py-0.5 rounded">
                                👑 Administrador
                              </span>
                            ) : (
                              <span className="bg-stone-200 text-stone-800 font-bold text-[10px] px-2.5 py-0.5 rounded">
                                ✂️ Barbero / Empleado
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-600">Usuario:</span>
                            <code className="text-[#0F232C] font-mono bg-stone-50 px-2 py-0.5 rounded border border-[#E5E7EB] font-bold">
                              {barber.username || barber.id}
                            </code>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-stone-600">Contraseña:</span>
                            <span className="text-stone-800 font-mono">
                              {barber.password ? '••••••••' : <span className="text-red-600 italic">Sin clave</span>}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-[#E5E7EB]">
                            <span className="block text-[10px] text-stone-500 font-semibold uppercase tracking-wider mb-1.5">
                              Permisos Habilitados:
                            </span>
                            {activePermissionsList.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {activePermissionsList.map((p) => (
                                  <span
                                    key={p.key}
                                    className="bg-white text-[#0F232C] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#E5E7EB] shadow-2xs"
                                  >
                                    {p.label}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-stone-400 italic">Sin permisos adicionales asignados</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
                      <button
                        onClick={() => handleToggleBarberAvailability(barber)}
                        className={`w-full py-1.5 rounded-[8px] text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                          !isAvailable
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isAvailable ? 'pause_circle' : 'play_circle'}
                        </span>
                        {isAvailable ? 'Pausar Trabajador' : 'Reactivar Trabajador'}
                      </button>

                      {!isWildcard && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingBarber(barber)}
                            className="flex-1 bg-stone-100 hover:bg-[#0F232C] hover:text-white text-[#1A1A1A] border border-[#E5E7EB] py-1.5 rounded-[8px] text-xs font-bold transition-colors"
                          >
                            Editar Permisos
                          </button>
                          <button
                            onClick={() => handleDeleteBarber(barber.id)}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-1.5 rounded-[8px] text-xs font-bold transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}

                      {!isWildcard && (
                        <button
                          type="button"
                          onClick={() => {
                            const roleName = barber.role === 'admin' ? 'Administrador' : 'Empleado';
                            const permsList = mapCheckboxesToPermissionsList(
                              barber.permissions || defaultWorkerPermissions,
                              barber.role || 'staff'
                            );
                            const userObj: MockUser = {
                              id: `user-${barber.id}`,
                              username: barber.username || barber.id,
                              password: barber.password || '1234',
                              name: barber.name,
                              role: roleName,
                              permissions: permsList
                            };
                            localStorage.setItem('currentUserSession', JSON.stringify(userObj));
                            setCurrentUser({
                              id: userObj.id,
                              username: userObj.username,
                              name: userObj.name,
                              role: barber.role === 'admin' ? 'admin' : 'staff',
                              permissions: convertPermissionsArrayToWorkerPermissions(userObj.permissions, userObj.role)
                            });
                          }}
                          className="w-full bg-[#0F232C]/5 hover:bg-[#0F232C] hover:text-white text-[#0F232C] border border-[#0F232C]/20 py-1.5 rounded-[8px] text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                          title="Cambiar sesión activa a este usuario para verificar sus permisos y pestañas en el simulador"
                        >
                          <span className="material-symbols-outlined text-sm">switch_account</span>
                          Probar Vista con este Perfil
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS SYSTEM */}
        {activeTab === 'logs' && hasTabPermission('logs') && (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-6 space-y-6 shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
                  Registro de Auditoría de Administradores
                  <span className="text-xs font-sans font-semibold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full border border-stone-200">
                    ({logs.length} eventos)
                  </span>
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Muestra un registro histórico inmutable de todas las acciones ejecutadas por administradores o el sistema.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
              <table className="w-full text-left text-xs bg-[#FFFFFF]">
                <thead className="bg-[#0F232C] text-white uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5 text-white">Timestamp</th>
                    <th className="p-3.5 text-white">Usuario</th>
                    <th className="p-3.5 text-white">Acción</th>
                    <th className="p-3.5 text-white">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] bg-[#FFFFFF]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-stone-600">
                        {new Date(log.timestamp).toLocaleString('es-ES')}
                      </td>
                      <td className="p-3.5 font-bold text-[#1A1A1A]">
                        {log.adminUser}
                      </td>
                      <td className="p-3.5">
                        <span className="bg-[#0F232C]/10 text-[#0F232C] border border-[#0F232C]/20 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 text-stone-800">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SENT EMAILS LOG */}
        {activeTab === 'emails' && hasTabPermission('emails') && (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-6 space-y-6 shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
                  Historial de Correos de Confirmación Enviados
                  <span className="text-xs font-sans font-semibold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full border border-stone-200">
                    ({emails.length} registrados)
                  </span>
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Registro en tiempo real de todas las notificaciones por correo electrónico entregadas o enviadas a clientes.
                </p>
              </div>
              <button
                onClick={fetchAdminData}
                className="bg-stone-100 border border-[#E5E7EB] text-[#1A1A1A] hover:bg-stone-200 text-xs px-3.5 py-1.5 rounded-[8px] transition-colors flex items-center gap-1.5 font-bold shadow-[0_4px_6px_rgba(0,0,0,0.04)]"
              >
                <span className="material-symbols-outlined text-sm">refresh</span> Refrescar
              </button>
            </div>

            {emails.length === 0 ? (
              <div className="text-center py-12 text-stone-500 text-xs">
                No se han registrado envíos de correo aún.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
                <table className="w-full text-left text-xs bg-[#FFFFFF]">
                  <thead className="bg-[#0F232C] text-white uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-3.5 text-white">Fecha y Hora</th>
                      <th className="p-3.5 text-white">Destinatario</th>
                      <th className="p-3.5 text-white">Asunto</th>
                      <th className="p-3.5 text-white">Estado</th>
                      <th className="p-3.5 text-right text-white">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] bg-[#FFFFFF]">
                    {emails.map((em) => (
                      <tr key={em.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3.5 font-mono text-[11px] text-stone-600">
                          {new Date(em.sentAt).toLocaleString('es-ES')}
                        </td>
                        <td className="p-3.5 font-bold text-[#1A1A1A]">
                          {em.to}
                          {em.customerName && (
                            <span className="block text-[11px] font-normal text-stone-500">
                              {em.customerName}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-[#1A1A1A] font-medium max-w-xs truncate">
                          {em.subject}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              em.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {em.status === 'delivered' ? 'Entregado SMTP' : 'Registrado Digital'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => setSelectedEmailModal(em)}
                            className="bg-stone-100 border border-[#E5E7EB] hover:bg-[#0F232C] hover:text-white text-[#1A1A1A] text-xs px-3 py-1 rounded-[8px] transition-colors font-semibold"
                          >
                            Ver Email
                          </button>
                          {em.bookingId && (
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/emails/resend/${em.bookingId}`, { method: 'POST' });
                                  if (res.ok) {
                                    alert(`Correo reenviado con éxito a ${em.to}`);
                                    fetchAdminData();
                                  } else {
                                    alert('Error al reenviar correo');
                                  }
                                } catch (e) {
                                  alert('Error al conectar con servidor');
                                }
                              }}
                              className="bg-[#0F232C]/10 hover:bg-[#0F232C]/20 text-[#0F232C] border border-[#0F232C]/30 text-xs px-3 py-1 rounded-[8px] transition-colors font-bold"
                            >
                              Reenviar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <EmailPreviewModal
          isOpen={!!selectedEmailModal}
          onClose={() => setSelectedEmailModal(null)}
          emailData={selectedEmailModal}
        />

      </main>
      </div>

      {/* Corporate Admin Footer */}
      <footer className="mt-16 py-6 border-t border-[#E5E7EB] text-center text-xs text-stone-500 font-medium bg-[#FFFFFF] shadow-[0_4px_6px_rgba(0,0,0,0.04)]">
        Software by Neova Digital
      </footer>

      {/* MODAL: Nueva Cita Manual (Admin) */}
      {showNewBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-lg w-full text-[#1A1A1A] space-y-4 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-[#0F232C]">Crear Nueva Cita (Admin)</h3>
            <form onSubmit={handleCreateBookingAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  value={bookingForm.customerName}
                  onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.customerPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Email (Opcional)</label>
                  <input
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={bookingForm.customerEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Servicio</label>
                  <select
                    value={bookingForm.serviceName}
                    onChange={(e) => {
                      const found = services.find((s) => s.name === e.target.value);
                      setBookingForm({
                        ...bookingForm,
                        serviceName: e.target.value,
                        price: found ? found.price : 25,
                        duration: found ? found.duration : 45
                      });
                    }}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.price}€) {s.available === false ? ' - ⚠️ PAUSADO' : ''}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const selectedSrv = services.find((s) => s.name === bookingForm.serviceName);
                    if (selectedSrv && selectedSrv.available === false) {
                      return (
                        <p className="text-[11px] text-amber-700 mt-1 font-medium">
                          ⚠️ Este servicio se encuentra pausado actualmente.
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Barbero / Profesional</label>
                  <select
                    value={bookingForm.barberName}
                    onChange={(e) => setBookingForm({ ...bookingForm, barberName: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} {b.available === false ? ' - ⚠️ PAUSADO' : ''}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const selectedB = barbers.find((b) => b.name === bookingForm.barberName);
                    if (selectedB && selectedB.available === false) {
                      return (
                        <p className="text-[11px] text-amber-700 mt-1 font-medium">
                          ⚠️ Este profesional se encuentra pausado actualmente.
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Hora</label>
                  <input
                    type="text"
                    required
                    placeholder="12:00"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewBookingModal(false)}
                  className="px-4 py-2 bg-stone-100 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#39B54A] text-white font-bold rounded-lg hover:bg-[#32a242] transition-colors shadow-sm"
                >
                  Guardar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Servicio (Admin) */}
      {showNewServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-md w-full text-[#1A1A1A] space-y-4 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-[#0F232C]">Añadir Nuevo Servicio</h3>
            <form onSubmit={handleCreateServiceAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tratamiento Capilar"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Precio (€) *</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Duración (min) *</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="popularCheck"
                    checked={serviceForm.popular}
                    onChange={(e) => setServiceForm({ ...serviceForm, popular: e.target.checked })}
                    className="rounded text-[#0F232C]"
                  />
                  <label htmlFor="popularCheck" className="text-stone-700 font-medium">Marcar como servicio Popular</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="availableCheck"
                    checked={serviceForm.available !== false}
                    onChange={(e) => setServiceForm({ ...serviceForm, available: e.target.checked })}
                    className="rounded text-[#0F232C]"
                  />
                  <label htmlFor="availableCheck" className="text-stone-700 font-medium">
                    Servicio Disponible para Clientes
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewServiceModal(false)}
                  className="px-4 py-2 bg-stone-100 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#39B54A] text-white font-bold rounded-lg hover:bg-[#32a242] transition-colors shadow-sm"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Cita (Admin) */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-md w-full text-[#1A1A1A] space-y-4 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-[#0F232C]">Editar Cita #{editingBooking.id}</h3>
            <form onSubmit={handleUpdateBooking} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Nombre Cliente</label>
                <input
                  type="text"
                  value={editingBooking.customerName}
                  onChange={(e) => setEditingBooking({ ...editingBooking, customerName: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    value={editingBooking.date}
                    onChange={(e) => setEditingBooking({ ...editingBooking, date: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Hora</label>
                  <input
                    type="text"
                    value={editingBooking.time}
                    onChange={(e) => setEditingBooking({ ...editingBooking, time: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Barbero / Profesional</label>
                <select
                  value={editingBooking.barberName}
                  onChange={(e) => setEditingBooking({ ...editingBooking, barberName: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                >
                  {barbers.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name} {b.available === false ? ' - ⚠️ PAUSADO' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 bg-stone-100 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#39B54A] text-white font-bold rounded-lg hover:bg-[#32a242] transition-colors shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Servicio (Admin) */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-md w-full text-[#1A1A1A] space-y-4 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-[#0F232C]">Editar Servicio</h3>
            <form onSubmit={handleUpdateService} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Precio (€)</label>
                  <input
                    type="number"
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Duración (min)</label>
                  <input
                    type="number"
                    value={editingService.duration}
                    onChange={(e) => setEditingService({ ...editingService, duration: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C] outline-none"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editPopularCheck"
                    checked={editingService.popular || false}
                    onChange={(e) => setEditingService({ ...editingService, popular: e.target.checked })}
                    className="rounded text-[#0F232C]"
                  />
                  <label htmlFor="editPopularCheck" className="text-stone-700 font-medium">Servicio Popular</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editAvailableCheck"
                    checked={editingService.available !== false}
                    onChange={(e) => setEditingService({ ...editingService, available: e.target.checked })}
                    className="rounded text-[#0F232C]"
                  />
                  <label htmlFor="editAvailableCheck" className="text-stone-700 font-medium">
                    Servicio Disponible / Activo
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 bg-stone-100 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#39B54A] text-white font-bold rounded-lg hover:bg-[#32a242] transition-colors shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE BARBER */}
      {showNewBarberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto text-[#1A1A1A]">
            <h3 className="font-serif text-xl font-bold text-[#0F232C]">Añadir Nuevo Trabajador y Perfil</h3>
            <form onSubmit={handleCreateBarberAdmin} className="space-y-4 text-xs font-sans">
              
              {/* Datos Personales */}
              <div className="space-y-3 bg-[#F8F9FA] p-4 rounded-xl border border-stone-200">
                <h4 className="text-[#0F232C] font-bold text-xs uppercase tracking-wider">1. Datos Personales</h4>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carlos M. Gómez"
                    value={barberForm.name}
                    onChange={(e) => setBarberForm({ ...barberForm, name: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] outline-none focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Especialidad / Puesto</label>
                  <input
                    type="text"
                    placeholder="Ej: Estilista / Especialista Degradados"
                    value={barberForm.title}
                    onChange={(e) => setBarberForm({ ...barberForm, title: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] outline-none focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">URL Foto Perfil (Opcional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={barberForm.avatarUrl}
                    onChange={(e) => setBarberForm({ ...barberForm, avatarUrl: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] outline-none focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="barberAvailableCheck"
                    checked={barberForm.available}
                    onChange={(e) => setBarberForm({ ...barberForm, available: e.target.checked })}
                    className="rounded text-[#0F232C]"
                  />
                  <label htmlFor="barberAvailableCheck" className="text-stone-700 font-medium">
                    Trabajador activo (Disponible para selección por clientes en la web)
                  </label>
                </div>
              </div>

              {/* Credenciales de Acceso */}
              <div className="space-y-3 bg-[#F8F9FA] p-4 rounded-xl border border-stone-200">
                <h4 className="text-[#0F232C] font-bold text-xs uppercase tracking-wider">2. Credenciales de Acceso al Panel Admin</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Usuario de Acceso *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: carlos"
                      value={barberForm.username}
                      onChange={(e) => setBarberForm({ ...barberForm, username: e.target.value.trim().toLowerCase() })}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] outline-none focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C]"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Contraseña *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: carlos2026"
                      value={barberForm.password}
                      onChange={(e) => setBarberForm({ ...barberForm, password: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] outline-none focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C]"
                    />
                  </div>
                </div>
              </div>

              {/* Asignación de Rol */}
              <div className="space-y-3 bg-[#F8F9FA] p-4 rounded-xl border border-stone-200">
                <h4 className="text-[#0F232C] font-bold text-xs uppercase tracking-wider">3. Rol del Trabajador</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    barberForm.role === 'admin'
                      ? 'bg-stone-50 border-[#0F232C] text-[#0F232C]'
                      : 'bg-white border-stone-200 text-stone-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="barberRole"
                        checked={barberForm.role === 'admin'}
                        onChange={() => {
                          setBarberForm({
                            ...barberForm,
                            role: 'admin',
                            permissions: {
                              canViewBookings: true,
                              canManageBookings: true,
                              canViewAnalytics: true,
                              canViewCalendar: true,
                              canManageServices: true,
                              canManageTeam: true,
                              canViewLogs: true,
                              canViewEmails: true
                            }
                          });
                        }}
                        className="text-[#0F232C]"
                      />
                      <span className="font-bold text-xs">👑 Administrador</span>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-1">Acceso total al panel, métricas y equipo</span>
                  </label>

                  <label className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    barberForm.role === 'staff'
                      ? 'bg-stone-50 border-[#0F232C] text-[#0F232C]'
                      : 'bg-white border-stone-200 text-stone-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="barberRole"
                        checked={barberForm.role === 'staff'}
                        onChange={() => {
                          setBarberForm({
                            ...barberForm,
                            role: 'staff',
                            permissions: { ...defaultWorkerPermissions }
                          });
                        }}
                        className="text-[#0F232C]"
                      />
                      <span className="font-bold text-xs">✂️ Empleado</span>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-1">Acceso según permisos personalizados</span>
                  </label>
                </div>
              </div>

              {/* Permisos Granulares */}
              <div className="space-y-3 bg-[#F8F9FA] p-4 rounded-xl border border-stone-200">
                <div className="flex justify-between items-center">
                  <h4 className="text-[#0F232C] font-bold text-xs uppercase tracking-wider">4. Permisos Específicos del Panel</h4>
                  {barberForm.role === 'admin' && (
                    <span className="text-[10px] text-emerald-700 font-semibold italic">Todos habilitados por ser Admin</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {[
                    { key: 'canViewBookings', label: '📅 Ver Citas de Clientes' },
                    { key: 'canManageBookings', label: '✏️ Gestionar / Cancelar Citas' },
                    { key: 'canViewAnalytics', label: '📊 Ver Gráficos & Facturación' },
                    { key: 'canViewCalendar', label: '🗓️ Ver Calendario de Horarios' },
                    { key: 'canManageServices', label: '✂️ Gestionar Servicios' },
                    { key: 'canManageTeam', label: '👥 Gestionar Equipo y Permisos' },
                    { key: 'canViewLogs', label: '📜 Ver Logs de Auditoría' },
                    { key: 'canViewEmails', label: '✉️ Ver Historial de Correos' }
                  ].map((perm) => (
                    <label
                      key={perm.key}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                        barberForm.permissions[perm.key as keyof WorkerPermissions]
                          ? 'bg-white border-[#0F232C]/40 text-[#0F232C] shadow-2xs'
                          : 'bg-white/60 border-stone-200 text-stone-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={barberForm.permissions[perm.key as keyof WorkerPermissions]}
                        onChange={(e) => {
                          setBarberForm({
                            ...barberForm,
                            permissions: {
                              ...barberForm.permissions,
                              [perm.key]: e.target.checked
                            }
                          });
                        }}
                        className="rounded text-[#0F232C]"
                      />
                      <span className="text-[11px] font-semibold">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewBarberModal(false)}
                  className="px-4 py-2 bg-stone-100 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-200 font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#39B54A] text-white font-bold rounded-lg hover:bg-[#32a242] transition-colors shadow-sm"
                >
                  Crear Trabajador con Permisos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BARBER */}
      {editingBarber && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto text-[#1A1A1A]">
            <h3 className="font-serif text-xl font-bold text-[#0F232C]">
              Editar Rol, Credenciales y Permisos ({editingBarber.name})
            </h3>
            <form onSubmit={handleUpdateBarber} className="space-y-4 text-xs font-sans">
              
              {/* Datos Personales */}
              <div className="space-y-3 bg-[#F8F9FA] p-4 rounded-xl border border-stone-200">
                <h4 className="text-[#0F232C] font-bold text-xs uppercase tracking-wider">1. Datos Personales</h4>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={editingBarber.name}
                    onChange={(e) => setEditingBarber({ ...editingBarber, name: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] outline-none focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Especialidad / Puesto</label>
                  <input
                    type="text"
                    value={editingBarber.title || ''}
                    onChange={(e) => setEditingBarber({ ...editingBarber, title: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] outline-none focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">URL Foto Perfil</label>
                  <input
                    type="text"
                    value={editingBarber.avatarUrl || ''}
                    onChange={(e) => setEditingBarber({ ...editingBarber, avatarUrl: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] outline-none focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editBarberAvailableCheck"
                    checked={editingBarber.available !== false}
                    onChange={(e) => setEditingBarber({ ...editingBarber, available: e.target.checked })}
                    className="rounded text-[#0F232C]"
                  />
                  <label htmlFor="editBarberAvailableCheck" className="text-stone-700 font-medium">
                    Trabajador activo / Disponible para citas
                  </label>
                </div>
              </div>

              {/* Credenciales de Acceso */}
              <div className="space-y-3 bg-[#F8F9FA] p-4 rounded-xl border border-stone-200">
                <h4 className="text-[#0F232C] font-bold text-xs uppercase tracking-wider">2. Credenciales de Acceso al Panel</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Usuario de Acceso *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: david"
                      value={editingBarber.username || ''}
                      onChange={(e) => setEditingBarber({ ...editingBarber, username: e.target.value.trim().toLowerCase() })}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] outline-none focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C]"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Contraseña de Acceso *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: david2026"
                      value={editingBarber.password || ''}
                      onChange={(e) => setEditingBarber({ ...editingBarber, password: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 text-[#1A1A1A] outline-none focus:border-[#0F232C] focus:ring-1 focus:ring-[#0F232C]"
                    />
                  </div>
                </div>
              </div>

              {/* Asignación de Rol */}
              <div className="space-y-3 bg-[#F8F9FA] p-4 rounded-xl border border-stone-200">
                <h4 className="text-[#0F232C] font-bold text-xs uppercase tracking-wider">3. Rol del Trabajador</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    editingBarber.role === 'admin'
                      ? 'bg-stone-50 border-[#0F232C] text-[#0F232C]'
                      : 'bg-white border-stone-200 text-stone-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="editBarberRole"
                        checked={editingBarber.role === 'admin'}
                        onChange={() => {
                          setEditingBarber({
                            ...editingBarber,
                            role: 'admin',
                            permissions: {
                              canViewBookings: true,
                              canManageBookings: true,
                              canViewAnalytics: true,
                              canViewCalendar: true,
                              canManageServices: true,
                              canManageTeam: true,
                              canViewLogs: true,
                              canViewEmails: true
                            }
                          });
                        }}
                        className="text-[#0F232C]"
                      />
                      <span className="font-bold text-xs">👑 Administrador</span>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-1">Acceso total e ilimitado</span>
                  </label>

                  <label className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    (editingBarber.role || 'staff') === 'staff'
                      ? 'bg-stone-50 border-[#0F232C] text-[#0F232C]'
                      : 'bg-white border-stone-200 text-stone-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="editBarberRole"
                        checked={(editingBarber.role || 'staff') === 'staff'}
                        onChange={() => {
                          setEditingBarber({
                            ...editingBarber,
                            role: 'staff',
                            permissions: editingBarber.permissions || { ...defaultWorkerPermissions }
                          });
                        }}
                        className="text-[#0F232C]"
                      />
                      <span className="font-bold text-xs">✂️ Empleado</span>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-1">Acceso restringido por permisos</span>
                  </label>
                </div>
              </div>

              {/* Permisos Granulares */}
              <div className="space-y-3 bg-[#F8F9FA] p-4 rounded-xl border border-stone-200">
                <div className="flex justify-between items-center">
                  <h4 className="text-[#0F232C] font-bold text-xs uppercase tracking-wider">4. Permisos Específicos del Panel</h4>
                  {editingBarber.role === 'admin' && (
                    <span className="text-[10px] text-emerald-700 font-semibold italic">Todos habilitados por ser Admin</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {[
                    { key: 'canViewBookings', label: '📅 Ver Citas de Clientes' },
                    { key: 'canManageBookings', label: '✏️ Gestionar / Cancelar Citas' },
                    { key: 'canViewAnalytics', label: '📊 Ver Gráficos & Facturación' },
                    { key: 'canViewCalendar', label: '🗓️ Ver Calendario de Horarios' },
                    { key: 'canManageServices', label: '✂️ Gestionar Servicios' },
                    { key: 'canManageTeam', label: '👥 Gestionar Equipo y Permisos' },
                    { key: 'canViewLogs', label: '📜 Ver Logs de Auditoría' },
                    { key: 'canViewEmails', label: '✉️ Ver Historial de Correos' }
                  ].map((perm) => {
                    const currentPerms = editingBarber.permissions || { ...defaultWorkerPermissions };
                    const isChecked = currentPerms[perm.key as keyof WorkerPermissions];
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                          isChecked
                            ? 'bg-white border-[#0F232C]/40 text-[#0F232C] shadow-2xs'
                            : 'bg-white/60 border-stone-200 text-stone-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setEditingBarber({
                              ...editingBarber,
                              permissions: {
                                ...currentPerms,
                                [perm.key]: e.target.checked
                              }
                            });
                          }}
                          className="rounded text-[#0F232C]"
                        />
                        <span className="text-[11px] font-semibold">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingBarber(null)}
                  className="px-4 py-2 bg-stone-100 border border-stone-300 text-stone-700 rounded-lg font-bold hover:bg-stone-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#39B54A] text-white font-bold rounded-lg hover:bg-[#32a242] transition-colors shadow-sm"
                >
                  Guardar Cambios de Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
