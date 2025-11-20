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
  email: string = '';
  contrasena: string = '';
  showPassword: boolean = false;

  constructor(private router: Router) {}

  async iniciarSesion() {
  try {
    const res = await fetch('http://localhost:3000/users/login-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: this.email,
        password: this.contrasena
      })
    });

    if (!res.ok) {
      alert('Error al iniciar sesión');
      return;
    }

    const data = await res.json();
    console.log('Respuesta login:', data);
    if (data.success) {
      localStorage.setItem('userData', JSON.stringify(data.user));
      this.router.navigate(['/dashboard']);
    } else {
      alert(data.error || 'Credenciales incorrectas');
    }
  } catch (error) {
    console.error('Error al conectar con el servidor:', error);
    alert('Error al conectar con el servidor');
  }
}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

}
