import { Component, inject } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GamesService } from '../../core/services/games.service';

interface Card {
  id: number;
  image: string;
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

const LEVELS = [3, 4, 5, 6];

@Component({
  selector: 'app-game-memory',
  templateUrl: 'game-memory.page.html',
  styleUrls: ['game-memory.page.scss'],
  imports: [IonContent, NgFor, NgIf, RouterLink],
})
export class GameMemoryPage {
  private gamesService = inject(GamesService);

  childName = '';
  cards: Card[] = [];
  levelIndex = 0;
  moves = 0;
  pairsFound = 0;
  totalPairs = 0;
  showInstructions = true;
  showWin = false;
  flippedCards: Card[] = [];
  isChecking = false;

  get level(): number {
    return this.levelIndex + 1;
  }

  get totalLevels(): number {
    return LEVELS.length;
  }

  constructor() {
    this.startLevel();
    const stored = localStorage.getItem('fm_selected_child');
    if (stored) {
      try { const c = JSON.parse(stored); this.childName = c.names || ''; } catch {}
    }
  }

  private startLevel(): void {
    const pairCount = LEVELS[this.levelIndex];
    this.totalPairs = pairCount;
    this.moves = 0;
    this.pairsFound = 0;
    this.flippedCards = [];
    this.isChecking = false;
    this.showWin = false;

    const deck: Card[] = [];
    let id = 0;
    for (let i = 1; i <= pairCount; i++) {
      deck.push({ id: id++, image: `assets/cartas/${i}.png`, pairId: i, flipped: false, matched: false });
      deck.push({ id: id++, image: `assets/cartas/${i}.png`, pairId: i, flipped: false, matched: false });
    }
    this.cards = this.shuffle(deck);
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  flipCard(card: Card): void {
    if (this.isChecking || card.flipped || card.matched) return;
    if (this.flippedCards.length >= 2) return;

    card.flipped = true;
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.isChecking = true;
      this.checkMatch();
    }
  }

  private checkMatch(): void {
    const [a, b] = this.flippedCards;
    if (a.pairId === b.pairId) {
      a.matched = true;
      b.matched = true;
      this.pairsFound++;
      this.flippedCards = [];
      this.isChecking = false;
      if (this.pairsFound === this.totalPairs) {
        setTimeout(() => {
          this.showWin = true;
          this.saveProgress();
        }, 500);
      }
    } else {
      setTimeout(() => {
        a.flipped = false;
        b.flipped = false;
        this.flippedCards = [];
        this.isChecking = false;
      }, 800);
    }
  }

  private saveProgress(): void {
    const stored = localStorage.getItem('fm_selected_child');
    if (!stored) return;
    try {
      const child = JSON.parse(stored);
      if (child?.id) {
        const totalAttempts = Math.max(this.moves, this.totalPairs);
        const mistakes = totalAttempts - this.totalPairs;
        this.gamesService.saveGameResult(
          '2', child.id, this.pairsFound,
          this.pairsFound, this.totalPairs, mistakes, null,
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
    this.startLevel();
  }

  restartGame(): void {
    this.levelIndex = 0;
    this.startLevel();
  }

  closeInstructions(): void {
    this.showInstructions = false;
  }

  trackByCardId(_: number, card: Card): number {
    return card.id;
  }
}
