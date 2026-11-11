// testing/karma-reporte-html.js
// Reporter de Karma que genera un HTML autocontenido con los resultados de las pruebas.
// No necesita dependencias extra: se registra como plugin en karma.conf.js.
//
// Opciones (en karma.conf.js → reporteHtml):
//   archivo     ruta del HTML a generar
//   titulo      título del reporte
//   proyecto    nombre del proyecto
//   hallazgos   (opcional) JSON con hallazgos encontrados durante las pruebas
//   cobertura   (opcional) coverage-summary.json de karma-coverage

const fs = require('fs');
const path = require('path');

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const ms = (t) => (t >= 1000 ? `${(t / 1000).toFixed(2)} s` : `${Math.round(t)} ms`);

const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);

/** Separa "CAR-01: texto" en { id: 'CAR-01', texto: 'texto' }. */
function separarId(descripcion) {
  const m = /^([A-ZÑ]{2,5}-\d{1,3})\s*:\s*(.*)$/.exec(descripcion);
  return m ? { id: m[1], texto: m[2] } : { id: '', texto: descripcion };
}

function ordenarPorId(a, b) {
  if (a.id && b.id) return a.id.localeCompare(b.id, 'es', { numeric: true });
  return a.texto.localeCompare(b.texto, 'es');
}

