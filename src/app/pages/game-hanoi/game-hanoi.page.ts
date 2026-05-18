import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GamesService } from '../../core/services/games.service';

interface HanoiState {
  towers: number[][];
  moves: number;
  diskCount: number;
  selectedTower: number | null;
  isComplete: boolean;
}

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  color: string;
}

const LEVELS = [4, 5, 6, 7, 8, 9];
const DISK_HEIGHT = 28;
const DISK_COLORS = [
  '#FF6B6B', '#FF9F43', '#FFE66D', '#2ECC71',
  '#4ECDC4', '#45B7D1', '#A29BFE', '#FD79A8', '#FDCB6E',
];

function createConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    color: DISK_COLORS[Math.floor(Math.random() * DISK_COLORS.length)],
  }));
}

@Component({
  selector: 'app-game-hanoi',
  templateUrl: 'game-hanoi.page.html',
  styleUrls: ['game-hanoi.page.scss'],
  imports: [NgFor, NgIf, RouterLink, IonContent],
})
export class GameHanoiPage {
  auth = inject(AuthService);
  private gamesService = inject(GamesService);
  private route = inject(ActivatedRoute);

  backRoute = '/child';
  childName = '';

  state: HanoiState;
  level = 1;
  showWin = false;
  showInstructions = true;
  draggedFrom: number | null = null;
  currentLevelIndex = 0;

  readonly DISK_HEIGHT = DISK_HEIGHT;
  readonly LEVELS = LEVELS;
  readonly DISK_COLORS = DISK_COLORS;
  readonly confettiArr: number[] = Array.from({ length: 30 }, (_, i) => i);
  confettiPieces: ConfettiPiece[] = [];

  constructor() {
    this.state = this.createGame(LEVELS[0]);
    this.regenerateConfetti();

    this.route.queryParams.subscribe(params => {
      this.backRoute = params['from'] === 'child' ? '/child' : '/guardian';
    });
    const stored = localStorage.getItem('fm_selected_child');
    if (stored) {
      try { const c = JSON.parse(stored); this.childName = c.names || ''; } catch {}
    }
  }

  private regenerateConfetti(): void {
    this.confettiPieces = createConfetti(30);
  }

  private createGame(diskCount: number): HanoiState {
    return {
      towers: [
        Array.from({ length: diskCount }, (_, i) => diskCount - i),
        [],
        [],
      ],
      moves: 0,
      diskCount,
      selectedTower: null,
      isComplete: false,
    };
  }

  get disksPerTower(): number[][] {
    return this.state.towers.map(t => [...t]);
  }

  diskWidth(disk: number): number {
    const minW = 40;
    const maxW = 180;
    const step = (maxW - minW) / (Math.max(this.state.diskCount - 1, 1));
    return minW + (disk - 1) * step;
  }

  diskColor(disk: number): string {
    return DISK_COLORS[(disk - 1) % DISK_COLORS.length];
  }

  selectTower(towerIndex: number): void {
    if (this.state.isComplete || this.showInstructions) return;

    const tower = this.state.towers[towerIndex];
    const sourceIdx = this.state.selectedTower;

    if (sourceIdx === null) {
      if (tower.length === 0) return;
      this.state.selectedTower = towerIndex;
    } else {
      if (sourceIdx === towerIndex) {
        this.state.selectedTower = null;
        return;
      }
      this.executeMove(sourceIdx, towerIndex);
      this.state.selectedTower = null;
    }
  }

  private executeMove(from: number, to: number): void {
    const src = this.state.towers[from];
    const dst = this.state.towers[to];
    if (src.length === 0) return;
    if (dst.length > 0 && src[src.length - 1] > dst[dst.length - 1]) return;

    const disk = src.pop()!;
    dst.push(disk);
    this.state.moves++;

    if (to === 2 && dst.length === this.state.diskCount) {
      this.state.isComplete = true;
      this.showWin = true;
      this.regenerateConfetti();
      this.saveProgress();
    }
  }

  private saveProgress(): void {
    const stored = localStorage.getItem('fm_selected_child');
    if (!stored) return;
    try {
      const child = JSON.parse(stored);
      if (child?.id) {
        const mistakes = Math.max(0, this.state.moves - this.optimalMoves);
        this.gamesService.saveGameResult(
          '1', child.id, this.score,
          this.score, this.optimalMoves, mistakes, null,
        ).subscribe();
      }
    } catch {}
  }

  onDragStart(event: DragEvent, towerIndex: number): void {
    if (this.state.isComplete || this.showInstructions) return;
    const tower = this.state.towers[towerIndex];
    if (tower.length === 0 || !event.dataTransfer) {
      event.preventDefault();
      return;
    }
    this.draggedFrom = towerIndex;
    this.state.selectedTower = towerIndex;
    event.dataTransfer.setData('text/plain', String(towerIndex));
    event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, towerIndex: number): void {
    event.preventDefault();
    if (this.draggedFrom === null || this.draggedFrom === towerIndex) {
      this.draggedFrom = null;
      this.state.selectedTower = null;
      return;
    }
    this.executeMove(this.draggedFrom, towerIndex);
    this.draggedFrom = null;
    this.state.selectedTower = null;
  }

  resetLevel(): void {
    this.state = this.createGame(LEVELS[this.currentLevelIndex]);
    this.showWin = false;
  }

  restartGame(): void {
    this.currentLevelIndex = 0;
    this.level = 1;
    this.state = this.createGame(LEVELS[0]);
    this.showWin = false;
  }

  nextLevel(): void {
    this.currentLevelIndex++;
    if (this.currentLevelIndex >= LEVELS.length) {
      this.currentLevelIndex = 0;
      this.level = 1;
    } else {
      this.level = this.currentLevelIndex + 1;
    }
    this.state = this.createGame(LEVELS[this.currentLevelIndex]);
    this.showWin = false;
  }

  get optimalMoves(): number {
    return Math.pow(2, this.state.diskCount) - 1;
  }

  get score(): number {
    const efficiency = this.optimalMoves / Math.max(this.state.moves, 1);
    return Math.round(Math.min(100, efficiency * 100 * (1 + this.state.diskCount * 0.05)));
  }

  closeInstructions(): void {
    this.showInstructions = false;
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByConfettiId(_: number, piece: ConfettiPiece): number {
    return piece.id;
  }
}
