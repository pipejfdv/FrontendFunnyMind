import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { RouterLink, Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { extractError } from '../../core/utils/error.utils';
import { Child } from '../../core/models/user.model';
import { TCE_QUESTIONS, TceQuestion, calculateTceEstimation } from '../../core/models/registration.model';

const AVATARS = ['🐶', '🐱', '🐰', '🐼', '🦊', '🐸', '🦁', '🐯'];

@Component({
  selector: 'app-guardian-dashboard',
  templateUrl: 'guardian-dashboard.page.html',
  styleUrls: ['guardian-dashboard.page.scss'],
  imports: [IonContent, RouterLink, NgFor, NgIf, FormsModule],
})
export class GuardianDashboardPage {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  children: Child[] = [];
  relationships: any[] = [];
  documentTypes: any[] = [];
  tceClassifications: any[] = [];
  guardianId = '';

  showModal = false;
  step = 1;
  relationshipId = '';
  childNames = '';
  childLastName = '';
  birthDate = '';
  docTypeId = '';
  docNumber = '';
  tceClassificationId = '';
  error = '';
  submitting = false;

  showQuestionnaire = false;
  tceQuestions: TceQuestion[] = TCE_QUESTIONS;
  questionnaireAnswers: number[] = [];
  tceEstimation = '';

  constructor() {
    this.loadGuardianInfo();
    this.api.getRelationships().subscribe(r => this.relationships = r);
    this.api.getDocumentTypes().subscribe(d => this.documentTypes = d);
    this.api.getTceClassifications().subscribe(t => this.tceClassifications = t);
  }

  private loadGuardianInfo(): void {
    this.api.getMyGuardianInfo().subscribe({
      next: (guardian: any) => {
        if (guardian?.id) {
          this.guardianId = guardian.id;
          this.loadChildren();
        }
      },
      error: () => {
        this.loadChildren();
      },
    });
  }

  private loadChildren(): void {
    this.api.getChildrenByGuardian().subscribe({
      next: (list: any[]) => {
        if (Array.isArray(list)) {
          this.children = list.map((c: any) => {
            const tceStr = c.tceClassification || '';
            const matched = this.tceClassifications.find((t: any) =>
              t.classification === tceStr || t.classification?.startsWith(tceStr)
            );
            return {
              id: c.id || '',
              names: c.names || '',
              lastName: c.lastName || '',
              birthDate: c.birthDate || '',
              age: c.age,
              tceClassification: matched || { id: '', classification: tceStr || 'No especificado' },
              avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
            } as Child;
          });
        }
      },
    });
  }

  selectChild(child: Child): void {
    localStorage.setItem('fm_selected_child', JSON.stringify(child));
    this.router.navigate(['/child'], { queryParams: { childId: child.id } });
  }

  openModal(): void {
    this.showModal = true; this.step = 1; this.error = ''; this.submitting = false;
    this.relationshipId = ''; this.childNames = ''; this.childLastName = '';
    this.birthDate = ''; this.docTypeId = ''; this.docNumber = '';
    this.tceClassificationId = ''; this.showQuestionnaire = false;
    this.tceEstimation = ''; this.questionnaireAnswers = [];
  }

  closeModal(): void { this.showModal = false; }

  get canProceedStep1(): boolean { return !!this.relationshipId; }
  get canProceedStep2(): boolean { return !!this.childNames && !!this.childLastName && !!this.birthDate && !!this.docTypeId && !!this.docNumber; }
  get canProceedStep3(): boolean { return this.showQuestionnaire ? this.tceEstimation !== '' : !!this.tceClassificationId; }

  nextStep(): void {
    if (this.step === 1 && !this.canProceedStep1) return;
    if (this.step === 2 && !this.canProceedStep2) return;
    if (this.step < 3) this.step++;
  }

  prevStep(): void {
    if (this.step === 2 && this.showQuestionnaire) this.cancelQuestionnaire();
    if (this.step > 1) this.step--;
  }

  startQuestionnaire(): void {
    this.showQuestionnaire = true;
    this.questionnaireAnswers = new Array(TCE_QUESTIONS.length).fill(-1);
    this.tceEstimation = '';
  }
  cancelQuestionnaire(): void { this.showQuestionnaire = false; }

  get allQuestionsAnswered(): boolean {
    return this.questionnaireAnswers.length === this.tceQuestions.length
      && this.questionnaireAnswers.every(a => a !== -1);
  }

  calculateEstimation(): void {
    if (!this.allQuestionsAnswered) return;
    this.tceEstimation = calculateTceEstimation(this.questionnaireAnswers);
    const match = this.tceClassifications.find((t: any) => t.classification === this.tceEstimation);
    if (match) this.tceClassificationId = match.id;
  }

  confirmAdd(): void {
    if (!this.canProceedStep3 || this.submitting) return;
    this.submitting = true;

    if (this.showQuestionnaire && !this.tceClassificationId) {
      this.tceClassificationId = this.tceClassifications[this.tceClassifications.length - 1]?.id || '';
    }

    const childBody = {
      names: this.childNames,
      lastName: this.childLastName,
      birthDate: this.birthDate,
      document: this.docNumber ? Number(this.docNumber) : undefined,
    };

    this.api.createChild(this.docTypeId, this.tceClassificationId, childBody).subscribe({
      next: (childId) => {
        if (!childId) { this.submitting = false; return; }
        if (this.guardianId && this.relationshipId) {
          this.api.linkGuardianChild(this.guardianId, childId, this.relationshipId).subscribe({
            next: () => { this.afterAdd(); },
            error: () => { this.afterAdd(); },
          });
        } else {
          this.afterAdd();
        }
      },
      error: (err) => { this.submitting = false; this.error = extractError(err, 'Error al crear el nino.'); },
    });
  }

  private afterAdd(): void {
    this.submitting = false;
    this.closeModal();
    this.loadChildren();
  }
}
