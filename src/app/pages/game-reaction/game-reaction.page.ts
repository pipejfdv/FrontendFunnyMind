import { Component, OnDestroy, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GamesService } from '../../core/services/games.service';

interface Target {
  x: number;
  y: number;
  id: number;
  exploding: boolean;
}

const LEVELS = [3000, 2500, 2000, 1500, 1000];
const GAME_DURATION = 30;

@Component({
  selector: 'app-game-reaction',
  templateUrl: 'game-reaction.page.html',
  styleUrls: ['game-reaction.page.scss'],
  imports: [IonContent, NgIf, RouterLink],
})
export class GameReactionPage implements OnDestroy {
  private gamesService = inject(GamesService);

  childName = '';
  levelIndex = 0;
  hits = 0;
  misses = 0;
  totalSpawned = 0;
  timeLeft = GAME_DURATION;
  showInstructions = true;
  showResult = false;
  playing = false;
  target: Target | null = null;
  private startTime = 0;
  private timerInterval: ReturnType<typeof setInterval> | undefined;
  private spawnTimeout: ReturnType<typeof setTimeout> | undefined;
  private disappearTimeout: ReturnType<typeof setTimeout> | undefined;
  private nextId = 0;

  get level(): number { return this.levelIndex + 1; }
  get totalLevels(): number { return LEVELS.length; }
  readonly GAME_DURATION = GAME_DURATION;
  get accuracy(): number {
    const total = this.hits + this.misses;
    return total ? Math.round((this.hits / total) * 100) : 0;
  }

  ngOnDestroy(): void {
    this.clearAll();
  }

  private clearAll(): void {
    clearInterval(this.timerInterval);
    clearTimeout(this.spawnTimeout);
    clearTimeout(this.disappearTimeout);
  }

  constructor() {
    const stored = localStorage.getItem('fm_selected_child');
    if (stored) {
      try { const c = JSON.parse(stored); this.childName = c.names || ''; } catch {}
    }
  }

  closeInstructions(): void {
    this.showInstructions = false;
    this.startGame();
  }

  private startGame(): void {
    this.playing = true;
    this.hits = 0;
    this.misses = 0;
    this.totalSpawned = 0;
    this.timeLeft = GAME_DURATION;
    this.target = null;
    this.startTime = Date.now();
    this.clearAll();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);

    this.spawnTarget();
  }

  private spawnTarget(): void {
    if (!this.playing) return;

    const size = 60;
    this.totalSpawned++;

    const x = 10 + Math.random() * (80);
    const y = 10 + Math.random() * (70);

    const id = this.nextId++;
    this.target = { x, y, id, exploding: false };

    this.disappearTimeout = setTimeout(() => {
      if (this.target?.id === id && this.playing) {
        this.misses++;
        this.target = null;
        this.spawnTarget();
      }
    }, LEVELS[this.levelIndex]);
  }

  hitTarget(): void {
    if (!this.target || !this.playing) return;

    this.hits++;
    const currentTarget = this.target;
    currentTarget.exploding = true;

    setTimeout(() => {
      if (this.target?.id === currentTarget.id) {
        this.target = null;
        this.spawnTarget();
      }
    }, 200);
  }

  private endGame(): void {
    this.playing = false;
    this.target = null;
    this.clearAll();
    this.showResult = true;
    this.saveProgress();
  }

  private saveProgress(): void {
    const stored = localStorage.getItem('fm_selected_child');
    if (!stored) return;
    try {
      const child = JSON.parse(stored);
      if (child?.id) {
        const elapsed = Math.round((Date.now() - this.startTime) / 1000);
        this.gamesService.saveGameResult(
          '3', child.id, this.hits,
          0, 0, 0, Math.max(1, elapsed),
        ).subscribe();
      }
    } catch {}
  }

  nextLevel(): void {
    if (this.levelIndex < LEVELS.length - 1) {
      this.levelIndex++;
    } else {
      this.levelIndex = 0;
    }
    this.showResult = false;
    setTimeout(() => this.startGame(), 100);
  }

  restartGame(): void {
    this.levelIndex = 0;
    this.showResult = false;
    setTimeout(() => this.startGame(), 100);
  }
}
