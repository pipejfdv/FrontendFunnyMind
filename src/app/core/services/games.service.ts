import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Game, GameCategory } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private api = inject(ApiService);

  readonly games = signal<Game[]>([]);
  readonly categories = signal<GameCategory[]>([]);

  private readonly defaultCategories: GameCategory[] = [
    { id: '1', name: 'FUNCIÓN EJECUTIVA', description: 'Planificación, lógica y estrategia.', icon: 'brain-outline', color: '#FF6B6B' },
    { id: '2', name: 'MEMORIA Y ATENCIÓN', description: 'Memoria visual, concentración.', icon: 'eye-outline', color: '#4ECDC4' },
    { id: '3', name: 'VELOCIDAD DE PROCESAMIENTO', description: 'Tiempo de reacción y reflejos.', icon: 'flash-outline', color: '#FFE66D' },
  ];

  private readonly defaultGames: Game[] = [
    { id: '1', name: 'Torre de Hanoi', description: 'Apila los discos siguiendo las reglas.', icon: 'layers-outline', color: '#FF6B6B', category: this.defaultCategories[0] },
    { id: '2', name: 'Los Pares', description: 'Encuentra las parejas de cartas.', icon: 'grid-outline', color: '#4ECDC4', category: this.defaultCategories[1] },
    { id: '3', name: 'Reaction', description: 'Reacciona rápido a los estímulos.', icon: 'flash-outline', color: '#FFE66D', category: this.defaultCategories[2] },
  ];

  constructor() {
    this.categories.set(this.defaultCategories);
    this.games.set(this.defaultGames);
    this.loadFromApi();
  }

  private loadFromApi(): void {
    this.api.getCategoriesList().subscribe({
      next: (cats: any[]) => {
        if (cats && cats.length > 0) {
          const mapped: GameCategory[] = cats.map((c: any, i: number) => ({
            id: c.id || '',
            name: (c.name || '').toUpperCase(),
            description: c.description || '',
            icon: 'grid-outline',
            color: this.getColorForIndex(i),
          }));
          this.categories.set(mapped);
          this.games.update(gs => gs.map((g, i) => ({
            ...g,
            category: mapped[i] || g.category,
          })));
        }
      },
    });
  }

  private getColorForIndex(i: number): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A29BFE', '#45B7D1'];
    return colors[i % colors.length];
  }

  getGamesByCategory(categoryId: string): Game[] {
    return this.games().filter(g => g.category.id === categoryId);
  }

  getGameById(id: string): Game | undefined {
    return this.games().find(g => g.id === id);
  }

  getChildStats(childId: string, gameId: string): Observable<any> {
    return this.api.getGameStats(childId, gameId);
  }

  getChildProgress(childId: string, categoryId: string): Observable<any> {
    return this.api.getGameProgress(childId, categoryId);
  }

  saveGameStat(stat: any): Observable<boolean> {
    return this.api.saveGameStat(stat);
  }

  saveChildProgress(progress: any): Observable<boolean> {
    return this.api.updateGameProgress(progress);
  }

  saveGameResult(
    gameId: string, childId: string, xp: number,
    correctAnswer: number, totalItems: number, mistakes: number,
    timeTakenS: number | null,
  ): Observable<boolean> {
    const game = this.games().find(g => g.id === gameId);
    const categoryId = game?.category?.id || '';
    const withTime = timeTakenS !== null && timeTakenS > 0;

    const body = {
      correctAnswer: withTime ? 0 : correctAnswer,
      totalItems: withTime ? 0 : totalItems,
      mistakes: withTime ? 0 : mistakes,
      timeTaken: withTime ? `PT${Math.round(timeTakenS)}S` : null,
      maxTime: withTime ? 'PT30M' : null,
      childProgres: {
        childrenId: childId,
        xp: Math.round(xp),
        level: 'Inicial',
        categoryOfGame: { id: categoryId },
      },
    };

    return this.api.updateGameProgress(body);
  }

  calculateHanoiScore(moves: number, optimalMoves: number, diskCount: number): number {
    const efficiency = optimalMoves / Math.max(moves, 1);
    return Math.round(Math.min(100, efficiency * 100 * (1 + diskCount * 0.05)));
  }

  getAllChildren(): Observable<any[]> {
    return this.api.getAllChildren();
  }

  getChildrenByGuardian(): Observable<any[]> {
    return this.api.getChildrenByGuardian();
  }
}
