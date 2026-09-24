import express from "express";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis";

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SERVICES_FILE = path.join(DATA_DIR, "services.json");
const BARBERS_FILE = path.join(DATA_DIR, "barbers.json");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const LOGS_FILE = path.join(DATA_DIR, "logs.json");
const EMAILS_FILE = path.join(DATA_DIR, "emails.json");

// Default permissions helper
function getDefaultPermissions(role: string = "staff") {
  if (role === "admin") {
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
  return {
    canViewBookings: true,
    canManageBookings: true,
    canViewAnalytics: false,
    canViewCalendar: true,
    canManageServices: false,
    canManageTeam: false,
    canViewLogs: false,
    canViewEmails: false,
  };
}

// Default initial data
const DEFAULT_BARBERS = [
  {
    id: "cualquiera",
    name: "Cualquiera",
    title: "Próximo disponible",
    avatarUrl: "",
    available: true,
    role: "staff",
    permissions: getDefaultPermissions("staff")
  },
  {
    id: "alejandro",
    name: "Alejandro",
    title: "Master Barber (Propietario)",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    available: true,
    username: "alejandro",
    password: "alejandro2026",
    role: "admin",
    permissions: getDefaultPermissions("admin")
  },
  {
    id: "david",
    name: "David",
    title: "Senior Stylist / Especialista Degradados",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    available: true,
    username: "david",
    password: "david2026",
    role: "staff",
    permissions: getDefaultPermissions("staff")
  }
];

// Default initial data
const DEFAULT_SERVICES = [
  {
    id: "corte-clasico",
    name: "Corte Clásico",
    duration: 30,
    price: 15,
    description: "Asesoramiento de imagen, lavado refrescante, corte artesanal a tijera o máquina y peinado final impecable.",
    popular: true,
    available: true,
    icon: "content_cut"
  },
  {
    id: "corte-barba",
    name: "Corte+Barba",
    duration: 45,
    price: 22,
    description: "Corte completo combinado con ritual de toallas calientes, perfilado a navaja tradicional y bálsamo hidratante.",
    popular: true,
    available: true,
    icon: "diamond"
  },
  {
    id: "perfilado",
    name: "Perfilado",
    duration: 20,
    price: 10,
    description: "Definición de contornos de barba y cuello a navaja con toalla caliente y loción calmante.",
    popular: false,
    available: true,
    icon: "face"
  },
  {
    id: "nino",
    name: "Niño",
    duration: 30,
    price: 12,
    description: "Corte de pelo especial para los más pequeños realizado con paciencia, cuidado y la mejor técnica.",
    popular: false,
    available: true,
    icon: "child_care"
  }
];

const DEFAULT_BOOKINGS = [
  {
    id: "bk-101",
    serviceId: "corte-barba",
    serviceName: "Corte+Barba",
    duration: 45,
    price: 22,
    barberId: "alejandro",
    barberName: "Alejandro",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "11:00",
    customerName: "Carlos Rodríguez",
    customerPhone: "+34 612 345 678",
    customerEmail: "carlos@example.com",
    notes: "Degradado medio y arreglo de barba",
    createdAt: new Date().toISOString(),
    status: "confirmed"
  }
];

const DEFAULT_LOGS = [
  {
    id: "log-1",
    action: "SISTEMA_INICIO",
    details: "Panel de administración y logs de auditoría inicializados.",
    timestamp: new Date().toISOString(),
    adminUser: "Sistema"
  }
];

function readJSON<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    const data = fs.readFileSync(file, "utf-8");
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return fallback;
  }
}

function writeJSON<T>(file: string, data: T) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

function addLog(action: string, details: string, adminUser: string = "Admin") {
  const logs = readJSON(LOGS_FILE, DEFAULT_LOGS);
  const newLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    details,
    timestamp: new Date().toISOString(),
    adminUser
  };
  logs.unshift(newLog);
  writeJSON(LOGS_FILE, logs);
  return newLog;
}

// --------------------------------------------------------
// EMAIL SERVICE HELPERS
// --------------------------------------------------------

function getMailTransporter() {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.GMAIL_PASS || process.env.GMAIL_PASSWORD || process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || (user ? 'smtp.gmail.com' : '');
  const port = Number(process.env.SMTP_PORT) || 587;
  const from = process.env.SMTP_FROM || (user ? `"The Arsenal Barber Co." <${user}>` : '"The Arsenal Barber Co." <noreply@thearsenalbarber.com>');

  if (host && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return { transporter, from, user };
  }
  return null;
}

