/*
* ApiService: Capa unica de comunicacion con el backend.
* Todas las llamadas HTTP pasan por este servicio.
* La URL base viene de environment.apiUrl:
*   - Desarrollo: http://localhost:8080/pipejfdv/api/v1
*   - Produccion: /pipejfdv/api/v1 (relativo, nginx proxy)
*/
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { WizardData, DocumentType, Relationship, TceClassification } from '../models/registration.model';
import { User, UserRole } from '../models/user.model';

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /*
  * Autentica al usuario contra MCSAuth (verifica credenciales via Feign contra MCSUsersFM).
  * @Params username String nombre de usuario
  * @Params password String contrasena
  * @Return Observable<LoginResponse> accessToken (JWT) + refreshToken
  */
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { username, password }).pipe(
      map(res => ({
        accessToken: res?.data?.token,
        refreshToken: res?.data?.refreshToken,
      })),
    );
  }

  /*
  * Verifica si el usuario ya completo el registro (wizard).
  * Usado por navigateByRole() para decidir si redirigir al wizard o al dashboard.
  * @Params userId String UUID del usuario
  * @Return Observable<boolean> true si existe registro completo
  */
  userExists(userId: string): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/User/exists/${userId}`).pipe(
      map(res => res?.data === true || res?.data === 'true'),
    );
  }

  /*
  * Crea un usuario con el rol especificado. Endpoint publico.
  * @Params username String nombre de usuario
  * @Params email String correo electronico
  * @Params password String contrasena sin encriptar
  * @Params membership String rol (PremiumUser, DemoUser, Medic, FMAdmin)
  * @Return Observable<String> UUID del usuario creado
  */
  createUser(username: string, email: string, password: string, membership: string): Observable<string> {
    return this.http.post<any>(`${this.apiUrl}/funnyMind/User/create/${membership}`, { username, email, password }).pipe(
      map(res => res?.data?.idUser || res?.idUser || ''),
    );
  }

  /*
  * Lista todos los usuarios registrados. Solo accesible por FMAdmin.
  * La API retorna {idUser, username, email, accountType}.
  * @Return Observable<User[]> lista de usuarios mapeados al modelo User
  */
  getUsers(): Observable<User[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/User/list`).pipe(
      map(r => {
        const raw: any[] = r?.data || [];
        return raw.map((u: any) => ({
          id: u.idUser || u.id || '',
          username: u.username || '',
          name: u.username || u.name || '',
          role: (typeof u.accountType === 'string' ? u.accountType : u.accountType?.name || u.typeOfAccount || '') as UserRole,
        }));
      }),
    );
  }

  /*
  * Obtiene datos completos del guardian (incluye documentType y document).
  * Solo FMAdmin puede acceder.
  * @Params guardianId String UUID del guardian
  * @Return Observable<any> datos del guardian (GuardianAdminDTO)
  */
  getGuardianAdminInfo(guardianId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/Guardian/admin?id=${guardianId}`).pipe(map(r => r?.data || {}));
  }

  /*
  * Elimina un usuario por su UUID.
  * @Params userId String UUID del usuario a eliminar
  * @Return Observable<boolean> true si se elimino correctamente
  */
  deleteUser(userId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/funnyMind/User/delete?id=${userId}`).pipe(map(() => true));
  }

  /*
  * Obtiene los datos del guardian del usuario autenticado.
  * El backend extrae el usuario del JWT, no requiere parametro.
  * @Return Observable<any> datos publicos del guardian (GuardianPublicDTO)
  */
  getMyGuardianInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/Guardian/public`).pipe(
      map(r => r?.data || {}),
    );
  }

  /*
  * Obtiene datos del guardian por ID de usuario.
  * @Params userId String UUID del usuario
  * @Return Observable<any> datos publicos del guardian
  */
  getGuardianInfo(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/Guardian/public?id=${userId}`).pipe(
      map(r => r?.data || {}),
    );
  }

  /*
  * Actualiza los datos del guardian.
  * @Params guardianId String UUID del guardian
  * @Params data any objeto con campos a actualizar (name, lastname, phone, biography)
  * @Return Observable<boolean> true si se actualizo
  */
  updateGuardian(guardianId: string, data: any): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/funnyMind/Guardian/edit?id=${guardianId}`, data).pipe(map(() => true));
  }

  /*
  * Lista los hijos del guardian autenticado (PremiumUser).
  * @Return Observable<any[]> lista de ChildrenPublicDTO
  */
  getChildrenByGuardian(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/children/public/list`).pipe(map(r => r?.data || []));
  }

  /*
  * Lista TODOS los hijos registrados. Accesible por FMAdmin y Medic.
  * Retorna ChildrenAdminDTO que incluye documentType y document.
  * @Return Observable<any[]> lista completa de hijos con datos administrativos
  */
  getAllChildren(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/children/Ad_Me/list`).pipe(
      map(r => {
        const raw: any[] = r?.data || [];
        return raw.map((c: any) => ({
          id: c.id || '',
          names: c.names || '',
          lastName: c.lastName || '',
          birthDate: c.birthDate || '',
          age: c.age || 0,
          tceClassification: { id: '', classification: c.tceClassification || 'No especificado' },
          documentType: c.documentType || '',
          document: c.document,
        }));
      }),
    );
  }

  /*
  * Crea un nuevo hijo. Los parametros docType y tceId son UUIDs del backend.
  * @Params docTypeId String UUID del tipo de documento
  * @Params tceId String UUID de la clasificacion TCE
  * @Params body any datos del hijo (names, lastName, birthDate, document)
  * @Return Observable<String> UUID del hijo creado
  */
  createChild(docTypeId: string, tceId: string, body: any): Observable<string> {
    return this.http.post<any>(`${this.apiUrl}/funnyMind/children/create/${docTypeId}/${tceId}`, body).pipe(map(r => r?.data?.id || ''));
  }

  /*
  * Vincula un guardian con un hijo (relacion N:M).
  * @Params guardianId String UUID del guardian
  * @Params childId String UUID del hijo
  * @Params relationshipId String UUID del tipo de relacion
  * @Return Observable<boolean> true si se vinculo
  */
  linkGuardianChild(guardianId: string, childId: string, relationshipId: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/funnyMind/guardianChildren/create`, { guardian: guardianId, child: childId, relationship: relationshipId }).pipe(map(() => true));
  }

  /*
  * Actualiza datos de un hijo.
  * @Params childId String UUID del hijo
  * @Params body any campos a actualizar (names, lastName, documentType, document)
  * @Return Observable<boolean> true si se actualizo
  */
  updateChild(childId: string, body: any): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/funnyMind/children/update?id=${childId}`, body).pipe(map(() => true));
  }

  /*
  * Elimina un hijo.
  * @Params childId String UUID del hijo a eliminar
  * @Return Observable<boolean> true si se elimino
  */
  deleteChild(childId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/funnyMind/children/deleted?id=${childId}`).pipe(map(() => true));
  }

  /*
  * Obtiene los perfiles (nombres alternativos) de los hijos de un guardian.
  * @Params guardianId String UUID del guardian
  * @Return Observable<any[]> lista de perfiles
  */
  getProfiles(guardianId: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/profiles/public/list/${guardianId}`).pipe(map(r => r?.data || []));
  }

  /*
  * Actualiza el nombre de un perfil.
  * @Params profileId String UUID del perfil
  * @Params name String nuevo nombre del perfil
  * @Return Observable<boolean> true si se actualizo
  */
  updateProfile(profileId: string, name: string): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/funnyMind/profiles/update/${profileId}/${name}`, {}).pipe(map(() => true));
  }

  /*
  * Crea un nuevo perfil para un hijo.
  * @Params childrenId String UUID del hijo
  * @Params profileName String nombre del perfil
  * @Return Observable<String> UUID del perfil creado
  */
  createProfile(childrenId: string, profileName: string): Observable<string> {
    return this.http.post<any>(`${this.apiUrl}/funnyMind/profiles/create/${childrenId}/${profileName}`, {}).pipe(map(r => r?.data?.id || ''));
  }

  /*
  * Cierra sesion en el backend: revoca todos los tokens activos del usuario en MCSAuth.
  * @Return Observable<boolean> true si se revocaron los tokens
  */
  logout(): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/auth/logout`, {}).pipe(map(() => true));
  }

  /*
  * Elimina los tokens de un usuario (admin). El parametro es el UUID del usuario.
  * @Params userId String UUID del usuario cuyos tokens se revocan
  * @Return Observable<boolean> true si se eliminaron
  */
  deleteToken(userId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/auth/deleted/${userId}`).pipe(map(() => true));
  }

  /*
  * Obtiene el progreso de un nino en una categoria especifica desde MCSJuegos.
  * @Params childId String UUID del nino
  * @Params categoryId String UUID de la categoria de juego
  * @Return Observable<any> { xp, attemptsDaily, level }
  */
  getGameProgress(childId: string, categoryId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/games/progress/${childId}/${categoryId}`).pipe(map(r => r?.data || {}));
  }

  /*
  * Obtiene estadisticas de un juego para un nino.
  * @Params childId String UUID del nino
  * @Params gameId String UUID del juego
  * @Return Observable<any> { totalScore, bestScore, totalPlayTime, lastPlay }
  */
  getGameStats(childId: string, gameId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/games/read/${childId}/${gameId}`).pipe(map(r => r?.data || {}));
  }

  /*
  * Guarda una estadistica de juego (nuevo registro).
  * @Params stat any objeto GameStat con totalScore, bestScore, game, childrenId
  * @Return Observable<boolean> true si se guardo
  */
  saveGameStat(stat: any): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/games/createGameStat`, stat).pipe(map(() => true));
  }

  /*
  * Guarda o actualiza el progreso de un nino en una categoria (upsert).
  * El body tiene formato segun tipo de juego:
  *   Sin tiempo: { correctAnswer, totalItems, mistakes, timeTaken: null, maxTime: null }
  *   Con tiempo: { correctAnswer:0, timeTaken:"PT{X}S", maxTime:"PT30M", ... }
  * @Params progress any objeto ProgressParameterPackage con childProgres incluido
  * @Return Observable<boolean> true si se guardo
  */
  updateGameProgress(progress: any): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/games/progress`, progress).pipe(map(() => true));
  }

  /*
  * Obtiene las categorias de juego desde MCSJuegos.
  * @Return Observable<any[]> [{ id, name, description }]
  */
  getCategoriesList(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/games/listCategories`).pipe(map(r => r?.data || []));
  }

  /*
  * Obtiene la lista de juegos registrados.
  * @Return Observable<any[]> [{ id, name }]
  */
  getGamesList(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/games/listGames`).pipe(map(r => r?.data || []));
  }

  /*
  * Obtiene los tipos de documento disponibles.
  * @Return Observable<DocumentType[]> lista con id y type
  */
  getDocumentTypes(): Observable<DocumentType[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/DT/List`).pipe(map(r => r?.data || []));
  }

  /*
  * Obtiene los tipos de relacion (parentesco) disponibles.
  * @Return Observable<Relationship[]> lista con id y relationship
  */
  getRelationships(): Observable<Relationship[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/relationship/Public/list`).pipe(map(r => r?.data || []));
  }

  /*
  * Obtiene las clasificaciones TCE. El backend cambio "classification" por "name".
  * @Return Observable<TceClassification[]> lista con id y classification
  */
  getTceClassifications(): Observable<TceClassification[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/tceClassification/list`).pipe(
      map(r => {
        const raw: any[] = r?.data || [];
        return raw.map((item: any) => ({
          id: item.id || '',
          classification: item.name || item.classification || 'No especificado',
        }));
      }),
    );
  }

  /*
  * El medico actualiza la clasificacion TCE de un nino.
  * @Params childId String UUID del nino
  * @Params tceId String UUID de la nueva clasificacion TCE
  * @Return Observable<boolean> true si se actualizo
  */
  updateTceByChildren(childId: string, tceId: string): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/funnyMind/tceClassification/updateByChildren/${childId}/${tceId}`, {}).pipe(map(() => true));
  }

  /*
  * Obtiene los tipos de cuenta disponibles.
  * @Return Observable<any[]> lista de tipos de cuenta
  */
  getAccountTypes(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/AcTypes/List`).pipe(map(r => r?.data || []));
  }

  /*
  * Crea un nuevo tipo de documento (admin).
  * @Params type String nombre del tipo de documento
  * @Return Observable<boolean> true si se creo
  */
  createDocumentType(type: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/funnyMind/DT/create`, { type }).pipe(map(() => true));
  }

  /*
  * Actualiza un tipo de documento (admin).
  * @Params id String UUID del tipo de documento
  * @Params type String nuevo nombre
  * @Return Observable<boolean> true si se actualizo
  */
  updateDocumentType(id: string, type: string): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/funnyMind/DT/update/${id}`, { type }).pipe(map(() => true));
  }

  /*
  * Elimina un tipo de documento (admin).
  * @Params id String UUID del tipo de documento
  * @Return Observable<boolean> true si se elimino
  */
  deleteDocumentType(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/funnyMind/DT/delete?id=${id}`).pipe(map(() => true));
  }

  /*
  * Crea un usuario con rol Medic (admin).
  * @Params data any objeto con username, email, password, name, lastname, phone, biography, docTypeId, docNumber
  * @Return Observable<String> UUID del medico creado
  */
  createMedicUser(data: any): Observable<string> {
    return this.http.post<any>(`${this.apiUrl}/funnyMind/User/create/Medic`, data).pipe(map(r => r?.data?.idUser || ''));
  }

  /*
  * Flujo completo de registro via wizard: crea guardian -> child -> relacion guardian-child.
  * Para FMAdmin y Medic solo se crea el guardian (no tienen hijos).
  * @Params userId String UUID del usuario (owner)
  * @Params data WizardData datos del wizard (guardian, child, relacion, TCE)
  * @Params role String rol del usuario (FMAdmin, Medic, PremiumUser, DemoUser)
  * @Return Observable<boolean> true si se completo el registro
  */
  registerFullUser(userId: string, data: WizardData, role: string): Observable<boolean> {
    const guardianBody = { name: data.guardian.name, lastname: data.guardian.lastname, phone: data.guardian.phone, biography: data.guardian.biography, document: data.guardian.document };
    return this.http.post<any>(`${this.apiUrl}/funnyMind/Guardian/create/${userId}/${data.guardian.documentTypeId}`, guardianBody).pipe(
      switchMap(res => {
        if (role === 'FMAdmin' || role === 'Medic') return of(true);

        const guardianId = res?.data?.id || '';
        const childBody = { names: data.child.names, lastName: data.child.lastName, birthDate: data.child.birthDate, document: data.child.document ? Number(data.child.document) : undefined };
        return this.http.post<any>(`${this.apiUrl}/funnyMind/children/create/${data.child.documentTypeId}/${data.tceClassificationId || ''}`, childBody).pipe(
          map(r => ({ guardianId, childId: r?.data?.id || '' })),
          switchMap(({ guardianId, childId }) => this.http.post<any>(`${this.apiUrl}/funnyMind/guardianChildren/create`, { guardian: guardianId, child: childId, relationship: data.relationshipId })),
          map(() => true),
        );
      }),
    );
  }
}
