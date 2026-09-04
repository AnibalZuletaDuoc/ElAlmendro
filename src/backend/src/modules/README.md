# Modulos de la capa de negocio

Cada carpeta de `modules/` corresponde a un modulo de la seccion 4.3 del
documento de arquitectura y se organiza siempre con las mismas capas internas:

```
modules/<modulo>/
  <modulo>.controller.ts    capa de controlador  - HTTP, DTOs, codigos de estado
  <modulo>.service.ts       capa de dominio      - reglas de negocio, transiciones
  <modulo>.repository.ts    capa de repositorio  - acceso a datos via Prisma
  dto/                      contratos de entrada y salida
  <modulo>.module.ts        cableado del modulo
```

Normas:

- Ningun modulo importa el repositorio de otro. Se habla por servicios publicos
  o, cuando la relacion es de reaccion y no de consulta, por eventos de dominio.
- Las reglas de negocio viven en el servicio, nunca en el controlador: deben
  poder probarse sin servidor HTTP ni base de datos.
- Las transiciones de estado se validan siempre en el servidor.
