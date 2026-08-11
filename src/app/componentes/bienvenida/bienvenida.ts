import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

const TIEMPO_MINIMO_MS = 1500;
const TIEMPO_MAXIMO_MS = 30000;

@Component({
  selector: 'app-bienvenida',
  imports: [FormsModule, CommonModule],
  templateUrl: './bienvenida.html',
  styleUrls: ['./bienvenida.scss']
})
export class BienvenidaComponent {
  email: string = '';
  contrasena: string = '';
  showPassword: boolean = false;

  cargando: boolean = false;
  mensajeCarga: string = 'Conectando con el servidor...';
  huboTimeout: boolean = false;

  private apiUrl = `${environment.apiUrl}/users/login-admin`;

  constructor(private router: Router, private http: HttpClient) {}

  iniciarSesion() {
    if (this.cargando) return; // evita doble submit

    this.cargando = true;
    this.huboTimeout = false;
    this.mensajeCarga = 'Conectando con el servidor...';

    const inicio = Date.now();

    // Mensaje que cambia después de unos segundos, para dar contexto de que puede tardar
    const avisoLento = setTimeout(() => {
      if (this.cargando) {
        this.mensajeCarga = 'El servidor puede tardar unos segundos en despertar, espera un momento...';
      }
    }, 4000);

    this.http.post<any>(this.apiUrl, {
      email: this.email,
      password: this.contrasena
    }).pipe(
      timeout(TIEMPO_MAXIMO_MS),
      catchError((err) => {
        clearTimeout(avisoLento);
        return throwError(() => err);
      })
    ).subscribe({
      next: (data) => {
        clearTimeout(avisoLento);
        this.finalizarConMinimo(inicio, () => {
          if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            this.router.navigate(['/dashboard']);
          } else {
            this.cargando = false;
            alert(data.error || 'Credenciales incorrectas');
          }
        });
      },
      error: (err) => {
        this.finalizarConMinimo(inicio, () => {
          this.cargando = false;

          if (err.name === 'TimeoutError') {
            this.huboTimeout = true;
            this.recargarVista();
          } else {
            console.error('Error al conectar con el servidor:', err);
            alert('Error al conectar con el servidor');
          }
        });
      }
    });
  }

  // Asegura que el modal se muestre mínimo TIEMPO_MINIMO_MS, aunque la respuesta llegue antes
  private finalizarConMinimo(inicio: number, callback: () => void) {
    const transcurrido = Date.now() - inicio;
    const restante = TIEMPO_MINIMO_MS - transcurrido;

    if (restante > 0) {
      setTimeout(callback, restante);
    } else {
      callback();
    }
  }

  private recargarVista() {
    // Reinicia el estado del formulario para reintentar, sin perder lo escrito
    setTimeout(() => {
      this.huboTimeout = false;
    }, 4000); // el mensaje de timeout se muestra 4s antes de limpiar el estado visual
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}