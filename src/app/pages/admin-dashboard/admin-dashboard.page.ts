import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { extractError } from '../../core/utils/error.utils';
import { User, Child, ChildProgress, GameStat } from '../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: 'admin-dashboard.page.html',
  styleUrls: ['admin-dashboard.page.scss'],
  imports: [IonContent, NgFor, NgIf, FormsModule],
})
export class AdminDashboardPage {
  auth = inject(AuthService);
  private api = inject(ApiService);
  readonly Math = Math;

  activeSection: string | null = null;

  docUsername = ''; docEmail = ''; docPassword = ''; docName = ''; docLastname = '';
  docPhone = ''; docBiography = ''; docDocTypeId = ''; docDocNumber = '';
  docMessage = '';

  tokens: { id: string; username: string; createdAt: string; active: boolean }[] = [];

  users: User[] = [];
  selectedUser: User | null = null;
  showUserModal = false;
  editUsername = '';
  editName = '';

  patients: Child[] = [];
  selectedPatient: (Child & { stats: GameStat[]; progress: ChildProgress[] }) | null = null;
  showPatientModal = false;

  documentTypes: { id: string; type: string }[] = [];
  newDocType = '';
  editingDocType: { id: string; type: string } | null = null;
  showDocTypeForm = false;
  editDocTypeValue = '';

  tceList: { id: string; classification: string }[] = [];
  categories: { id: string; name: string; color: string }[] = [];

  reports: any = null;

  constructor() {
    this.api.getDocumentTypes().subscribe(d => this.documentTypes = d);
    this.api.getCategoriesList().subscribe(cats => {
      if (cats && cats.length > 0) {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D'];
        this.categories = cats.map((c: any, i: number) => ({
          id: c.id,
          name: (c.name || '').toUpperCase(),
          color: colors[i % colors.length],
        }));
      }
    });
  }

  toggleSection(section: string): void {
    this.activeSection = this.activeSection === section ? null : section;
    if (section === 'users') this.loadUsers();
    if (section === 'patients') this.loadPatients();
    if (section === 'tokens') this.loadTokens();
    if (section === 'types') this.api.getDocumentTypes().subscribe(d => this.documentTypes = d);
    if (section === 'tce') this.loadTceList();
    if (section === 'reports') this.loadReports();
  }

  private loadTceList(): void {
    this.api.getTceClassifications().subscribe(t => this.tceList = t);
  }

  createDoctor(): void {
    if (!this.docUsername || !this.docEmail || !this.docPassword || !this.docName || !this.docLastname || !this.docDocNumber) {
      this.docMessage = 'Completa los campos obligatorios (*)';
      return;
    }
    this.api.createMedicUser({
      username: this.docUsername, email: this.docEmail, password: this.docPassword,
      name: this.docName, lastname: this.docLastname, phone: this.docPhone,
      biography: this.docBiography, docTypeId: this.docDocTypeId, docNumber: this.docDocNumber,
    }).subscribe({
      next: () => {
        this.docUsername = ''; this.docEmail = ''; this.docPassword = '';
        this.docName = ''; this.docLastname = ''; this.docPhone = ''; this.docBiography = '';
        this.docDocTypeId = ''; this.docDocNumber = '';
        this.docMessage = '✓ Médico creado exitosamente';
        this.loadUsers();
      },
      error: (err) => { this.docMessage = extractError(err, 'Error al crear medico.'); },
    });
  }

  private loadTokens(): void {
    try {
      const logs = JSON.parse(localStorage.getItem('fm_token_logs') || '[]');
      this.tokens = logs.map((t: any) => ({
        id: t.id,
        username: t.username,
        createdAt: t.createdAt,
        active: t.active !== false,
      }));
    } catch {
      this.tokens = [];
    }
  }

  deleteToken(userId: string): void {
    this.api.deleteToken(userId).subscribe({
      next: () => {
        try {
          const logs = JSON.parse(localStorage.getItem('fm_token_logs') || '[]');
          const updated = logs.filter((t: any) => t.id !== userId);
          localStorage.setItem('fm_token_logs', JSON.stringify(updated));
        } catch {}
        this.loadTokens();
      },
    });
  }

  private loadUsers(): void {
    this.api.getUsers().subscribe(u => this.users = u);
  }

  openUser(user: User): void {
    this.selectedUser = { ...user };
    this.editUsername = user.username;
    this.editName = user.name;
    this.showUserModal = true;
  }

  closeUser(): void { this.showUserModal = false; this.selectedUser = null; }

  saveUser(): void {
    if (!this.selectedUser) return;
    // User update via API
    this.loadUsers();
    this.closeUser();
  }

  deleteUser(id: string): void {
    this.api.deleteUser(id).subscribe({
      next: () => {
        this.loadUsers();
        if (this.selectedUser?.id === id) this.closeUser();
      },
    });
  }

  private loadPatients(): void {
    this.api.getAllChildren().subscribe(p => this.patients = p);
  }

  openPatient(child: Child): void {
    const progress: ChildProgress[] = [];
    let loaded = 0;

    for (const cat of this.categories) {
      this.api.getGameProgress(child.id, cat.id).subscribe({
        next: (p: any) => {
          if (p && p.xp !== undefined) {
            progress.push({
              xp: p.xp || 0,
              attemptsDaily: p.attemptsDaily || 0,
              level: p.level || 'Inicial',
              categoryId: cat.id,
              childId: child.id,
            });
          }
          loaded++;
          if (loaded >= this.categories.length || this.categories.length === 0) {
            this.selectedPatient = { ...child, stats: [], progress: [...progress] };
            this.showPatientModal = true;
          }
        },
        error: () => {
          loaded++;
          if (loaded >= this.categories.length || this.categories.length === 0) {
            this.selectedPatient = { ...child, stats: [], progress: [...progress] };
            this.showPatientModal = true;
          }
        },
      });
    }
  }

