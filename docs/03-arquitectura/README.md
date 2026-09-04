# Arquitectura

TimeFlow se organiza en **cinco capas** desplegadas como contenedores
independientes. Cada capa solo conoce a la que tiene inmediatamente debajo.

```
                    Navegador del trabajador
                              |
                              v
      +-----------------------------------------------+
  1   |  Caddy 2  -  proxy inverso / cortafuegos       |
      |  TLS, enrutamiento, cabeceras de seguridad     |
      +-----------------------------------------------+
             |                              |
             v                              v
      +---------------+            +------------------+
  2   |  Next.js 15   |     3      |    NestJS 11     |
      |  presentacion |----------->|  logica y API    |
      +---------------+            +------------------+
                                     |            |
                                     v            v
                         +----------------+  +-------------+
                     4   | PostgreSQL 16  |  |  MinIO (S3) |  5
                         | datos          |  |  archivos   |
                         +----------------+  +-------------+
```

Las capas 4 y 5 estan separadas a proposito: las evidencias son archivos
binarios que no deben vivir en la base de datos. En PostgreSQL se guardan sus
metadatos; el contenido va al almacen de objetos.

## Documentos

| Documento | Contenido |
|---|---|
| `Arquitectura del Sistema TimeFlow.docx` | Modelo C4, capas, componentes y decisiones |
| `Patrones de Diseño TimeFlow.docx` | Patrones aplicados y su justificacion |
| `Stack Tecnológico TimeFlow.docx` | Tecnologias elegidas y por que |

El modelo de datos tiene su propio documento en
[`../04-modelo-datos/`](../04-modelo-datos/).

## Componentes

| Capa | Componente | Contenedor | Responsabilidad |
|---|---|---|---|
| 1 | Caddy 2 | `timeflow-proxy` | TLS, enrutamiento, cabeceras |
| 2 | Next.js 15 + React 19 | `timeflow-web` | Interfaz y renderizado |
| 3 | NestJS 11 | `timeflow-api` | Reglas de negocio y autorizacion |
| 4 | PostgreSQL 16 | `timeflow-db` | Persistencia relacional |
| 5 | MinIO | `timeflow-storage` | Evidencias y adjuntos |

## Comunicacion entre componentes

| Origen | Destino | Protocolo | Detalle |
|---|---|---|---|
| Navegador | Caddy | HTTPS | Unico punto de entrada publico |
| Caddy | Next.js | HTTP interno | Todo lo que no sea `/api/*` |
| Caddy | NestJS | HTTP interno | Rutas `/api/*` |
| Next.js | NestJS | HTTP + cookie | `credentials: 'include'`, cookie `tf_acceso` |
| NestJS | PostgreSQL | TCP 5432 | Prisma 6 como unico acceso |
| NestJS | MinIO | S3 | URLs prefirmadas de vida corta |
| NestJS | Navegador | WebSocket | Socket.IO para el estado en vivo |

Solo el proxy queda expuesto. La base de datos y el almacen de objetos no
publican puertos fuera de la red de Docker.

## Organizacion interna de la API

Cada modulo de `src/backend/src/modules/` se divide en controlador, servicio y
acceso a datos.

| Elemento | Responsabilidad |
|---|---|
| `*.controller.ts` | Recibe la peticion, valida forma, no decide reglas |
| `*.service.ts` | Reglas de negocio y transacciones |
| `PrismaService` | Unico punto de contacto con la base de datos |

**Norma no negociable:** ningun modulo importa el repositorio de otro modulo. Si
un modulo necesita datos de otro, pasa por su servicio. Esto evita que una
regla de negocio quede escrita en dos lugares distintos.

## Decisiones que condicionan todo lo demas

**El servidor es la autoridad del tiempo.** La interfaz nunca transmite
duraciones: solo envia eventos de inicio y detencion, y el servidor los sella
con su propio reloj. Un navegador con la hora mal configurada no puede alterar
el registro.

**Todo instante se guarda en UTC** (`timestamptz`). La conversion a
`America/Santiago` ocurre unicamente en la capa de presentacion, porque Chile
cambia de hora dos veces al ano y un total historico no puede moverse por eso.

**El alcance por rol se aplica en el servidor.** Que la interfaz oculte una
opcion no es una medida de seguridad. Un trabajador que consulte la API
directamente sigue viendo solo sus propios registros.

## Estado de implementacion

| Modulo | Estado |
|---|---|
| `auth` | Implementado |
| `jornada` | Implementado |
| `actividades` | Implementado |
| `sesiones` | Implementado |
| `reportes` | Implementado |
| `nodos` | Implementado (solo lectura) |
| `dashboard` | Implementado |
| `usuarios` | Pendiente |
| `evidencias` | Pendiente |
| `historial` | Pendiente (la bitacora ya se escribe) |
| `notificaciones` | Pendiente |

Ante cualquier discrepancia entre estos documentos y el repositorio, prevalece
el repositorio.