function leerJson(ruta) {
  try {
    if (ruta && fs.existsSync(ruta)) return JSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch (e) {
    /* archivo inválido: se ignora */
  }
  return null;
}

function generarHtml(datos) {
  const { titulo, proyecto, fecha, duracion, navegadores, specs, hallazgos, cobertura, errorGeneral } = datos;

  const total = specs.length;
  const fallidas = specs.filter((s) => s.estado === 'fallo').length;
  const omitidas = specs.filter((s) => s.estado === 'omitida').length;
  const exitosas = total - fallidas - omitidas;
  const ejecutadas = total - omitidas;
  const ok = fallidas === 0 && !errorGeneral && total > 0;

  // Agrupar por módulo (describe de primer nivel)
  const modulos = new Map();
  for (const s of specs) {
    if (!modulos.has(s.modulo)) modulos.set(s.modulo, []);
    modulos.get(s.modulo).push(s);
  }
  const listaModulos = [...modulos.entries()]
    .map(([nombre, items]) => ({
      nombre,
      items: items.sort(ordenarPorId),
      fallidas: items.filter((s) => s.estado === 'fallo').length,
      omitidas: items.filter((s) => s.estado === 'omitida').length,
      tiempo: items.reduce((t, s) => t + s.tiempo, 0),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const badge = (estado) =>
    ({
      exito: '<span class="estado estado--ok">Aprobada</span>',
      fallo: '<span class="estado estado--fallo">Fallida</span>',
      omitida: '<span class="estado estado--omitida">Omitida</span>',
    })[estado];

  const tarjetaCobertura = (etiqueta, dato) => {
    if (!dato) return '';
    const p = Number(dato.pct) || 0;
    const nivel = p >= 80 ? 'alto' : p >= 60 ? 'medio' : 'bajo';
    return `
      <div class="cob">
        <div class="cob__cab"><span>${esc(etiqueta)}</span><strong>${p.toFixed(1)}%</strong></div>
        <div class="barra"><div class="barra__relleno barra__relleno--${nivel}" style="width:${Math.min(p, 100)}%"></div></div>
        <small>${esc(dato.covered)} de ${esc(dato.total)}</small>
      </div>`;
  };

  const seccionCobertura = cobertura && cobertura.total
    ? `
    <section class="bloque">
      <h2>Cobertura de código</h2>
      <div class="cobertura">
        ${tarjetaCobertura('Sentencias', cobertura.total.statements)}
        ${tarjetaCobertura('Ramas', cobertura.total.branches)}
        ${tarjetaCobertura('Funciones', cobertura.total.functions)}
        ${tarjetaCobertura('Líneas', cobertura.total.lines)}
      </div>
      <p class="nota">Detalle por archivo: <a href="cobertura/index.html">cobertura/index.html</a></p>
    </section>`
    : '';

  const filasResumen = listaModulos
    .map((m) => {
      const aprobadas = m.items.length - m.fallidas - m.omitidas;
      return `
        <tr>
          <td><a href="#${esc(encodeURIComponent(m.nombre))}">${esc(m.nombre)}</a></td>
          <td class="num">${m.items.length}</td>
          <td class="num ok">${aprobadas}</td>
          <td class="num ${m.fallidas ? 'mal' : ''}">${m.fallidas}</td>
          <td class="num">${m.omitidas}</td>
          <td class="num">${ms(m.tiempo)}</td>
          <td>${m.fallidas ? badge('fallo') : badge('exito')}</td>
        </tr>`;
    })
    .join('');

  const detalleModulos = listaModulos
    .map((m) => {
      const filas = m.items
        .map((s) => {
          const error = s.errores.length
            ? `<tr class="fila-error" data-estado="${s.estado}"><td colspan="4"><pre>${esc(s.errores.join('\n\n'))}</pre></td></tr>`
            : '';
          const sub = s.subgrupo ? `<div class="sub">${esc(s.subgrupo)}</div>` : '';
          return `
          <tr data-estado="${s.estado}" data-texto="${esc((s.id + ' ' + s.texto + ' ' + m.nombre).toLowerCase())}">
            <td class="id">${esc(s.id || '—')}</td>
            <td>${sub}${esc(s.texto)}</td>
            <td>${badge(s.estado)}</td>
            <td class="num">${ms(s.tiempo)}</td>
          </tr>${error}`;
        })
        .join('');
      return `
      <details class="modulo" id="${esc(encodeURIComponent(m.nombre))}" ${m.fallidas ? 'open' : ''}>
        <summary>
          <span class="modulo__nombre">${esc(m.nombre)}</span>
          <span class="modulo__conteo">${m.items.length - m.fallidas - m.omitidas}/${m.items.length}</span>
          ${m.fallidas ? badge('fallo') : badge('exito')}
        </summary>
        <div class="tabla-wrap"><table class="tabla">
          <thead><tr><th>ID</th><th>Caso de prueba</th><th>Resultado</th><th class="num">Tiempo</th></tr></thead>
          <tbody>${filas}</tbody>
        </table></div>
      </details>`;
    })
    .join('');

  const seccionHallazgos = Array.isArray(hallazgos) && hallazgos.length
    ? `
    <section class="bloque">
      <h2>Hallazgos detectados durante las pruebas</h2>
      <p class="nota">Observaciones sobre el código de la aplicación encontradas al diseñar los casos de prueba.</p>
      <div class="tabla-wrap"><table class="tabla">
        <thead><tr><th>ID</th><th>Severidad</th><th>Módulo</th><th>Descripción</th><th>Recomendación</th></tr></thead>
        <tbody>
          ${hallazgos
            .map(
              (h) => `
            <tr>
              <td class="id">${esc(h.id)}</td>
              <td><span class="sev sev--${esc(String(h.severidad || '').toLowerCase())}">${esc(h.severidad)}</span></td>
              <td>${esc(h.modulo)}</td>
              <td>${esc(h.descripcion)}${h.evidencia ? `<div class="sub">Evidencia: ${esc(h.evidencia)}</div>` : ''}</td>
              <td>${esc(h.recomendacion)}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table></div>
    </section>`
    : '';

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<style>
  :root {
    --fondo: #f4f6f9; --tarjeta: #ffffff; --texto: #1c2430; --suave: #5d6b7c; --borde: #dfe4ea;
    --azul: #005baa; --ok: #1e8e4f; --ok-bg: #e5f5ec; --mal: #c8323b; --mal-bg: #fbe8e9;
    --gris-bg: #eef1f4; --amarillo: #a36a00; --amarillo-bg: #fff4dc;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--fondo); color: var(--texto); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .cont { max-width: 1100px; margin: 0 auto; padding: 24px 16px 48px; }
  header.portada { background: var(--azul); color: #fff; padding: 28px 0 24px; }
  header.portada .cont { padding-top: 0; padding-bottom: 0; }
  header h1 { margin: 0 0 4px; font-size: 26px; }
  header .meta { opacity: .85; font-size: 14px; display: flex; flex-wrap: wrap; gap: 4px 18px; }
  .veredicto { display: inline-block; margin-top: 14px; padding: 6px 14px; border-radius: 999px; font-weight: 700; background: #fff; }
  .veredicto--ok { color: var(--ok); } .veredicto--mal { color: var(--mal); }
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 20px 0; }
  .kpi { background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 10px; padding: 14px 16px; }
  .kpi span { display: block; color: var(--suave); font-size: 13px; }
  .kpi strong { font-size: 28px; line-height: 1.2; }
  .kpi--ok strong { color: var(--ok); } .kpi--mal strong { color: var(--mal); }
  .bloque { background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 10px; padding: 18px 20px; margin: 18px 0; }
  .bloque h2 { margin: 0 0 12px; font-size: 18px; }
  .nota { color: var(--suave); font-size: 13px; margin: 10px 0 0; }
  .tabla-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .tabla { width: 100%; border-collapse: collapse; font-size: 14px; }
  .tabla th { text-align: left; font-weight: 600; color: var(--suave); border-bottom: 2px solid var(--borde); padding: 8px; }
  .tabla td { border-bottom: 1px solid var(--borde); padding: 8px; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  td.ok { color: var(--ok); } td.mal { color: var(--mal); font-weight: 700; }
  .id { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; white-space: nowrap; color: var(--azul); }
  .sub { color: var(--suave); font-size: 12px; }
  .estado { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
  .estado--ok { background: var(--ok-bg); color: var(--ok); }
  .estado--fallo { background: var(--mal-bg); color: var(--mal); }
  .estado--omitida { background: var(--gris-bg); color: var(--suave); }
  .sev { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .sev--alta { background: var(--mal-bg); color: var(--mal); }
  .sev--media { background: var(--amarillo-bg); color: var(--amarillo); }
  .sev--baja { background: var(--gris-bg); color: var(--suave); }
  .controles { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
  .controles input { flex: 1 1 220px; padding: 8px 10px; border: 1px solid var(--borde); border-radius: 8px; font: inherit; }
  .controles button { padding: 7px 12px; border: 1px solid var(--borde); background: #fff; border-radius: 8px; cursor: pointer; font: inherit; }
  .controles button.activo { background: var(--azul); border-color: var(--azul); color: #fff; }
  details.modulo { border: 1px solid var(--borde); border-radius: 8px; margin: 10px 0; background: #fff; }
  details.modulo summary { cursor: pointer; padding: 10px 14px; display: flex; gap: 12px; align-items: center; list-style: none; }
  details.modulo summary::-webkit-details-marker { display: none; }
  details.modulo summary::before { content: "▸"; color: var(--suave); }
  details.modulo[open] summary::before { content: "▾"; }
  .modulo__nombre { font-weight: 600; flex: 1; }
  .modulo__conteo { color: var(--suave); font-size: 13px; font-variant-numeric: tabular-nums; }
  details.modulo .tabla { border-top: 1px solid var(--borde); }
  pre { margin: 0; white-space: pre-wrap; word-break: break-word; background: var(--mal-bg); color: #6d1a1f; padding: 10px; border-radius: 6px; font-size: 12px; }
  .cobertura { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
  .cob__cab { display: flex; justify-content: space-between; }
  .barra { height: 8px; background: var(--gris-bg); border-radius: 99px; overflow: hidden; margin: 6px 0 4px; }
  .barra__relleno { height: 100%; }
  .barra__relleno--alto { background: var(--ok); } .barra__relleno--medio { background: #d99a00; } .barra__relleno--bajo { background: var(--mal); }
  .cob small { color: var(--suave); }
  .alerta { background: var(--mal-bg); color: var(--mal); border-radius: 8px; padding: 12px 14px; margin-top: 16px; }
  footer { color: var(--suave); font-size: 12.5px; text-align: center; margin-top: 28px; }
  a { color: var(--azul); }
  @media (max-width: 640px) { header h1 { font-size: 21px; } .bloque { padding: 14px 12px; } .tabla { font-size: 13px; } }
  @media print {
    body { background: #fff; } .controles { display: none; }
    details.modulo { break-inside: avoid; } details.modulo > table { display: table; }
    header.portada { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<header class="portada">
  <div class="cont">
    <h1>${esc(titulo)}</h1>
    <div class="meta">
      <span>Proyecto: <strong>${esc(proyecto)}</strong></span>
      <span>Fecha: ${esc(fecha)}</span>
      <span>Duración: ${ms(duracion)}</span>
      <span>Navegador: ${esc(navegadores.join(', ') || '—')}</span>
    </div>
    <div class="veredicto ${ok ? 'veredicto--ok' : 'veredicto--mal'}">${ok ? '✔ Todas las pruebas pasaron' : `✖ ${fallidas} prueba(s) fallaron`}</div>
  </div>
</header>

<main class="cont">
  ${errorGeneral ? `<div class="alerta"><strong>Error durante la ejecución:</strong><pre>${esc(errorGeneral)}</pre></div>` : ''}

  <div class="kpis">
    <div class="kpi"><span>Casos de prueba</span><strong>${total}</strong></div>
    <div class="kpi kpi--ok"><span>Aprobadas</span><strong>${exitosas}</strong></div>
    <div class="kpi ${fallidas ? 'kpi--mal' : ''}"><span>Fallidas</span><strong>${fallidas}</strong></div>
    <div class="kpi"><span>Omitidas</span><strong>${omitidas}</strong></div>
    <div class="kpi"><span>Tasa de éxito</span><strong>${pct(exitosas, ejecutadas)}%</strong></div>
    <div class="kpi"><span>Módulos probados</span><strong>${listaModulos.length}</strong></div>
  </div>

  <section class="bloque">
    <h2>Resumen por módulo</h2>
    <div class="tabla-wrap"><table class="tabla">
      <thead><tr><th>Módulo</th><th class="num">Casos</th><th class="num">Aprobadas</th><th class="num">Fallidas</th><th class="num">Omitidas</th><th class="num">Tiempo</th><th>Estado</th></tr></thead>
      <tbody>${filasResumen}</tbody>
    </table></div>
  </section>

  ${seccionCobertura}

  <section class="bloque">
    <h2>Detalle de casos de prueba</h2>
    <div class="controles">
      <input id="buscar" type="search" placeholder="Buscar por ID, módulo o descripción…" aria-label="Buscar caso de prueba">
      <button type="button" data-filtro="todas" class="activo">Todas</button>
      <button type="button" data-filtro="fallo">Fallidas</button>
      <button type="button" data-filtro="exito">Aprobadas</button>
      <button type="button" id="expandir">Expandir todo</button>
    </div>
    ${detalleModulos || '<p class="nota">No se ejecutó ninguna prueba.</p>'}
  </section>

  ${seccionHallazgos}

  <footer>
    Generado automáticamente por Karma + Jasmine (Angular TestBed) · Para regenerarlo: <code>pnpm test:reporte</code>
  </footer>
</main>

<script>
  (function () {
    var filtro = 'todas';
    var buscar = document.getElementById('buscar');
    function aplicar() {
      var q = (buscar.value || '').trim().toLowerCase();
      document.querySelectorAll('details.modulo').forEach(function (d) {
        var visibles = 0;
        d.querySelectorAll('tbody tr[data-texto]').forEach(function (tr) {
          var ok = (filtro === 'todas' || tr.dataset.estado === filtro) && (!q || tr.dataset.texto.indexOf(q) !== -1);
          tr.style.display = ok ? '' : 'none';
          var sig = tr.nextElementSibling;
          if (sig && sig.classList.contains('fila-error')) sig.style.display = ok ? '' : 'none';
          if (ok) visibles++;
        });
        d.style.display = visibles ? '' : 'none';
        if (q || filtro !== 'todas') d.open = visibles > 0;
      });
    }
    buscar.addEventListener('input', aplicar);
    document.querySelectorAll('[data-filtro]').forEach(function (b) {
      b.addEventListener('click', function () {
        filtro = b.dataset.filtro;
        document.querySelectorAll('[data-filtro]').forEach(function (x) { x.classList.toggle('activo', x === b); });
        aplicar();
      });
    });
    var expandido = false;
    document.getElementById('expandir').addEventListener('click', function (e) {
      expandido = !expandido;
      document.querySelectorAll('details.modulo').forEach(function (d) { d.open = expandido; });
      e.target.textContent = expandido ? 'Contraer todo' : 'Expandir todo';
    });
    window.addEventListener('beforeprint', function () {
      document.querySelectorAll('details.modulo').forEach(function (d) { d.open = true; });
    });
  })();
</script>
</body>
</html>
`;
}

function ReporteHtml(baseReporterDecorator, config, logger) {
  baseReporterDecorator(this);
  // No imprimimos nada en consola: de eso se encarga el reporter "progress".
  this.adapters = [];

  const log = logger.create('reporter.reporte-html');
  const opciones = config.reporteHtml || {};
  const archivo = path.resolve(config.basePath || process.cwd(), opciones.archivo || 'reportes/reporte-pruebas.html');
  const titulo = opciones.titulo || 'Reporte de pruebas';
  const proyecto = opciones.proyecto || path.basename(config.basePath || process.cwd());

  let specs = [];
  let navegadores = new Set();
  let inicio = Date.now();
  let errorGeneral = '';
  let ultimoReporte = null;

  const escribir = (conCobertura) => {
    const datos = {
      titulo,
      proyecto,
      fecha: new Date(inicio).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' }),
      duracion: Date.now() - inicio,
      navegadores: [...navegadores],
      specs,
      hallazgos: leerJson(opciones.hallazgos),
      cobertura: conCobertura ? leerJson(opciones.cobertura) : null,
      errorGeneral,
    };
    ultimoReporte = datos;
    fs.mkdirSync(path.dirname(archivo), { recursive: true });
    fs.writeFileSync(archivo, generarHtml(datos), 'utf8');
  };

  this.onRunStart = () => {
    specs = [];
    navegadores = new Set();
    errorGeneral = '';
    inicio = Date.now();
  };

  this.onBrowserStart = (browser) => navegadores.add(browser.name);

  this.onBrowserError = (browser, error) => {
    errorGeneral += `${browser.name}: ${typeof error === 'string' ? error : JSON.stringify(error)}\n`;
  };

  this.onSpecComplete = (browser, result) => {
    const suite = Array.isArray(result.suite) ? result.suite : [];
    const { id, texto } = separarId(result.description || '');
    let estado = 'exito';
    if (result.skipped || result.pending || result.disabled) estado = 'omitida';
    else if (!result.success) estado = 'fallo';
    specs.push({
      navegador: browser.name,
      modulo: suite[0] || '(sin describe)',
      subgrupo: suite.slice(1).join(' › '),
      id,
      texto,
      estado,
      tiempo: Number(result.time) || 0,
      errores: estado === 'fallo' ? (result.log || []).map(String) : [],
    });
  };

  this.onRunComplete = () => {
    try {
      escribir(false);
      log.info(`Reporte HTML generado en ${archivo}`);
    } catch (e) {
      log.error(`No se pudo escribir el reporte HTML: ${e.message}`);
    }
  };

  // karma-coverage escribe su resumen al final; esperamos un poco y regeneramos con cobertura.
  this.onExit = (done) => {
    const ruta = opciones.cobertura;
    if (!ruta || !ultimoReporte) return done();
    const limite = Date.now() + 8000;
    const revisar = () => {
      let listo = false;
      try {
        listo = fs.existsSync(ruta) && fs.statSync(ruta).mtimeMs >= inicio - 1000;
      } catch (e) {
        listo = false;
      }
      if (listo) {
        try {
          escribir(true);
        } catch (e) {
          log.warn(`No se pudo agregar la cobertura al reporte: ${e.message}`);
        }
        return done();
      }
      if (Date.now() > limite) return done();
      setTimeout(revisar, 250);
    };
    revisar();
  };
}

ReporteHtml.$inject = ['baseReporterDecorator', 'config', 'logger'];
// Accesible para probar el generador sin Karma (Karma solo registra las llaves del objeto exportado).
ReporteHtml.generarHtml = generarHtml;

module.exports = {
  'reporter:reporte-html': ['type', ReporteHtml],
};
