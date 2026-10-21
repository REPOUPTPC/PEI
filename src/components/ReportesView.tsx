import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText,
  Download,
  Filter,
  GraduationCap,
  Building2,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { Docente, ObservatorioStats } from '@/lib/types';
import { useToast } from './Toast';

interface ReportesViewProps {
  stats: ObservatorioStats | null;
  docentes: Docente[];
  onSelectDocente: (docente: Docente) => void;
}

export const ReportesView: React.FC<ReportesViewProps> = ({ stats, docentes, onSelectDocente }) => {
  const { showToast } = useToast();
  const [selectedReportType, setSelectedReportType] = useState<
    'GENERAL' | 'POSTGRADOS' | 'PNF' | 'INVESTIGACION' | 'GREMIO'
  >('GENERAL');

  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Filter docentes according to selected report
  const getReportData = () => {
    switch (selectedReportType) {
      case 'POSTGRADOS':
        return docentes.filter(d => d.posee_doctorado === 1 || d.posee_maestria === 1 || d.posee_especialidad === 1);
      case 'INVESTIGACION':
        return docentes.filter(
          d =>
            d.usuario_recitven === 1 ||
            d.publicaciones_repositorio === 1 ||
            d.publicaciones_libros === 1 ||
            d.publicaciones_articulos === 1 ||
            d.investigacion_en_desarrollo === 1
        );
      case 'GREMIO':
        return docentes.filter(d => d.colegiado === 1 || d.componente_docente === 1);
      case 'PNF':
        return docentes.filter(d => {
          try {
            const arr = JSON.parse(d.pnfs || '[]');
            return arr.length > 0;
          } catch {
            return false;
          }
        });
      default:
        return docentes;
    }
  };

  const reportDocentes = getReportData();

  // Export official PDF report
  const handleExportPDF = () => {
    setGeneratingPDF(true);
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');

      // Header Membrete
      doc.setFillColor(11, 77, 148);
      doc.rect(0, 0, 297, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('UNIVERSIDAD POLITÉCNICA TERRITORIAL DE PUERTO CABELLO', 148.5, 10, { align: 'center' });
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('RECTORADO • UNIDAD DE CIENCIA Y TECNOLOGÍA • PROGRAMA DE EVALUACIÓN INSTITUCIONAL (PEI)', 148.5, 17, { align: 'center' });

      // Title
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');

      let reportTitle = 'INFORME GENERAL DE EVALUACIÓN INSTITUCIONAL DOCENTE';
      if (selectedReportType === 'POSTGRADOS') reportTitle = 'INFORME DEL PADRÓN ACADÉMICO DE POSTGRADO (PhD / MSc / Esp)';
      if (selectedReportType === 'INVESTIGACION') reportTitle = 'INFORME DE INVESTIGACIÓN, RECITVEN Y PRODUCCIÓN INTELECTUAL';
      if (selectedReportType === 'GREMIO') reportTitle = 'INFORME DEL GREMIO PROFESIONAL Y COMPONENTE DOCENTE';
      if (selectedReportType === 'PNF') reportTitle = 'INFORME DE DOCENTES POR PROGRAMAS DE FORMACIÓN (PNF)';

      doc.text(reportTitle, 14, 34);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Generado el: ${new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | Total Registros: ${reportDocentes.length}`,
        14,
        40
      );

      // Prepare table data
      const tableHeaders = ['#', 'CÉDULA', 'NOMBRE COMPLETO', 'CARGO', 'PROFESIÓN / CARRERA', 'POSTGRADO', 'PNF', 'RECITVEN / PUB'];
      const tableRows = reportDocentes.map((d, idx) => {
        let postgrado = 'Pregrado';
        if (d.posee_doctorado === 1) postgrado = 'Doctorado';
        else if (d.posee_maestria === 1) postgrado = 'Maestría';
        else if (d.posee_especialidad === 1) postgrado = 'Especialista';

        let pnfStr = '';
        try {
          const arr = JSON.parse(d.pnfs || '[]');
          pnfStr = arr.join(', ');
        } catch {
          pnfStr = '';
        }

        const pubStr = `${d.usuario_recitven === 1 ? 'RECITVEN' : ''} ${d.publicaciones_repositorio === 1 ? '• Repositorio UPTPC' : ''} ${d.publicaciones_libros === 1 ? '• Libros' : ''} ${d.publicaciones_articulos === 1 ? '• Artículos' : ''}`.trim() || 'N/D';

        return [
          idx + 1,
          d.cedula,
          d.nombre_completo,
          d.cargo || 'DOCENTE',
          `${d.tipo_profesion || ''} - ${d.carrera_pregrado || 'Pendiente'}`,
          postgrado,
          pnfStr || 'General',
          pubStr,
        ];
      });

      autoTable(doc, {
        startY: 45,
        head: [tableHeaders],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [11, 77, 148], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 25, fontStyle: 'bold' },
          2: { cellWidth: 65, fontStyle: 'bold' },
          3: { cellWidth: 35 },
          4: { cellWidth: 55 },
          5: { cellWidth: 25 },
          6: { cellWidth: 40 },
          7: { cellWidth: 30 },
        },
      });

      // Footers on all pages
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Página ${i} de ${pageCount} • Programa de Evaluación Institucional (PEI) • Rectorado UPTPC • Licencia Apache 3.0`,
          148.5,
          202,
          { align: 'center' }
        );
      }

      doc.save(`Reporte_UPTPC_PEI_${selectedReportType}_${Date.now()}.pdf`);
      showToast('success', 'PDF Generado', 'El reporte oficial se descargó exitosamente.');
    } catch (err: any) {
      showToast('error', 'Error generando PDF', err.message);
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Exportar datos del reporte actual en CSV
  const handleExportCSV = () => {
    if (reportDocentes.length === 0) return;
    const headers = [
      'CEDULA',
      'NOMBRE_COMPLETO',
      'CARGO',
      'PROFESION',
      'CARRERA',
      'POSTGRADO',
      'ESTADO_PROCEDENCIA',
      'MUNICIPIO_PROCEDENCIA',
      'ESTADO_RESIDENCIA',
      'MUNICIPIO_RESIDENCIA',
      'ESTADO_CENSO',
    ];
    const rows = [headers.join(',')];

    reportDocentes.forEach(d => {
      let postgrado = 'Pregrado';
      if (d.posee_doctorado === 1) postgrado = 'Doctorado';
      else if (d.posee_maestria === 1) postgrado = 'Maestría';
      else if (d.posee_especialidad === 1) postgrado = 'Especialista';

      rows.push([
        `"${(d.cedula || '').replace(/"/g, '""')}"`,
        `"${(d.nombre_completo || '').replace(/"/g, '""')}"`,
        `"${(d.cargo || 'DOCENTE').replace(/"/g, '""')}"`,
        `"${(d.tipo_profesion || '').replace(/"/g, '""')}"`,
        `"${(d.carrera_pregrado || '').replace(/"/g, '""')}"`,
        `"${postgrado}"`,
        `"${(d.estado_procedencia_nombre || '').replace(/"/g, '""')}"`,
        `"${(d.municipio_procedencia_nombre || '').replace(/"/g, '""')}"`,
        `"${(d.estado_nombre || '').replace(/"/g, '""')}"`,
        `"${(d.municipio_nombre || '').replace(/"/g, '""')}"`,
        d.encuestado === 1 ? 'CENSADO' : 'PENDIENTE',
      ].join(','));
    });

    const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_pei_${selectedReportType.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'CSV Generado', 'El reporte en formato CSV se descargó exitosamente.');
  };

  return (
    <div className="card-white p-6 sm:p-8 space-y-6 animate-fade-in shadow-md">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4D94] uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Módulo de Reportería Institucional</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Generador de Informes Interactivos y Exportación
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Seleccione el tipo de informe para visualizar datos filtrados y exportar en formato PDF o CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            disabled={reportDocentes.length === 0}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-2xs transition-all flex items-center gap-2 disabled:opacity-50"
            title="Exportar datos del reporte actual en formato CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={generatingPDF || reportDocentes.length === 0}
            className="bg-[#0B4D94] hover:bg-[#073262] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{generatingPDF ? 'Generando PDF...' : 'Descargar PDF'}</span>
          </button>
        </div>
      </div>

      {/* Selector de Informes con Tarjetas Interactivas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setSelectedReportType('GENERAL')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedReportType === 'GENERAL'
              ? 'bg-blue-50 border-[#0B4D94] shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className={`w-5 h-5 mb-2 ${selectedReportType === 'GENERAL' ? 'text-[#0B4D94]' : 'text-slate-400'}`} />
          <h4 className="font-bold text-xs text-slate-800">Informe General</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Todos los docentes y estatus</p>
        </button>

        <button
          onClick={() => setSelectedReportType('POSTGRADOS')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedReportType === 'POSTGRADOS'
              ? 'bg-purple-50 border-purple-600 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className={`w-5 h-5 mb-2 ${selectedReportType === 'POSTGRADOS' ? 'text-purple-600' : 'text-slate-400'}`} />
          <h4 className="font-bold text-xs text-slate-800">Postgrados (PhD/MSc)</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Cuarto y quinto nivel</p>
        </button>

        <button
          onClick={() => setSelectedReportType('PNF')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedReportType === 'PNF'
              ? 'bg-sky-50 border-sky-600 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className={`w-5 h-5 mb-2 ${selectedReportType === 'PNF' ? 'text-sky-600' : 'text-slate-400'}`} />
          <h4 className="font-bold text-xs text-slate-800">Docentes por PNF</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Distribución académica</p>
        </button>

        <button
          onClick={() => setSelectedReportType('INVESTIGACION')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedReportType === 'INVESTIGACION'
              ? 'bg-emerald-50 border-emerald-600 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BookOpen className={`w-5 h-5 mb-2 ${selectedReportType === 'INVESTIGACION' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <h4 className="font-bold text-xs text-slate-800">I+D+i e Intelectual</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Libros, Revistas, RECITVEN</p>
        </button>

        <button
          onClick={() => setSelectedReportType('GREMIO')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedReportType === 'GREMIO'
              ? 'bg-amber-50 border-amber-600 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Award className={`w-5 h-5 mb-2 ${selectedReportType === 'GREMIO' ? 'text-amber-600' : 'text-slate-400'}`} />
          <h4 className="font-bold text-xs text-slate-800">Gremio y Docencia</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">Colegiaturas y Componente</p>
        </button>
      </div>

      {/* Resumen del Reporte Seleccionado */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900">
            Vista Previa:{' '}
            {selectedReportType === 'GENERAL' && 'Censo General de Evaluación Institucional'}
            {selectedReportType === 'POSTGRADOS' && 'Padrón de Docentes con Postgrados (PhD, MSc, Especialidades)'}
            {selectedReportType === 'PNF' && 'Docentes por Programa Nacional de Formación (PNF)'}
            {selectedReportType === 'INVESTIGACION' && 'Investigadores, Publicaciones ISBN y Artículos Científicos'}
            {selectedReportType === 'GREMIO' && 'Gremio Profesional Universitario y Componente Docente'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Registros clasificados:{' '}
            <strong className="text-[#0B4D94] font-bold">{reportDocentes.length} profesionales</strong>
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={generatingPDF || reportDocentes.length === 0}
          className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Descargar PDF</span>
        </button>
      </div>

      {/* Tabla Interactiva del Reporte */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Cédula</th>
                <th className="py-2.5 px-3">Nombre Completo</th>
                <th className="py-2.5 px-3">Cargo</th>
                <th className="py-2.5 px-3">Profesión / Carrera</th>
                <th className="py-2.5 px-3">Postgrado</th>
                <th className="py-2.5 px-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {reportDocentes.map((d, i) => (
                <tr
                  key={d.cedula}
                  onClick={() => onSelectDocente(d)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                >
                  <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{i + 1}</td>
                  <td className="py-2 px-3 font-mono font-bold text-[#0B4D94]">{d.cedula}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800 uppercase">{d.nombre_completo}</td>
                  <td className="py-2 px-3 text-slate-600">{d.cargo || 'DOCENTE'}</td>
                  <td className="py-2 px-3">
                    <span className="font-semibold text-slate-700">{d.tipo_profesion || 'OTRO'}</span>
                    {d.carrera_pregrado && <span className="text-slate-500"> • {d.carrera_pregrado}</span>}
                  </td>
                  <td className="py-2 px-3">
                    {d.posee_doctorado === 1 ? (
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        PhD
                      </span>
                    ) : d.posee_maestria === 1 ? (
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        MSc
                      </span>
                    ) : d.posee_especialidad === 1 ? (
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        Esp
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Pregrado</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-[#0B4D94] font-semibold flex items-center gap-1">
                    <span>Ficha</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
