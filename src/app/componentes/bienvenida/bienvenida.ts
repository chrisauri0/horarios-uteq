import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bienvenida',
  imports: [FormsModule, CommonModule],
  templateUrl: './bienvenida.html',
  styleUrls: ['./bienvenida.scss']
})
export class BienvenidaComponent {

  usuarioPrueba = {
    email: 'admin@uteq.edu.mx',
    password: 'admin123'
  };

  email: string = '';
  contrasena: string = '';
  showPassword: boolean = false;

  constructor(private router: Router) { }

  async iniciarSesion() {

    if (this.email === this.usuarioPrueba.email && this.contrasena === this.usuarioPrueba.password) {
      localStorage.setItem('token', 'token-de-prueba');
      localStorage.setItem('userData', JSON.stringify(this.usuarioPrueba));
      this.router.navigate(['/dashboard']);
    } else {
      alert('Credenciales incorrectas');
    }

    // try {
    //   const res = await fetch('https://horarios-backend-58w8.onrender.com/users/login-admin', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       email: this.email,
    //       password: this.contrasena
    //     })
    //   });

    //   const data = await res.json();
    //   console.log('Respuesta login:', data);

    //   console.log('Respuesta login:', data.user);

    //   if (data.access_token) {
    //     // GUARDAR TOKEN
    //     localStorage.setItem('token', data.access_token);
    //     localStorage.setItem('userData', JSON.stringify(data.user));
    //     this.router.navigate(['/dashboard']);

    //   } else {
    //     alert(data.error || 'Credenciales incorrectas');
    //     console.error('Error de login:', data);
    //   }

    // } catch (error) {
    //   console.error('Error al conectar con el servidor:', error);
    //   alert('Error al conectar con el servidor');
    // }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

}
