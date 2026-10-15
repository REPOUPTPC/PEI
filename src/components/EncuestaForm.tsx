import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  Plus,
  Trash2,
  GraduationCap,
  BookOpen,
  MapPin,
  Building2,
  FileCheck,
  AlertCircle,
  Search,
  Sparkles,
  RefreshCw,
  Award,
  Atom,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  Docente,
  Estado,
  Municipio,
  Parroquia,
  Carrera,
  PNF,
  ItemAcademico,
  ItemLibro,
  ItemArticulo,
  ItemDiplomado,
} from '@/lib/types';
import { useToast } from './Toast';
import { SearchableSelect } from './SearchableSelect';

interface EncuestaFormProps {
  initialDocente?: Docente | null;
  onSuccess: () => void;
  onCancel: () => void;
  currentUser?: any;
}

export const EncuestaForm: React.FC<EncuestaFormProps> = ({
  initialDocente,
  onSuccess,
  onCancel,
  currentUser,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [searchingCedula, setSearchingCedula] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');

  // External reference data
  const [estados, setEstados] = useState<Estado[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [pnfList, setPnfList] = useState<PNF[]>([]);
  const [profesionesList, setProfesionesList] = useState<string[]>([
    'INGENIERO',
    'LICENCIADO',
    'MEDICO',
    'ARQUITECTO',
    'ABOGADO',
    'TSU',
  ]);
  const [otraProfesionInput, setOtraProfesionInput] = useState('');

  // Carrera autocomplete state
  const [carreraInput, setCarreraInput] = useState('');
  const [carreraDropdownOpen, setCarreraDropdownOpen] = useState(false);
  const [creatingCarrera, setCreatingCarrera] = useState(false);

  // Form State
  const [cedula, setCedula] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [cargo, setCargo] = useState('DOCENTE');
  const [desde, setDesde] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState('MASCULINO');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  // Ubicación
  const [idEstado, setIdEstado] = useState<number | ''>('');
  const [idMunicipio, setIdMunicipio] = useState<number | ''>('');
  const [idParroquia, setIdParroquia] = useState<number | ''>('');
  const [direccion, setDireccion] = useState('');

  // Título Universitario Pregrado
  const [tipoProfesion, setTipoProfesion] = useState('INGENIERO');
  const [carreraPregrado, setCarreraPregrado] = useState('');
  const [ramaEspecifica, setRamaEspecifica] = useState('');
  const [universidadPregrado, setUniversidadPregrado] = useState('');
  const [anioPregrado, setAnioPregrado] = useState<string | number>('');

  // Postgrados Dinámicos (Repeaters)
  const [poseeEspecialidad, setPoseeEspecialidad] = useState(false);
  const [especialidades, setEspecialidades] = useState<ItemAcademico[]>([]);

  const [poseeMaestria, setPoseeMaestria] = useState(false);
  const [maestrias, setMaestrias] = useState<ItemAcademico[]>([]);

  const [poseeDoctorado, setPoseeDoctorado] = useState(false);
  const [doctorados, setDoctorados] = useState<ItemAcademico[]>([]);

  // Docencia & Gremio
  const [componenteDocente, setComponenteDocente] = useState(false);
  const [usuarioRecitven, setUsuarioRecitven] = useState(false);
  const [colegiado, setColegiado] = useState(false);
  const [nombreColegio, setNombreColegio] = useState('');
  const [numeroColegio, setNumeroColegio] = useState('');
  const [selectedPnfs, setSelectedPnfs] = useState<string[]>([]);

  // Investigación
  const [lineaInvestigacion, setLineaInvestigacion] = useState('');
  const [investigacionEnDesarrollo, setInvestigacionEnDesarrollo] = useState(false);
  const [investigacionInstituto, setInvestigacionInstituto] = useState('');
  const [investigacionTitulo, setInvestigacionTitulo] = useState('');
  const [investigacionLinea, setInvestigacionLinea] = useState('');

  // Publicaciones
  const [publicacionesLibros, setPublicacionesLibros] = useState(false);
  const [libros, setLibros] = useState<ItemLibro[]>([]);

  const [publicacionesArticulos, setPublicacionesArticulos] = useState(false);
  const [articulos, setArticulos] = useState<ItemArticulo[]>([]);

  // Diplomados & Potencialidades
  const [poseeDiplomados, setPoseeDiplomados] = useState(false);
  const [diplomados, setDiplomados] = useState<ItemDiplomado[]>([]);
  const [potencialidades, setPotencialidades] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Load basic reference data
  useEffect(() => {
    fetch('/api/geografia/estados')
      .then(r => r.json())
      .then(d => d.success && setEstados(d.estados))
      .catch(console.error);

    fetch('/api/carreras')
      .then(r => r.json())
      .then(d => d.success && setCarreras(d.carreras))
      .catch(console.error);

    fetch('/api/pnfs')
      .then(r => r.json())
      .then(d => d.success && setPnfList(d.pnfs))
      .catch(console.error);

    fetch('/api/profesiones')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.profesiones)) {
          setProfesionesList(d.profesiones);
        }
      })
      .catch(console.error);
  }, []);

  // Cascading municipios
  useEffect(() => {
    if (idEstado) {
      fetch(`/api/geografia/municipios?id_estado=${idEstado}`)
        .then(r => r.json())
        .then(d => d.success && setMunicipios(d.municipios))
        .catch(console.error);
    } else {
      setMunicipios([]);
      setParroquias([]);
    }
  }, [idEstado]);

  // Cascading parroquias
  useEffect(() => {
    if (idMunicipio) {
      fetch(`/api/geografia/parroquias?id_municipio=${idMunicipio}`)
        .then(r => r.json())
        .then(d => d.success && setParroquias(d.parroquias))
        .catch(console.error);
    } else {
      setParroquias([]);
    }
  }, [idMunicipio]);

  // Hydrate initial docente if provided
  useEffect(() => {
    if (initialDocente) {
      setCedula(initialDocente.cedula || '');
      setNombreCompleto(initialDocente.nombre_completo || '');
      setCargo(initialDocente.cargo || 'DOCENTE');
      setDesde(initialDocente.desde || '');
      setFechaNacimiento(initialDocente.fecha_nacimiento || '');
      setGenero(initialDocente.genero || 'MASCULINO');
      setEmail(initialDocente.email || '');
      setTelefono(initialDocente.telefono || '');
      setFotoUrl(initialDocente.foto_url || '');

      setIdEstado(initialDocente.id_estado || '');
      setIdMunicipio(initialDocente.id_municipio || '');
      setIdParroquia(initialDocente.id_parroquia || '');
      setDireccion(initialDocente.direccion || '');

      if (initialDocente.tipo_profesion) {
        const tp = initialDocente.tipo_profesion.trim().toUpperCase();
        setProfesionesList(prev => (prev.includes(tp) ? prev : [...prev, tp]));
        setTipoProfesion(tp);
      } else {
        setTipoProfesion('INGENIERO');
      }
      setCarreraPregrado(initialDocente.carrera_pregrado || '');
      setCarreraInput(initialDocente.carrera_pregrado || '');
      setRamaEspecifica(initialDocente.rama_especifica || '');
      setUniversidadPregrado(initialDocente.universidad_pregrado || '');
      setAnioPregrado(initialDocente.anio_pregrado || '');

      setPoseeEspecialidad(initialDocente.posee_especialidad === 1);
      setEspecialidades(parseJsonSafe(initialDocente.especialidades));

      setPoseeMaestria(initialDocente.posee_maestria === 1);
      setMaestrias(parseJsonSafe(initialDocente.maestrias));

      setPoseeDoctorado(initialDocente.posee_doctorado === 1);
      setDoctorados(parseJsonSafe(initialDocente.doctorados));

      setComponenteDocente(initialDocente.componente_docente === 1);
      setUsuarioRecitven(initialDocente.usuario_recitven === 1);
      setColegiado(initialDocente.colegiado === 1);
      setNombreColegio(initialDocente.nombre_colegio || '');
      setNumeroColegio(initialDocente.numero_colegio || '');

      setSelectedPnfs(parseJsonSafe(initialDocente.pnfs));

      setLineaInvestigacion(initialDocente.linea_investigacion || '');
      setInvestigacionEnDesarrollo(initialDocente.investigacion_en_desarrollo === 1);
      setInvestigacionInstituto(initialDocente.investigacion_instituto || '');
      setInvestigacionTitulo(initialDocente.investigacion_titulo || '');
      setInvestigacionLinea(initialDocente.investigacion_linea || '');

      setPublicacionesLibros(initialDocente.publicaciones_libros === 1);
      setLibros(parseJsonSafe(initialDocente.libros_detalle));

      setPublicacionesArticulos(initialDocente.publicaciones_articulos === 1);
      setArticulos(parseJsonSafe(initialDocente.articulos_detalle));

      setPoseeDiplomados(initialDocente.posee_diplomados === 1);
      setDiplomados(parseJsonSafe(initialDocente.diplomados_detalle));
      setPotencialidades(initialDocente.potencialidades || '');
      setObservaciones(initialDocente.observaciones || '');
    }
  }, [initialDocente]);

  const parseJsonSafe = (str?: string) => {
    if (!str) return [];
    try {
      const p = JSON.parse(str);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  };

  // Live lookup by Cédula
  const handleLookupCedula = async (val: string) => {
    const clean = val.trim().toUpperCase();
    setCedula(clean);

    if (clean.length >= 6) {
      setSearchingCedula(true);
      try {
        const res = await fetch(`/api/docentes/${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (data.success && data.docente) {
          const doc = data.docente;
          setNombreCompleto(doc.nombre_completo || '');
          setCargo(doc.cargo || 'DOCENTE');
          setDesde(doc.desde || '');
          if (doc.encuestado === 1) {
            showToast('info', 'Docente ya censado', 'Cargando datos previos para actualización.');
          } else {
            showToast('success', 'Docente Activo Reconocido', `${doc.nombre_completo} (${doc.cargo})`);
          }
        }
      } catch (err) {
        // Not found, continues normal registration
      } finally {
        setSearchingCedula(false);
      }
    }
  };

  // Image Upload handler (File from disk or mobile gallery)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data,
            fileName: `${cedula || 'docente'}_${Date.now()}.jpg`,
            mimeType: file.type,
            cedula,
          }),
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.success) {
          setFotoUrl(uploadJson.url);
          showToast('success', 'Foto Cargada', 'La fotografía se almacenó correctamente en Cloudflare R2.');
        } else {
          showToast('error', 'Error al subir foto', uploadJson.error);
        }
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast('error', 'Error procesando imagen', err.message);
      setUploadingPhoto(false);
    }
  };

  // Direct WebCam Capture for Phone / Desktop Camera
  const startCamera = async (mode?: 'user' | 'environment') => {
    const targetMode = mode || cameraFacingMode;
    // Stop any existing stream tracks first
    if (videoRef.current?.srcObject) {
      const currentStream = videoRef.current.srcObject as MediaStream;
      currentStream.getTracks().forEach(t => t.stop());
    }

    setCameraActive(true);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraFacingMode(targetMode);
    } catch (err: any) {
      showToast(
        'error',
        'No se pudo acceder a la cámara',
        'Verifique los permisos de cámara en su navegador o utilice el botón "Subir Imagen".'
      );
      setCameraActive(false);
    }
  };

  const toggleCameraFacingMode = () => {
    const nextMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextMode);
    startCamera(nextMode);
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw square cropped image from center
    const vWidth = videoRef.current.videoWidth || 640;
    const vHeight = videoRef.current.videoHeight || 640;
    const minDim = Math.min(vWidth, vHeight);
    const startX = (vWidth - minDim) / 2;
    const startY = (vHeight - minDim) / 2;

    ctx.drawImage(videoRef.current, startX, startY, minDim, minDim, 0, 0, 640, 640);
    const base64Data = canvas.toDataURL('image/jpeg', 0.88);

    stopCamera();

    // Upload directly to Cloudflare R2
    setUploadingPhoto(true);
    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data,
          fileName: `${cedula || 'docente'}_cam_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          cedula,
        }),
      });
      const uploadJson = await uploadRes.json();
      if (uploadJson.success) {
        setFotoUrl(uploadJson.url);
        showToast('success', 'Foto Capturada con Cámara', 'Almacenada con éxito en Cloudflare R2.');
      } else {
        showToast('error', 'Error al subir foto', uploadJson.error);
      }
    } catch (err: any) {
      showToast('error', 'Error al subir foto', err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle Carrera Creation / Selection
  const handleSelectCarrera = (c: Carrera) => {
    setCarreraPregrado(c.nombre);
    setCarreraInput(c.nombre);
    if (c.tipo) setTipoProfesion(c.tipo);
    setCarreraDropdownOpen(false);
  };

  const handleCreateNewCarrera = async () => {
    if (!carreraInput.trim()) return;
    setCreatingCarrera(true);

    try {
      const res = await fetch('/api/carreras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: carreraInput.trim(),
          tipo: tipoProfesion,
        }),
      });
      const data = await res.json();
      if (data.success && data.carrera) {
        setCarreras(prev => [...prev, data.carrera]);
        setCarreraPregrado(data.carrera.nombre);
        setCarreraInput(data.carrera.nombre);
        setCarreraDropdownOpen(false);
        showToast('success', 'Carrera Registrada', `"${data.carrera.nombre}" se agregó a la base de datos.`);
      }
    } catch (err: any) {
      showToast('error', 'Error registrando carrera', err.message);
    } finally {
      setCreatingCarrera(false);
    }
  };

  // Toggle PNF
  const handleTogglePnf = (nombrePnf: string) => {
    setSelectedPnfs(prev =>
      prev.includes(nombrePnf) ? prev.filter(p => p !== nombrePnf) : [...prev, nombrePnf]
    );
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cedula.trim() || !nombreCompleto.trim()) {
      showToast('error', 'Campos Obligatorios', 'Por favor ingrese la Cédula y el Nombre Completo del docente.');
      return;
    }

    let effectiveProfesion = tipoProfesion;
    if (tipoProfesion === 'OTRO') {
      const cleanOtra = otraProfesionInput.trim().toUpperCase();
      if (!cleanOtra) {
        showToast('error', 'Profesión Incompleta', 'Por favor especifique el nombre de la otra profesión.');
        return;
      }
      effectiveProfesion = cleanOtra;
      // Persist in background so it forms part of future selections
      try {
        fetch('/api/profesiones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: cleanOtra }),
        }).catch(console.error);
        setProfesionesList(prev => (prev.includes(cleanOtra) ? prev : [...prev, cleanOtra]));
      } catch {}
    }

    setLoading(true);

    const estadoObj = estados.find(e => e.id_estado === Number(idEstado));
    const munObj = municipios.find(m => m.id_municipio === Number(idMunicipio));
    const parObj = parroquias.find(p => p.id_parroquia === Number(idParroquia));

    const payload = {
      cedula: cedula.trim().toUpperCase(),
      nombre_completo: nombreCompleto.trim().toUpperCase(),
      cargo,
      desde,
      fecha_nacimiento: fechaNacimiento,
      genero,
      email,
      telefono,
      foto_url: fotoUrl,

      id_estado: idEstado ? Number(idEstado) : null,
      estado_nombre: estadoObj?.estado || null,
      id_municipio: idMunicipio ? Number(idMunicipio) : null,
      municipio_nombre: munObj?.municipio || null,
      id_parroquia: idParroquia ? Number(idParroquia) : null,
      parroquia_nombre: parObj?.parroquia || null,
      direccion,

      tipo_profesion: effectiveProfesion,
      carrera_pregrado: carreraPregrado || carreraInput,
      rama_especifica: ramaEspecifica,
      universidad_pregrado: universidadPregrado,
      anio_pregrado: anioPregrado,

      posee_especialidad: poseeEspecialidad ? 1 : 0,
      especialidades,

      posee_maestria: poseeMaestria ? 1 : 0,
      maestrias,

      posee_doctorado: poseeDoctorado ? 1 : 0,
      doctorados,

      componente_docente: componenteDocente ? 1 : 0,
      usuario_recitven: usuarioRecitven ? 1 : 0,
      colegiado: colegiado ? 1 : 0,
      nombre_colegio: nombreColegio,
      numero_colegio: numeroColegio,

      pnfs: selectedPnfs,

      linea_investigacion: lineaInvestigacion,
      investigacion_en_desarrollo: investigacionEnDesarrollo ? 1 : 0,
      investigacion_instituto: investigacionInstituto,
      investigacion_titulo: investigacionTitulo,
      investigacion_linea: investigacionLinea,

      publicaciones_libros: publicacionesLibros ? 1 : 0,
      libros_detalle: libros,

      publicaciones_articulos: publicacionesArticulos ? 1 : 0,
      articulos_detalle: articulos,

      posee_diplomados: poseeDiplomados ? 1 : 0,
      diplomados_detalle: diplomados,
      potencialidades,
      observaciones,

      registrado_por: currentUser?.username || 'ENCUESTADOR',
    };

    try {
      const res = await fetch('/api/docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast('success', 'Censo Completado', `La ficha de ${nombreCompleto} ha sido registrada con éxito.`);
        onSuccess();
      } else {
        showToast('error', 'Error al guardar', json.error || 'Ocurrió un error');
      }
    } catch (err: any) {
      showToast('error', 'Error de conexión', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-white p-6 sm:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in shadow-md">
      {/* Encabezado del Formulario */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4D94] uppercase tracking-wider mb-1">
              <FileCheck className="w-4 h-4" />
              <span>Censo de Evaluación Institucional UPTPC</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Formulario de Recopilación Integral de Información Docente
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingrese o actualice las credenciales académicas, científicas y gremiales del profesional universitario.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
          >
            ← Volver al Directorio
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* BLOQUE 1: IDENTIFICACIÓN Y FOTOGRAFÍA (R2 + CÁMARA MÓVIL) */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-full bg-[#0B4D94] text-white text-xs flex items-center justify-center font-bold">
              1
            </span>
            <span>Identificación y Fotografía Oficial</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Cámara & Fotografía (Cloudflare R2) */}
            <div className="md:col-span-4 flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 bg-white flex items-center justify-center shadow-inner">
                {cameraActive ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      <span>EN VIVO ({cameraFacingMode === 'user' ? 'FRONTAL' : 'TRASERA'})</span>
                    </div>
                  </>
                ) : fotoUrl ? (
                  <img src={fotoUrl} alt="Foto del docente" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <Camera className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-[10px]">Sin fotografía</span>
                  </div>
                )}

                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-bold gap-1.5">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Subiendo a R2...</span>
                  </div>
                )}
              </div>

              {/* Botonera de Cámara / Upload */}
              <div className="w-full space-y-2">
                {cameraActive ? (
                  <div className="space-y-1.5 w-full">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Tomar Foto Ahora</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={toggleCameraFacingMode}
                        className="bg-blue-50 hover:bg-blue-100 text-[#0B4D94] border border-blue-200 font-semibold text-[10px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all"
                        title="Cambiar entre cámara trasera y frontal"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{cameraFacingMode === 'user' ? 'Cám. Trasera' : 'Cám. Frontal'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={stopCamera}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[10px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera('environment')}
                      className="bg-blue-50 hover:bg-blue-100 text-[#0B4D94] border border-blue-200 font-semibold text-[11px] py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Cámara Celular</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px] py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Imagen</span>
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <p className="text-[10px] text-slate-400 text-center">
                  Almacenamiento seguro en Cloudflare R2 (Rectorado)
                </p>
              </div>
            </div>

            {/* Datos Personales y de Contratación */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cédula de Identidad <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ej. V-12345678"
                    value={cedula}
                    onChange={e => handleLookupCedula(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                  />
                  {searchingCedula && (
                    <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-3 top-3" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Autocompleta si está en los docentes activos de UPTPC</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nombres y Apellidos"
                  value={nombreCompleto}
                  onChange={e => setNombreCompleto(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 uppercase focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cargo Institucional</label>
                <input
                  type="text"
                  placeholder="Ej. ASISTENTE T.C."
                  value={cargo}
                  onChange={e => setCargo(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Ingreso a UPTPC</label>
                <input
                  type="date"
                  value={desde}
                  onChange={e => setDesde(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={e => setFechaNacimiento(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Género</label>
                <select
                  value={genero}
                  onChange={e => setGenero(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none bg-white"
                >
                  <option value="MASCULINO">MASCULINO</option>
                  <option value="FEMENINO">FEMENINO</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="correo@uptpc.edu.ve"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  placeholder="0412-1234567"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE 2: PROCEDENCIA GEOGRÁFICA (VENEZUELA.SQL CASCADA) */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-full bg-[#0B4D94] text-white text-xs flex items-center justify-center font-bold">
              2
            </span>
            <span>Procedencia y Residencia (Geografía Nacional)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
              <SearchableSelect
                value={idEstado}
                onChange={val => {
                  setIdEstado(val ? Number(val) : '');
                  setIdMunicipio('');
                  setIdParroquia('');
                }}
                options={estados.map(est => ({
                  value: est.id_estado,
                  label: est.estado,
                }))}
                placeholder="Seleccione Estado..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Municipio</label>
              <SearchableSelect
                value={idMunicipio}
                disabled={!idEstado}
                disabledMessage="Seleccione Estado primero"
                onChange={val => {
                  setIdMunicipio(val ? Number(val) : '');
                  setIdParroquia('');
                }}
                options={municipios.map(m => ({
                  value: m.id_municipio,
                  label: m.municipio,
                }))}
                placeholder="Seleccione Municipio..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Parroquia</label>
              <SearchableSelect
                value={idParroquia}
                disabled={!idMunicipio}
                disabledMessage="Seleccione Municipio primero"
                onChange={val => setIdParroquia(val ? Number(val) : '')}
                options={parroquias.map(p => ({
                  value: p.id_parroquia,
                  label: p.parroquia,
                }))}
                placeholder="Seleccione Parroquia..."
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Dirección de Residencia</label>
              <input
                type="text"
                placeholder="Urbanización / Sector, Calle, Edificio o Casa"
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* BLOQUE 3: TÍTULO UNIVERSITARIO Y CARRERA AUTOCOMPLETABLE */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-full bg-[#0B4D94] text-white text-xs flex items-center justify-center font-bold">
              3
            </span>
            <span>Título Universitario y Clasificación Profesional</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipo de Profesión Principal <span className="text-rose-500">*</span>
              </label>
              <select
                value={tipoProfesion}
                onChange={e => {
                  setTipoProfesion(e.target.value);
                  if (e.target.value !== 'OTRO') {
                    setOtraProfesionInput('');
                  }
                }}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-semibold text-[#0B4D94] focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
              >
                {profesionesList.map(prof => (
                  <option key={prof} value={prof}>
                    {prof}
                  </option>
                ))}
                <option value="OTRO">OTRO (Especificar otra profesión...)</option>
              </select>
            </div>

            {tipoProfesion === 'OTRO' && (
              <div className="animate-slide-in">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Especifique la Profesión <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="EJ. ECONOMISTA, PSICÓLOGO, SOCIÓLOGO..."
                  value={otraProfesionInput}
                  onChange={e => setOtraProfesionInput(e.target.value.toUpperCase())}
                  className="w-full text-xs border-2 border-amber-400 bg-amber-50/50 rounded-lg p-2.5 font-bold uppercase focus:ring-2 focus:ring-[#0B4D94] focus:outline-none text-slate-900"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Se guardará en mayúsculas y formará parte de las opciones para otros docentes.
                </p>
              </div>
            )}

            {/* CARRERA AUTOCOMPLETABLE CON CREACIÓN EN CALIENTE */}
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Carrera Universitaria de Pregrado <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Escriba para buscar o crear..."
                value={carreraInput}
                onChange={e => {
                  setCarreraInput(e.target.value);
                  setCarreraPregrado(e.target.value);
                  setCarreraDropdownOpen(true);
                }}
                onFocus={() => setCarreraDropdownOpen(true)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
              />

              {/* Dropdown de Carreras Existentes o Opción de Crear */}
              {carreraDropdownOpen && carreraInput.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {carreras
                    .filter(c => c.nombre.toLowerCase().includes(carreraInput.toLowerCase()))
                    .slice(0, 8)
                    .map(c => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCarrera(c)}
                        className="p-2.5 hover:bg-blue-50 text-xs cursor-pointer flex items-center justify-between text-slate-800"
                      >
                        <span className="font-medium">{c.nombre}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          {c.tipo}
                        </span>
                      </div>
                    ))}

                  {/* Botón para crear nueva carrera si no coincide exacto */}
                  {!carreras.some(c => c.nombre.toLowerCase() === carreraInput.trim().toLowerCase()) && (
                    <div
                      onClick={handleCreateNewCarrera}
                      className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold cursor-pointer flex items-center gap-2 border-t border-amber-200"
                    >
                      <Plus className="w-4 h-4 text-amber-600" />
                      <span>
                        Registrar "{carreraInput.trim()}" en la base de datos de carreras
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rama Específica de la Profesión
              </label>
              <input
                type="text"
                placeholder="Ej. Mecánica Térmica, Sistemas, etc."
                value={ramaEspecifica}
                onChange={e => setRamaEspecifica(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Universidad de Egreso</label>
              <input
                type="text"
                placeholder="Ej. Universidad de Carabobo, UPTPC, USB"
                value={universidadPregrado}
                onChange={e => setUniversidadPregrado(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Año de Graduación</label>
              <input
                type="number"
                min="1960"
                max="2035"
                placeholder="Ej. 2005"
                value={anioPregrado}
                onChange={e => setAnioPregrado(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* BLOQUE 4: ESTUDIOS DE POSTGRADO (ESPECIALIDADES, MAESTRÍAS, DOCTORADOS) */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-full bg-[#0B4D94] text-white text-xs flex items-center justify-center font-bold">
              4
            </span>
            <span>Estudios de Cuarto y Quinto Nivel (Postgrado)</span>
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Especialidades */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={poseeEspecialidad}
                    onChange={e => {
                      setPoseeEspecialidad(e.target.checked);
                      if (e.target.checked && especialidades.length === 0) {
                        setEspecialidades([{ titulo: '', universidad: '', anio: '' }]);
                      }
                    }}
                    className="rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                  />
                  <span>¿Posee Especialidad?</span>
                </label>
                {poseeEspecialidad && (
                  <button
                    type="button"
                    onClick={() => setEspecialidades([...especialidades, { titulo: '', universidad: '', anio: '' }])}
                    className="text-[11px] text-[#0B4D94] font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                )}
              </div>

              {poseeEspecialidad && (
                <div className="space-y-2">
                  {especialidades.map((esp, i) => (
                    <div key={i} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1.5 relative">
                      <button
                        type="button"
                        onClick={() => setEspecialidades(especialidades.filter((_, idx) => idx !== i))}
                        className="absolute right-2 top-2 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        placeholder="Título de Especialidad"
                        value={esp.titulo}
                        onChange={e => {
                          const copy = [...especialidades];
                          copy[i].titulo = e.target.value;
                          setEspecialidades(copy);
                        }}
                        className="w-full text-[11px] border border-slate-200 rounded p-1.5"
                      />
                      <div className="grid grid-cols-3 gap-1.5">
                        <input
                          type="text"
                          placeholder="Universidad"
                          value={esp.universidad}
                          onChange={e => {
                            const copy = [...especialidades];
                            copy[i].universidad = e.target.value;
                            setEspecialidades(copy);
                          }}
                          className="col-span-2 text-[11px] border border-slate-200 rounded p-1.5"
                        />
                        <input
                          type="number"
                          placeholder="Año"
                          value={esp.anio || ''}
                          onChange={e => {
                            const copy = [...especialidades];
                            copy[i].anio = e.target.value;
                            setEspecialidades(copy);
                          }}
                          className="text-[11px] border border-slate-200 rounded p-1.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Maestrías / MSc */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={poseeMaestria}
                    onChange={e => {
                      setPoseeMaestria(e.target.checked);
                      if (e.target.checked && maestrias.length === 0) {
                        setMaestrias([{ titulo: '', universidad: '', anio: '' }]);
                      }
                    }}
                    className="rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                  />
                  <span>¿Posee Maestría / MSc?</span>
                </label>
                {poseeMaestria && (
                  <button
                    type="button"
                    onClick={() => setMaestrias([...maestrias, { titulo: '', universidad: '', anio: '' }])}
                    className="text-[11px] text-[#0B4D94] font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                )}
              </div>

              {poseeMaestria && (
                <div className="space-y-2">
                  {maestrias.map((m, i) => (
                    <div key={i} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1.5 relative">
                      <button
                        type="button"
                        onClick={() => setMaestrias(maestrias.filter((_, idx) => idx !== i))}
                        className="absolute right-2 top-2 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        placeholder="Título de Maestría (MSc)"
                        value={m.titulo}
                        onChange={e => {
                          const copy = [...maestrias];
                          copy[i].titulo = e.target.value;
                          setMaestrias(copy);
                        }}
                        className="w-full text-[11px] border border-slate-200 rounded p-1.5"
                      />
                      <div className="grid grid-cols-3 gap-1.5">
                        <input
                          type="text"
                          placeholder="Universidad"
                          value={m.universidad}
                          onChange={e => {
                            const copy = [...maestrias];
                            copy[i].universidad = e.target.value;
                            setMaestrias(copy);
                          }}
                          className="col-span-2 text-[11px] border border-slate-200 rounded p-1.5"
                        />
                        <input
                          type="number"
                          placeholder="Año"
                          value={m.anio || ''}
                          onChange={e => {
                            const copy = [...maestrias];
                            copy[i].anio = e.target.value;
                            setMaestrias(copy);
                          }}
                          className="text-[11px] border border-slate-200 rounded p-1.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Doctorados */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={poseeDoctorado}
                    onChange={e => {
                      setPoseeDoctorado(e.target.checked);
                      if (e.target.checked && doctorados.length === 0) {
                        setDoctorados([{ titulo: '', universidad: '', anio: '' }]);
                      }
                    }}
                    className="rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                  />
                  <span>¿Posee Doctorado (PhD)?</span>
                </label>
                {poseeDoctorado && (
                  <button
                    type="button"
                    onClick={() => setDoctorados([...doctorados, { titulo: '', universidad: '', anio: '' }])}
                    className="text-[11px] text-[#0B4D94] font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                )}
              </div>

              {poseeDoctorado && (
                <div className="space-y-2">
                  {doctorados.map((doc, i) => (
                    <div key={i} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1.5 relative">
                      <button
                        type="button"
                        onClick={() => setDoctorados(doctorados.filter((_, idx) => idx !== i))}
                        className="absolute right-2 top-2 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        placeholder="Título de Doctorado (PhD)"
                        value={doc.titulo}
                        onChange={e => {
                          const copy = [...doctorados];
                          copy[i].titulo = e.target.value;
                          setDoctorados(copy);
                        }}
                        className="w-full text-[11px] border border-slate-200 rounded p-1.5"
                      />
                      <div className="grid grid-cols-3 gap-1.5">
                        <input
                          type="text"
                          placeholder="Universidad"
                          value={doc.universidad}
                          onChange={e => {
                            const copy = [...doctorados];
                            copy[i].universidad = e.target.value;
                            setDoctorados(copy);
                          }}
                          className="col-span-2 text-[11px] border border-slate-200 rounded p-1.5"
                        />
                        <input
                          type="number"
                          placeholder="Año"
                          value={doc.anio || ''}
                          onChange={e => {
                            const copy = [...doctorados];
                            copy[i].anio = e.target.value;
                            setDoctorados(copy);
                          }}
                          className="text-[11px] border border-slate-200 rounded p-1.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BLOQUE 5: FORMACIÓN DOCENTE, GREMIO Y PROGRAMAS PNF EN UPTPC */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-full bg-[#0B4D94] text-white text-xs flex items-center justify-center font-bold">
              5
            </span>
            <span>Docencia, Gremio y Programas Nacionales de Formación (PNF)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Componente Docente */}
            <div
              onClick={() => setComponenteDocente(!componenteDocente)}
              className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                componenteDocente
                  ? 'bg-blue-50/90 border-[#0B4D94] shadow-xs ring-1 ring-[#0B4D94]/30'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div>
                <p className={`font-bold text-xs ${componenteDocente ? 'text-[#0B4D94]' : 'text-slate-800'}`}>
                  Componente Docente
                </p>
                <p className="text-[10px] text-slate-500">¿Posee formación pedagógica?</p>
              </div>
              <input
                type="checkbox"
                checked={componenteDocente}
                readOnly
                className="w-4 h-4 rounded text-[#0B4D94] focus:ring-[#0B4D94] pointer-events-none"
              />
            </div>

            {/* Usuario en RECITVEN */}
            <div
              onClick={() => setUsuarioRecitven(!usuarioRecitven)}
              className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                usuarioRecitven
                  ? 'bg-blue-50/90 border-[#0B4D94] shadow-xs ring-1 ring-[#0B4D94]/30'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div>
                <p className={`font-bold text-xs ${usuarioRecitven ? 'text-[#0B4D94]' : 'text-slate-800'}`}>
                  Usuario en RECITVEN
                </p>
                <p className="text-[10px] text-slate-500">Registro Científico e Innovación</p>
              </div>
              <input
                type="checkbox"
                checked={usuarioRecitven}
                readOnly
                className="w-4 h-4 rounded text-[#0B4D94] focus:ring-[#0B4D94] pointer-events-none"
              />
            </div>

            {/* Colegiado en Gremio */}
            <div
              onClick={() => setColegiado(!colegiado)}
              className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                colegiado
                  ? 'bg-blue-50/90 border-[#0B4D94] shadow-xs ring-1 ring-[#0B4D94]/30'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div>
                <p className={`font-bold text-xs ${colegiado ? 'text-[#0B4D94]' : 'text-slate-800'}`}>
                  Colegiado en Gremio
                </p>
                <p className="text-[10px] text-slate-500">CIV, Colegio de Licenciados, etc.</p>
              </div>
              <input
                type="checkbox"
                checked={colegiado}
                readOnly
                className="w-4 h-4 rounded text-[#0B4D94] focus:ring-[#0B4D94] pointer-events-none"
              />
            </div>

            {colegiado && (
              <>
                <div className="sm:col-span-2 animate-slide-in">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Colegio Profesional</label>
                  <input
                    type="text"
                    placeholder="Ej. Colegio de Ingenieros de Venezuela (CIV)"
                    value={nombreColegio}
                    onChange={e => setNombreColegio(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                  />
                </div>
                <div className="animate-slide-in">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número de Colegiatura / Carnet</label>
                  <input
                    type="text"
                    placeholder="Ej. CIV-123456"
                    value={numeroColegio}
                    onChange={e => setNumeroColegio(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* SELECCIÓN DE PROGRAMAS (PNF) SOLICITADOS */}
            <div className="sm:col-span-3 border border-slate-200 rounded-xl p-4 bg-white space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Programas de Formación en los que participa en UPTPC:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {pnfList.map(pnf => {
                  const isChecked = selectedPnfs.includes(pnf.nombre);
                  return (
                    <div
                      key={pnf.id}
                      onClick={() => handleTogglePnf(pnf.nombre)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-blue-50/90 border-[#0B4D94] text-[#0B4D94] font-bold shadow-xs ring-1 ring-[#0B4D94]/30'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="rounded text-[#0B4D94] focus:ring-[#0B4D94] pointer-events-none"
                      />
                      <span className="leading-tight">{pnf.nombre}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* BLOQUE 6: LÍNEAS DE INVESTIGACIÓN Y PRODUCCIÓN INTELECTUAL */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-full bg-[#0B4D94] text-white text-xs flex items-center justify-center font-bold">
              6
            </span>
            <span>Investigación y Publicaciones Científicas</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Línea de Investigación del Docente
              </label>
              <input
                type="text"
                placeholder="Ej. Energías Renovables, Inteligencia Artificial, Mantenimiento Predictivo..."
                value={lineaInvestigacion}
                onChange={e => setLineaInvestigacion(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
              />
            </div>

            {/* Investigación en Desarrollo */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={investigacionEnDesarrollo}
                  onChange={e => setInvestigacionEnDesarrollo(e.target.checked)}
                  className="rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                />
                <span>¿Posee en desarrollo alguna investigación actualmente?</span>
              </label>

              {investigacionEnDesarrollo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">¿En qué Instituto o Centro?</label>
                    <input
                      type="text"
                      placeholder="Ej. Centro de Investigaciones UPTPC"
                      value={investigacionInstituto}
                      onChange={e => setInvestigacionInstituto(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Línea de la Producción</label>
                    <input
                      type="text"
                      placeholder="Línea institucional"
                      value={investigacionLinea}
                      onChange={e => setInvestigacionLinea(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">¿De qué trata el estudio? (Título / Resumen)</label>
                    <textarea
                      rows={2}
                      placeholder="Describa el objetivo o título de la investigación..."
                      value={investigacionTitulo}
                      onChange={e => setInvestigacionTitulo(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Libros Publicados con ISBN */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publicacionesLibros}
                    onChange={e => {
                      setPublicacionesLibros(e.target.checked);
                      if (e.target.checked && libros.length === 0) {
                        setLibros([{ titulo: '', instituto_editorial: '', anio: '', isbn: '' }]);
                      }
                    }}
                    className="rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                  />
                  <span>¿Ha publicado libros? (con ISBN)</span>
                </label>
                {publicacionesLibros && (
                  <button
                    type="button"
                    onClick={() => setLibros([...libros, { titulo: '', instituto_editorial: '', anio: '', isbn: '' }])}
                    className="text-[11px] text-[#0B4D94] font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Libro</span>
                  </button>
                )}
              </div>

              {publicacionesLibros && (
                <div className="space-y-2">
                  {libros.map((lib, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => setLibros(libros.filter((_, idx) => idx !== i))}
                        className="absolute right-2 top-2 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        placeholder="Título del Libro"
                        value={lib.titulo}
                        onChange={e => {
                          const copy = [...libros];
                          copy[i].titulo = e.target.value;
                          setLibros(copy);
                        }}
                        className="w-full text-xs border border-slate-200 rounded p-1.5"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Editorial / Instituto"
                          value={lib.instituto_editorial}
                          onChange={e => {
                            const copy = [...libros];
                            copy[i].instituto_editorial = e.target.value;
                            setLibros(copy);
                          }}
                          className="text-xs border border-slate-200 rounded p-1.5"
                        />
                        <input
                          type="number"
                          placeholder="Año"
                          value={lib.anio || ''}
                          onChange={e => {
                            const copy = [...libros];
                            copy[i].anio = e.target.value;
                            setLibros(copy);
                          }}
                          className="text-xs border border-slate-200 rounded p-1.5"
                        />
                        <input
                          type="text"
                          placeholder="ISBN (ej. 978-980-12-...)"
                          value={lib.isbn || ''}
                          onChange={e => {
                            const copy = [...libros];
                            copy[i].isbn = e.target.value;
                            setLibros(copy);
                          }}
                          className="text-xs border border-slate-200 rounded p-1.5 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Artículos Científicos en Revistas */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publicacionesArticulos}
                    onChange={e => {
                      setPublicacionesArticulos(e.target.checked);
                      if (e.target.checked && articulos.length === 0) {
                        setArticulos([{ titulo: '', revista: '', anio: '', url_doi: '' }]);
                      }
                    }}
                    className="rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                  />
                  <span>¿Ha publicado artículos científicos en revistas?</span>
                </label>
                {publicacionesArticulos && (
                  <button
                    type="button"
                    onClick={() => setArticulos([...articulos, { titulo: '', revista: '', anio: '', url_doi: '' }])}
                    className="text-[11px] text-[#0B4D94] font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Artículo</span>
                  </button>
                )}
              </div>

              {publicacionesArticulos && (
                <div className="space-y-2">
                  {articulos.map((art, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => setArticulos(articulos.filter((_, idx) => idx !== i))}
                        className="absolute right-2 top-2 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        placeholder="Título del Artículo Científico"
                        value={art.titulo}
                        onChange={e => {
                          const copy = [...articulos];
                          copy[i].titulo = e.target.value;
                          setArticulos(copy);
                        }}
                        className="w-full text-xs border border-slate-200 rounded p-1.5"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Nombre de la Revista"
                          value={art.revista}
                          onChange={e => {
                            const copy = [...articulos];
                            copy[i].revista = e.target.value;
                            setArticulos(copy);
                          }}
                          className="text-xs border border-slate-200 rounded p-1.5"
                        />
                        <input
                          type="number"
                          placeholder="Año"
                          value={art.anio || ''}
                          onChange={e => {
                            const copy = [...articulos];
                            copy[i].anio = e.target.value;
                            setArticulos(copy);
                          }}
                          className="text-xs border border-slate-200 rounded p-1.5"
                        />
                        <input
                          type="text"
                          placeholder="DOI o Enlace Web"
                          value={art.url_doi || ''}
                          onChange={e => {
                            const copy = [...articulos];
                            copy[i].url_doi = e.target.value;
                            setArticulos(copy);
                          }}
                          className="text-xs border border-slate-200 rounded p-1.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BLOQUE 7: DIPLOMADOS Y POTENCIALIDADES PROFESIONALES */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-5 h-5 rounded-full bg-[#0B4D94] text-white text-xs flex items-center justify-center font-bold">
              7
            </span>
            <span>Diplomados y Potencialidades Profesionales</span>
          </h3>

          <div className="space-y-4">
            {/* Diplomados */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={poseeDiplomados}
                    onChange={e => {
                      setPoseeDiplomados(e.target.checked);
                      if (e.target.checked && diplomados.length === 0) {
                        setDiplomados([{ area: '', institucion: '', anio: '', horas: '' }]);
                      }
                    }}
                    className="rounded text-[#0B4D94] focus:ring-[#0B4D94]"
                  />
                  <span>¿Posee Diplomados en algunas áreas?</span>
                </label>
                {poseeDiplomados && (
                  <button
                    type="button"
                    onClick={() =>
                      setDiplomados([...diplomados, { area: '', institucion: '', anio: '', horas: '' }])
                    }
                    className="text-[11px] text-[#0B4D94] font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Diplomado</span>
                  </button>
                )}
              </div>

              {poseeDiplomados && (
                <div className="space-y-2">
                  {diplomados.map((dip, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => setDiplomados(diplomados.filter((_, idx) => idx !== i))}
                        className="absolute right-2 top-2 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        placeholder="Área del Diplomado"
                        value={dip.area}
                        onChange={e => {
                          const copy = [...diplomados];
                          copy[i].area = e.target.value;
                          setDiplomados(copy);
                        }}
                        className="w-full text-xs border border-slate-200 rounded p-1.5"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Institución Otorgante"
                          value={dip.institucion}
                          onChange={e => {
                            const copy = [...diplomados];
                            copy[i].institucion = e.target.value;
                            setDiplomados(copy);
                          }}
                          className="text-xs border border-slate-200 rounded p-1.5"
                        />
                        <input
                          type="number"
                          placeholder="Año"
                          value={dip.anio || ''}
                          onChange={e => {
                            const copy = [...diplomados];
                            copy[i].anio = e.target.value;
                            setDiplomados(copy);
                          }}
                          className="text-xs border border-slate-200 rounded p-1.5"
                        />
                        <input
                          type="number"
                          placeholder="Horas Académicas"
                          value={dip.horas || ''}
                          onChange={e => {
                            const copy = [...diplomados];
                            copy[i].horas = e.target.value;
                            setDiplomados(copy);
                          }}
                          className="text-xs border border-slate-200 rounded p-1.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Potencialidades Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Síntesis de Potencialidades Profesionales del Docente
              </label>
              <textarea
                rows={3}
                placeholder="Describa las competencias destacadas, habilidades técnicas, experiencia industrial, asesorías, consultorías o aportes estratégicos que brinda esta persona a la UPTPC..."
                value={potencialidades}
                onChange={e => setPotencialidades(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0B4D94] focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* BOTONES DE ENVÍO */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Registrado por: <strong className="text-slate-700">{currentUser?.username || 'ENCUESTADOR'}</strong>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#0B4D94] hover:bg-[#073262] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando en Turso...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completar y Guardar Censo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

