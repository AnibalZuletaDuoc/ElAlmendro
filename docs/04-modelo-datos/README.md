# Modelo de Datos

Base de datos **relacional**: PostgreSQL 16. El dominio de TimeFlow es
intensamente relacional y exige agregación temporal exacta para los reportes de
horas, de modo que se descartó un modelo documental.

## Documento

**`Modelo de Base de Datos TimeFlow.docx`** (DOC-BD-01) — documento completo del
modelo. Contiene:

| Sección | Contenido |
|---|---|
| 2 | Decisiones de diseño y su fundamento |
| 3 | Modelo entidad-relación y cardinalidades |
| 4 | Diccionario de datos de las 13 tablas |
| 5 | Enumeraciones |
| 6 | Máquinas de estado de Actividad y Sesión |
| 7 | Reglas de integridad y su verificación contra el motor |
| 8 | Índices y estrategia de consulta |
| 9 | Consultas SQL representativas |
| 10 | Normalización (3FN) |
| 11 | Tratamiento de la zona horaria |
| 12 | Volumetría estimada |
| 13 | Seguridad, respaldo y retención |
| 15 | Trazabilidad con el Product Backlog |

## Implementación

El modelo está implementado y verificado. Ante cualquier discrepancia entre el
documento y el repositorio, prevalece el repositorio.

| Ruta | Contenido |
|---|---|
| `src/backend/prisma/schema.prisma` | Entidades, tipos y relaciones |
| `src/backend/prisma/migrations/` | Migraciones versionadas en SQL |
| `src/backend/prisma/sql/reglas-integridad.sql` | Índices parciales, exclusión y disparadores |
| `src/backend/prisma/seed.ts` | Datos iniciales de desarrollo |
| `docker/db/init/01-extensions.sql` | Extensiones `btree_gist` y `pgcrypto` |

## Resumen de las entidades

| Tabla | Propósito |
|---|---|
| `usuarios` | Personas que acceden al sistema |
| `tokens_refresco` | Rotación de sesiones con detección de reutilización |
| `proyectos` | Contenedor del trabajo de un cliente o área |
| `miembros_proyecto` | Asociación N:M entre usuarios y proyectos |
| `sprints` | Ciclos de entrega con fecha de corte |
| `actividades` | Unidad de trabajo asignable y nodo del mapa visual |
| `subtareas` | Puntos de control dentro de una actividad |
| `derivaciones` | Registro histórico de traspasos con motivo (US-06) |
| `jornadas` | Presencia laboral del trabajador en un día (US-02) |
| `sesiones_trabajo` | Tramo cronometrado de dedicación a una actividad |
| `tramos_sesion` | Subdivisión de una sesión por pausas |
| `evidencias` | Metadatos de los archivos de respaldo |
| `comentarios` | Hilo de conversación sobre una actividad |
| `registros_auditoria` | Bitácora inmutable de solo escritura (US-08) |

## Decisión central del modelo

El cronómetro pertenece a la **sesión de trabajo**, no a la actividad. Una
actividad acumula tantas sesiones como sea necesario y su tiempo total es la
suma de ellas; una sesión se subdivide en tramos por las pausas y su duración
es la suma de los tramos.

No existe ningún campo que almacene horas o minutos totales: todo tiempo es un
valor derivado. Es imposible que un total almacenado difiera del detalle,
porque no hay total almacenado.
