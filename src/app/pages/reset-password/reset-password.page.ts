import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { LoadingService } from '../../core/services/loading.service';
import { extractError } from '../../core/utils/error.utils';

@Component({
  selector: 'app-reset-password',
  templateUrl: 'reset-password.page.html',
  styleUrls: ['../auth-recovery.shared.scss'],
  imports: [IonContent, FormsModule, RouterLink, NgIf],
})
export class ResetPasswordPage {
  private api = inject(ApiService);
  private loading = inject(LoadingService);
  private route = inject(ActivatedRoute);

  token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  error = '';
  success = false;
  submitting = false;

  submit(): void {
    this.error = '';

    if (!this.newPassword) {
      this.error = 'Escribe tu nueva contraseña.';
      return;
    }
    if (this.newPassword.length < 4) {
      this.error = 'La contraseña debe tener al menos 4 caracteres.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.submitting = true;
    this.loading.show('Actualizando tu contraseña...');

    this.api.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.loading.hide();
        this.submitting = false;
        this.success = true;
      },
      error: (err) => {
        this.loading.hide();
        this.submitting = false;
        this.error = extractError(err, 'No pudimos actualizar tu contraseña. Solicita un enlace nuevo.');
      },
    });
  }
}
