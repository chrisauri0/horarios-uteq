import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

/** Error con mensaje listo para mostrar y detalles opcionales (lista). */
class ApiError extends Error {
  constructor(message: string, public detalles: string[] = []) {
    super(message);
    this.name = 'ApiError';
  }
}

type ToastTipo = 'success' | 'warning' | 'error';

@Component({
  selector: 'app-scheduler',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './scheduler.html',
  styleUrls: ['./scheduler.scss']
})
export class SchedulerComponent implements OnInit {
  // TODO: idealmente mover estas URLs a environment.ts
  private readonly apiBaseUrl = 'https://horarios-backend-58w8.onrender.com';
  private readonly pythonBaseUrl = 'https://ortools-horarios.onrender.com'; // <- pon aquí tu URL real de Python

  // Rango de horas que se manda al generador (17:00 a 22:00 = 5 slots).
  // Ajusta hora_fin si tu build_slots_hora trata el fin de forma distinta.
  private readonly horaInicio = 17;
  private readonly horaFin = 22;

  private readonly timeoutPythonMs = 120_000; // cold start de Render (~50 s) + solver (30 s)
  private readonly timeoutNestMs = 60_000;

  private readonly claseColorClasses = [
    'clase-tone-1', 'clase-tone-2', 'clase-tone-3', 'clase-tone-4',
    'clase-tone-5', 'clase-tone-6', 'clase-tone-7', 'clase-tone-8'
  ];
  private readonly diasMap: Record<string, string> = {
    lun: 'Lun', lunes: 'Lun',
    mar: 'Mar', martes: 'Mar',
    mie: 'Mie', miercoles: 'Mie', miércoles: 'Mie',
    jue: 'Jue', jueves: 'Jue',
    vie: 'Vie', viernes: 'Vie'
  };
  private readonly motivosTexto: Record<string, string> = {
    infactible: 'las restricciones no se pueden cumplir',
    tiempo_agotado: 'se agotó el tiempo de cálculo',
    horas_excedidas: 'pide más horas de las permitidas',
    profesor_sin_disponibilidad: 'el profesor no tiene disponibilidad',
    grupo_saturado: 'el grupo tiene demasiadas horas',
    conflicto_de_recursos: 'profesor o salón ocupados en otros grupos',
    no_cubierto_por_solver: 'el generador no pudo colocarla',
    sin_solucion_factible: 'no hay solución factible'
  };

  // ── Estado ────────────────────────────────────────────────────────────
  loading = false;
  message = '';
  modoActual: 'generar' | 'ver' = 'generar';
  mostrarToast = false;
  toastTipo: ToastTipo = 'success';
  toastDetalles: string[] = [];
  private toastTimer?: ReturnType<typeof setTimeout>;

  /** Compatibilidad con el HTML anterior ([class.success]="isSuccess"). */
  get isSuccess(): boolean {
    return this.toastTipo === 'success';
  }

  usuarioNombre = '';
  usuarioCarrera = '';
  usuarioDivision = '';
  usuarioTurno = '';

  groupedSchedules: Array<{ nombregrupo: string; data: any[] }> = [];
  profesoresConHorarios: Array<{ nombre: string; clases: any[] }> = [];
  diasSemana: string[] = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'];
  horas: string[] = ['17', '18', '19', '20', '21'];
  vistaHorarios: 'grupo' | 'profesor' = 'grupo';

  gruposPreview: Array<{ id: string; nombre: string; division: string; selected: boolean; grado: number | string }> = [];
  profesoresPreview: Array<{ id: string; nombre: string; materias: string[]; disponibilidad: Array<string | Record<string, unknown>>; selected: boolean }> = [];
  salonesPreview: Array<{ id: string; nombre: string; division: string; selected: boolean }> = [];
  materiasPreview: Array<{ id: string; nombre: string; carrera: string; grado: number | string; horas_semana: number; salones: string[]; selected: boolean }> = [];

