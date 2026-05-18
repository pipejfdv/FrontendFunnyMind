/*
* GamesService: Gestion de juegos, categorias y progreso.
*
* - categories: se carga desde GET /games/listCategories (MCSJuegos) al construir el servicio.
*   En caso de error, usa categorias por defecto (FUNCION EJECUTIVA, MEMORIA Y ATENCION, VELOCIDAD DE PROCESAMIENTO).
* - games: datos estaticos de los 3 juegos (Hanoi, Memory, Reaction).
*
* El metodo saveGameResult() construye el body correcto segun el tipo de juego:
*   - Sin tiempo (Hanoi, Memory): { correctAnswer, totalItems, mistakes, timeTaken: null, maxTime: null }
*   - Con tiempo (Reaction): { correctAnswer:0, timeTaken:"PT{X}S", maxTime:"PT30M", ... }
*/
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Game, GameCategory } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private api = inject(ApiService);

  /** Lista de juegos disponibles (senal reactiva) */
  readonly games = signal<Game[]>([]);

  /** Lista de categorias de juego (senal reactiva, se actualiza desde API) */
  readonly categories = signal<GameCategory[]>([]);

  private readonly defaultCategories: GameCategory[] = [
    { id: '1', name: 'FUNCION EJECUTIVA', description: 'Planificacion, logica y estrategia.', icon: 'brain-outline', color: '#FF6B6B' },
    { id: '2', name: 'MEMORIA Y ATENCION', description: 'Memoria visual, concentracion.', icon: 'eye-outline', color: '#4ECDC4' },
    { id: '3', name: 'VELOCIDAD DE PROCESAMIENTO', description: 'Tiempo de reaccion y reflejos.', icon: 'flash-outline', color: '#FFE66D' },
  ];

  private readonly defaultGames: Game[] = [
    { id: '1', name: 'Torre de Hanoi', description: 'Apila los discos siguiendo las reglas.', icon: 'layers-outline', color: '#FF6B6B', category: this.defaultCategories[0] },
    { id: '2', name: 'Los Pares', description: 'Encuentra las parejas de cartas.', icon: 'grid-outline', color: '#4ECDC4', category: this.defaultCategories[1] },
    { id: '3', name: 'Reaction', description: 'Reacciona rapido a los estimulos.', icon: 'flash-outline', color: '#FFE66D', category: this.defaultCategories[2] },
  ];

  constructor() {
    this.categories.set(this.defaultCategories);
    this.games.set(this.defaultGames);
    this.loadFromApi();
  }

  /*
  * Intenta cargar las categorias desde MCSJuegos.
  * Si la API responde, reemplaza las categorias por defecto con las reales
  * y asigna cada juego a su categoria correspondiente por indice.
  */
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

  /*
  * Filtra juegos por categoria.
  * @Params categoryId String UUID de la categoria
  * @Return Game[] juegos que pertenecen a esa categoria
  */
  getGamesByCategory(categoryId: string): Game[] {
    return this.games().filter(g => g.category.id === categoryId);
  }

  /*
  * Busca un juego por su ID.
  * @Params id String ID del juego (1=Hanoi, 2=Memory, 3=Reaction)
  * @Return Game | undefined juego encontrado o undefined
  */
  getGameById(id: string): Game | undefined {
    return this.games().find(g => g.id === id);
  }

  /*
  * Obtiene estadisticas de un juego para un nino.
  * @Params childId String UUID del nino
  * @Params gameId String UUID del juego
  * @Return Observable<any> { totalScore, bestScore, totalPlayTime, lastPlay }
  */
  getChildStats(childId: string, gameId: string): Observable<any> {
    return this.api.getGameStats(childId, gameId);
  }

  /*
  * Obtiene el progreso de un nino en una categoria.
  * @Params childId String UUID del nino
  * @Params categoryId String UUID de la categoria
  * @Return Observable<any> { xp, attemptsDaily, level }
  */
  getChildProgress(childId: string, categoryId: string): Observable<any> {
    return this.api.getGameProgress(childId, categoryId);
  }

  saveGameStat(stat: any): Observable<boolean> {
    return this.api.saveGameStat(stat);
  }

  saveChildProgress(progress: any): Observable<boolean> {
    return this.api.updateGameProgress(progress);
  }

  /*
  * Guarda el resultado de un juego en el backend.
  * Construye automaticamente el body segun el tipo de juego (con o sin tiempo).
  * @Params gameId String ID del juego (1, 2 o 3)
  * @Params childId String UUID del nino
  * @Params xp Number puntos de experiencia ganados
  * @Params correctAnswer Number respuestas correctas (0 si es juego con tiempo)
  * @Params totalItems Number total de preguntas/items
  * @Params mistakes Number errores cometidos
  * @Params timeTakenS Number | null segundos tomados (null si juego sin tiempo)
  * @Return Observable<boolean> true si se guardo correctamente
  */
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

  /*
  * Calcula el puntaje de eficiencia para la Torre de Hanoi.
  * @Params moves Number movimientos realizados
  * @Params optimalMoves Number movimientos optimos (2^n - 1)
  * @Params diskCount Number cantidad de discos
  * @Return Number puntaje de 0 a 100
  */
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
