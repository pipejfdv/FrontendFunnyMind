import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { ApiService } from './api.service';

function decodeJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  readonly currentUser = signal<User | null>(null);
  readonly token = signal<string | null>(null);

  private readonly roleRoutes: Record<string, string> = {
    DemoUser: '/child',
    PremiumUser: '/guardian',
    Medic: '/medic',
    FMAdmin: '/admin',
  };

  constructor() {
    this.tryRestoreSession();
  }

  login(username: string, password: string): Observable<boolean> {
    return this.api.login(username, password).pipe(
      map(res => {
        const tok = res.accessToken;
        if (!tok) return false;

        this.token.set(tok);
        localStorage.setItem('fm_token', tok);

        const payload = decodeJwt(tok);
        const idUser: string = payload?.jti || payload?.id || '';
        const accountType: string = payload?.accountType || '';
        const role = (accountType as UserRole) || 'PremiumUser';

        const user: User = {
          id: idUser,
          username: payload?.sub || username,
          name: payload?.sub || username,
          role,
        };

        this.currentUser.set(user);
        localStorage.setItem('fm_user', JSON.stringify(user));
        return true;
      }),
    );
  }

  logout(): void {
    this.currentUser.set(null);
    this.token.set(null);
    localStorage.removeItem('fm_token');
    localStorage.removeItem('fm_user');
    this.router.navigate(['/']);
  }

  navigateByRole(): void {
    const user = this.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // FMAdmin y Medic van directo a su dashboard, sin wizard
    if (user.role === 'FMAdmin' || user.role === 'Medic') {
      this.router.navigate([this.roleRoutes[user.role] || '/login']);
      return;
    }

    // PremiumUser/DemoUser: chequean si ya completaron el registro
    this.api.userExists(user.id).subscribe({
      next: (exists) => {
        if (exists) {
          this.router.navigate([this.roleRoutes[user.role] || '/login']);
        } else {
          this.router.navigate(['/wizard']);
        }
      },
      error: () => {
        this.router.navigate([this.roleRoutes[user.role] || '/login']);
      },
    });
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this.currentUser();
    return !!user && roles.includes(user.role);
  }

  private tryRestoreSession(): void {
    const stored = localStorage.getItem('fm_user');
    const savedToken = localStorage.getItem('fm_token');
    if (stored && savedToken) {
      try {
        const user = JSON.parse(stored) as User;
        this.currentUser.set(user);
        this.token.set(savedToken);
      } catch {
        localStorage.removeItem('fm_user');
        localStorage.removeItem('fm_token');
      }
    }
  }
}
