import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly isLoading = signal(false);
  message = signal('Cargando...');

  show(msg?: string): void {
    if (msg) this.message.set(msg);
    this.isLoading.set(true);
  }

  hide(): void {
    this.isLoading.set(false);
  }
}
