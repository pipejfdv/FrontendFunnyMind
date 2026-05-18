import { HttpErrorResponse } from '@angular/common/http';

export function extractError(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    if (typeof err.error === 'object' && err.error !== null) {
      const body = err.error as any;
      if (body.errorMessage) return body.errorMessage;
      if (body.message) return body.message;
    }
    if (err.status === 409) return 'El registro ya existe.';
    if (err.status === 403) return 'No tienes permisos para esta accion.';
    if (err.status === 404) return 'Recurso no encontrado.';
    if (err.status === 0) return 'Error de conexion con el servidor.';
  }
  return fallback;
}
