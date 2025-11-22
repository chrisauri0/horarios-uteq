# Horarios UTEQ — Manual de Usuario

Bienvenido a la plataforma **Horarios UTEQ**. Esta aplicación permite gestionar, visualizar y exportar los horarios académicos de la Universidad Tecnológica de Querétaro de manera sencilla y eficiente.

---

## Índice

1. [¿Qué es Horarios UTEQ?](#que-es)
2. [Requisitos](#requisitos)
3. [Instalación y primer uso](#instalacion)
4. [Guía rápida de uso](#guia-rapida)
   - [Inicio de sesión](#login)
   - [Dashboard](#dashboard)
   - [Gestión de horarios](#horarios)
   - [Profesores, Salones, Materias, Grupos, Carreras](#modulos)
5. [Exportar horarios a PDF](#exportar-pdf)
6. [Preguntas frecuentes](#faq)
7. [Soporte](#soporte)

---

## <a name="que-es"></a>¿Qué es Horarios UTEQ?

Horarios UTEQ es una aplicación web para la gestión integral de horarios escolares. Permite:

- Registrar y editar profesores, materias, salones, grupos y carreras.
- Generar automáticamente horarios evitando traslapes.
- Visualizar los horarios por grupo y exportarlos a PDF.
- Acceso seguro mediante inicio de sesión.

---

## <a name="requisitos"></a>Requisitos

- Node.js 18+ y npm/pnpm
- Angular CLI (`npm install -g @angular/cli`)
- Navegador moderno (Chrome, Edge, Firefox)
- (Opcional) Backend corriendo en `http://localhost:3000/` para datos reales

---

## <a name="instalacion"></a>Instalación y primer uso

1. Clona el repositorio y entra a la carpeta:
   ```bash
   git clone https://github.com/chrisauri0/horarios-uteq.git
   cd horarios-uteq
   ```
2. Instala las dependencias:
   ```bash
   npm install
   # o
   pnpm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   ng serve
   ```
4. Abre tu navegador en [http://localhost:4200](http://localhost:4200)

---

## <a name="guia-rapida"></a>Guía rápida de uso

### <a name="login"></a>1. Inicio de sesión

Ingresa tu correo institucional y contraseña. Si los datos son correctos, accederás al dashboard principal.

### <a name="dashboard"></a>2. Dashboard

Desde el dashboard puedes navegar a los distintos módulos usando la barra lateral:

- **Horarios**: Genera y visualiza horarios.
- **Profesores**: Administra el personal docente.
- **Grupos**: Gestiona los grupos escolares.
- **Salones**: Registra y edita salones disponibles.
- **Materias**: Administra las materias ofertadas.
- **Carreras**: Gestiona las carreras y divisiones.

### <a name="horarios"></a>3. Gestión de horarios

- **Generar horarios**: Ve a “Horarios” y haz clic en “Generar Horarios”. El sistema asignará materias, profesores y salones automáticamente.
- **Ver horarios**: Consulta los horarios generados por grupo. Puedes filtrar y navegar entre grupos.
- **Exportar a PDF**: En la vista de horarios, haz clic en “Exportar a PDF” para descargar el horario del grupo seleccionado.

### <a name="modulos"></a>4. Otros módulos

- **Profesores**: Agrega, edita o elimina profesores. Cada profesor puede tener materias y horarios asignados.
- **Salones**: Registra salones y su capacidad.
- **Materias**: Administra materias, carga horaria y asignación a carreras.
- **Grupos**: Crea y edita grupos, asigna carrera y cuatrimestre.
- **Carreras**: Gestiona las carreras y divisiones académicas.

---

## <a name="exportar-pdf"></a>Exportar horarios a PDF

1. Ve a la sección de “Horarios”.
2. Selecciona el grupo deseado.
3. Haz clic en el botón “Exportar a PDF” debajo de la tabla de horarios.
4. El archivo se descargará automáticamente.

---

## <a name="faq"></a>Preguntas frecuentes

**¿No puedo iniciar sesión?**

- Verifica que tu correo y contraseña sean correctos.
- Si olvidaste tu contraseña, contacta al administrador.

**¿No aparecen los horarios generados?**

- Asegúrate de haber creado profesores, materias, grupos y salones antes de generar horarios.
- Si el backend no está corriendo, los datos pueden no guardarse.

**¿Cómo actualizo la información de un profesor o grupo?**

- Ve al módulo correspondiente, selecciona el registro y haz clic en “Editar”.

**¿Puedo usar la app en el celular?**

- Sí, la interfaz es responsiva y se adapta a dispositivos móviles.

---

## <a name="soporte"></a>Soporte

¿Tienes dudas, sugerencias o encontraste un error?

- Abre un issue en el repositorio de GitHub.
- Contacta al administrador del sistema.
- whatsapp 4425265981

---

> _Sugerencia:_ Puedes agregar capturas de pantalla en este README para ilustrar cada sección. Solo sube las imágenes a la carpeta `/public/assets/` y enlázalas aquí con `![alt](ruta)`.
