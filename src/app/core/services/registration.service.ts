import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { WizardData } from '../models/registration.model';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private api = inject(ApiService);
  private router = inject(Router);

  wizardData: WizardData = this.emptyWizard();

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

  resetWizard(): void {
    this.wizardData = this.emptyWizard();
  }

  completeRegistration(userId: string, role: string): Observable<boolean> {
    return this.api.registerFullUser(userId, this.wizardData, role);
  }

  goToWizard(): void {
    this.resetWizard();
    this.router.navigate(['/wizard']);
  }
}
