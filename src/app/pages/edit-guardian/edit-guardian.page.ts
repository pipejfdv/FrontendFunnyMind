/*
* EditGuardianPage: Editar datos del tutor y administrar hijos.
* Secciones: datos personales (editable), lista de hijos con editar/eliminar.
* Modal de edicion permite cambiar nombres del nino y nombre del perfil.
* Al guardar, actualiza via PUT /children/update y PUT /profiles/update.
*/
import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { Child } from '../../core/models/user.model';

@Component({
  selector: 'app-edit-guardian',
  templateUrl: 'edit-guardian.page.html',
  styleUrls: ['edit-guardian.page.scss'],
  imports: [IonContent, FormsModule, RouterLink, NgFor, NgIf],
})
export class EditGuardianPage {
  private auth = inject(AuthService);
  private api = inject(ApiService);

  guardianId = '';
  name = '';
  lastname = '';
  phone = '';
  biography = '';
  saved = false;
  loading = true;

  children: Child[] = [];
  childProfiles: Map<string, { id: string; nameProfile: string }> = new Map();

  editingChild: Child | null = null;
  editChildNames = '';
  editChildLastName = '';
  editProfileName = '';
  showEditModal = false;

  deletingChild: Child | null = null;
  showDeleteConfirm = false;

  constructor() {
    this.loadData();
  }

  // Carga datos del guardian + perfiles + hijos
  private loadData(): void {
    this.loading = true;
    this.api.getMyGuardianInfo().subscribe({
      next: (g: any) => {
        if (g?.id) {
          this.guardianId = g.id;
          this.name = g.name || '';
          this.lastname = g.lastname || '';
          this.phone = g.phone || '';
          this.biography = g.biography || '';
          this.loadProfiles();
        } else {
          this.loadChildren();
        }
      },
      error: () => { this.loading = false; },
    });
  }

  // Carga perfiles (nombres alternativos) de los hijos
  private loadProfiles(): void {
    this.api.getProfiles(this.guardianId).subscribe({
      next: (profiles: any[]) => {
        this.childProfiles.clear();
        for (const p of profiles) {
          this.childProfiles.set(p.childId || p.id, { id: p.id, nameProfile: p.nameProfile || '' });
        }
        this.loadChildren();
      },
      error: () => { this.loadChildren(); },
    });
  }

  private loadChildren(): void {
    this.api.getChildrenByGuardian().subscribe({
      next: (list: any[]) => {
        if (Array.isArray(list)) {
          this.children = list.map((c: any) => {
            const profile = this.childProfiles.get(c.id);
            return {
              id: c.id || '',
              names: c.names || '',
              lastName: c.lastName || '',
              birthDate: c.birthDate || '',
              age: c.age || 0,
              tceClassification: { id: '', classification: c.tceClassification || 'No especificado' },
              profileId: profile?.id,
              profileName: profile?.nameProfile,
            } as Child;
          });
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  save(): void {
    if (!this.guardianId) return;
    this.api.updateGuardian(this.guardianId, {
      name: this.name,
      lastname: this.lastname,
      phone: this.phone,
      biography: this.biography,
    }).subscribe({
      next: () => { this.saved = true; setTimeout(() => this.saved = false, 3000); },
    });
  }

  openEdit(child: Child): void {
    this.editingChild = { ...child };
    this.editChildNames = child.names;
    this.editChildLastName = child.lastName;
    this.editProfileName = child.profileName || child.names;
    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.editingChild = null;
  }

  saveEdit(): void {
    if (!this.editingChild) return;
    this.loading = true;

    this.api.updateChild(this.editingChild.id, {
      names: this.editChildNames,
      lastName: this.editChildLastName,
    }).subscribe({
      next: () => {
        const profileId = this.editingChild!.profileId;
        if (profileId && this.editProfileName !== this.editChildNames) {
          this.api.updateProfile(profileId, this.editProfileName).subscribe({
            next: () => { this.afterEdit(); },
            error: () => { this.afterEdit(); },
          });
        } else if (!profileId && this.editProfileName) {
          this.api.createProfile(this.editingChild!.id, this.editProfileName).subscribe({
            next: () => { this.afterEdit(); },
            error: () => { this.afterEdit(); },
          });
        } else {
          this.afterEdit();
        }
      },
      error: () => { this.loading = false; },
    });
  }

  private afterEdit(): void {
    this.closeEdit();
    this.loadData();
  }

  confirmDelete(child: Child): void {
    this.deletingChild = child;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deletingChild = null;
  }

  executeDelete(): void {
    if (!this.deletingChild) return;
    this.api.deleteChild(this.deletingChild.id).subscribe({
      next: () => { this.cancelDelete(); this.loadData(); },
    });
  }
}
