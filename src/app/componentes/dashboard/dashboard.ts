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
  usuarioCarrera: string = '';
  sidebarCollapsed = false;
  constructor(private router: Router) {}

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  

  ngOnInit() {
    const usuarioData = localStorage.getItem('userData');
    if (usuarioData) {
      const { full_name, metadata: { division , turno } } = JSON.parse(usuarioData);
      this.usuarioNombre = full_name;
      this.usuarioCarrera = division + ' - ' + turno;
    } else {
      this.router.navigate(['/']);
    }
  }
}