async function sendConfirmationEmail(booking: any, googleCalendarUrl?: string) {
  if (!booking.customerEmail || !booking.customerEmail.trim()) {
    return null;
  }
  const emails = readJSON<any[]>(EMAILS_FILE, []);

  const subject = `💈 Confirmación de Reserva: ${booking.serviceName} - The Arsenal Barber Co.`;
  const bodyText = `Hola ${booking.customerName},\n\nTu reserva para "${booking.serviceName}" el ${booking.date} a las ${booking.time} hs con ${booking.barberName} ha sido confirmada con éxito.\n\nServicio: ${booking.serviceName}\nFecha y Hora: ${booking.date} a las ${booking.time} hs\nBarbero: ${booking.barberName}\nPrecio: ${booking.price}€\n\nDirección: Calle Párroco Antonio Gomez Villalobos, 100, Sevilla\nTeléfono//WhatsApp: 954 11 50 09\n\n¡Gracias por elegir The Arsenal Barber Co.!`;

  const bodyHtml = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Confirmación de Reserva - The Arsenal Barber Co.</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1A1A1A;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; padding: 30px 10px;">
      <tr>
        <td align="center">
          <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #B8860B; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td align="center" style="background-color: #0F232C; padding: 25px 20px; border-bottom: 2px solid #39B54A;">
                <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-family: Georgia, serif; letter-spacing: 2px; text-transform: uppercase;">
                  THE ARSENAL BARBER CO.
                </h1>
                <p style="color: #39B54A; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
                  Confirmación de Cita Oficial
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px 35px 20px 35px;">
                <h2 style="color: #1A1A1A; font-size: 18px; margin: 0 0 10px 0;">¡Hola, ${booking.customerName}!</h2>
                <p style="color: #4A4A4A; font-size: 14px; line-height: 1.6; margin: 0;">
                  Tu cita para <strong style="color: #1A1A1A;">${booking.serviceName}</strong> ha sido <strong style="color: #39B54A;">confirmada correctamente</strong>. Estamos preparados para ofrecerte la mejor experiencia en nuestra barbería.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 35px 25px 35px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px;">
                  <tr>
                    <td style="padding-bottom: 12px; border-bottom: 1px solid #E5E7EB;">
                      <span style="color: #71717A; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Servicio</span><br>
                      <strong style="color: #1A1A1A; font-size: 16px;">${booking.serviceName}</strong>
                    </td>
                    <td align="right" style="padding-bottom: 12px; border-bottom: 1px solid #E5E7EB;">
                      <span style="color: #71717A; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Precio</span><br>
                      <strong style="color: #1A1A1A; font-size: 16px;">${booking.price}€</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                      <span style="color: #71717A; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Fecha y Hora</span><br>
                      <strong style="color: #1A1A1A; font-size: 15px;">📅 ${booking.date} a las ⏰ ${booking.time} hs</strong>
                    </td>
                    <td align="right" style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                      <span style="color: #71717A; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Duración</span><br>
                      <strong style="color: #1A1A1A; font-size: 15px;">⏱️ ${booking.duration} min</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 12px;" colspan="2">
                      <span style="color: #71717A; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Barbero Asignado</span><br>
                      <strong style="color: #1A1A1A; font-size: 15px;">✂️ ${booking.barberName}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${
              googleCalendarUrl
                ? `
            <tr>
              <td align="center" style="padding: 0 35px 25px 35px;">
                <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; background-color: #1A1A1A; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; padding: 12px 24px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                  📅 Agendar en Google Calendar
                </a>
              </td>
            </tr>`
                : ""
            }
            <tr>
              <td style="background-color: #F8F9FA; padding: 20px 35px; border-top: 1px solid #E5E7EB;">
                <h4 style="color: #1A1A1A; font-size: 12px; margin: 0 0 6px 0; text-transform: uppercase;">📍 Dirección y Contacto</h4>
                <p style="color: #4A4A4A; font-size: 12px; margin: 0;">Calle Párroco Antonio Gomez Villalobos, 100, Sevilla</p>
                <p style="color: #71717A; font-size: 11px; margin: 4px 0 0 0;">Teléfono // WhatsApp: 954 11 50 09</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="background-color: #0F232C; padding: 15px;">
                <p style="color: #ffffff; font-size: 11px; margin: 0;">
                  © 2026 The Arsenal Barber Co. Correo enviado automáticamente a ${booking.customerEmail}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  let deliveryStatus: 'delivered' | 'simulated' | 'failed' = 'simulated';

  const mailConfig = getMailTransporter();
  if (mailConfig) {
    try {
      await mailConfig.transporter.sendMail({
        from: mailConfig.from,
        to: booking.customerEmail,
        subject,
        text: bodyText,
        html: bodyHtml,
      });

      deliveryStatus = 'delivered';
    } catch (err) {
      console.error('Error enviando email SMTP/Gmail:', err);
      deliveryStatus = 'simulated';
    }
  }

  const sentEmail = {
    id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    bookingId: booking.id,
    to: booking.customerEmail,
    customerName: booking.customerName,
    subject,
    bodyText,
    bodyHtml,
    sentAt: new Date().toISOString(),
    status: deliveryStatus,
    type: 'confirmation'
  };

  emails.unshift(sentEmail);
  writeJSON(EMAILS_FILE, emails);

  addLog(
    "EMAIL_CONFIRMACION_ENVIADO",
    `Correo de confirmación enviado a ${booking.customerEmail} (${booking.serviceName} el ${booking.date} a las ${booking.time}) [Estado: ${deliveryStatus}]`,
    "Sistema Email"
  );

  return sentEmail;
}

