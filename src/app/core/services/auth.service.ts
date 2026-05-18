/*
* AuthService: Gestion de autenticacion y sesion de usuario.
*
* Flujo de login:
*   1. api.login() -> POST /auth/login -> obtiene JWT
*   2. Decodifica el payload del JWT para extraer userId (claim jti) y rol (accountType)
*   3. Almacena usuario en localStorage para restaurar sesion al recargar la pagina
*   4. navigateByRole() redirige al dashboard segun el rol
*
* El JWT tiene este payload:
*   { jti: userId, sub: username, accountType: "PremiumUser" | "Medic" | "FMAdmin" | "DemoUser" }
*
* Logout:
*   1. Llama POST /auth/logout al backend (revoca todos los tokens del usuario)
*   2. Limpia localStorage y redirige al home
*/
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { ApiService } from './api.service';

/*
* Decodifica el payload de un JWT sin verificar la firma.
* Solo extraemos los claims que el backend firmo (jti, sub, accountType).
* @Params token String el JWT completo
* @Return any objeto con los claims del payload
*/
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

  /** Estado reactivo de la sesion usando signals de Angular */
  readonly currentUser = signal<User | null>(null);
  readonly token = signal<string | null>(null);

  /** Mapa de roles a rutas del dashboard */
  private readonly roleRoutes: Record<string, string> = {
    DemoUser: '/child',
    PremiumUser: '/guardian',
    Medic: '/medic',
    FMAdmin: '/admin',
  };

  constructor() {
    this.tryRestoreSession();
  }

  /*
  * Autentica al usuario. Llama al backend y si es exitoso extrae userId y rol del JWT.
  * Tambien guarda un registro del login en localStorage para el panel de administracion.
  * @Params username String nombre de usuario
  * @Params password String contrasena
  * @Return Observable<boolean> true si el login fue exitoso
  */
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

        // Guarda registro de login para el admin (tokens)
        try {
          const logs = JSON.parse(localStorage.getItem('fm_token_logs') || '[]');
          logs.unshift({
            id: idUser,
            username: user.username,
            role: user.role,
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            active: true,
          });
          localStorage.setItem('fm_token_logs', JSON.stringify(logs.slice(0, 50)));
        } catch {}

        return true;
      }),
    );
  }

  /*
  * Cierra sesion: llama POST /auth/logout para revocar tokens en el backend,
  * luego limpia el estado local y redirige al home.
  */
  logout(): void {
    const tok = this.token();
    if (tok) {
      this.api.logout().subscribe();
    }
    this.currentUser.set(null);
    this.token.set(null);
    localStorage.removeItem('fm_token');
    localStorage.removeItem('fm_user');
    this.router.navigate(['/']);
  }

  /*
  * Redirige al dashboard correspondiente segun el rol del usuario.
  * FMAdmin y Medic van directo (no necesitan wizard).
  * PremiumUser/DemoUser verifican si ya completaron el wizard via userExists().
  */
  navigateByRole(): void {
    const user = this.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (user.role === 'FMAdmin' || user.role === 'Medic') {
      this.router.navigate([this.roleRoutes[user.role] || '/login']);
      return;
    }

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

  /*
  * Verifica si el usuario actual tiene alguno de los roles especificados.
  * @Params roles UserRole[] lista de roles a verificar
  * @Return boolean true si el usuario tiene uno de los roles
  */
  hasRole(...roles: UserRole[]): boolean {
    const user = this.currentUser();
    return !!user && roles.includes(user.role);
  }

  /*
  * Restaura la sesion desde localStorage al recargar la pagina.
  * Lee fm_user y fm_token del almacenamiento local.
  */
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
