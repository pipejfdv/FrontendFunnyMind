/*
* RegisterPage: Creacion de nueva cuenta.
* Paso 1: Seleccionar plan (Demo gratuito o Premium completo).
* Paso 2: Llenar formulario con usuario, email, contrasena.
* Al enviar, llama POST /User/create/{membership} y redirige al login.
*/
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
    features: ['Explora todos los juegos', 'Acceso ilimitado a categorias'],
    limitations: ['3 horas diarias de juego', 'Publicidad (simulada)', 'Sin registro de progreso'],
    color: '#4ECDC4',
  },
  {
    type: 'PremiumUser',
    name: 'Premium',
    price: 'Completa',
    features: [
      'Todo lo de la version Demo', 'Sin limite de tiempo', 'Sin publicidad',
      'Historial completo del nino', 'Estadisticas de progreso',
      'Asesoria medica profesional', 'Multiples perfiles de ninos',
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
      this.error = 'Completa todos los campos'; return;
    }
    if (!this.email.includes('@')) { this.error = 'Ingresa un correo valido'; return; }
    if (this.password !== this.confirmPassword) { this.error = 'Las contrasenas no coinciden'; return; }
    if (this.password.length < 4) { this.error = 'La contrasena debe tener al menos 4 caracteres'; return; }
    if (!this.selectedMembership) { this.error = 'Selecciona una membresia'; return; }

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