  // Paginación
  paginaActualGrupos = 0;
  gruposPorPagina = 1;
  paginaActualProfesores = 0;
  profesoresPorPagina = 1;

  get gruposConHorariosFiltered(): Array<{ nombregrupo: string; data: any[] }> {
    return this.groupedSchedules;
  }

  get gruposEnPaginaActual(): Array<{ nombregrupo: string; data: any[] }> {
    const inicio = this.paginaActualGrupos * this.gruposPorPagina;
    return this.gruposConHorariosFiltered.slice(inicio, inicio + this.gruposPorPagina);
  }

  get totalPaginasGrupos(): number {
    return Math.ceil(this.gruposConHorariosFiltered.length / this.gruposPorPagina);
  }

  get profesoresEnPaginaActual(): Array<{ nombre: string; clases: any[] }> {
    const inicio = this.paginaActualProfesores * this.profesoresPorPagina;
    return this.profesoresConHorarios.slice(inicio, inicio + this.profesoresPorPagina);
  }

  get totalPaginasProfesores(): number {
    return Math.ceil(this.profesoresConHorarios.length / this.profesoresPorPagina);
  }

  get totalGruposSeleccionados(): number {
    return this.gruposPreview.filter((g) => g.selected).length;
  }

  get totalProfesoresSeleccionados(): number {
    return this.profesoresPreview.filter((p) => p.selected).length;
  }

  get totalSalonesSeleccionados(): number {
    return this.salonesPreview.filter((s) => s.selected).length;
  }

  get totalMateriasSeleccionadas(): number {
    return this.materiasPreview.filter((m) => m.selected).length;
  }

  // ── Ciclo de vida ─────────────────────────────────────────────────────
  ngOnInit(): void {
    this.usuarioNombre = 'Usuario';
    this.usuarioCarrera = '';
    this.usuarioDivision = '';
    this.usuarioTurno = '';

    try {
      const usuarioData = localStorage.getItem('userData');
      if (usuarioData) {
        const user = JSON.parse(usuarioData);
        const division = user?.metadata?.division ?? '';
        const turno = user?.metadata?.turno ?? '';

        this.usuarioNombre = user?.full_name || 'Usuario';
        this.usuarioDivision = division;
        this.usuarioTurno = turno;
        this.usuarioCarrera = division || turno ? `${division} - ${turno}` : '';
      }
    } catch (e) {
      console.error('userData inválido en localStorage', e);
    }

    this.cargarDatosPreview();
    this.cargarHorariosCreados();
    this.despertarPython();
  }

  /** Ping al health de Python para que Render lo despierte antes de generar. */
  private despertarPython(): void {
    fetch(`${this.pythonBaseUrl}/health`).catch(() => { /* silencioso */ });
  }

  // ── Toasts ────────────────────────────────────────────────────────────
  private mostrarToastConEstado(mensaje: string, tipo: ToastTipo, ms: number, detalles: string[] = []): void {
    clearTimeout(this.toastTimer);
    this.message = mensaje;
    this.toastTipo = tipo;
    this.toastDetalles = detalles;
    this.mostrarToast = true;
    this.toastTimer = setTimeout(() => (this.mostrarToast = false), ms);
  }

  mostrarToastExitoso(mensaje: string): void {
    this.mostrarToastConEstado(mensaje, 'success', 4000);
  }

  mostrarToastAviso(mensaje: string, detalles: string[] = []): void {
    this.mostrarToastConEstado(mensaje, 'warning', 15000, detalles);
  }

  mostrarToastError(mensaje: string, detalles: string[] = []): void {
    this.mostrarToastConEstado(mensaje, 'error', 10000, detalles);
  }

  cerrarToast(): void {
    clearTimeout(this.toastTimer);
    this.mostrarToast = false;
  }

