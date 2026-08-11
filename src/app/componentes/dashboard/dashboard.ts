import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';


@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent {
  usuarioNombre: string = '';
  usuarioOrganizacion: string = '';
  sidebarCollapsed = false;
  constructor(private router: Router) {}

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  

  ngOnInit() {
    const usuarioData = localStorage.getItem('userData');
    if (usuarioData) {
      const { nombreOrganizacion,full_name } = JSON.parse(usuarioData);
      this.usuarioNombre = full_name;
      this.usuarioOrganizacion = nombreOrganizacion;
    } else {
      this.router.navigate(['/']);
    }
  }
}