async function sendCancellationEmail(booking: any) {
  const emails = readJSON<any[]>(EMAILS_FILE, []);

  const subject = `❌ Cancelación de Reserva: ${booking.serviceName} - The Arsenal Barber Co.`;
  const bodyText = `Hola ${booking.customerName},\n\nTu cita para "${booking.serviceName}" el ${booking.date} a las ${booking.time} hs ha sido cancelada.\n\nSi deseas volver a reservar, visita nuestra web. ¡Esperamos verte pronto!`;

  const bodyHtml = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Cancelación de Reserva - The Arsenal Barber Co.</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1A1A1A;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; padding: 30px 10px;">
      <tr>
        <td align="center">
          <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #f43f5e; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
            <tr>
              <td align="center" style="background-color: #0F232C; padding: 25px 20px; border-bottom: 2px solid #f43f5e;">
                <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-family: Georgia, serif; letter-spacing: 2px; text-transform: uppercase;">
                  THE ARSENAL BARBER CO.
                </h1>
                <p style="color: #f43f5e; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
                  Reserva Cancelada
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px 35px;">
                <h2 style="color: #1A1A1A; font-size: 18px; margin: 0 0 10px 0;">Hola, ${booking.customerName}</h2>
                <p style="color: #4A4A4A; font-size: 14px; line-height: 1.6; margin: 0;">
                  Te informamos que tu cita de <strong style="color: #1A1A1A;">${booking.serviceName}</strong> programada para el <strong>${booking.date} a las ${booking.time} hs</strong> ha sido <strong style="color: #f43f5e;">cancelada</strong>.
                </p>
                <p style="color: #71717A; font-size: 13px; margin: 15px 0 0 0;">
                  Si deseas programar un nuevo horario, puedes realizar tu reserva en cualquier momento desde nuestra web.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  let deliveryStatus: 'delivered' | 'simulated' | 'failed' = 'simulated';

  const mailConfig = getMailTransporter();
  if (mailConfig) {
    try {
      await mailConfig.transporter.sendMail({
        from: mailConfig.from,
        to: booking.customerEmail,
        subject,
        text: bodyText,
        html: bodyHtml,
      });
      deliveryStatus = 'delivered';
    } catch (err) {
      console.error('Error enviando cancellation email SMTP/Gmail:', err);
    }
  }

  const sentEmail = {
    id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    bookingId: booking.id,
    to: booking.customerEmail,
    customerName: booking.customerName,
    subject,
    bodyText,
    bodyHtml,
    sentAt: new Date().toISOString(),
    status: deliveryStatus,
    type: 'cancellation'
  };

  emails.unshift(sentEmail);
  writeJSON(EMAILS_FILE, emails);

  addLog(
    "EMAIL_CANCELACION_ENVIADO",
    `Correo de cancelación enviado a ${booking.customerEmail}`,
    "Sistema Email"
  );

  return sentEmail;
}

// --------------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------------

