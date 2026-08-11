import { CommonModule } from '@angular/common';
import { Component, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import {  HostListener } from '@angular/core'; // <-- agrega HostListener al import existente

@Component({
  selector: 'app-navbar',
  imports: [ RouterOutlet, CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
 protected readonly title = signal('horarios-uteq');

  /** Nombre del usuario autenticado */
  usuarioNombre: string = '';
  /** Carrera del usuario autenticado */
  usuarioCarrera: string = '';
  /** Estado del sidebar */
  sidebarCollapsed = false;
  /** Indica si se está en la pantalla de login */
  esLogin = false;
  /** Estado del menú superior responsive */
  navbarOpen = false;


   sidebarColapsado = false;        // true = encogido (solo iconos) en desktop
  sidebarAbiertoMobile = false;    // true = visible como overlay en mobile
 


  constructor(private router: Router) {
    // Detecta si la ruta actual es /login o la raíz para ocultar el layout
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.esLogin = event.url.includes('/login') || event.url === '/';
      });
  }

  /**
   * Inicializa los datos del usuario desde localStorage.
   * Si no existe información, asigna valores por defecto.
   */
  ngOnInit(): void {
    try {
      const usuarioData = localStorage.getItem('userData');
      if (usuarioData) {
        // Validación y parseo seguro
        const parsed = JSON.parse(usuarioData);
        this.usuarioNombre = typeof parsed.nombre === 'string' ? parsed.nombre : 'Usuario';
        this.usuarioCarrera = typeof parsed.carrera === 'string' ? parsed.carrera : 'N/A';
      } else {
        this.usuarioNombre = 'Director de la división de Tecnologías de la Información';
        this.usuarioCarrera = 'N/A';
      }
    } catch (error) {
      // Manejo de error de parseo
      this.usuarioNombre = 'Usuario';
      this.usuarioCarrera = 'N/A';
      // Se podría loggear el error si se cuenta con un sistema de logs
    }
  }



    // ===== NUEVO: alternar el sidebar =====
  toggleSidebar(): void {
    if (this.esMobile()) {
      this.sidebarAbiertoMobile = !this.sidebarAbiertoMobile;
    } else {
      this.sidebarColapsado = !this.sidebarColapsado;
    }
  }
 
  // ===== NUEVO: cerrar el sidebar en mobile (al tocar el overlay) =====
  cerrarSidebarMobile(): void {
    this.sidebarAbiertoMobile = false;
  }
 
  // ===== NUEVO: helper para saber si estamos en mobile =====
  private esMobile(): boolean {
    return window.innerWidth <= 768;
  }
 
  // ===== NUEVO: si cambian de mobile a desktop (o viceversa), resetea estados =====
  @HostListener('window:resize')
  onResize(): void {
    if (!this.esMobile()) {
      this.sidebarAbiertoMobile = false;
    }
  }

  /**
   * Cierra la sesión del usuario, eliminando datos y redirigiendo a login.
   * Incluye confirmación para evitar cierres accidentales.
   */
  cerrarSesion(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('userData');
      this.router.navigate(['/login']);
    }
  }
}
