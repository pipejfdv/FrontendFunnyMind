/*
* authInterceptor: Interceptor HTTP que anade headers a TODAS las peticiones salientes.
*
* Headers incluidos:
*   Authorization: Bearer <token>  (token JWT desde localStorage)
*   Accept: application/json       (fuerza respuesta JSON)
*   ngrok-skip-browser-warning: true (evita pagina de advertencia de ngrok)
*
* En caso de respuesta 401 (no autorizado), limpia la sesion y redirige al login.
*/
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('fm_token');

  let headers: Record<string, string> = {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cloned = req.clone({ setHeaders: headers });

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        localStorage.removeItem('fm_token');
        localStorage.removeItem('fm_user');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
