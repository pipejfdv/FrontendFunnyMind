import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { GamesService } from '../../core/services/games.service';
import { Game, GameCategory } from '../../core/models/game.model';
import { Child } from '../../core/models/user.model';

@Component({
  selector: 'app-child-dashboard',
  templateUrl: 'child-dashboard.page.html',
  styleUrls: ['child-dashboard.page.scss'],
  imports: [IonContent, RouterLink, NgFor, NgIf],
})
export class ChildDashboardPage {
  private gamesService = inject(GamesService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  categories: GameCategory[];
  games: Game[];
  selectedChild: Child | null = null;
  isPremiumFlow = false;

  readonly catEmojis: Record<string, string> = {
    'FUNCIÓN EJECUTIVA': '🧠',
    'MEMORIA Y ATENCIÓN': '👁️',
    'VELOCIDAD DE PROCESAMIENTO': '⚡',
  };

  constructor() {
    this.categories = this.gamesService.categories();
    this.games = this.gamesService.games();

    this.route.queryParams.subscribe(params => {
      const childId = params['childId'];
      if (childId) {
        this.isPremiumFlow = true;
        const stored = localStorage.getItem('fm_selected_child');
        if (stored) {
          try { this.selectedChild = JSON.parse(stored); } catch { this.selectedChild = null; }
        }
      } else {
        this.isPremiumFlow = false;
        this.selectedChild = null;
      }
    });
  }

  getGamesByCategory(catId: string): Game[] {
    return this.games.filter(g => g.category.id === catId);
  }
}
