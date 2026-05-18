import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { NewsService, NewsArticle } from '../../core/services/news.service';
import { Child, ChildProgress } from '../../core/models/user.model';
import { GameCategory } from '../../core/models/game.model';

@Component({
  selector: 'app-medic-dashboard',
  templateUrl: 'medic-dashboard.page.html',
  styleUrls: ['medic-dashboard.page.scss'],
  imports: [IonContent, NgFor, NgIf, FormsModule],
})
export class MedicDashboardPage {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private newsService = inject(NewsService);
  readonly Math = Math;

  categories = ['health', 'technology', 'science'];
  catLabels: Record<string, { label: string; icon: string }> = {
    health: { label: 'Salud', icon: '🩺' },
    technology: { label: 'Tecnología', icon: '💻' },
    science: { label: 'Ciencia', icon: '🔬' },
  };
  activeCategory = 'health';
  news: Record<string, NewsArticle[]> = { health: [], technology: [], science: [] };
  loading = true;

  children: Child[] = [];
  gameCategories: GameCategory[] = [];
  tceClassifications: any[] = [];

  showPatientModal = false;
  patientView: (Child & { age: number; progress: ChildProgress[] }) | null = null;
  showCommentModal = false;

  // TCE update
  selectedTceId = '';
  tceUpdating = false;
  tceUpdateMessage = '';

  constructor() {
    this.loadChildren();
    this.loadAllNews();
    this.api.getCategoriesList().subscribe(cats => this.gameCategories = cats || []);
    this.api.getTceClassifications().subscribe(t => {
      if (Array.isArray(t)) this.tceClassifications = t.filter(item => item.id && item.classification);
    });
  }

  private loadChildren(): void {
    this.api.getAllChildren().subscribe({
      next: (list: any[]) => {
        if (Array.isArray(list)) {
          this.children = list.map((c: any) => ({
            id: c.id || '',
            names: c.names || '',
            lastName: c.lastName || '',
            birthDate: c.birthDate || '',
            age: c.age || 0,
            tceClassification: { id: c.tceId || '', classification: c.tceClassification || 'No especificado' },
          } as Child));
        }
      },
    });
  }

  private loadAllNews(): void {
    this.loading = true;
    let loaded = 0;
    for (const cat of this.categories) {
      this.newsService.getNews(cat).subscribe(articles => {
        this.news[cat] = articles;
        loaded++;
        if (loaded === this.categories.length) this.loading = false;
      });
    }
  }

  selectCategory(cat: string): void {
    this.activeCategory = cat;
  }

  get currentNews(): NewsArticle[] {
    return this.news[this.activeCategory] || [];
  }

  getCategoryName(categoryId: string): string {
    const cat = this.gameCategories.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId.substring(0, 8) + '...';
  }

  openPatient(child: Child): void {
    const age = this.calculateAge(child.birthDate);
    const progressList: ChildProgress[] = [];
    let loaded = 0;
    this.tceUpdateMessage = '';
    this.selectedTceId = '';

    for (const cat of this.gameCategories) {
      this.api.getGameProgress(child.id, cat.id).subscribe({
        next: (p: any) => {
          if (p && p.xp !== undefined) {
            progressList.push({
              xp: p.xp || 0,
              attemptsDaily: p.attemptsDaily || 0,
              level: p.level || 'Inicial',
              categoryId: cat.id,
              childId: child.id,
            });
          }
          loaded++;
          if (loaded >= this.gameCategories.length) {
            this.patientView = { ...child, age, progress: [...progressList] };
            this.showPatientModal = true;
          }
        },
        error: () => {
          loaded++;
          if (loaded >= this.gameCategories.length) {
            this.patientView = { ...child, age, progress: [...progressList] };
            this.showPatientModal = true;
          }
        },
      });
    }

    if (this.gameCategories.length === 0) {
      this.patientView = { ...child, age, progress: [] };
      this.showPatientModal = true;
    }
  }

  closePatient(): void {
    this.showPatientModal = false;
    this.patientView = null;
  }

  updateTce(): void {
    if (!this.patientView || !this.selectedTceId) return;
    this.tceUpdating = true;
    this.tceUpdateMessage = '';
    this.api.updateTceByChildren(this.patientView.id, this.selectedTceId).subscribe({
      next: () => {
        this.tceUpdating = false;
        this.tceUpdateMessage = '✅ Clasificación TCE actualizada';
        if (this.patientView) {
          const match = this.tceClassifications.find(t => t.id === this.selectedTceId);
          if (match) this.patientView.tceClassification = { id: match.id, classification: match.classification };
        }
        setTimeout(() => { if (this.patientView) this.tceUpdateMessage = ''; }, 3000);
      },
      error: () => {
        this.tceUpdating = false;
        this.tceUpdateMessage = '❌ Error al actualizar';
      },
    });
  }

  openCommentModal(): void {
    this.showCommentModal = true;
  }

  closeCommentModal(): void {
    this.showCommentModal = false;
  }

  calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return Math.max(0, age);
  }

  getLevelColor(level: string): string {
    const colors: Record<string, string> = {
      Inicial: '#FF6B6B', Basico: '#FFB347', Intermedio: '#4ECDC4',
      Avanzado: '#45B7D1', Experto: '#A29BFE',
    };
    return colors[level] || '#999';
  }

  getNextLevelXp(level: string): number {
    const thresholds: Record<string, number> = {
      Inicial: 200, Basico: 400, Intermedio: 600, Avanzado: 800, Experto: 1000,
    };
    return thresholds[level] || 200;
  }
}
