/*
* LoginPage: Formulario de inicio de sesion.
* Envia credenciales al backend via AuthService.login().
* Si exito, navega al dashboard segun el rol (navigateByRole).
* Si falla, muestra mensaje de error (usuario/contra incorrectos o error de conexion).
*/
import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoadingService } from '../../core/services/loading.service';
import { extractError } from '../../core/utils/error.utils';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [IonContent, FormsModule, RouterLink, NgIf],
})
export class LoginPage {
  private auth = inject(AuthService);
  private loading = inject(LoadingService);

  username = '';
  password = '';
  error = '';

  login(): void {
    this.error = '';
    if (!this.username || !this.password) {
      this.error = 'Ingresa tu usuario y contrasena';
      return;
    }
    this.loading.show('Iniciando sesion...');
    this.auth.login(this.username, this.password).subscribe({
      next: (success) => {
        this.loading.hide();
        if (success) {
          this.auth.navigateByRole();
        } else {
          this.error = 'Usuario o contrasena incorrectos';
        }
      },
      error: (err) => {
        this.loading.hide();
        this.error = extractError(err, 'Error de conexion. Intenta de nuevo.');
      },
    });
  }
}
