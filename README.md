# Salud Transparente Chile

**¿Llegó la plata a tu hospital?**

Conecta el presupuesto público de salud (DIPRES) con las listas de espera de tu hospital (MINSAL). Una sola búsqueda. Datos públicos. Lenguaje humano.

---

## El Problema

En Chile, ~15 millones de personas dependen de la salud pública. La ejecución presupuestaria está en DIPRES y las listas de espera están en el Visor MINSAL — en mundos separados que nunca se cruzan. Este proyecto construye el puente.

## Qué Hace

1. El ciudadano escribe su hospital o su comuna
2. En segundos recibe:
   - Cuánto presupuesto recibió su **red regional de salud** (datos DIPRES)
   - Cuánto se ejecutó de ese presupuesto
   - Cómo evolucionó la **lista de espera en su hospital** (datos MINSAL)
   - Un párrafo descriptivo que conecta ambos datos en lenguaje simple

## Principios Innegociables

- **Honestidad de unidad**: DIPRES publica por Servicio de Salud (~29 regionales), MINSAL por establecimiento. Siempre se etiquetan por separado.
- **Cero veredictos**: párrafos descriptivos, sin acusaciones.
- **Sin tiempo real**: datos pre-ingresados, actualizables con scripts.
- **Primera impresión clara**: una sola caja, cero jerga.

---

## Stack Técnico

- **Framework**: Next.js 16 con App Router y Turbopack
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Datos**: JSON estático pre-ingresado (sin base de datos)
- **Deploy**: Vercel (free tier)

## Estructura del Repositorio

```
salud-transparente-chile/
├── data/
│   ├── mapping.json           ← TABLA MAESTRA: commune/hospital → Servicio de Salud
│   ├── dipres_ejecucion.json  ← Presupuesto por Servicio de Salud (DIPRES)
│   └── minsal_espera.json     ← Lista de espera por establecimiento (MINSAL)
├── scripts/
│   ├── ingest_dipres.py       ← Actualiza datos DIPRES desde Excel oficial
│   └── ingest_minsal.py       ← Actualiza datos MINSAL desde CSV Visor
├── src/
│   ├── app/
│   │   ├── api/search/        ← API de búsqueda
│   │   ├── api/heroes/        ← Demos verificadas
│   │   └── page.tsx           ← Página principal
│   ├── components/
│   │   └── SearchClient.tsx   ← UI interactiva
│   └── lib/
│       ├── types.ts           ← Tipos TypeScript
│       ├── search.ts          ← Motor de búsqueda
│       └── format.ts          ← Formateo y generación de párrafos
└── README.md
```

---

## Tabla de Mapeo (data/mapping.json)

La tabla de mapeo es el corazón del proyecto. Conecta:

```
nombre de hospital / comuna → Servicio de Salud (para datos DIPRES)
nombre de hospital          → ID establecimiento (para datos MINSAL)
```

### Servicios de Salud incluidos (29 servicios)

| ID | Nombre | Región |
|---|---|---|
| ss_metro_norte | Servicio de Salud Metropolitano Norte | RM |
| ss_metro_occidente | Servicio de Salud Metropolitano Occidente | RM |
| ss_metro_central | Servicio de Salud Metropolitano Central | RM |
| ss_metro_oriente | Servicio de Salud Metropolitano Oriente | RM |
| ss_metro_sur | Servicio de Salud Metropolitano Sur | RM |
| ss_metro_sur_oriente | Servicio de Salud Metropolitano Sur Oriente | RM |
| ss_valparaiso_sa | Servicio de Salud Valparaíso - San Antonio | Valparaíso |
| ss_vina_quillota | Servicio de Salud Viña del Mar - Quillota | Valparaíso |
| ss_aconcagua | Servicio de Salud Aconcagua | Valparaíso |
| ss_ohiggins | Servicio de Salud Libertador B. O'Higgins | O'Higgins |
| ss_maule | Servicio de Salud Maule | Maule |
| ss_nuble | Servicio de Salud Ñuble | Ñuble |
| ss_biobio | Servicio de Salud Biobío | Biobío |
| ss_talcahuano | Servicio de Salud Talcahuano | Biobío |
| ss_arauco | Servicio de Salud Arauco | Biobío |
| ss_araucania_norte | Servicio de Salud Araucanía Norte | Araucanía |
| ss_araucania_sur | Servicio de Salud Araucanía Sur | Araucanía |
| ss_valdivia | Servicio de Salud Valdivia | Los Ríos |
| ss_osorno | Servicio de Salud Osorno | Los Lagos |
| ss_reloncavi | Servicio de Salud del Reloncaví | Los Lagos |
| ss_chiloe | Servicio de Salud Chiloé | Los Lagos |
| ss_aysen | Servicio de Salud Aysén | Aysén |
| ss_magallanes | Servicio de Salud Magallanes | Magallanes |
| ss_coquimbo | Servicio de Salud Coquimbo | Coquimbo |
| ss_atacama | Servicio de Salud Atacama | Atacama |
| ss_antofagasta | Servicio de Salud Antofagasta | Antofagasta |
| ss_tarapaca | Servicio de Salud Tarapacá | Tarapacá |
| ss_arica_parinacota | Servicio de Salud Arica y Parinacota | Arica y Parinacota |

