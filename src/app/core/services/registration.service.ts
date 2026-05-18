/*
* RegistrationService: Orquestador del wizard de registro inicial.
*
* Este servicio mantiene el estado del formulario multipaso (4 pasos)
* mientras el usuario navega entre ellos. Como es singleton (providedIn: 'root'),
* los datos no se pierden aunque el componente WizardPage se destruya.
*
* Flujo:
*   1. goToWizard() -> resetea datos y navega a /wizard
*   2. WizardPage modifica wizardData paso a paso via [(ngModel)]
*   3. completeRegistration(userId, role) -> envia todo al backend api.registerFullUser()
*
* El parametro 'role' determina si se crea guardian solo (Admin/Medic)
* o guardian + nino + relacion (PremiumUser/DemoUser).
*/
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { WizardData } from '../models/registration.model';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private api = inject(ApiService);
  private router = inject(Router);

  /** Datos acumulados del wizard (persisten entre pasos) */
  wizardData: WizardData = this.emptyWizard();

  /*
  * Retorna una estructura WizardData con todos los campos vacios.
  * Se usa al iniciar y al resetear.
  * @Return WizardData estructura vacia para el formulario
  */
  private emptyWizard(): WizardData {
    return {
      guardian: { name: '', lastname: '', phone: '', biography: '', documentTypeId: '', document: '' },
      relationshipId: '',
      child: { names: '', lastName: '', birthDate: '', documentTypeId: '', document: '' },
      tceClassificationId: null,
      usesQuestionnaire: false,
      questionnaireAnswers: [],
    };
  }

  /*
  * Reinicia todos los campos del wizard a valores vacios.
  * Se llama antes de navegar al wizard o al cancelar.
  */
  resetWizard(): void {
    this.wizardData = this.emptyWizard();
  }

  /*
  * Envia los datos completos del wizard al backend.
  * @Params userId String UUID del usuario (owner del guardian)
  * @Params role String rol del usuario (FMAdmin, Medic, PremiumUser, DemoUser)
  * @Return Observable<boolean> true si el registro completo se guardo
  */
  completeRegistration(userId: string, role: string): Observable<boolean> {
    return this.api.registerFullUser(userId, this.wizardData, role);
  }

  /*
  * Resetea los datos y navega a la pagina del wizard.
  */
  goToWizard(): void {
    this.resetWizard();
    this.router.navigate(['/wizard']);
  }
}
