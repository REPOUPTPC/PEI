import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  RefreshCw,
  Download,
  ArrowRight,
} from 'lucide-react';
import { useToast } from './Toast';

interface CargaMasivaCSVProps {
  onSuccess: () => void;
  currentUser?: any;
}

export const CargaMasivaCSV: React.FC<CargaMasivaCSVProps> = ({ onSuccess, currentUser }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Download template CSV completa
  const handleDownloadTemplate = () => {
    const csvContent =
      'CEDULA,NOMBRE_COMPLETO,CARGO,DESDE,PROFESION,CARRERA,PNF,EMAIL,TELEFONO\r\n' +
      'V-12345678,PEREZ LOPEZ JUAN CARLOS,ASISTENTE T.C.,2015-10-01,INGENIERO,Ingeniería Mecánica,PNF en Mecánica,juan.perez@uptpc.edu.ve,04121234567\r\n' +
      'V-87654321,GARCIA MORALES MARIA ELENA,AGREGADO D.E.,2010-03-15,LICENCIADO,Licenciatura en Educación,PNF en Turismo,maria.garcia@uptpc.edu.ve,04147654321\r\n';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_completa_docentes_uptpc.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download template CSV simplificada (solo Cédula y Nombre Completo)
  const handleDownloadTemplateBase = () => {
    const csvContent =
      'CEDULA,NOMBRE_COMPLETO\r\n' +
      'V-12345678,PEREZ LOPEZ JUAN CARLOS\r\n' +
      'V-87654321,GARCIA MORALES MARIA ELENA\r\n' +
      'V-11223344,HERNANDEZ VALDERRAMA CIRO\r\n';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_base_cedula_nombre_uptpc.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.type.includes('csv')) {
      showToast('error', 'Formato Inválido', 'Por favor seleccione un archivo en formato .CSV');
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    Papa.parse(selectedFile, {
      skipEmptyLines: true,
      complete: results => {
        setLoading(false);
        const data = results.data as any[];

        if (!data || data.length <= 1) {
          showToast('error', 'Archivo Vacío', 'El archivo CSV no contiene registros para procesar.');
          return;
        }

        // Regla explícita del usuario: "obviando la primera linea que es la que posee el encabezado de las tablas"
        const detectedHeaders = (data[0] || []).map((h: any) => String(h).trim());
        const contentRows = data.slice(1); // Excluir la primera línea (cabecera)

        setHeaders(detectedHeaders);
        setParsedRows(contentRows);
        showToast(
          'info',
          'Archivo CSV Precargado',
          `Se detectaron ${contentRows.length} registros (cabecera omitida con éxito).`
        );
      },
      error: err => {
        setLoading(false);
        showToast('error', 'Error al leer CSV', err.message);
      },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setFile(null);
    setParsedRows([]);
    setHeaders([]);
    setSuccessCount(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/docentes/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsedRows,
          registrado_por: currentUser?.username || 'CARGA_MASIVA',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessCount(json.totalProcesados);
        showToast('success', 'Importación Exitosa', json.message);
        onSuccess();
      } else {
        showToast('error', 'Error en la importación', json.error);
      }
    } catch (err: any) {
      showToast('error', 'Error de red', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-white p-6 sm:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in shadow-md">
      {/* Encabezado */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4D94] uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Digitalización y Carga Masiva</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Importación Masiva de Docentes desde Archivo CSV
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cargue un lote de docentes (puede incluir únicamente Cédula y Nombre, o el formulario extendido) para previsualizar e importar a Turso.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleDownloadTemplateBase}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-2 shadow-2xs"
            title="Descargar formato CSV solo con Cédula y Nombre Completo"
          >
            <Download className="w-3.5 h-3.5 text-[#0B4D94]" />
            <span>Plantilla Base (Cédula y Nombre)</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-2"
            title="Descargar formato CSV completo con todos los campos"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Plantilla Completa</span>
          </button>
        </div>
      </div>

      {/* Zona de Arrastrar y Soltar Archivo */}
      {!file ? (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-blue-200 hover:border-[#0B4D94] bg-blue-50/30 hover:bg-blue-50/60 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-3"
        >
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto text-[#0B4D94] shadow-sm">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Arrastre y suelte su archivo CSV aquí, o haga clic para examinar
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Compatible con archivos exportados de Excel (.csv delimitado por comas)
            </p>
          </div>
          <span className="inline-block text-[11px] font-semibold text-[#0B4D94] bg-white border border-blue-200 px-3 py-1 rounded-full shadow-2xs">
            Seleccionar archivo .CSV
          </span>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,text/csv"
            onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
        </div>
      ) : (
        /* Tarjeta de Archivo Seleccionado y Estadísticas */
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB •{' '}
                <span className="font-semibold text-emerald-700">{parsedRows.length} registros detectados</span> (línea 1 de encabezados excluida)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Descartar</span>
            </button>

            <button
              onClick={handleConfirmImport}
              disabled={loading || parsedRows.length === 0}
              className="bg-[#0B4D94] hover:bg-[#073262] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Importando a Turso...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar e Importar {parsedRows.length} Docentes</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Previsualización de la Tabla de Datos Precargados */}
      {parsedRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Previsualización de Datos Precargados (Primeros 15 de {parsedRows.length})</span>
            </h4>
            <span className="text-[11px] text-slate-400">Verifique los datos antes de confirmar el envío</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Cédula</th>
                    <th className="py-2.5 px-3">Nombre Completo</th>
                    <th className="py-2.5 px-3">Cargo</th>
                    <th className="py-2.5 px-3">Ingreso</th>
                    <th className="py-2.5 px-3">Profesión</th>
                    <th className="py-2.5 px-3">Carrera / Área</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {parsedRows.slice(0, 15).map((row, idx) => {
                    const ced = Array.isArray(row) ? row[0] : row.cedula || row.CEDULA;
                    const nom = Array.isArray(row) ? row[1] : row.nombre_completo || row.nombre;
                    const car = Array.isArray(row) ? row[2] : row.cargo;
                    const des = Array.isArray(row) ? row[3] : row.desde;
                    const pro = Array.isArray(row) ? row[4] : row.tipo_profesion || row.profesion;
                    const crr = Array.isArray(row) ? row[5] : row.carrera_pregrado || row.carrera;

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-[#0B4D94]">{ced}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800 uppercase">{nom}</td>
                        <td className="py-2 px-3 text-slate-600">{car || 'DOCENTE'}</td>
                        <td className="py-2 px-3 text-slate-500">{des || 'N/D'}</td>
                        <td className="py-2 px-3">
                          <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {pro || 'OTRO'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{crr || 'Sin carrera'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal o Tarjeta de Éxito al Completar */}
      {successCount !== null && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">¡Importación Masiva Completada Exitosamente!</h4>
              <p className="text-xs text-emerald-700">
                Se sincronizaron {successCount} registros en la base de datos Turso de UPTPC.
              </p>
            </div>
          </div>

          <a
            href="#docentes"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>Ir al Directorio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};

