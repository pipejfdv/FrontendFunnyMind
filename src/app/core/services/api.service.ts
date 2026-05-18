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

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { username, password }).pipe(
      map(res => ({
        accessToken: res?.data?.token,
        refreshToken: res?.data?.refreshToken,
      })),
    );
  }

  userExists(userId: string): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/User/exists/${userId}`).pipe(
      map(res => res?.data === true || res?.data === 'true'),
    );
  }

  createUser(username: string, email: string, password: string, membership: string): Observable<string> {
    return this.http.post<any>(`${this.apiUrl}/funnyMind/User/create/${membership}`, { username, email, password }).pipe(
      map(res => res?.data?.idUser || res?.idUser || ''),
    );
  }

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

  deleteUser(userId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/funnyMind/User/delete?id=${userId}`).pipe(map(() => true));
  }

  getMyGuardianInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/Guardian/public`).pipe(
      map(r => r?.data || {}),
    );
  }

  getGuardianInfo(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/Guardian/public?id=${userId}`).pipe(
      map(r => r?.data || {}),
    );
  }

  updateGuardian(guardianId: string, data: any): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/funnyMind/Guardian/edit?id=${guardianId}`, data).pipe(map(() => true));
  }

  getChildrenByGuardian(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/children/public/list`).pipe(map(r => r?.data || []));
  }

  getChildren(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/children/Ad_Me/list`).pipe(map(r => r?.data || []));
  }

  createChild(docTypeId: string, tceId: string, body: any): Observable<string> {
    return this.http.post<any>(`${this.apiUrl}/funnyMind/children/create/${docTypeId}/${tceId}`, body).pipe(map(r => r?.data?.id || ''));
  }

  linkGuardianChild(guardianId: string, childId: string, relationshipId: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/funnyMind/guardianChildren/create`, { guardian: guardianId, child: childId, relationship: relationshipId }).pipe(map(() => true));
  }

  getAllChildren(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/children/Ad_Me/list`).pipe(map(r => r?.data || []));
  }

  updateChild(childId: string, body: any): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/funnyMind/children/update?id=${childId}`, body).pipe(map(() => true));
  }

  deleteChild(childId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/funnyMind/children/deleted?id=${childId}`).pipe(map(() => true));
  }

  getProfiles(guardianId: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/profiles/public/list/${guardianId}`).pipe(map(r => r?.data || []));
  }

  updateProfile(profileId: string, name: string): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/funnyMind/profiles/update/${profileId}/${name}`, {}).pipe(map(() => true));
  }

  createProfile(childrenId: string, profileName: string): Observable<string> {
    return this.http.post<any>(`${this.apiUrl}/funnyMind/profiles/create/${childrenId}/${profileName}`, {}).pipe(map(r => r?.data?.id || ''));
  }

  logout(): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/auth/logout`, {}).pipe(map(() => true));
  }

  deleteToken(userId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/auth/deleted/${userId}`).pipe(map(() => true));
  }

  getGameProgress(childId: string, categoryId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/games/progress/${childId}/${categoryId}`).pipe(map(r => r?.data || {}));
  }

  getGameStats(childId: string, gameId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/games/read/${childId}/${gameId}`).pipe(map(r => r?.data || {}));
  }

  saveGameStat(stat: any): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/games/createGameStat`, stat).pipe(map(() => true));
  }

  updateGameProgress(progress: any): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/games/progress`, progress).pipe(map(() => true));
  }

  getCategoriesList(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/games/listCategories`).pipe(map(r => r?.data || []));
  }

  getGamesList(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/games/listGames`).pipe(map(r => r?.data || []));
  }

  getDocumentTypes(): Observable<DocumentType[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/DT/List`).pipe(map(r => r?.data || []));
  }

  getRelationships(): Observable<Relationship[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/relationship/Public/list`).pipe(map(r => r?.data || []));
  }

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

  updateTceByChildren(childId: string, tceId: string): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/funnyMind/tceClassification/updateByChildren/${childId}/${tceId}`, {}).pipe(map(() => true));
  }

  getAccountTypes(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/funnyMind/AcTypes/List`).pipe(map(r => r?.data || []));
  }

  createDocumentType(type: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/funnyMind/DT/create`, { type }).pipe(map(() => true));
  }

  updateDocumentType(id: string, type: string): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/funnyMind/DT/update/${id}`, { type }).pipe(map(() => true));
  }

  deleteDocumentType(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/funnyMind/DT/delete?id=${id}`).pipe(map(() => true));
  }

  createMedicUser(data: any): Observable<string> {
    return this.http.post<any>(`${this.apiUrl}/funnyMind/User/create/Medic`, data).pipe(map(r => r?.data?.idUser || ''));
  }

  registerFullUser(userId: string, data: WizardData, role: string): Observable<boolean> {
    const guardianBody = { name: data.guardian.name, lastname: data.guardian.lastname, phone: data.guardian.phone, biography: data.guardian.biography, document: data.guardian.document };
    return this.http.post<any>(`${this.apiUrl}/funnyMind/Guardian/create/${userId}/${data.guardian.documentTypeId}`, guardianBody).pipe(
      switchMap(res => {
        // FMAdmin y Medic: solo crean guardian, sin child ni link
        if (role === 'FMAdmin' || role === 'Medic') return of(true);

        // PremiumUser/DemoUser: flujo completo con child + link
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