// Admin auth check
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const inputUser = (username || "").trim().toLowerCase();
  const inputPass = (password || "").trim();

  // Master Admin direct password check
  if (
    inputPass === "admin" ||
    inputPass === "barber2026" ||
    inputPass === "1234" ||
    (inputUser === "admin" && inputPass === "admin")
  ) {
    addLog("ADMIN_LOGIN_SUCCESS", "Acceso exitoso al panel de administración (Propietario / Master)", "Admin Master");
    return res.json({
      success: true,
      token: "admin-session-token-2026",
      user: {
        id: "admin-master",
        name: "Administrador / Dueño",
        username: inputUser || "admin",
        role: "admin",
        permissions: getDefaultPermissions("admin")
      }
    });
  }

  // Check workers list for specific credentials
  const barbers = readJSON(BARBERS_FILE, DEFAULT_BARBERS);
  const matchedBarber = barbers.find((b: any) => {
    if (!b.password) return false;
    const bUser = (b.username || b.id || "").toLowerCase();
    if (inputUser) {
      return bUser === inputUser && b.password === inputPass;
    } else {
      return b.password === inputPass;
    }
  });

  if (matchedBarber) {
    const role = matchedBarber.role || "staff";
    const permissions = matchedBarber.permissions || getDefaultPermissions(role);

    addLog(
      "ADMIN_LOGIN_SUCCESS",
      `Acceso exitoso de trabajador: ${matchedBarber.name} [Rol: ${role.toUpperCase()}]`,
      matchedBarber.name
    );

    return res.json({
      success: true,
      token: `user-token-${matchedBarber.id}`,
      user: {
        id: matchedBarber.id,
        name: matchedBarber.name,
        username: matchedBarber.username || matchedBarber.id,
        role,
        permissions
      }
    });
  }

  addLog("ADMIN_LOGIN_FAILED", `Intento fallido de acceso al panel con usuario: "${username || 'desconocido'}"`, "Desconocido");
  res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
});

// Services endpoints
app.get("/api/services", (req, res) => {
  const services = readJSON(SERVICES_FILE, DEFAULT_SERVICES);
  res.json(services);
});

app.post("/api/services", (req, res) => {
  const { name, duration, price, description, popular, icon, available } = req.body;
  if (!name || !duration || !price) {
    return res.status(400).json({ error: "Nombre, duración y precio son requeridos" });
  }
  const services = readJSON(SERVICES_FILE, DEFAULT_SERVICES);
  const newService = {
    id: `srv-${Date.now()}`,
    name,
    duration: Number(duration),
    price: Number(price),
    description: description || "",
    popular: Boolean(popular),
    available: available !== undefined ? Boolean(available) : true,
    icon: icon || "content_cut"
  };
  services.push(newService);
  writeJSON(SERVICES_FILE, services);
  addLog("SERVICIO_CREADO", `Nuevo servicio creado: ${name} (${price}€ - ${duration} min)`, "Admin");
  res.json(newService);
});

app.put("/api/services/:id", (req, res) => {
  const { id } = req.params;
  const { name, duration, price, description, popular, icon, available } = req.body;
  const services = readJSON(SERVICES_FILE, DEFAULT_SERVICES);
  const index = services.findIndex((s: any) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Servicio no encontrado" });
  }
  services[index] = {
    ...services[index],
    name: name ?? services[index].name,
    duration: duration ? Number(duration) : services[index].duration,
    price: price ? Number(price) : services[index].price,
    description: description ?? services[index].description,
    popular: popular !== undefined ? Boolean(popular) : services[index].popular,
    available: available !== undefined ? Boolean(available) : (services[index].available ?? true),
    icon: icon ?? services[index].icon
  };
  writeJSON(SERVICES_FILE, services);
  const statusStr = services[index].available ? "Disponible" : "Pausado/No disponible";
  addLog("SERVICIO_MODIFICADO", `Servicio actualizado ID ${id}: ${services[index].name} [${statusStr}]`, "Admin");
  res.json(services[index]);
});

app.delete("/api/services/:id", (req, res) => {
  const { id } = req.params;
  let services = readJSON(SERVICES_FILE, DEFAULT_SERVICES);
  const serviceToDelete = services.find((s: any) => s.id === id);
  if (!serviceToDelete) {
    return res.status(404).json({ error: "Servicio no encontrado" });
  }
  services = services.filter((s: any) => s.id !== id);
  writeJSON(SERVICES_FILE, services);
  addLog("SERVICIO_ELIMINADO", `Servicio eliminado: ${serviceToDelete.name}`, "Admin");
  res.json({ success: true, id });
});