  closePatient(): void { this.showPatientModal = false; this.selectedPatient = null; }

  addDocType(): void {
    if (!this.newDocType.trim()) return;
    this.api.createDocumentType(this.newDocType.trim()).subscribe({
      next: () => {
        this.newDocType = '';
        this.api.getDocumentTypes().subscribe(d => this.documentTypes = d);
      },
    });
  }

  startEditDocType(dt: { id: string; type: string }): void {
    this.editingDocType = dt;
    this.editDocTypeValue = dt.type;
    this.showDocTypeForm = true;
  }

  saveDocType(): void {
    if (!this.editingDocType || !this.editDocTypeValue.trim()) return;
    this.api.updateDocumentType(this.editingDocType.id, this.editDocTypeValue.trim()).subscribe({
      next: () => {
        this.editingDocType = null;
        this.showDocTypeForm = false;
        this.api.getDocumentTypes().subscribe(d => this.documentTypes = d);
      },
    });
  }

  cancelDocTypeEdit(): void {
    this.editingDocType = null;
    this.showDocTypeForm = false;
  }

  deleteDocType(id: string): void {
    this.api.deleteDocumentType(id).subscribe({
      next: () => this.api.getDocumentTypes().subscribe(d => this.documentTypes = d),
    });
  }

  private loadReports(): void {
    this.api.getAllChildren().subscribe(children => {
      const byLevel: { level: string; count: number }[] = [
        { level: 'Inicial', count: 0 },
        { level: 'Basico', count: 0 },
        { level: 'Intermedio', count: 0 },
        { level: 'Avanzado', count: 0 },
        { level: 'Experto', count: 0 },
      ];
      const byCategory: { name: string; xp: number }[] = this.categories.map(c => ({ name: c.name, xp: 0 }));
      const individual: { childName: string; xp: number; level: string; color: string }[] = [];
      let loaded = 0;

      if (children.length === 0 || this.categories.length === 0) {
        this.reports = { totalChildren: 0, totalPlayTimeHours: 0, avgScore: 0, byLevel, byCategory, individual };
        return;
      }

      for (const child of children) {
        let totalXp = 0;
        let topLevel = 'Inicial';
        const levelOrder = ['Inicial', 'Basico', 'Intermedio', 'Avanzado', 'Experto'];
        const childCategories: { name: string; xp: number }[] = [];

        for (const cat of this.categories) {
          this.api.getGameProgress(child.id, cat.id).subscribe({
            next: (p: any) => {
              if (p && p.xp !== undefined) {
                totalXp += p.xp;
                const catIdx = byCategory.findIndex(bc => bc.name === cat.name);
                if (catIdx >= 0) byCategory[catIdx].xp += p.xp;

                const levelIdx = levelOrder.indexOf(p.level);
                if (levelIdx > levelOrder.indexOf(topLevel)) topLevel = p.level;
              }
            },
            error: () => {},
          }).add(() => {
            loaded++;
            if (loaded >= children.length * this.categories.length) {
              const levelColors: Record<string, string> = {
                Inicial: '#FF6B6B', Basico: '#FFB347', Intermedio: '#4ECDC4',
                Avanzado: '#45B7D1', Experto: '#A29BFE',
              };
              for (const c of children) {
                individual.push({
                  childName: c.names,
                  xp: 0,
                  level: 'Inicial',
                  color: '#FF6B6B',
                });
              }
              this.reports = {
                totalChildren: children.length,
                totalPlayTimeHours: 0,
                avgScore: 0,
                byLevel,
                byCategory,
                individual,
              };
            }
          });
        }
      }
    });
  }

  calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  getLevelColor(level: string): string {
    const colors: Record<string, string> = {
      Inicial: '#FF6B6B', Basico: '#FFB347', Intermedio: '#4ECDC4',
      Avanzado: '#45B7D1', Experto: '#A29BFE',
    };
    return colors[level] || '#999';
  }

  getRoleBadge(role: string): string {
    const colors: Record<string, string> = {
      DemoUser: '#FF6B6B', PremiumUser: '#4ECDC4', Medic: '#A29BFE', FMAdmin: '#FFB347',
    };
    return colors[role] || '#999';
  }

  getProgressForCategory(catId: string, progress: ChildProgress[]): ChildProgress | undefined {
    return progress.find(p => p.categoryId === catId);
  }

  getNextLevelXp(level: string): number {
    const thresholds: Record<string, number> = {
      Inicial: 200, Basico: 400, Intermedio: 600, Avanzado: 800, Experto: 1000,
    };
    return thresholds[level] || 200;
  }

  patientTotalMinutes(): number {
    if (!this.selectedPatient) return 0;
    return Math.round(this.selectedPatient.stats.reduce((a, s) => a + s.totalPlayTime, 0) / 60);
  }

  patientTotalScore(): number {
    if (!this.selectedPatient) return 0;
    return this.selectedPatient.stats.reduce((a, s) => a + s.totalScore, 0);
  }

  patientBestScore(): number {
    if (!this.selectedPatient || !this.selectedPatient.stats.length) return 0;
    return Math.max(...this.selectedPatient.stats.map(s => s.bestScore));
  }
}