### Demos Héroe Verificadas

Estas tres búsquedas tienen datos verificados y garantizados para la demo en vivo:

| Búsqueda | Servicio de Salud | Hospital Principal |
|---|---|---|
| "Hospital San José" / "Recoleta" | SS Metropolitano Norte | Hospital San José |
| "Temuco" / "Hospital Regional Temuco" | SS Araucanía Sur | Hospital H. Henríquez Aravena |
| "Valparaíso" / "Hospital Carlos Van Buren" | SS Valparaíso - San Antonio | Hospital Dr. Carlos Van Buren |

---

## Fuentes de Datos

### DIPRES
- **URL**: https://www.dipres.gob.cl/597/w3-propertyvalue-15131.html
- **Qué publica**: Ejecución presupuestaria mensual por servicio (Excel)
- **Partida**: 16 - Ministerio de Salud
- **Unidad**: Cada Servicio de Salud como organismo
- **Frecuencia**: Mensual, con corte a fin de mes

### MINSAL - Visor Ciudadano
- **URL**: https://visortiemposespera.minsal.cl/
- **Qué publica**: Listas de espera por establecimiento (consultas y cirugías)
- **Unidad**: Hospital / Establecimiento
- **Frecuencia**: Mensual

---

## Instalación y Desarrollo

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/salud-transparente-chile
cd salud-transparente-chile

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build de producción
npm run build
```

## Actualizar Datos

```bash
# Instalar dependencias Python (solo para scripts de ingesta)
pip install requests pandas openpyxl

# Actualizar datos DIPRES (requiere Excel descargado manualmente)
python scripts/ingest_dipres.py ruta/al/archivo_dipres.xlsx 2024

# Explorar API MINSAL
python scripts/ingest_minsal.py

# Actualizar datos MINSAL (desde CSV del Visor)
python scripts/ingest_minsal.py ruta/al/datos_minsal.csv "Diciembre 2024"
```

Después de actualizar los JSON en `data/`, hacer commit y deploy:

```bash
git add data/
git commit -m "feat: actualizar datos a [MES ANO]"
git push
# Vercel re-deploya automáticamente
```

---

## Deploy en Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftu-usuario%2Fsalud-transparente-chile)

```bash
# O usando Vercel CLI
npm i -g vercel
vercel deploy
```

---

## Contribuir

1. Fork el repositorio
2. Mejora la tabla de mapeo en `data/mapping.json`
3. Agrega más hospitales o comunas
4. Envía Pull Request

**Prioridades de contribución:**
- Completar el mapeo de todas las comunas de Chile
- Agregar más hospitales y establecimientos
- Mejorar los scripts de ingesta para automatizar la actualización
- Mejorar el algoritmo de búsqueda fuzzy

---

## Licencia

MIT License — libre para usar, modificar y distribuir.

---

*Proyecto desarrollado para hackathon hack@latam 2026 — Track Transparency & Corruption*
*Datos públicos de DIPRES y MINSAL Chile*
