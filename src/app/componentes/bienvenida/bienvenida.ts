import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bienvenida',
  imports: [FormsModule],
  templateUrl: './bienvenida.html',
  styleUrls: ['./bienvenida.scss']
})
export class BienvenidaComponent {
  usuario: string = '';

  constructor(private router: Router) {}

  iniciarSesion() {
    // Aquí puedes enviar this.usuario como body en una petición HTTP
    alert(`Iniciando sesión para: ${this.usuario}`);
    console.log('Usuario:', this.usuario);
    
    //redirigir a otra página o realizar otra acción
    // Por ejemplo, puedes usar el Router para navegar a otra ruta
     this.router.navigate(['/dashboard']); // Asegúrate de tener esta ruta configurada
  }
}