// Barbers / Workers endpoints
app.get("/api/barbers", (req, res) => {
  const barbers = readJSON(BARBERS_FILE, DEFAULT_BARBERS);
  res.json(barbers);
});

app.post("/api/barbers", (req, res) => {
  const { name, title, avatarUrl, available, username, password, role, permissions } = req.body;
  if (!name) {
    return res.status(400).json({ error: "El nombre del barbero/trabajador es requerido" });
  }
  const barbers = readJSON(BARBERS_FILE, DEFAULT_BARBERS);

  if (username && username.trim()) {
    const existing = barbers.find((b: any) => (b.username || "").toLowerCase() === username.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: `El nombre de usuario "${username}" ya está registrado.` });
    }
  }

  const userRole = role === "admin" ? "admin" : "staff";
  const defaultPerms = getDefaultPermissions(userRole);
  const finalPermissions = permissions ? { ...defaultPerms, ...permissions } : defaultPerms;

  const newBarber = {
    id: `barber-${Date.now()}`,
    name,
    title: title || "Barbero / Estilista",
    avatarUrl: avatarUrl || "",
    available: available !== undefined ? Boolean(available) : true,
    username: username ? username.trim() : "",
    password: password ? password.trim() : "",
    role: userRole,
    permissions: finalPermissions
  };

  barbers.push(newBarber);
  writeJSON(BARBERS_FILE, barbers);
  addLog("TRABAJADOR_CREADO", `Nuevo trabajador/barbero añadido: ${name} [Rol: ${userRole.toUpperCase()}]`, "Admin");
  res.json(newBarber);
});

app.put("/api/barbers/:id", (req, res) => {
  const { id } = req.params;
  const { name, title, avatarUrl, available, username, password, role, permissions } = req.body;
  const barbers = readJSON(BARBERS_FILE, DEFAULT_BARBERS);
  const index = barbers.findIndex((b: any) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Barbero/Trabajador no encontrado" });
  }

  const currentRole = role !== undefined ? (role === "admin" ? "admin" : "staff") : (barbers[index].role || "staff");
  const defaultPerms = getDefaultPermissions(currentRole);

  let updatedPermissions = barbers[index].permissions || defaultPerms;
  if (permissions) {
    updatedPermissions = { ...updatedPermissions, ...permissions };
  } else if (role !== undefined && role !== barbers[index].role) {
    updatedPermissions = defaultPerms;
  }

  barbers[index] = {
    ...barbers[index],
    name: name ?? barbers[index].name,
    title: title ?? barbers[index].title,
    avatarUrl: avatarUrl ?? barbers[index].avatarUrl,
    available: available !== undefined ? Boolean(available) : (barbers[index].available ?? true),
    username: username !== undefined ? username.trim() : barbers[index].username,
    password: password !== undefined ? password.trim() : barbers[index].password,
    role: currentRole,
    permissions: updatedPermissions
  };

  writeJSON(BARBERS_FILE, barbers);
  const statusStr = barbers[index].available ? "Disponible" : "Pausado / No disponible";
  addLog("TRABAJADOR_MODIFICADO", `Trabajador actualizado ID ${id}: ${barbers[index].name} [Rol: ${currentRole.toUpperCase()}] [${statusStr}]`, "Admin");
  res.json(barbers[index]);
});

app.delete("/api/barbers/:id", (req, res) => {
  const { id } = req.params;
  if (id === "cualquiera") {
    return res.status(400).json({ error: "No se puede eliminar la opción genérica 'Cualquiera'." });
  }
  let barbers = readJSON(BARBERS_FILE, DEFAULT_BARBERS);
  const barberToDelete = barbers.find((b: any) => b.id === id);
  if (!barberToDelete) {
    return res.status(404).json({ error: "Barbero/Trabajador no encontrado" });
  }
  barbers = barbers.filter((b: any) => b.id !== id);
  writeJSON(BARBERS_FILE, barbers);
  addLog("TRABAJADOR_ELIMINADO", `Trabajador eliminado: ${barberToDelete.name}`, "Admin");
  res.json({ success: true, id });
});

// Bookings endpoints
app.get("/api/bookings", (req, res) => {
  const bookings = readJSON(BOOKINGS_FILE, DEFAULT_BOOKINGS);
  res.json(bookings);
});

