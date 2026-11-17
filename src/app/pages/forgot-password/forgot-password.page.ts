import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { LoadingService } from '../../core/services/loading.service';
import { extractError } from '../../core/utils/error.utils';

@Component({
  selector: 'app-forgot-password',
  templateUrl: 'forgot-password.page.html',
  styleUrls: ['../auth-recovery.shared.scss'],
  imports: [IonContent, FormsModule, RouterLink, NgIf],
})
export class ForgotPasswordPage {
  private api = inject(ApiService);
  private loading = inject(LoadingService);

  username = '';
  error = '';
  success = false;
  submitting = false;

  submit(): void {
    this.error = '';

    const username = this.username.trim();
    if (!username) {
      this.error = 'Escribe tu nombre de usuario.';
      return;
    }

    this.submitting = true;
    this.loading.show('Enviando enlace seguro...');

    this.api.forgotPassword(username).subscribe({
      next: () => {
        this.loading.hide();
        this.submitting = false;
        this.username = username;
        this.success = true;
      },
      error: (err) => {
        this.loading.hide();
        this.submitting = false;
        this.error = extractError(err, 'No pudimos enviar el correo. Intenta de nuevo.');
      },
    });
  }

  tryAnotherUser(): void {
    this.success = false;
    this.username = '';
    this.error = '';
  }
}
