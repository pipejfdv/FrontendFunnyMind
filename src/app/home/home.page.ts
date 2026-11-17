import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { NgFor } from '@angular/common';

interface PreviewCard {
  image: string;
  flipped: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonContent, RouterLink, NgFor],
})
export class HomePage {
  readonly year = new Date().getFullYear();

  readonly cards: PreviewCard[] = [
    { image: 'assets/cartas/3.png', flipped: true },
    { image: 'assets/cartas/7.png', flipped: false },
    { image: 'assets/cartas/8.png', flipped: false },
    { image: 'assets/cartas/3.png', flipped: false },
    { image: 'assets/cartas/8.png', flipped: true },
    { image: 'assets/cartas/7.png', flipped: false },
  ];

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  flip(card: PreviewCard): void {
    card.flipped = !card.flipped;
  }
}