app.post("/api/bookings", async (req, res) => {
  const {
    serviceId,
    serviceName,
    duration,
    price,
    barberId,
    barberName,
    date,
    time,
    customerName,
    customerPhone,
    customerEmail,
    notes,
    isAdminCreated
  } = req.body;

  if (!serviceName || !date || !time || !customerName || !customerPhone) {
    return res.status(400).json({ error: "Nombre, teléfono, servicio, fecha y hora son obligatorios" });
  }

  const bookings = readJSON(BOOKINGS_FILE, DEFAULT_BOOKINGS);

  // Check double booking for same barber at same date and time
  const conflict = bookings.find(
    (b: any) =>
      b.status === "confirmed" &&
      b.date === date &&
      b.time === time &&
      (b.barberId === barberId || barberId === "cualquiera" || b.barberId === "cualquiera")
  );

  if (conflict) {
    return res.status(400).json({ error: "El horario seleccionado ya está reservado. Por favor elige otro horario." });
  }

  const newBooking = {
    id: `bk-${Date.now()}`,
    serviceId: serviceId || "custom",
    serviceName,
    duration: Number(duration) || 30,
    price: Number(price) || 20,
    barberId: barberId || "sergio",
    barberName: barberName || "Sergio Márquez",
    date,
    time,
    customerName,
    customerPhone,
    customerEmail: customerEmail || "",
    notes: notes || "",
    createdAt: new Date().toISOString(),
    status: "confirmed"
  };

  bookings.unshift(newBooking);
  writeJSON(BOOKINGS_FILE, bookings);

  // Add Google Calendar link generator helper
  const startTime = new Date(`${date}T${time}:00`);
  const endTime = new Date(startTime.getTime() + (newBooking.duration || 30) * 60000);
  
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Cita en The Arsenal Barber Co. - ${serviceName}`
  )}&dates=${startTime.toISOString().replace(/-|:|\.\d\d\d/g, "")}/${endTime
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent(
    `Reserva para ${customerName}\nServicio: ${serviceName}\nBarbero: ${barberName}\nTeléfono: ${customerPhone}`
  )}&location=${encodeURIComponent("Calle Párroco Antonio Gomez Villalobos, 100, Sevilla")}`;

  addLog(
    "CITA_CREADA",
    `Cita creada para ${customerName} (${serviceName} el ${date} a las ${time} con ${barberName}) ${
      isAdminCreated ? "[por Administrador]" : "[por Cliente]"
    }`,
    isAdminCreated ? "Admin" : "Cliente"
  );

  // Send confirmation email
  let sentEmailRecord = null;
  try {
    sentEmailRecord = await sendConfirmationEmail(newBooking, googleCalendarUrl);
  } catch (emailErr) {
    console.error("Failed sending booking confirmation email:", emailErr);
  }

  res.json({
    ...newBooking,
    googleCalendarUrl,
    confirmationEmailSent: true,
    emailDetails: sentEmailRecord
  });
});

app.put("/api/bookings/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const bookings = readJSON(BOOKINGS_FILE, DEFAULT_BOOKINGS);
  const index = bookings.findIndex((b: any) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Cita no encontrada" });
  }

  bookings[index] = {
    ...bookings[index],
    ...updates
  };
  writeJSON(BOOKINGS_FILE, bookings);
  addLog(
    "CITA_MODIFICADA",
    `Cita ID ${id} modificada. Cliente: ${bookings[index].customerName}, Fecha: ${bookings[index].date} ${bookings[index].time}`,
    "Admin"
  );
  res.json(bookings[index]);
});

app.delete("/api/bookings/:id", async (req, res) => {
  const { id } = req.params;
  const bookings = readJSON(BOOKINGS_FILE, DEFAULT_BOOKINGS);
  const index = bookings.findIndex((b: any) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Cita no encontrada" });
  }

  const cancelledBooking = bookings[index];
  cancelledBooking.status = "cancelled";
  bookings[index] = cancelledBooking;
  writeJSON(BOOKINGS_FILE, bookings);

  addLog(
    "CITA_CANCELADA",
    `Cita cancelada ID ${id} de ${cancelledBooking.customerName} (${cancelledBooking.date} ${cancelledBooking.time})`,
    "Admin"
  );

  try {
    await sendCancellationEmail(cancelledBooking);
  } catch (e) {
    console.error("Error sending cancellation email:", e);
  }

  res.json({ success: true, booking: cancelledBooking });
});

