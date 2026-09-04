# Backend — API TimeFlow

API REST construida con **NestJS 11**, TypeScript y Prisma sobre PostgreSQL 16.
Contiene las reglas de negocio, la autorización y el cronometraje autoritativo.

## Ejecutar

Desde la raíz del repositorio:

```bash
npm run dev:api
```

| URL | Contenido |
|---|---|
| `http://localhost:4000/api/salud` | Estado de la API y de la base de datos |
| `http://localhost:4000/api/docs` | Documentación OpenAPI |

## Estructura

```
prisma/
  schema.prisma              modelo de datos
  migrations/                migraciones versionadas
  sql/reglas-integridad.sql  invariantes del motor
  seed.ts                    datos iniciales
src/
  common/       guards, pipes, filtros e interceptores transversales
  infra/prisma/ cliente de base de datos
  modules/      un módulo por historia de usuario
```

## Convención de capas

Cada módulo se organiza siempre igual:

```
modules/<modulo>/
  <modulo>.controller.ts    HTTP, DTOs, códigos de estado
  <modulo>.service.ts       reglas de negocio y transiciones de estado
  <modulo>.repository.ts    acceso a datos vía Prisma
  dto/                      contratos de entrada y salida
  <modulo>.module.ts        cableado
```

Normas:

- **Ningún módulo importa el repositorio de otro.** Se habla por servicios
  públicos o, cuando la relación es de reacción y no de consulta, por eventos
  de dominio.
- Las reglas de negocio viven en el servicio, nunca en el controlador: deben
  poder probarse sin servidor HTTP ni base de datos.
- Las transiciones de estado se validan siempre en el servidor. Un cliente
  alterado no puede provocar una transición inválida.

## Comandos de base de datos

```bash
npm run db:migrate
npm run db:seed
npm run db:studio
```
