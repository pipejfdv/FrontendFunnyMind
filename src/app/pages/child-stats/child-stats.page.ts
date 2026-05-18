/*
* ChildStatsPage: Estadisticas de progreso por nino (vista guardian).
* Carga las categorias desde MCSJuegos y para cada nino + categoria
* consulta el progreso via GET /games/progress/{childId}/{catId}.
* Muestra barras de XP, nivel alcanzado e intentos del dia.
*/
import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { GamesService } from '../../core/services/games.service';
import { Child, ChildProgress } from '../../core/models/user.model';
import { GameCategory } from '../../core/models/game.model';

@Component({
  selector: 'app-child-stats',
  templateUrl: 'child-stats.page.html',
  styleUrls: ['child-stats.page.scss'],
  imports: [IonContent, NgFor, NgIf, RouterLink],
})
export class ChildStatsPage {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private gamesService = inject(GamesService);
  private router = inject(Router);
  readonly Math = Math;

  children: Child[] = [];
  selectedChild: Child | null = null;
  progress: ChildProgress[] = [];
  categories: GameCategory[] = [];
  showAppointmentModal = false;
  loading = true;

  constructor() {
    // Carga categorias desde MCSJuegos o usa las del GamesService
    this.api.getCategoriesList().subscribe(cats => {
      this.categories = cats && cats.length > 0 ? cats : this.gamesService.categories();
      this.loadChildren();
    });
  }

  private loadChildren(): void {
    this.loading = true;
    this.api.getChildrenByGuardian().subscribe({
      next: (list: any[]) => {
        if (Array.isArray(list)) {
          this.children = list.map((c: any) => ({
            id: c.id || '',
            names: c.names || '',
            lastName: c.lastName || '',
            birthDate: c.birthDate || '',
            age: c.age,
            tceClassification: { id: '', classification: c.tceClassification || 'No especificado' },
          } as Child));
          if (this.children.length > 0) this.selectChild(this.children[0]);
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  selectChild(child: Child): void {
    this.selectedChild = child;
    this.loadProgress(child.id);
  }

  // Carga progreso para cada categoria del nino seleccionado
  private loadProgress(childId: string): void {
    const progressList: ChildProgress[] = [];
    let loaded = 0;
    for (const cat of this.categories) {
      this.api.getGameProgress(childId, cat.id).subscribe({
        next: (p: any) => {
          if (p && p.xp !== undefined) {
            progressList.push({
              xp: p.xp || 0,
              attemptsDaily: p.attemptsDaily || 0,
              level: p.level || 'Inicial',
              categoryId: cat.id,
              childId: childId,
            });
          }
          loaded++;
          if (loaded >= this.categories.length) this.progress = [...progressList];
        },
        error: () => {
          loaded++;
          if (loaded >= this.categories.length) this.progress = [...progressList];
        },
      });
    }
  }

  getProgressForCategory(catId: string): ChildProgress | undefined {
    return this.progress.find(p => p.categoryId === catId);
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

  goToGames(child: Child): void {
    this.router.navigate(['/child'], { queryParams: { childId: child.id } });
  }
}
