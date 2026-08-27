# ElAlmendro

## Nombre del proyecto
ElAlmendro

## Descripción
Sistema de gestión de bodega orientado a cocina y distribución de productos, con auditoría y alertas automatizadas.

## Tecnologías utilizadas

- Lenguaje: C#
- Framework: .NET (WPF) — aplicación de escritorio
- ORM: Entity Framework Core
- Base de datos: SQL Server (LocalDB / Express)
- Distribución: software de escritorio (instalador Windows), sin hosting/cloud

## Instrucciones para ejecutar el proyecto localmente
> TODO: Pasos para clonar, restaurar dependencias (NuGet) y ejecutar la solución.

```bash
git clone https://github.com/AnibalZuletaDuoc/ElAlmendro.git
cd ElAlmendro
# dotnet restore
# dotnet build
# dotnet run --project src/<proyecto>
```

## Integrantes del equipo y roles

| Apellido y Nombre | Rol |
|---|---|
| RAMIREZ, CRISTOPHER | Líder de proyecto |
| RIVERA, RODRIGO | Desarrollador |
| ZULETA, ANIBAL | Calidad |

## Metodología de trabajo del equipo
Metodología ágil (Scrum / Kanban). Los artefactos de gestión ágil (Product Vision, Product Backlog, Sprint Backlog, Definition of Done, retrospectivas) se encuentran en [docs/02-metodologia-agil](docs/02-metodologia-agil).

## Arquitectura de la solución
Ver [docs/03-arquitectura](docs/03-arquitectura) para el diagrama de arquitectura, componentes y comunicación entre servicios.

## Estructura del repositorio

```
ElAlmendro/
├── docs/                          Documentación técnica y de gestión del proyecto
│   ├── 01-inicio-proyecto/        Documento de inicio de proyecto
│   ├── 02-metodologia-agil/       Product Vision, Backlog, Sprints, DoD, retrospectivas
│   ├── 03-arquitectura/           Diagrama de arquitectura y componentes
│   ├── 04-modelo-datos/           Modelo ER o documental
│   ├── 05-diagramas-uml/          Casos de uso, clases, secuencia, componentes
│   ├── 06-requisitos-no-funcionales/
│   ├── 07-pruebas/                Unitarias, integración, rendimiento, seguridad
│   ├── 08-innovacion/             Problema, diferenciación y valor agregado
│   └── 09-manual-tecnico-despliegue/
├── Fase 1/                        Evidencias individuales y grupales de la Fase 1
├── Fase 2/                        Evidencias individuales, grupales y de proyecto de la Fase 2
├── Fase 3/                        Evidencias individuales y grupales de la Fase 3
├── src/                           Código fuente (solución .NET / WPF)
├── docker/                        Portabilidad (opcional para componentes que lo requieran)
└── README.md
```

## Estado del proyecto
Repositorio público desde el inicio de la Experiencia 1, mantenido activo durante todo el semestre.
