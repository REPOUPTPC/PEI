# PEI - Programa De Evaluación Institucional
### Universidad Politécnica Territorial de Puerto Cabello (UPTPC)
**Rectorado • Unidad de Ciencia y Tecnología (CYT)**

Plataforma web 100% interactiva y responsive para el censo, evaluación institucional, medición de capacidades científicas y conglomerados de profesionales de la UPTPC, inspirada en la arquitectura de observatorios científicos abiertos (como el ONCTI).

---

## 🏛️ Características Principales

1. **Observatorio Institucional Interactivo (Acceso Público sin Login)**:
   - Resumen dinámico y medición de indicadores institucionales en tiempo real.
   - Explorador de **Conglomerados Profesionales** con *drill-down* interactivo:
     - Haga clic en cualquier gremio (ej. **INGENIERO**, **LICENCIADO**, **MÉDICO**, etc.) para ver la desagregación por ramas específicas y conteos nominales.
     - Haga clic en el nombre de cualquier docente para desplegar su **Ficha Integral** con fotografía oficial, títulos, producción intelectual y potencialidades profesionales.
   - Gráficos de distribución de postgrado (Doctorados, Maestrías, Especialidades), programas de formación (PNF), componente docente, adscripción al RECITVEN y producción científica.

2. **Ficha Integral del Profesional con Exportación a PDF**:
   - Visualización de datos de pregrado, postgrado, institución de egreso y año.
   - Estado de colegiatura profesional (CIV, Colegios de Licenciados, Médicos, etc.) y código RECITVEN.
   - Proyectos de investigación activos, líneas institucionales, artículos en revistas y libros publicados con ISBN.
   - Detección y despliegue de **Potencialidades Profesionales** y diplomados cursados.
   - Botón directo para **Exportar Ficha Oficial a PDF** con membrete institucional de la UPTPC.

3. **Censo PEI y Digitalización Amigable**:
   - Búsqueda en tiempo de ejecución por Cédula, Nombres o Apellidos.
   - **Toma de fotografía en tiempo real desde el teléfono celular** (soporte nativo de cámara móvil y WebCam integrada) con almacenamiento automático en **Cloudflare R2** (`rectorado`).
   - Algoritmo autocompletable para carreras universitarias repetidas (ej. *INGENIERO MECÁNICO*): autocompleta carreras existentes o permite registrarlas al instante en la base de datos si es una nueva carrera.
   - Despliegue en cascada de la geografía nacional venezolana (**Estado ➔ Municipio ➔ Parroquia**).
   - Programas de Formación (PNF y PT) vinculados en la UPTPC:
     - PT en Mecánica Térmica
     - PT en Mecánica Automotriz
     - PNF en Materiales Industriales
     - PNF en Mantenimiento
     - PNF en Mecánica
     - PNF en Turismo
     - PNF en Informática
     - PNF en Distribución y Logística

4. **Carga Masiva desde Archivo CSV**:
   - Carga masiva de profesionales en lote.
   - **Exclusión automática de la primera línea (cabecera)** según requerimiento institucional.
   - Previsualización interactiva de la tabla de datos antes de confirmar el envío a la base de datos.

5. **Módulo de Reportería Oficial**:
   - Generación de informes clasificados por gremio, postgrados, PNF o producción intelectual.
   - Exportación de informes oficiales en PDF tamaño A4 apaisado con membretes y tablas automáticas.

6. **Seguridad y Control de Roles (SUPERADMIN, ADMIN, ENCUESTADOR)**:
   - Acceso con credenciales de **SUPERADMIN**:
     - **Usuario**: `CIENCIA_TECNOLOGIA`
     - **Contraseña**: `CYT_01012023`
   - El SUPERADMIN puede cambiar su contraseña directamente desde el sistema.
   - Control total CRUD de todos los datos y usuarios.
   - Creación de perfiles de **ENCUESTADOR** (acceso limitado a censo y directorio).
   - Creación de perfiles de **ADMIN** con permisos modulares configurables por el SUPERADMIN en la sección de Configuración.

7. **Navegación Amigable con Hash (`#`)**:
   - Permite actualizar la página o compartir enlaces directos (`#observatorio`, `#docentes`, `#encuesta`, `#reportes`, `#dashboard`, `#configuracion`) sin reiniciar el estado de la aplicación.
   - Sin alertas nativas de JavaScript (`alert()` o `confirm()`), empleando modales animados y notificaciones *toast* integradas.

---

## ☁️ Infraestructura y Almacenamiento

- **Base de Datos**: Turso LibSQL (`libsql://rectorado-herrejose.aws-ap-northeast-1.turso.io`)
- **Almacenamiento de Imágenes / Fotos**: Cloudflare R2 (`https://pub-e4f5b0a4105248f090453c5e81b8348f.r2.dev`)
  - Bucket: `rectorado`
- **Frontend / Backend**: Next.js 14, React 18, Tailwind CSS, Chart.js, jsPDF, AWS SDK S3.
- **Despliegue**: Optimizado para **Vercel**.

---

## 🚀 Despliegue en Vercel

1. Suba este repositorio a su cuenta de GitHub / GitLab.
2. Cree un nuevo proyecto en [Vercel](https://vercel.com).
3. Configure las siguientes Variables de Entorno en Vercel (*Project Settings -> Environment Variables*):

```env
TURSO_DATABASE_URL=libsql://rectorado-herrejose.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...

R2_ENDPOINT=https://da7c23add0ce839e4989c068fbfa4394.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=ebd05f33ae6eb4e8fbb1eaad50b7bb09
R2_SECRET_ACCESS_KEY=a4936f4285fe070ec4d290dd45e6105d81c192b90d767266532880bd1a49e12a
R2_BUCKET=rectorado
R2_PUBLIC_URL=https://pub-e4f5b0a4105248f090453c5e81b8348f.r2.dev
```

4. Haga clic en **Deploy**. Vercel compilará la aplicación de forma automática.

> **Nota de Privacidad y Git**: Los archivos SQL locales (`sql/`) están excluidos del repositorio mediante `.gitignore` para cumplir con la privacidad institucional de las instrucciones para el agente de IA.

---

## 💻 Ejecución Local

```bash
# Instalar dependencias
npm install

# Inicializar y sincronizar base de datos en Turso
npm run db:init

# Iniciar servidor de desarrollo
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) en su navegador.

---

## 📜 Licencia

Este proyecto está bajo la **Licencia Pública General Apache 3.0** (Apache License 2.0 / 3.0 compatible).
Universidad Politécnica Territorial de Puerto Cabello (UPTPC) • Puerto Cabello, Estado Carabobo, Venezuela.
