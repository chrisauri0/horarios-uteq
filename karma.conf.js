// karma.conf.js — configuración de pruebas unitarias (Jasmine + Karma)
// Genera:
//   reportes/reporte-pruebas.html   → reporte de resultados (entregable)
//   reportes/cobertura/index.html   → cobertura de código por archivo
const path = require('path');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('./testing/karma-reporte-html'),
    ],
    client: {
      jasmine: {
        // Las pruebas corren en orden aleatorio para detectar dependencias entre ellas.
        random: true,
      },
      clearContext: false,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: path.join(__dirname, 'reportes/cobertura'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }, { type: 'json-summary' }],
    },
    reporteHtml: {
      archivo: path.join(__dirname, 'reportes/reporte-pruebas.html'),
      titulo: 'Reporte de pruebas unitarias — Horarios UTEQ',
      proyecto: 'horarios-uteq (Angular 20)',
      hallazgos: path.join(__dirname, 'testing/hallazgos.json'),
      cobertura: path.join(__dirname, 'reportes/cobertura/coverage-summary.json'),
    },
    reporters: ['progress', 'kjhtml', 'coverage', 'reporte-html'],
    browsers: ['Chrome'],
    customLaunchers: {
      // Chrome sin ventana; --no-sandbox es necesario en contenedores y en algunas distros (NixOS).
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },
    restartOnFileChange: true,
  });
};
