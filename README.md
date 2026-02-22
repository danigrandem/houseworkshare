# House Work Share

Sistema de gestión de tareas domésticas con puntos, grupos de tareas, y seguimiento semanal.

## Características

- ✅ Sistema de tareas con puntos asignados
- ✅ Grupos de tareas para facilitar la organización
- ✅ Rotación automática de grupos cada semana
- ✅ Sistema de puntos con penalizaciones y transferencias
- ✅ Intercambio de tareas entre participantes (temporal o permanente)
- ✅ Historial completo de semanas anteriores
- ✅ Dashboard con progreso semanal

## Tecnologías

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
Crea un archivo `.env.local` con:
```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

3. Configurar Supabase:
- Crea un proyecto en Supabase
- Ejecuta las migraciones SQL en `supabase/migrations/`:
  - `001_initial_schema.sql` - Crea todas las tablas
  - `002_rls_policies.sql` - Configura las políticas RLS

4. Ejecutar el proyecto:
```bash
npm run dev
```

## Estructura del Proyecto

```
app/
  (auth)/          # Páginas de autenticación
  (protected)/     # Páginas protegidas
    dashboard/     # Dashboard principal
    tasks/         # Gestión de tareas
    groups/        # Gestión de grupos
    history/       # Historial
    settings/      # Configuración
  api/             # API routes
lib/
  db/              # Consultas a la base de datos
  supabase/        # Clientes de Supabase
  utils/           # Utilidades (fechas, puntos, rotación)
components/        # Componentes React
supabase/
  migrations/      # Migraciones SQL
```

## Funcionalidades Principales

### Gestión de Tareas
- Crear, editar y eliminar tareas
- Asignar puntos a cada tarea
- Agrupar tareas en grupos

### Sistema Semanal
- Cada semana (lunes) se asignan grupos automáticamente
- Rotación circular de grupos entre participantes
- Objetivo de puntos por semana por persona

### Sistema de Puntos
- Si un usuario no cumple el objetivo, los puntos faltantes se suman a la siguiente semana
- Los puntos faltantes se restan del objetivo de los otros participantes

### Intercambio de Tareas
- Solicitar intercambio de tareas con otros participantes
- Intercambio temporal (solo un día) o permanente (resto de la semana)
- Notificaciones de solicitudes pendientes

## Uso

1. **Registro/Login**: Crea una cuenta o inicia sesión
2. **Configuración inicial**: 
   - Crea tareas con puntos
   - Crea grupos y asigna tareas
   - Configura puntos objetivo por semana
3. **Dashboard**: Ve tus tareas asignadas y marca como completadas
4. **Intercambios**: Solicita intercambios si no puedes hacer una tarea
5. **Historial**: Revisa semanas anteriores y puntuaciones

## Notas

- Los intercambios temporales expiran automáticamente al día siguiente
- La rotación de grupos se puede ejecutar manualmente llamando a `/api/weekly/rotate`
- El procesamiento de fin de semana se puede ejecutar manualmente llamando a `/api/weekly/process-end`
