import React from 'react';
import {
  X,
  Printer,
  Download,
  GraduationCap,
  Award,
  BookOpen,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  CheckCircle2,
  XCircle,
  FileText,
  Bookmark,
  Share2,
  Edit,
  Building,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Docente, ItemAcademico, ItemLibro, ItemArticulo, ItemDiplomado } from '@/lib/types';

interface DocenteFichaModalProps {
  docente: Docente | null;
  onClose: () => void;
  onEdit?: (docente: Docente) => void;
}

export const DocenteFichaModal: React.FC<DocenteFichaModalProps> = ({ docente, onClose, onEdit }) => {
  if (!docente) return null;

  // Helper parsers for JSON arrays
  const parseJsonArray = <T,>(jsonStr?: string): T[] => {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const especialidades = parseJsonArray<ItemAcademico>(docente.especialidades);
  const maestrias = parseJsonArray<ItemAcademico>(docente.maestrias);
  const doctorados = parseJsonArray<ItemAcademico>(docente.doctorados);
  const libros = parseJsonArray<ItemLibro>(docente.libros_detalle);
  const articulos = parseJsonArray<ItemArticulo>(docente.articulos_detalle);
  const diplomados = parseJsonArray<ItemDiplomado>(docente.diplomados_detalle);
  const pnfs = parseJsonArray<string>(docente.pnfs);

  // Exportar Ficha a PDF con membrete oficial UPTPC
  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    // Header Membrete
    doc.setFillColor(11, 77, 148);
    doc.rect(0, 0, 210, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('UNIVERSIDAD POLITÉCNICA TERRITORIAL DE PUERTO CABELLO', 105, 9, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('RECTORADO • PROGRAMA DE EVALUACIÓN INSTITUCIONAL (PEI)', 105, 15, { align: 'center' });

    // Titulo Ficha
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHA INTEGRAL DEL DOCENTE', 14, 32);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-VE')}`, 14, 37);

    // Datos Principales
    autoTable(doc, {
      startY: 42,
      head: [['DATOS GENERALES Y FILIACIÓN INSTITUCIONAL', '']],
      body: [
        ['Nombre Completo:', docente.nombre_completo || ''],
        ['Cédula de Identidad:', docente.cedula || ''],
        ['Cargo / Dedicación:', `${docente.cargo || 'DOCENTE'} (Desde: ${docente.desde || 'N/D'})`],
        ['Condición / Estatus:', docente.status || 'ACTIVO'],
        ['Procedencia Geográfica:', `${docente.estado_nombre || 'Carabobo'} - ${docente.municipio_nombre || 'Puerto Cabello'}, Parroquia ${docente.parroquia_nombre || 'N/D'}`],
        ['Correo Electrónico / Teléfono:', `${docente.email || 'N/D'} | ${docente.telefono || 'N/D'}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [11, 77, 148], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
    });

    let currentY = (doc as any).lastAutoTable.finalY + 6;

    // Formación Universitaria
    const titulosBody = [
      ['Pregrado:', `${docente.carrera_pregrado || 'N/D'} (${docente.universidad_pregrado || 'N/D'}${docente.anio_pregrado ? ` - ${docente.anio_pregrado}` : ''})`],
      ['Rama Profesional:', docente.rama_especifica || docente.tipo_profesion || 'General'],
    ];

    if (doctorados.length > 0) {
      titulosBody.push(['Doctorado(s):', doctorados.map(d => `${d.titulo} (${d.universidad}${d.anio ? ` - ${d.anio}` : ''})`).join('; ')]);
    }
    if (maestrias.length > 0) {
      titulosBody.push(['Maestría(s):', maestrias.map(m => `${m.titulo} (${m.universidad}${m.anio ? ` - ${m.anio}` : ''})`).join('; ')]);
    }
    if (especialidades.length > 0) {
      titulosBody.push(['Especialidad(es):', especialidades.map(e => `${e.titulo} (${e.universidad}${e.anio ? ` - ${e.anio}` : ''})`).join('; ')]);
    }

    autoTable(doc, {
      startY: currentY,
      head: [['TRAYECTORIA ACADÉMICA Y TÍTULOS OBTENIDOS', '']],
      body: titulosBody,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // Docencia y Gremio
    autoTable(doc, {
      startY: currentY,
      head: [['DOCENCIA, GREMIO Y PROGRAMAS DE FORMACIÓN (PNF)', '']],
      body: [
        ['Componente Docente:', docente.componente_docente === 1 ? 'SÍ posee componente docente' : 'NO posee'],
        ['Gremio / Colegiatura:', docente.colegiado === 1 ? `SÍ (${docente.nombre_colegio || 'Colegio Profesional'}${docente.numero_colegio ? ` Nro: ${docente.numero_colegio}` : ''})` : 'NO colegiado'],
        ['Registro RECITVEN:', docente.usuario_recitven === 1 ? 'SÍ está inscrito en RECITVEN' : 'NO inscrito'],
        ['PNFs en UPTPC:', pnfs.length > 0 ? pnfs.join(', ') : 'No especificado'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // Producción Intelectual y Científica
    const prodBody = [
      ['Línea de Investigación:', docente.linea_investigacion || 'No especificada'],
      ['Investigación en Desarrollo:', docente.investigacion_en_desarrollo === 1 ? `SÍ: "${docente.investigacion_titulo || ''}" en ${docente.investigacion_instituto || 'UPTPC'}` : 'Sin investigación activa'],
    ];

    if (libros.length > 0) {
      prodBody.push(['Libros Publicados:', libros.map(l => `"${l.titulo}" (${l.instituto_editorial || ''}${l.isbn ? `, ISBN: ${l.isbn}` : ''})`).join('; ')]);
    }
    if (articulos.length > 0) {
      prodBody.push(['Artículos en Revistas:', articulos.map(a => `"${a.titulo}" (${a.revista || ''}${a.anio ? ` - ${a.anio}` : ''})`).join('; ')]);
    }
    if (docente.potencialidades) {
      prodBody.push(['Potencialidades Profesionales:', docente.potencialidades]);
    }

    autoTable(doc, {
      startY: currentY,
      head: [['PRODUCCIÓN CIENTÍFICA, LÍNEAS DE INVESTIGACIÓN Y POTENCIALIDADES', '']],
      body: prodBody,
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Programa de Evaluación Institucional (PEI) • Unidad de Ciencia y Tecnología (CYT) • UPTPC • Licencia Apache 3.0',
        105,
        290,
        { align: 'center' }
      );
    }

    doc.save(`Ficha_${docente.cedula}_${docente.nombre_completo.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header Modal con Membrete UPTPC */}
        <div className="bg-gradient-to-r from-[#073262] via-[#0B4D94] to-[#1E6BB8] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-lg">
              <img
                src="https://pub-e4f5b0a4105248f090453c5e81b8348f.r2.dev/img/LOGO_UPTPC.png"
                alt="UPTPC"
                className="h-8 sm:h-10 w-auto"
              />
              <img
                src="https://pub-e4f5b0a4105248f090453c5e81b8348f.r2.dev/img/logoRECTORADO.png"
                alt="Rectorado"
                className="h-8 sm:h-10 w-auto"
              />
            </div>
            <div>
              <p className="text-[10px] text-blue-200 font-semibold tracking-wider uppercase">
                UNIVERSIDAD POLITECNICA TERRITORIAL DE PUERTO CABELLO
              </p>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Ficha Integral del Profesional</span>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  PEI
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border border-white/20"
              title="Descargar Ficha en PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-800">
          {/* Top Profile Card: Photo, Names, Cedula, Badges */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl">
            {/* Foto de Cloudflare R2 o Placeholder */}
            <div className="relative shrink-0">
              {docente.foto_url ? (
                <img
                  src={docente.foto_url}
                  alt={docente.nombre_completo}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-[#0B4D94] to-[#1E6BB8] text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
                  {docente.nombres?.[0] || docente.nombre_completo?.[0] || 'D'}
                </div>
              )}
              {docente.encuestado === 1 ? (
                <span
                  title="Censado en el PEI"
                  className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              ) : (
                <span
                  title="Pendiente de Censo"
                  className="absolute -bottom-1.5 -right-1.5 bg-amber-500 text-white p-1 rounded-full border-2 border-white shadow-xs"
                >
                  <Calendar className="w-4 h-4" />
                </span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-mono text-xs font-bold bg-white border border-slate-300 text-slate-800 px-2.5 py-0.5 rounded-lg shadow-2xs">
                  {docente.cedula}
                </span>
                <span className="text-xs font-semibold bg-blue-100 text-[#0B4D94] px-2.5 py-0.5 rounded-lg">
                  {docente.cargo || 'DOCENTE'}
                </span>
                {docente.desde && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ingreso: {docente.desde}</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {docente.nombre_completo}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {docente.carrera_pregrado || 'Carrera no registrada'}
                {docente.rama_especifica && <span className="text-slate-500"> — {docente.rama_especifica}</span>}
              </p>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                {docente.tipo_profesion && (
                  <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
                    {docente.tipo_profesion}
                  </span>
                )}
                {docente.posee_doctorado === 1 && (
                  <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
                    Doctorado (PhD)
                  </span>
                )}
                {docente.posee_maestria === 1 && (
                  <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
                    Magíster (MSc)
                  </span>
                )}
                {docente.componente_docente === 1 && (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
                    Componente Docente ✓
                  </span>
                )}
                {docente.usuario_recitven === 1 && (
                  <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
                    RECITVEN ✓
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Grid de Secciones Detalladas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna 1: Formación Académica */}
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                  <GraduationCap className="w-4 h-4 text-[#0B4D94]" />
                  <span>Títulos Universitarios Obtenidos</span>
                </h4>

                <div className="space-y-3 text-xs">
                  {/* Pregrado */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-800 text-xs">
                      {docente.carrera_pregrado || 'Pregrado registrado'}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {docente.universidad_pregrado || 'Universidad no especificada'}
                      {docente.anio_pregrado ? ` • Año ${docente.anio_pregrado}` : ''}
                    </p>
                    {docente.rama_especifica && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                        Rama: {docente.rama_especifica}
                      </span>
                    )}
                  </div>

                  {/* Doctorados */}
                  {doctorados.map((d, i) => (
                    <div key={i} className="p-2.5 bg-purple-50/50 rounded-lg border border-purple-100">
                      <p className="font-bold text-purple-900 text-xs">🎓 {d.titulo}</p>
                      <p className="text-slate-500 text-[11px]">
                        {d.universidad} {d.anio ? `• Año ${d.anio}` : ''}
                      </p>
                    </div>
                  ))}

                  {/* Maestrías */}
                  {maestrias.map((m, i) => (
                    <div key={i} className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
                      <p className="font-bold text-indigo-900 text-xs">📜 {m.titulo}</p>
                      <p className="text-slate-500 text-[11px]">
                        {m.universidad} {m.anio ? `• Año ${m.anio}` : ''}
                      </p>
                    </div>
                  ))}

                  {/* Especialidades */}
                  {especialidades.map((e, i) => (
                    <div key={i} className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                      <p className="font-bold text-blue-900 text-xs">🎖️ {e.titulo}</p>
                      <p className="text-slate-500 text-[11px]">
                        {e.universidad} {e.anio ? `• Año ${e.anio}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Procedencia Geográfica y Contacto */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                  <MapPin className="w-4 h-4 text-[#0B4D94]" />
                  <span>Ubicación y Procedencia</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <p>
                    <strong className="text-slate-900">Estado:</strong> {docente.estado_nombre || 'Carabobo'}
                  </p>
                  <p>
                    <strong className="text-slate-900">Municipio:</strong> {docente.municipio_nombre || 'Puerto Cabello'}
                  </p>
                  <p>
                    <strong className="text-slate-900">Parroquia:</strong> {docente.parroquia_nombre || 'No especificada'}
                  </p>
                  {docente.direccion && (
                    <p>
                      <strong className="text-slate-900">Dirección:</strong> {docente.direccion}
                    </p>
                  )}
                  {docente.email && (
                    <p className="flex items-center gap-1 pt-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{docente.email}</span>
                    </p>
                  )}
                  {docente.telefono && (
                    <p className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{docente.telefono}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Columna 2: Investigación, Potencialidades y Gremio */}
            <div className="space-y-4">
              {/* Investigación y Producción Intelectual */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Investigación y Producción Intelectual</span>
                </h4>

                <div className="space-y-3 text-xs">
                  {docente.linea_investigacion && (
                    <div>
                      <p className="font-semibold text-slate-500 text-[11px]">Línea de Investigación:</p>
                      <p className="font-bold text-slate-900">{docente.linea_investigacion}</p>
                    </div>
                  )}

                  {docente.investigacion_en_desarrollo === 1 && (
                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="font-bold text-emerald-950 text-xs">
                        🔬 Investigación Activa: {docente.investigacion_titulo}
                      </p>
                      <p className="text-emerald-800 text-[11px] mt-0.5">
                        Instituto: {docente.investigacion_instituto || 'UPTPC'}
                      </p>
                      {docente.investigacion_linea && (
                        <p className="text-emerald-700 text-[10px]">Línea: {docente.investigacion_linea}</p>
                      )}
                    </div>
                  )}

                  {libros.length > 0 && (
                    <div>
                      <p className="font-bold text-slate-700 text-xs mb-1">📚 Libros Publicados:</p>
                      {libros.map((l, i) => (
                        <div key={i} className="text-[11px] bg-slate-50 p-2 rounded mb-1">
                          <p className="font-semibold text-slate-800">"{l.titulo}"</p>
                          <p className="text-slate-500">
                            {l.instituto_editorial} {l.anio ? `(${l.anio})` : ''} {l.isbn ? `• ISBN: ${l.isbn}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {articulos.length > 0 && (
                    <div>
                      <p className="font-bold text-slate-700 text-xs mb-1">📄 Artículos en Revistas Científicas:</p>
                      {articulos.map((a, i) => (
                        <div key={i} className="text-[11px] bg-slate-50 p-2 rounded mb-1">
                          <p className="font-semibold text-slate-800">"{a.titulo}"</p>
                          <p className="text-slate-500">
                            {a.revista} {a.anio ? `(${a.anio})` : ''} {a.url_doi ? `• ${a.url_doi}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Potencialidades Profesionales y Diplomados */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Potencialidades Profesionales y Diplomados</span>
                </h4>

                {docente.potencialidades ? (
                  <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/60 border border-amber-200/70 p-3 rounded-lg mb-3">
                    {docente.potencialidades}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mb-3">
                    Aún no se han sintetizado las potencialidades en el censo.
                  </p>
                )}

                {diplomados.length > 0 && (
                  <div>
                    <p className="font-bold text-slate-700 text-xs mb-1.5">Diplomados Realizados:</p>
                    <div className="space-y-1.5">
                      {diplomados.map((dip, i) => (
                        <div key={i} className="p-2 bg-slate-50 rounded text-xs flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-800">{dip.area}</p>
                            <p className="text-[11px] text-slate-500">{dip.institucion}</p>
                          </div>
                          {dip.horas && (
                            <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                              {dip.horas} hrs
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Programas y Gremio */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2 text-xs">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span>Gremio y Programas Institucionales</span>
                </h4>

                <p>
                  <strong className="text-slate-800">Colegiado:</strong>{' '}
                  {docente.colegiado === 1
                    ? `Sí (${docente.nombre_colegio || 'Gremio Profesional'}${docente.numero_colegio ? ` • N° ${docente.numero_colegio}` : ''})`
                    : 'No'}
                </p>

                <p>
                  <strong className="text-slate-800">RECITVEN:</strong>{' '}
                  {docente.usuario_recitven === 1 ? 'Sí posee registro' : 'No'}
                </p>

                {pnfs.length > 0 && (
                  <div>
                    <strong className="text-slate-800 block mb-1">Programas de Formación en UPTPC:</strong>
                    <div className="flex flex-wrap gap-1">
                      {pnfs.map(p => (
                        <span key={p} className="bg-blue-50 text-[#0B4D94] border border-blue-200 text-[11px] px-2 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400">
            Ficha ID: <span className="font-mono text-slate-600 font-semibold">{docente.cedula}</span>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(docente)}
                className="bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl border border-slate-300 shadow-2xs transition-all flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Actualizar Censo</span>
              </button>
            )}

            <button
              onClick={handleExportPDF}
              className="bg-[#0B4D94] hover:bg-[#073262] text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
