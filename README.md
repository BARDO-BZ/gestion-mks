# SmartCheck — Gestión de EPPs Radiológicos

Sistema web para la gestión del estado de Elementos de Protección Personal (EPPs) radiológicos. Desarrollado para MKS Argentina, permite hacer seguimiento del ciclo de vida de cada EPP: desde su incorporación hasta su descarte, pasando por inspecciones periódicas, tareas de mantenimiento y alertas automáticas.

---

## Qué hace la aplicación

### Gestión de EPPs
Cada EPP tiene un código único, está asignado a una institución, sucursal y servicio, y atraviesa los siguientes estados:

| Estado | Descripción |
|--------|-------------|
| Aprobado | En uso normal |
| Uso bajo reserva | Con defecto detectado, uso condicionado |
| A descartar | Requiere retiro del servicio |
| Descartado | Fuera de uso |

El estado puede cambiar manualmente o de forma automática al registrar una inspección con defectos.

### Inspecciones
Registro de inspecciones periódicas (mensual, trimestral, semestral, anual). Si una inspección detecta un defecto, el EPP pasa automáticamente a "Uso bajo reserva" y se genera una tarea pendiente.

### Tareas
Tareas de seguimiento vinculadas a cada EPP. Se crean automáticamente al detectar defectos en inspecciones, o manualmente. Al cerrarse, quedan registradas en el historial.

### Reportes
Exportación de datos a Excel con filtros por estado, sucursal, próximos vencimientos e inspecciones pendientes. Incluye estadísticas generales.

### Usuarios e instituciones
Sistema de roles (admin / usuario). Los nuevos usuarios quedan pendientes de aprobación por un admin. Cada usuario pertenece a una institución.

### Notificaciones
- **In-app**: campana en el navbar que se actualiza cada 60 segundos. Solo visible para admins.
- **Por email**: emails automáticos disparados por eventos y por crons programados.

---

## Stack técnico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **UI**: HeroUI + Tailwind CSS + Framer Motion
- **Base de datos**: MySQL con `mysql2` (pool de 4 conexiones, singleton global en dev)
- **Autenticación**: JWT con cookies (`jose` + `jsonwebtoken`), contraseñas hasheadas con `bcrypt`
- **Emails**: Nodemailer (SMTP)
- **Storage**: Vercel Blob (imágenes privadas de inspecciones, con proxy autenticado)
- **Export**: `xlsx` para reportes en Excel

---

## Servicios externos

### Railway (deploy)
La aplicación está desplegada en Railway. El servidor corre como proceso Node.js persistente.

### Vercel Blob (storage)
Las fotos de inspección se suben a un store privado de Vercel Blob. El acceso se hace a través del endpoint `/api/blob-proxy` que valida la sesión antes de servir la imagen.

### cron-job.org (crons)
Los trabajos programados se configuran en cron-job.org como llamadas HTTP GET a los endpoints de la app, con el header `x-cron-secret` para autenticación.

| Job | Endpoint | Horario |
|-----|----------|---------|
| Notificación diaria | `GET /api/cron/daily` | Todos los días 12:00 UTC (9 AM ARG) |
| Resumen mensual | `GET /api/cron/monthly` | Día 1 de cada mes 12:00 UTC |

**Notificación diaria**: envía un email a todos los admins con los EPPs en estado "A descartar", "Uso bajo reserva", o con caducidad en los próximos 30 días. No se envía si no hay novedades.

**Resumen mensual**: envía un email con el total de EPPs por estado, los que requieren atención y la cantidad de tareas pendientes.

---

## Arquitectura del proyecto

```
src/
├── app/
│   ├── (protected)/        # Rutas autenticadas
│   │   ├── dashboard/
│   │   ├── epp/
│   │   ├── inspections/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── admin/
│   ├── api/
│   │   ├── cron/           # Endpoints para cron-job.org
│   │   ├── notifications/  # API de notificaciones in-app
│   │   ├── blob-proxy/     # Proxy para imágenes privadas
│   │   └── ...
│   └── reset-password/
├── features/               # Lógica por dominio
│   ├── epps/
│   ├── inspections/
│   ├── users/
│   ├── institutions/
│   ├── reports/
│   ├── dashboard/
│   └── email/
└── lib/
    ├── db.ts               # Pool MySQL
    ├── auth.ts             # getAuthUser()
    ├── authz/              # requireAuth, requireInstitutionAccess
    ├── email.ts            # sendEmail() con Nodemailer
    ├── notificationService.ts  # sendDailyNotification, sendMonthlySummary, notifyOverdueInspections
    ├── notifyAdmins.ts     # Escribe notificaciones in-app en la DB
    └── emailTemplates.ts   # Templates HTML de emails
```

---

## Variables de entorno

```env
# Base de datos
NEW_DB_HOST=
NEW_DB_PORT=
NEW_DB_USER=
NEW_DB_PASSWORD=
NEW_DB=

# Auth
JWT_SECRET=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
FROM_NAME=
FROM_EMAIL=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# Cron (debe coincidir con el header configurado en cron-job.org)
CRON_SECRET=

# URL pública (usada en los footers de emails)
NEXT_PUBLIC_BASE_URL=
```

---

## Desarrollo local

```bash
npm install
npm run dev
```

La app corre en [http://localhost:3000](http://localhost:3000).