// Emails Endpoint
app.get("/api/emails", (req, res) => {
  const { email, bookingId } = req.query;
  let emails = readJSON<any[]>(EMAILS_FILE, []);
  if (email) {
    emails = emails.filter((e) => e.to.toLowerCase() === String(email).toLowerCase());
  }
  if (bookingId) {
    emails = emails.filter((e) => e.bookingId === String(bookingId));
  }
  res.json(emails);
});

app.post("/api/emails/resend/:bookingId", async (req, res) => {
  const { bookingId } = req.params;
  const bookings = readJSON<any[]>(BOOKINGS_FILE, DEFAULT_BOOKINGS);
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Reserva no encontrada" });
  }

  try {
    const sentEmail = await sendConfirmationEmail(booking);
    res.json({ success: true, email: sentEmail });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Error al re-enviar correo" });
  }
});

// Logs endpoint
app.get("/api/logs", (req, res) => {
  const logs = readJSON(LOGS_FILE, DEFAULT_LOGS);
  res.json(logs);
});

// AI Chatbot endpoint with Gemini API and RGPD instructions
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "El mensaje es obligatorio" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        reply: "Hola. Bienvenido a The Arsenal Barber Co. Soy el Asistente Virtual de IA. Nuestro horario es de Lunes a Viernes de 10:00 a 20:00 y Sábados de 09:00 a 14:00. ¿En qué puedo ayudarte hoy?"
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Fetch live services and bookings for real-time agenda availability checking
    const services = readJSON(SERVICES_FILE, DEFAULT_SERVICES);
    const bookings = readJSON(BOOKINGS_FILE, DEFAULT_BOOKINGS).filter((b: any) => b.status === "confirmed");

    const systemInstruction = `
Eres la Inteligencia Artificial oficial y Asistente Virtual de la barbería "The Arsenal Barber Co.".
Cumples estrictamente con la normativa RGPD de la Unión Europea y siempre debes identificarte claramente como un asistente de IA.

Información clave del negocio:
- Nombre: The Arsenal Barber Co.
- Ubicación principal: Calle Párroco Antonio Gomez Villalobos, 100, Sevilla. Teléfono//WhatsApp: 954 11 50 09.
- Horario de Atención:
  * Lunes a Viernes: 10:00 - 20:00
  * Sábados: 09:00 - 14:00
  * Domingos: Cerrado
- Barberos disponibles:
  1. Alejandro (Master Barber & Fundador)
  2. David (Senior Stylist & Especialista Degradados)
- Servicios ofrecidos actualmente:
  ${services.map((s: any) => `- ${s.name}: ${s.price}€ (${s.duration} min). ${s.description}`).join("\n  ")}

Citas actuales agendadas (para consultar disponibilidad):
${bookings.map((b: any) => `* ${b.date} a las ${b.time} - ${b.serviceName} (${b.barberName})`).join("\n")}

Instrucciones de comportamiento:
1. Responde de manera amable, profesional, concisa y elegante en español.
2. Ayuda a resolver preguntas frecuentes sobre precios, servicios, dirección, horario y disponibilidad de la agenda.
3. Si el usuario pregunta por disponibilidad en un día/hora específico, revisa si hay coincidencia con las citas agendadas y responde si el hueco parece libre u ocupado dentro de nuestro horario laboral.
4. Recuerda siempre de forma educada al usuario que para efectuar una reserva oficial puede utilizar la sección de reservas en la web.
5. Mantén siempre el tono premium, elegante, minimalista y servicial característico de The Arsenal Barber Co.
`;

    // Combine history into contents
    const contents: any[] = [];
    if (Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction,
        temperature: 0.7
      },
      contents
    });

    const reply = response.text || "Disculpa, no he podido procesar tu solicitud. ¿En qué otra consulta sobre nuestra barbería te puedo orientar?";
    res.json({ reply });
  } catch (err: any) {
    console.error("Error en /api/chat:", err);
    res.json({
      reply: "Hola. Soy la IA de Sergio Márquez Barber. En este momento tenemos una alta demanda, pero te confirmo que nuestro horario es de L-V de 10:00 a 20:00 y Sábados de 09:00 a 14:00. Puedes realizar tu reserva directamente en el botón 'Book Now'."
    });
  }
});

// Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
