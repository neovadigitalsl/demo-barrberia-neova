# 🚀 Guía Paso a Paso: Reutilización de Plantilla para Nuevos Clientes

Este documento contiene el flujo de trabajo estandarizado para clonar, personalizar y desplegar este sistema de reservas, notificaciones push e emails automáticos para **cualquier otro negocio o cliente** (barberías, salones de belleza, clínicas, consultorías, etc.) de forma rápida y eficiente.

---

## 📋 Resumen del Proceso en Cadena

```
[1. Clonar/Duplicar] ➔ [2. Datos y Servicios] ➔ [3. Identidad Visual] ➔ [4. Correo Gmail/SMTP] ➔ [5. Prompt Chatbot IA] ➔ [6. Limpieza y Despliegue]
```

---

## 1. ⚙️ Paso 1: Configurar Datos del Negocio (`server.ts`)

Abre el archivo `server.ts` para adaptar la información base del nuevo cliente:

1. **Servicios y Precios (`DEFAULT_SERVICES`):**
   - Define el ID, nombre del servicio, descripción, precio y duración en minutos.
   ```typescript
   {
     id: "srv-1",
     name: "Corte Clásico / Servicio Principal",
     description: "Descripción detallada del servicio...",
     price: 20,
     duration: 30,
     category: "Pelo"
   }
   ```

2. **Equipo / Profesionales (`DEFAULT_BARBERS`):**
   - Define la lista de especialistas o empleados disponibles para recibir citas.
   ```typescript
   {
     id: "barber-1",
     name: "Nombre del Profesional",
     role: "Especialista / Máster",
     avatar: "https://...",
     specialties: ["Corte", "Barba"],
     rating: 4.9
   }
   ```

3. **Horarios de Citas (`SLOTS`):**
   - Modifica las horas en que el negocio acepta reservas (ej. `["09:00", "09:30", "10:00", ...]`).

---

## 2. 🎨 Paso 2: Personalización de la Identidad Visual

1. **Nombre e Información General:**
   - En `metadata.json`, actualiza el `name` y `description` con la marca del cliente.
2. **Componentes Clave:**
   - `src/components/Navbar.tsx`: Modifica el logotipo y textos de cabecera.
   - `src/components/HeroSection.tsx`: Ajusta los textos principales, eslogan y botones.
   - `src/components/FooterSection.tsx`: Actualiza teléfonos, dirección física, enlaces a redes sociales y mapa.
3. **Colores y Estilo (Tailwind CSS):**
   - Si el cliente utiliza otra paleta de colores, busca y reemplaza las clases principales de Tailwind en la carpeta `src/components/`:
     - Color principal/dorado: `#ffb779` ➔ `#NUEVO_COLOR`
     - Fondo oscuro: `#131313` y `#1c1b1b` ➔ `#NUEVO_FONDO`

---

## 3. ✉️ Paso 3: Configurar Envío Real de Correos (Gmail / SMTP)

Para que el nuevo cliente envíe correos reales desde su propio Gmail:

1. **Crear Contraseña de Aplicación en Google:**
   - Entra en la cuenta de Gmail del cliente ➔ **Cuenta de Google** ➔ **Seguridad** ➔ **Verificación en dos pasos** ➔ **Contraseñas de aplicación**.
   - Genera una clave de 16 caracteres.
2. **Configurar Variables en `.env`:**
   ```env
   GMAIL_USER=correo.del.cliente@gmail.com
   GMAIL_PASS=xxxx xxxx xxxx xxxx
   ```
3. **Personalizar Plantilla HTML (`server.ts`):**
   - En la función `sendConfirmationEmail` dentro de `server.ts`, actualiza el membrete HTML, el logotipo, el teléfono de contacto y la dirección del nuevo negocio.

---

## 4. 🤖 Paso 4: Ajustar el Asistente Virtual con IA (Gemini)

Si utilizas el Chatbot de atención al cliente (`src/components/AIChatWidget.tsx` / `server.ts`):

1. Abre el endpoint `/api/chat` en `server.ts`.
2. Actualiza el prompt de instrucciones con:
   - Nombre de la empresa.
   - Preguntas frecuentes sobre aparcamiento, métodos de pago o políticas de cancelación.
   - Tono de conversación (formal, cercano, exclusivo).

---

## 5. 🧹 Paso 5: Limpieza de Datos de Prueba

Antes de entregar la aplicación al cliente final:

1. Vacía o reinicia los archivos de persistencia local en `data/`:
   - `data/bookings.json` ➔ `[]`
   - `data/emails.json` ➔ `[]`
   - `data/logs.json` ➔ `[]`
2. Verifica que las notificaciones push sigan activas probando una cita de prueba en la interfaz web.

---

## 6. 🚀 Paso 6: Verificación y Despliegue

1. Comprueba el código compilando el proyecto:
   ```bash
   npm run build
   ```
2. Publica la aplicación en Cloud Run, Vercel, Netlify o servidor VPS.
3. Configura las variables de entorno (`GMAIL_USER`, `GMAIL_PASS`, `GEMINI_API_KEY`) en el panel de control del servidor de producción.

---

### ✅ Checklist Final de Entrega al Cliente
- [ ] Datos de servicios y precios actualizados.
- [ ] Lista de personal/barberos correcta.
- [ ] Dirección, teléfono y mapa de la ubicación actualizados.
- [ ] Contraseña de aplicación de Gmail configurada y comprobada.
- [ ] Pruebas de notificaciones push de navegador funcionando.
- [ ] Registros de prueba limpios.
