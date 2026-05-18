import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { RegistrationService } from '../../core/services/registration.service';
import {
  WizardData, DocumentType, Relationship, TceClassification,
  TceQuestion, TCE_QUESTIONS, calculateTceEstimation,
} from '../../core/models/registration.model';

@Component({
  selector: 'app-wizard',
  templateUrl: 'wizard.page.html',
  styleUrls: ['wizard.page.scss'],
  imports: [IonContent, FormsModule, NgFor, NgIf],
})
export class WizardPage {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private reg = inject(RegistrationService);
  private router = inject(Router);

  private readonly roleRoutes: Record<string, string> = {
    DemoUser: '/child',
    PremiumUser: '/guardian',
    Medic: '/medic',
    FMAdmin: '/admin',
  };

  step = 1;
  data: WizardData;
  loading = false;
  error = '';

  documentTypes: DocumentType[] = [];
  relationships: Relationship[] = [];
  tceClassifications: TceClassification[] = [];

  // TCE questionnaire
  showQuestionnaire = false;
  usesQuestionnaire = false;
  tceQuestions: TceQuestion[] = TCE_QUESTIONS;
  questionnaireAnswers: number[] = [];
  tceEstimation = '';

  get allQuestionsAnswered(): boolean {
    return this.questionnaireAnswers.length === this.tceQuestions.length
      && this.questionnaireAnswers.every(a => a !== -1);
  }

  get userRole(): string { return this.auth.currentUser()?.role || ''; }
  get isSimpleRole(): boolean { return this.userRole === 'FMAdmin' || this.userRole === 'Medic'; }
  get totalSteps(): number { return this.isSimpleRole ? 1 : 4; }

  constructor() {
    this.data = this.reg.wizardData;
    this.loadLookups();
  }

  private loadLookups(): void {
    this.api.getDocumentTypes().subscribe(d => this.documentTypes = d);
    if (!this.isSimpleRole) {
      this.api.getRelationships().subscribe(r => this.relationships = r);
      this.api.getTceClassifications().subscribe(t => this.tceClassifications = t);
    }
  }

  get steps(): { num: number; label: string }[] {
    if (this.isSimpleRole) {
      return [{ num: 1, label: 'Datos' }];
    }
    return [
      { num: 1, label: 'Tutor' },
      { num: 2, label: 'Relación' },
      { num: 3, label: 'Niño' },
      { num: 4, label: 'TCE' },
    ];
  }

  canProceed(): boolean {
    switch (this.step) {
      case 1:
        return !!this.data.guardian.name && !!this.data.guardian.lastname
          && !!this.data.guardian.documentTypeId && !!this.data.guardian.document;
      case 2:
        return !!this.data.relationshipId;
      case 3:
        return !!this.data.child.names && !!this.data.child.lastName
          && !!this.data.child.birthDate && !!this.data.child.documentTypeId
          && !!this.data.child.document;
      case 4:
        return this.usesQuestionnaire
          ? this.tceEstimation !== ''
          : !!this.data.tceClassificationId;
      default:
        return false;
    }
  }

  nextStep(): void {
    if (!this.canProceed()) return;
    if (this.step < this.totalSteps) {
      this.step++;
    }
  }

  prevStep(): void {
    if (this.step > 1) {
      this.step--;
    }
  }

  // TCE questionnaire handling
  startQuestionnaire(): void {
    this.showQuestionnaire = true;
    this.usesQuestionnaire = true;
    this.questionnaireAnswers = new Array(TCE_QUESTIONS.length).fill(-1);
    this.tceEstimation = '';
  }

  cancelQuestionnaire(): void {
    this.showQuestionnaire = false;
    this.usesQuestionnaire = false;
  }

  calculateEstimation(): void {
    if (!this.allQuestionsAnswered) return;
    const estimation = calculateTceEstimation(this.questionnaireAnswers);
    this.tceEstimation = estimation;
    const match = this.tceClassifications.find(
      t => t.classification === estimation,
    );
    this.data.tceClassificationId = match?.id || null;
    this.data.questionnaireAnswers = [...this.questionnaireAnswers];
    this.data.usesQuestionnaire = true;
  }

  finish(): void {
    if (!this.canProceed()) return;
    const user = this.auth.currentUser();
    if (!user) return;

    if (this.usesQuestionnaire && this.tceEstimation) {
      const match = this.tceClassifications.find(
        t => t.classification === this.tceEstimation,
      );
      if (match) {
        this.data.tceClassificationId = match.id;
      } else {
        this.data.tceClassificationId = this.tceClassifications[3]?.id || '';
      }
    }

    this.loading = true;
    this.error = '';

    this.reg.completeRegistration(user.id, this.userRole).subscribe({
      next: () => {
        this.loading = false;
        const route = this.roleRoutes[this.userRole] || '/guardian';
        this.router.navigate([route]);
      },
      error: () => {
        this.loading = false;
        this.error = 'Error al guardar los datos. Intenta de nuevo.';
      },
    });
  }
}
