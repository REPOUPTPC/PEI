import React, { useMemo, useState } from 'react';
import { Camera, ChevronDown, ChevronUp, UserCircle2 } from 'lucide-react';
import { Docente } from '@/lib/types';
import { getEstadoCenso, getPorcentajeCenso } from '@/lib/censo';

interface AvisoFotosPendientesProps {
  docentes: Docente[];
  currentUser: any;
  onCompletar: (docente: Docente) => void;
}

/**
 * Aviso para las personas que realizan el censo:
 * muestra los perfiles (censados o en progreso) a los que aún no se les ha tomado la fotografía.
 * - ENCUESTADOR: solo ve los perfiles registrados por él/ella.
 * - ADMIN / SUPERADMIN: ve todos, agrupados por encuestador.
 */
export const AvisoFotosPendientes: React.FC<AvisoFotosPendientesProps> = ({ docentes, currentUser, onCompletar }) => {
  const [abierto, setAbierto] = useState(false);

  const esEncuestador = currentUser?.rol === 'ENCUESTADOR';
  const username = (currentUser?.username || '').toString().trim().toUpperCase();

  const sinFoto = useMemo(() => {
    return docentes
      .filter(d => getEstadoCenso(d) !== 'PENDIENTE')
      .filter(d => !d.foto_url || !String(d.foto_url).trim())
      .filter(d => !esEncuestador || (d.registrado_por || '').toString().trim().toUpperCase() === username)
      .sort((a, b) => (a.nombre_completo || '').localeCompare(b.nombre_completo || '', 'es'));
  }, [docentes, esEncuestador, username]);

  if (!currentUser || sinFoto.length === 0) return null;

  return (
    <div className="mb-5 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 via-orange-50/50 to-rose-50 shadow-2xs overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between gap-3 p-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-rose-900">
              {esEncuestador ? 'Tienes' : 'Hay'} {sinFoto.length} perfil{sinFoto.length === 1 ? '' : 'es'} de docentes sin
              fotografía
            </p>
            <p className="text-[11px] text-rose-800/80">
              Aún no se ha tomado la foto al profesor. La fotografía forma parte del porcentaje requerido para considerar la
              planilla censada.
            </p>
          </div>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-rose-800">
          {abierto ? 'Ocultar' : 'Ver perfiles'}
          {abierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${abierto ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="px-3.5 pb-3.5 max-h-72 overflow-y-auto space-y-1.5">
            {sinFoto.map(d => {
              const estado = getEstadoCenso(d);
              const pct = getPorcentajeCenso(d);
              return (
                <div
                  key={d.cedula}
                  className="flex items-center justify-between gap-3 p-2.5 bg-white border border-rose-100 rounded-lg"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserCircle2 className="w-7 h-7 text-slate-300 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{d.nombre_completo}</p>
                      <p className="text-[10px] text-slate-500">
                        C.I. {d.cedula}
                        {!esEncuestador && d.registrado_por ? ` • Encuestador: ${d.registrado_por}` : ''}
                        {' • '}
                        <span className={estado === 'CENSADO' ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                          {estado === 'CENSADO' ? 'Censado' : 'En progreso'} ({pct}%)
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCompletar(d)}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#0B4D94] hover:bg-[#073262] text-white text-[11px] font-bold rounded-lg transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Tomar foto</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvisoFotosPendientes;
