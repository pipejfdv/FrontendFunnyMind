/*
* extractError: Extrae mensajes de error del backend para mostrarlos al usuario.
*
* El backend retorna errores en formato:
*   { "errorMessage": "descripcion", "status": 409 }
*   { "message": "descripcion", "status": 400 }
*
* Si no hay mensaje del backend, genera uno segun el codigo HTTP:
*   409 -> "El registro ya existe."
*   403 -> "No tienes permisos para esta accion."
*   404 -> "Recurso no encontrado."
*   0   -> "Error de conexion con el servidor."
*
* @Params err unknown error de la peticion HTTP (HttpErrorResponse)
* @Params fallback String mensaje generico por defecto
* @Return String mensaje de error descriptivo
*/
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