  // ── Red ───────────────────────────────────────────────────────────────
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async fetchConTimeout(url: string, init: RequestInit, ms: number, servicio: string): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      return await fetch(url, { ...init, signal: ctrl.signal });
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        throw new ApiError(
          `${servicio} tardó demasiado en responder (más de ${Math.round(ms / 1000)} s). ` +
          'Puede estar despertando; intenta de nuevo en un momento.'
        );
      }
      throw new ApiError(`No se pudo conectar con ${servicio}. Revisa tu conexión o intenta en unos segundos.`);
    } finally {
      clearTimeout(timer);
    }
  }

  private formatearFuera(f: any): string {
    const motivo = f?.mensaje || this.motivosTexto[f?.motivo] || f?.motivo || 'sin detalle';
    return `${f?.grupo ?? '?'} · ${f?.materia ?? '?'}: faltan ${f?.horas_faltantes ?? '?'} h (${motivo})`;
  }

  private resumirLista(items: string[], max = 6): string[] {
    const unicos = Array.from(new Set(items.filter(Boolean)));
    if (unicos.length <= max) return unicos;
    return [...unicos.slice(0, max), `…y ${unicos.length - max} más`];
  }

  /** Convierte una respuesta HTTP con error (Python o Nest) en un ApiError legible. */
  private async leerError(res: Response, servicio: string): Promise<ApiError> {
    if (res.status === 401 || res.status === 403) {
      return new ApiError('Tu sesión expiró o no tienes permiso. Vuelve a iniciar sesión.');
    }

    const text = await res.text();
    let body: any = null;
    try { body = JSON.parse(text); } catch { /* no era JSON */ }

    const base = body?.error ?? body?.message ?? body?.detail;
    let mensaje: string;
    if (Array.isArray(base)) {
      mensaje = base.map((x: any) => (typeof x === 'string' ? x : x?.msg ?? JSON.stringify(x))).join(', ');
    } else if (typeof base === 'string' && base) {
      mensaje = base;
    } else {
      mensaje = `${servicio} respondió con error ${res.status}.`;
    }
    if (body?.job_id) mensaje += ` (ref: ${body.job_id})`;

    const detalles: string[] = [];
    if (Array.isArray(body?.materias_fuera)) detalles.push(...body.materias_fuera.map((f: any) => this.formatearFuera(f)));
    if (Array.isArray(body?.advertencias)) detalles.push(...body.advertencias.map((a: any) => a?.mensaje));
    if (!detalles.length && typeof body?.detalle === 'string') detalles.push(body.detalle);

    return new ApiError(mensaje, this.resumirLista(detalles));
  }

  // ── Normalización de clases ───────────────────────────────────────────
  getClase(data: any[], dia: string, hora: string): any {
    return data.find(c => this.normalizarDiaClase(c) === dia && this.normalizarHoraClase(c) === hora) || null;
  }

  getClaseProfesor(clases: any[], dia: string, hora: string): any {
    return clases.find(c => this.normalizarDiaClase(c) === dia && this.normalizarHoraClase(c) === hora) || null;
  }

  private normalizarDiaClase(clase: any): string {
    if (typeof clase?.start === 'string' && clase.start.length >= 3) {
      return clase.start.substring(0, 3);
    }
    const rawDia = String(clase?.dia || clase?.day || '').trim().toLowerCase();
    return this.diasMap[rawDia] || '';
  }

  private normalizarHoraClase(clase: any): string {
    if (typeof clase?.start === 'string' && clase.start.length >= 5) {
      return clase.start.substring(3, 5);
    }
    const rawHora = String(clase?.hora || clase?.time || '').trim();
    const match = rawHora.match(/^(\d{1,2})/);
    return match ? match[1].padStart(2, '0') : '';
  }

  private normalizarClase(rawClase: any): any {
    const dia = this.normalizarDiaClase(rawClase);
    const hora = this.normalizarHoraClase(rawClase);
    const start = dia && hora ? `${dia}${hora}:00` : '';

    return {
      ...rawClase,
      start,
      subj: rawClase?.subj || rawClase?.materia || rawClase?.subject || 'Sin materia',
      prof: rawClase?.prof || rawClase?.profesor || rawClase?.teacher || 'Sin profesor',
      room: rawClase?.room || rawClase?.salon || rawClase?.salón || rawClase?.classroom || 'Sin salón',
      group: rawClase?.group || rawClase?.grupo || rawClase?.nombregrupo || ''
    };
  }

  getClaseColorClass(materia: unknown): string {
    const nombre = String(materia || '').trim().toLowerCase();
    if (!nombre) return this.claseColorClasses[0];
    const hash = nombre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.claseColorClasses[hash % this.claseColorClasses.length];
  }

  // ── Carga de datos ────────────────────────────────────────────────────
  async cargarDatosPreview() {
    try {
      const headers = this.getAuthHeaders();
      const [gruposRes, profesoresRes, salonesRes, materiasRes] = await Promise.all([
        fetch(`${this.apiBaseUrl}/grupos`, { headers }),
        fetch(`${this.apiBaseUrl}/profesores`, { headers }),
        fetch(`${this.apiBaseUrl}/salones`, { headers }),
        fetch(`${this.apiBaseUrl}/materias`, { headers })
      ]);

      const fallidos = [
        ['grupos', gruposRes], ['profesores', profesoresRes],
        ['salones', salonesRes], ['materias', materiasRes]
      ].filter(([, r]) => !(r as Response).ok).map(([n]) => n as string);

      if (fallidos.length) {
        throw new ApiError(`No se pudieron cargar: ${fallidos.join(', ')}. Revisa tu sesión o conexión.`);
      }

      const [gruposData, profesoresData, salonesData, materiasData] = await Promise.all([
        gruposRes.json(), profesoresRes.json(), salonesRes.json(), materiasRes.json()
      ]);

      this.gruposPreview = this.normalizeGrupos(gruposData);
      this.profesoresPreview = this.normalizeProfesores(profesoresData);
      this.salonesPreview = this.normalizeSalones(salonesData);
      this.materiasPreview = this.normalizeMaterias(materiasData);
    } catch (error: any) {
      console.error('Error al cargar preview de datos:', error);
      this.mostrarToastError(
        error instanceof ApiError
          ? error.message
          : 'No se pudo cargar el preview. Revisa tu conexión e intenta de nuevo.'
      );
    }
  }

  async cargarHorariosCreados() {
    try {
      const res = await this.fetchConTimeout(
        `${this.apiBaseUrl}/scheduler`,
        { headers: this.getAuthHeaders() },
        this.timeoutNestMs,
        'el servidor'
      );
      if (!res.ok) throw await this.leerError(res, 'El servidor');

      const data = await res.json();
      // El backend puede devolver { schedules: [...] } o directamente un array
      const schedulesArray = Array.isArray(data) ? data : (data?.schedules ?? []);

      if (!Array.isArray(schedulesArray)) {
        this.groupedSchedules = [];
        this.profesoresConHorarios = [];
        return;
      }

      this.groupedSchedules = schedulesArray.map((s: any) => ({
        nombregrupo: s.nombregrupo ?? s.groupName ?? 'Sin nombre',
        data: Array.isArray(s.data) ? s.data.map((clase: any) => this.normalizarClase(clase)) : []
      }));

      const clasesTodas: any[] = this.groupedSchedules.flatMap((g) => g.data);
      const profesoresMap: Record<string, any[]> = {};
      for (const clase of clasesTodas) {
        const nombreProfesor = String(clase.prof || '').trim();
        if (!nombreProfesor) continue;
        (profesoresMap[nombreProfesor] ??= []).push(clase);
      }
      this.profesoresConHorarios = Object.entries(profesoresMap).map(([nombre, clases]) => ({ nombre, clases }));
    } catch (err: any) {
      console.error('Error al cargar horarios creados:', err);
      this.mostrarToastError(
        'No se pudo cargar la lista de horarios creados.',
        err instanceof ApiError ? [err.message, ...err.detalles] : []
      );
    }
  }

  // ── Normalizadores del preview ────────────────────────────────────────
  private normalizeGrupos(raw: unknown): Array<{ id: string; nombre: string; division: string; selected: boolean; grado: number | string }> {
    if (!Array.isArray(raw)) return [];

    const divisionUsuario = this.usuarioDivision.toLowerCase();
    return raw
      .map((item: any, index: number) => ({
        id: item?.id ?? `g-${index}`,
        nombre: item?.nombre ?? `Grupo ${index + 1}`,
        division: item?.division ?? '',
        grado: item?.grado ?? ''
      }))
      .filter((grupo) => !divisionUsuario || !grupo.division || grupo.division.toLowerCase() === divisionUsuario)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((grupo) => ({ ...grupo, selected: true }));
  }

  private normalizeDisponibilidad(rawDisponibilidad: unknown): Array<string | Record<string, unknown>> {
    if (!Array.isArray(rawDisponibilidad)) return [];

    return rawDisponibilidad
      .map((bloque) => {
        if (bloque && typeof bloque === 'object') {
          return bloque as Record<string, unknown>;
        }
        if (typeof bloque === 'string') {
          const trimmed = bloque.trim();
          if (!trimmed) return null;
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object') {
              return parsed as Record<string, unknown>;
            }
          } catch {
            // Si no es JSON válido, se conserva como string.
          }
          return trimmed;
        }
        return null;
      })
      .filter((bloque): bloque is string | Record<string, unknown> => bloque !== null);
  }

  private normalizeProfesores(raw: unknown): Array<{ id: string; nombre: string; materias: string[]; disponibilidad: Array<string | Record<string, unknown>>; selected: boolean }> {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item: any, index: number) => ({
        id: item?.profesor_id ?? item?.id ?? `p-${index}`,
        nombre: `${item?.nombre ?? ''} ${item?.apellidos ?? ''}`.trim() || `Profesor ${index + 1}`,
        materias: Array.isArray(item?.materias) ? item.materias.map((m: unknown) => String(m).trim()).filter(Boolean) : [],
        disponibilidad: this.normalizeDisponibilidad(item?.metadata?.disponibilidad ?? item?.disponibilidad)
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((profesor) => ({ ...profesor, selected: true }));
  }

  private normalizeSalones(raw: unknown): Array<{ id: string; nombre: string; division: string; selected: boolean }> {
    if (!Array.isArray(raw)) return [];

    const divisionUsuario = this.usuarioDivision.toLowerCase();
    return raw
      .map((item: any, index: number) => ({
        id: item?.id ?? `s-${index}`,
        nombre: item?.nombre ?? `Salon ${index + 1}`,
        division: item?.division ?? ''
      }))
      .filter((salon) => !divisionUsuario || !salon.division || salon.division.toLowerCase() === divisionUsuario)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((salon) => ({ ...salon, selected: true }));
  }

  private extractSalones(rawSalones: unknown): string[] {
    if (Array.isArray(rawSalones)) {
      return rawSalones.map((salon) => String(salon).trim()).filter(Boolean);
    }
    if (rawSalones && typeof rawSalones === 'object') {
      return Object.values(rawSalones as Record<string, unknown>)
        .map((salon) => String(salon).trim())
        .filter(Boolean);
    }
    if (typeof rawSalones === 'string' && rawSalones.trim()) {
      return [rawSalones.trim()];
    }
    return [];
  }

  private normalizeMaterias(raw: unknown): Array<{ id: string; nombre: string; carrera: string; grado: number | string; horas_semana: number; salones: string[]; selected: boolean }> {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item: any, index: number) => ({
        id: item?.id ?? `m-${index}`,
        nombre: item?.nombre ?? `Materia ${index + 1}`,
        carrera: item?.carrera ?? '',
        grado: item?.grado ?? '',
        horas_semana: item?.horas_semana ?? 0,
        salones: this.extractSalones(item?.salones)
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((materia) => ({ ...materia, selected: true }));
  }

  // ── Interacción UI ────────────────────────────────────────────────────
  seleccionarTodo(tipo: 'grupos' | 'profesores' | 'salones' | 'materias', selected: boolean) {
    this.getSelectionList(tipo).forEach((item) => {
      item.selected = selected;
    });
  }

  private getSelectionList(tipo: 'grupos' | 'profesores' | 'salones' | 'materias') {
    if (tipo === 'grupos') return this.gruposPreview;
    if (tipo === 'profesores') return this.profesoresPreview;
    if (tipo === 'materias') return this.materiasPreview;
    return this.salonesPreview;
  }

  irAPaginaGrupo(numeroPagina: number): void {
    if (numeroPagina >= 0 && numeroPagina < this.totalPaginasGrupos) {
      this.paginaActualGrupos = numeroPagina;
    }
  }

  irAPaginaProfesor(numeroPagina: number): void {
    if (numeroPagina >= 0 && numeroPagina < this.totalPaginasProfesores) {
      this.paginaActualProfesores = numeroPagina;
    }
  }

  generarRangoNumeros(cantidad: number): number[] {
    return Array.from({ length: cantidad }, (_, i) => i);
  }

  cambiarModo(nuevo: 'generar' | 'ver'): void {
    this.modoActual = nuevo;
  }

  // ── Generar y guardar ─────────────────────────────────────────────────
  async generateSchedule() {
    const gruposSeleccionados = this.gruposPreview
      .filter((g) => g.selected)
      .map((g) => ({ nombre: g.nombre, grado: g.grado }));

    const profesoresSeleccionados = this.profesoresPreview
      .filter((p) => p.selected)
      .map((p) => ({ nombre: p.nombre, materias: p.materias, disponibilidad: p.disponibilidad }));

    const salonesSeleccionados = this.salonesPreview
      .filter((s) => s.selected)
      .map((s) => s.nombre);

    const materiasSeleccionadas = this.materiasPreview
      .filter((m) => m.selected)
      .map((m) => ({ nombre: m.nombre, grado: m.grado, salones: m.salones, horas: m.horas_semana }));

    const faltantes: string[] = [];
    if (!gruposSeleccionados.length) faltantes.push('1 grupo');
    if (!profesoresSeleccionados.length) faltantes.push('1 profesor');
    if (!materiasSeleccionadas.length) faltantes.push('1 materia');
    if (!salonesSeleccionados.length) faltantes.push('1 salón');

    if (faltantes.length) {
      this.mostrarToastError(`Selecciona al menos ${faltantes.join(', ')} para generar.`);
      return;
    }

    this.loading = true;
    this.cerrarToast();

    const payload = {
      rango_horario: { hora_inicio: this.horaInicio, hora_fin: this.horaFin },
      grupos: gruposSeleccionados,
      profesores: profesoresSeleccionados,
      salones: salonesSeleccionados,
      materias: materiasSeleccionadas,
    };

    try {
      // 1) Generar en Python
      const pythonRes = await this.fetchConTimeout(
        `${this.pythonBaseUrl}/generar-horario`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        this.timeoutPythonMs,
        'el generador de horarios'
      );

      if (!pythonRes.ok) throw await this.leerError(pythonRes, 'El generador');

      const pythonData = await pythonRes.json();

      const horario = Array.isArray(pythonData) ? pythonData : pythonData?.horario;
      if (!Array.isArray(horario) || !horario.length) {
        throw new ApiError('El generador respondió sin ninguna clase. Revisa los datos seleccionados.');
      }

      // 2) Guardar en Nest (requiere token)
      const saveRes = await this.fetchConTimeout(
        `${this.apiBaseUrl}/scheduler/guardar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
          body: JSON.stringify({ horario }),
        },
        this.timeoutNestMs,
        'el servidor'
      );

      if (!saveRes.ok) {
        const err = await this.leerError(saveRes, 'El servidor');
        throw new ApiError(`El horario se generó pero no se pudo guardar: ${err.message}`, err.detalles);
      }

      await this.cargarHorariosCreados();
      this.modoActual = 'ver';
      this.paginaActualGrupos = 0;
      this.paginaActualProfesores = 0;
      this.notificarResultado(pythonData);
    } catch (err: any) {
      console.error('Error en flujo generar/guardar:', err);
      if (err instanceof ApiError) {
        this.mostrarToastError(err.message, err.detalles);
      } else {
        this.mostrarToastError('Ocurrió un error inesperado al generar o guardar el horario.');
      }
    } finally {
      this.loading = false;
    }
  }

  /** Muestra el resultado real del generador: éxito, o éxito con observaciones. */
  private notificarResultado(py: any): void {
    const fuera: any[] = Array.isArray(py?.materias_fuera) ? py.materias_fuera : [];
    const avisos: any[] = Array.isArray(py?.advertencias) ? py.advertencias : [];
    const nivel: string = py?.nivel ?? (fuera.length || avisos.length ? 'warning' : 'ok');

    if (nivel === 'ok') {
      this.mostrarToastExitoso(`✅ ${py?.mensaje ?? 'Horario generado y guardado exitosamente.'}`);
      return;
    }

    const detalles = this.resumirLista([
      ...fuera.map((f) => this.formatearFuera(f)),
      ...avisos.map((a) => a?.mensaje),
    ]);
    this.mostrarToastAviso(
      `⚠️ ${py?.mensaje ?? 'Horario guardado con observaciones.'}`,
      detalles
    );
  }

  // ── Exportar PDF ──────────────────────────────────────────────────────
  async exportarPDF(group: { nombregrupo: string; data: any[] }) {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();

    const primaryColor = [0, 91, 170] as [number, number, number]; // #005baa

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 20, 'F');

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(`Horario de Grupo`, 14, 13);

    doc.setFontSize(10);
    doc.text(`Horari - UTEQ`, 180, 13, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grupo: ${group.nombregrupo}`, 14, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 36);

    const head = [['Hora', ...this.diasSemana]];
    const body: any[] = [];

    for (const hora of this.horas) {
      const row: any[] = [hora + ':00'];
      for (const dia of this.diasSemana) {
        const clase = this.getClase(group.data, dia, hora);
        row.push(
          clase
            ? [clase.subj, clase.prof || 'Sin profesor', clase.room || 'Sin salón'].filter(Boolean).join('\n')
            : ''
        );
      }
      body.push(row);
    }

    autoTable(doc, {
      head,
      body,
      startY: 45,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: 'middle',
        halign: 'center',
        lineColor: [224, 228, 234],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Documento generado automáticamente por el sistema de horarios UTEQ', 105, 290, { align: 'center' });
    }

    doc.save(`horario_${group.nombregrupo}.pdf`);
  }

  async exportarPDFProfesor(prof: { nombre: string; clases: any[] }) {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();

    const primaryColor = [0, 91, 170] as [number, number, number];
    const secondaryColor = [245, 247, 250] as [number, number, number];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 20, 'F');

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(`Horario de Profesor`, 14, 13);

    doc.setFontSize(10);
    doc.text(`Horari - UTEQ`, 180, 13, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Profesor: ${prof.nombre}`, 14, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 36);

    const head = [['Hora', ...this.diasSemana]];
    const body: any[] = [];

    for (const hora of this.horas) {
      const row: any[] = [hora + ':00'];
      for (const dia of this.diasSemana) {
        const clase = this.getClaseProfesor(prof.clases, dia, hora);
        row.push(
          clase
            ? [clase.subj, `Grupo: ${clase.group || clase.grupo || '-'}`, clase.room].filter(Boolean).join('\n')
            : ''
        );
      }
      body.push(row);
    }

    autoTable(doc, {
      head,
      body,
      startY: 45,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: 'middle',
        halign: 'center',
        lineColor: [224, 228, 234],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 20, fillColor: secondaryColor },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index > 0 && data.cell.raw) {
          data.cell.styles.fillColor = [234, 243, 251];
          data.cell.styles.textColor = [0, 91, 170];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Documento generado automáticamente por el sistema de horarios UTEQ', 105, 290, { align: 'center' });
    }

    doc.save(`horario_profesor_${prof.nombre}.pdf`);
  }
}
