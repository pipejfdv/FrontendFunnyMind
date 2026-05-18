import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { LoadingService } from '../../core/services/loading.service';
import { extractError } from '../../core/utils/error.utils';
import { MembershipPlan, MembershipType } from '../../core/models/registration.model';

const MEMBERSHIPS: MembershipPlan[] = [
  {
    type: 'DemoUser',
    name: 'Demo',
    price: 'Gratis',
    features: [
      'Explora todos los juegos',
      'Acceso ilimitado a categorías',
    ],
    limitations: [
      '3 horas diarias de juego',
      'Publicidad (simulada)',
      'Sin registro de progreso',
    ],
    color: '#4ECDC4',
  },
  {
    type: 'PremiumUser',
    name: 'Premium',
    price: 'Completa',
    features: [
      'Todo lo de la versión Demo',
      'Sin límite de tiempo',
      'Sin publicidad',
      'Historial completo del niño',
      'Estadísticas de progreso',
      'Asesoría médica profesional',
      'Múltiples perfiles de niños',
    ],
    limitations: [],
    color: '#FF6B6B',
  },
];

@Component({
  selector: 'app-register',
  templateUrl: 'register.page.html',
  styleUrls: ['register.page.scss'],
  imports: [IonContent, FormsModule, RouterLink, NgFor, NgIf],
})
export class RegisterPage {
  private api = inject(ApiService);
  private router = inject(Router);
  private loadingSvc = inject(LoadingService);

  memberships = MEMBERSHIPS;
  selectedMembership: MembershipType | null = null;
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  loading = false;

  selectMembership(type: MembershipType): void {
    this.selectedMembership = type;
    this.error = '';
  }

  backToPlans(): void {
    this.selectedMembership = null;
    this.error = '';
  }

  register(): void {
    this.error = '';
    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      this.error = 'Completa todos los campos';
      return;
    }
    if (!this.email.includes('@')) {
      this.error = 'Ingresa un correo válido';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }
    if (this.password.length < 4) {
      this.error = 'La contraseña debe tener al menos 4 caracteres';
      return;
    }
    if (!this.selectedMembership) {
      this.error = 'Selecciona una membresía';
      return;
    }

    this.loading = true;
    this.loadingSvc.show('Creando tu cuenta...');
    this.api.createUser(this.username, this.email, this.password, this.selectedMembership).subscribe({
      next: () => {
        this.loadingSvc.hide();
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loadingSvc.hide();
        this.loading = false;
        this.error = extractError(err, 'Error al crear la cuenta. Intenta de nuevo.');
      },
    });
  }
}
