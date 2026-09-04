# Frontend — Interfaz TimeFlow

Interfaz construida con **Next.js 15**, React 19 y Tailwind CSS 4. Actúa además
como BFF: agrega llamadas a la API y custodia los tokens en cookies httpOnly,
de modo que el navegador nunca habla directo con la API.

## Ejecutar

Desde la raíz del repositorio:

```bash
npm run dev:web
```

## Estructura

```
src/
  app/         rutas y layouts (App Router). Vistas de lectura en servidor.
  components/  componentes reutilizables de interfaz
  lib/         cliente de la API, utilidades de fecha y formato
```

## Reglas del equipo

- Todo instante llega desde la API en **UTC**. La conversión a
  `America/Santiago` se hace aquí y solo aquí.
- El cronómetro visible se calcula sobre la marca `inicioEn` que devolvió la
  API. **Nunca se envía una duración al servidor**: la interfaz transmite solo
  los eventos de inicio y término.

## Librerías principales

| Librería | Uso |
|---|---|
| React Flow (`@xyflow/react`) | Mapa de actividades por nodos (US-05) |
| Recharts | Gráficos del panel de resumen (US-09) |
| Socket.IO client | Panel en vivo |
| Luxon | Conversión de zona horaria |
