import React from 'react';
import { ShieldCheck, Award, ExternalLink, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
          {/* Logo & Agency Info */}
          <div className="md:col-span-2 flex items-center gap-4">
            <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl shrink-0 shadow-sm">
              <img
                src="https://pub-e4f5b0a4105248f090453c5e81b8348f.r2.dev/img/CYT.png"
                alt="Unidad de Ciencia y Tecnología UPTPC"
                className="h-16 w-auto object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Unidad de Ciencia y Tecnología (CYT)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Universidad Politécnica Territorial de Puerto Cabello (UPTPC)
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Rectorado • Dirección de Evaluación Institucional y Desarrollo Tecnológico
              </p>
            </div>
          </div>

          {/* Institutional details */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#0B4D94]" />
              <span>Marco Legal & Licencia</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Plataforma desarrollada bajo la{' '}
              <span className="font-semibold text-slate-900">Licencia Pública General Apache 3.0</span>.
              Fomentando la soberanía tecnológica, los datos abiertos y la interoperabilidad en la educación universitaria venezolana.
            </p>
          </div>

          {/* Location & Status */}
          <div className="text-left md:text-right text-xs text-slate-500">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Turso & R2 Conectados</span>
            </div>
            <p className="font-medium text-slate-700">Puerto Cabello, Estado Carabobo</p>
            <p className="text-[11px] text-slate-400">República Bolivariana de Venezuela</p>
            <p className="text-[10px] text-slate-400 mt-1">© {new Date().getFullYear()} UPTPC PEI. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

