import { Injectable } from '@angular/core';
import { User, Child, TceClassification, GameStat, ChildProgress } from '../models/user.model';
import { Game, GameCategory } from '../models/game.model';
import { WizardData } from '../models/registration.model';

export interface ProfileData {
  id: string;
  nameProfile: string;
  childId: string;
}

@Injectable({ providedIn: 'root' })
export class MockDataService {

  private readonly users: User[] = [
    { id: '1', username: 'demo', name: 'Niño Demo', role: 'DemoUser' },
    { id: '2', username: 'tutor', name: 'María García', role: 'PremiumUser' },
    { id: '3', username: 'medico', name: 'Dr. Andrés López', role: 'Medic' },
    { id: '4', username: 'admin', name: 'Admin FM', role: 'FMAdmin' },
  ];

  private readonly tceClassifications: TceClassification[] = [
    { id: '1', classification: 'Leve' },
    { id: '2', classification: 'Moderado' },
    { id: '3', classification: 'Grave' },
    { id: '4', classification: 'No especificado' },
  ];

  readonly categories: GameCategory[] = [
    {
      id: '1', name: 'FUNCIÓN EJECUTIVA',
      description: 'Planificación, lógica y estrategia. Ayuda a organizar pensamientos y acciones.',
      icon: 'brain-outline', color: '#FF6B6B',
    },
    {
      id: '2', name: 'MEMORIA Y ATENCIÓN',
      description: 'Memoria visual, concentración y reconocimiento de patrones.',
      icon: 'eye-outline', color: '#4ECDC4',
    },
    {
      id: '3', name: 'VELOCIDAD DE PROCESAMIENTO',
      description: 'Tiempo de reacción, reflejos mentales y rapidez de respuesta.',
      icon: 'flash-outline', color: '#FFE66D',
    },
  ];

  readonly games: Game[] = [
    {
      id: '1', name: 'Torre de Hanoi', description: 'Apila los discos de la torre 1 a la torre 3 siguiendo las reglas.',
      icon: 'layers-outline', color: '#FF6B6B', category: this.categories[0],
    },
    {
      id: '2', name: 'Los Pares', description: 'Encuentra las parejas de cartas iguales usando tu memoria.',
      icon: 'grid-outline', color: '#4ECDC4', category: this.categories[1],
    },
    {
      id: '3', name: 'Reaction', description: 'Reacciona rápido a los estímulos que aparecen en pantalla.',
      icon: 'flash-outline', color: '#FFE66D', category: this.categories[2],
    },
  ];

  private readonly stats: Map<string, GameStat[]> = new Map();
  private readonly progress: Map<string, ChildProgress[]> = new Map();
  private readonly guardianData: Map<string, { name: string; lastname: string; phone: string; biography: string }> = new Map([
    ['2', { name: 'María', lastname: 'García', phone: '555-0101', biography: 'Madre de dos niños maravillosos.' }],
  ]);
  private readonly guardianDocs: Map<string, { type: string; number: string }> = new Map([
    ['2', { type: 'Cedula Ciudadania', number: '123456789' }],
  ]);

  private readonly childrenPool: Child[] = [
    { id: 'child-1', names: 'Carlitos', lastName: 'García', birthDate: '2018-05-10',
      tceClassification: this.tceClassifications[1], avatar: '🐶' },
    { id: 'child-2', names: 'Anita', lastName: 'García', birthDate: '2020-01-15',
      tceClassification: this.tceClassifications[0], avatar: '🐱' },
    { id: 'child-3', names: 'Pedro', lastName: 'Martínez', birthDate: '2017-11-20',
      tceClassification: this.tceClassifications[2], avatar: '🐰' },
  ];

  private readonly profiles: ProfileData[] = [
    { id: 'prof-1', nameProfile: 'Carlitos', childId: 'child-1' },
    { id: 'prof-2', nameProfile: 'Anita', childId: 'child-2' },
  ];

  private nextUserId = 10;
  private readonly completedUsers = new Set<string>(['1', '2', '3', '4']);
  private readonly registeredUsers: Map<string, { password: string; membership: string; name: string }> = new Map();

  readonly documentTypes: { id: string; type: string }[] = [
    { id: 'dt-1', type: 'Cedula Ciudadania' },
    { id: 'dt-2', type: 'Cedula Extranjeria' },
    { id: 'dt-3', type: 'Tarjeta de Identidad' },
    { id: 'dt-4', type: 'Permiso Transitorio' },
  ];

  readonly relationships: { id: string; relationship: string }[] = [
    { id: 'rel-1', relationship: 'Padre' },
    { id: 'rel-2', relationship: 'Madre' },
    { id: 'rel-3', relationship: 'Tio' },
    { id: 'rel-4', relationship: 'Tia' },
    { id: 'rel-5', relationship: 'Tutor' },
    { id: 'rel-6', relationship: 'Padrastro' },
    { id: 'rel-7', relationship: 'Madrastra' },
    { id: 'rel-8', relationship: 'Hermano' },
    { id: 'rel-9', relationship: 'Hermana' },
  ];

  readonly tceClassificationList: { id: string; classification: string }[] = [
    { id: 'tce-1', classification: 'Leve - GCS 13-15' },
    { id: 'tce-2', classification: 'Moderado - GCS 9-12' },
    { id: 'tce-3', classification: 'Grave - GCS 3-8' },
    { id: 'tce-4', classification: 'No especificado' },
  ];

  private readonly guardianChildrenMap: Map<string, string[]> = new Map([
    ['2', ['child-1', 'child-2']],
  ]);

  constructor() {
    this.seedMockData();
  }

  private seedMockData(): void {
    this.stats.set('child-1', [
      { totalPlayTime: 3600, totalScore: 850, bestScore: 95, lastPlay: '2026-05-16', gameId: '1', childId: 'child-1' },
      { totalPlayTime: 1800, totalScore: 420, bestScore: 70, lastPlay: '2026-05-15', gameId: '2', childId: 'child-1' },
    ]);
    this.progress.set('child-1', [
      { xp: 320, attemptsDaily: 2, level: 'Intermedio', categoryId: '1', childId: 'child-1' },
      { xp: 180, attemptsDaily: 4, level: 'Basico', categoryId: '2', childId: 'child-1' },
    ]);
  }

  getUserByCredentials(username: string): User | undefined {
    return this.users.find(u => u.username === username);
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getChildrenByGuardian(guardianId: string): Child[] {
    const childIds = this.guardianChildrenMap.get(guardianId) || [];
    return childIds.map(id => this.childrenPool.find(c => c.id === id)).filter(Boolean) as Child[];
  }

  getGameStats(childId: string): GameStat[] {
    return this.stats.get(childId) || [];
  }

  getChildProgress(childId: string): ChildProgress[] {
    return this.progress.get(childId) || [];
  }

  saveGameStat(stat: GameStat): void {
    const list = this.stats.get(stat.childId) || [];
    const idx = list.findIndex(s => s.gameId === stat.gameId);
    if (idx >= 0) list[idx] = stat;
    else list.push(stat);
    this.stats.set(stat.childId, list);
  }

  saveChildProgress(progress: ChildProgress): void {
    const list = this.progress.get(progress.childId) || [];
    const idx = list.findIndex(p => p.categoryId === progress.categoryId);
    if (idx >= 0) list[idx] = progress;
    else list.push(progress);
    this.progress.set(progress.childId, list);
  }

  getAllChildren(): Child[] {
    return [...this.childrenPool];
  }

  getPasswordForUser(username: string): string {
    const passwords: Record<string, string> = {
      'demo': '1234',
      'tutor': '1234',
      'medico': '1234',
      'admin': '1234',
    };

    if (passwords[username]) return passwords[username];
    const reg = this.registeredUsers.get(username);
    if (reg) return reg.password;
    return '1234';
  }

  getRegisteredUserPassword(username: string): string | undefined {
    return this.registeredUsers.get(username)?.password;
  }

  // Registration methods
  userExists(userId: string): boolean {
    return this.completedUsers.has(userId);
  }

  createUser(username: string, email: string, password: string, membership: string): string {
    const id = String(this.nextUserId++);
    const name = username.charAt(0).toUpperCase() + username.slice(1);
    this.users.push({ id, username, name, role: membership as 'DemoUser' | 'PremiumUser' });
    this.registeredUsers.set(username, { password, membership, name });
    return id;
  }

  getDocumentTypes(): { id: string; type: string }[] {
    return this.documentTypes;
  }

  getRelationships(): { id: string; relationship: string }[] {
    return this.relationships;
  }

  getTceClassifications(): { id: string; classification: string }[] {
    return this.tceClassificationList;
  }

  registerFullUser(userId: string, data: WizardData): boolean {
    this.completedUsers.add(userId);

    // Create mock guardian data
    const name = data.guardian.name || 'User';
    const lastname = data.guardian.lastname || 'Test';
    this.guardianData.set(userId, { name, lastname, phone: data.guardian.phone || '', biography: data.guardian.biography || '' });
    this.guardianDocs.set(userId, { type: 'Cedula Ciudadania', number: data.guardian.document || '0000' });

    // Create mock child if data exists
    if (data.child.names && data.child.lastName) {
      const childId = 'child-' + Date.now();
      const tceClass: TceClassification = { id: '4', classification: 'No especificado' };
      const newChild: Child = {
        id: childId,
        names: data.child.names,
        lastName: data.child.lastName,
        birthDate: data.child.birthDate || '2020-01-01',
        tceClassification: tceClass,
        avatar: '🐶',
      };
      this.childrenPool.push(newChild);
      this.profiles.push({ id: 'prof-' + childId, nameProfile: data.child.names, childId });
      const existing = this.guardianChildrenMap.get(userId) || [];
      existing.push(childId);
      this.guardianChildrenMap.set(userId, existing);
    }

    return true;
  }

  // Guardian data
  getGuardianData(): Map<string, { name: string; lastname: string; phone: string; biography: string }> {
    return this.guardianData;
  }

  updateGuardian(userId: string, data: { name: string; lastname: string; phone: string; biography: string }): void {
    this.guardianData.set(userId, data);
  }

  getGuardianDocument(userId: string): { type: string; number: string } | undefined {
    return this.guardianDocs.get(userId);
  }

  // Profile management
  getProfilesByGuardian(_guardianId: string): ProfileData[] {
    return [...this.profiles];
  }

  getChildById(childId: string): Child | undefined {
    return this.childrenPool.find(c => c.id === childId);
  }

  updateProfile(profileId: string, name: string): void {
    const p = this.profiles.find(pr => pr.id === profileId);
    if (p) p.nameProfile = name;
  }

  updateChild(childId: string, names: string, lastName: string): void {
    const c = this.childrenPool.find(ch => ch.id === childId);
    if (c) {
      c.names = names;
      c.lastName = lastName;
    }
  }

  deleteChild(guardianId: string, childId: string): void {
    const idx = this.childrenPool.findIndex(c => c.id === childId);
    if (idx >= 0) this.childrenPool.splice(idx, 1);
    const pIdx = this.profiles.findIndex(p => p.childId === childId);
    if (pIdx >= 0) this.profiles.splice(pIdx, 1);
    this.stats.delete(childId);
    this.progress.delete(childId);

    // Remove from guardian mapping
    const children = this.guardianChildrenMap.get(guardianId);
    if (children) {
      const ci = children.indexOf(childId);
      if (ci >= 0) children.splice(ci, 1);
    }
  }

  calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  addChildToGuardian(
    guardianId: string,
    data: {
      relationshipId: string;
      names: string;
      lastName: string;
      birthDate: string;
      documentTypeId: string;
      document: string;
      tceClassificationId: string;
    },
  ): Child {
    const childId = 'child-' + String(Date.now());

    // Map from tceClassificationList ID to simplified tceClassifications
    const selectedTce = this.tceClassificationList.find(t => t.id === data.tceClassificationId);
    let tce: TceClassification;
    if (selectedTce) {
      const simpleClass = selectedTce.classification.split(' - ')[0];
      tce = this.tceClassifications.find(t => t.classification === simpleClass) || this.tceClassifications[3];
    } else {
      tce = this.tceClassifications[3];
    }

    const avatar = ['🐶', '🐱', '🐰', '🐼', '🦊', '🐸', '🦁', '🐯'][this.childrenPool.length % 8];

    const newChild: Child = {
      id: childId,
      names: data.names,
      lastName: data.lastName,
      birthDate: data.birthDate,
      tceClassification: tce,
      avatar,
    };

    this.childrenPool.push(newChild);
    this.profiles.push({ id: 'prof-' + childId, nameProfile: data.names, childId });

    // Link to guardian
    const existing = this.guardianChildrenMap.get(guardianId) || [];
    existing.push(childId);
    this.guardianChildrenMap.set(guardianId, existing);

    return newChild;
  }

  // ─── Admin methods ───

  createMedicUser(data: { username: string; email: string; password: string; name: string; lastname: string; phone: string; biography: string; docTypeId: string; docNumber: string }): User {
    const id = String(this.nextUserId++);
    const newUser: User = { id, username: data.username, name: data.name, role: 'Medic' };
    this.users.push(newUser);
    this.registeredUsers.set(data.username, { password: data.password, membership: 'Medic', name: data.name });
    this.guardianData.set(id, { name: data.name, lastname: data.lastname, phone: data.phone, biography: data.biography });
    this.completedUsers.add(id);
    return newUser;
  }

  updateUser(userId: string, data: { username: string; name: string }): void {
    const u = this.users.find(user => user.id === userId);
    if (u) {
      u.username = data.username;
      u.name = data.name;
    }
  }

  getTokens(): { id: string; username: string; createdAt: string; active: boolean }[] {
    return [
      { id: 'tok-1', username: 'tutor', createdAt: '2026-05-15 10:30', active: true },
      { id: 'tok-2', username: 'admin', createdAt: '2026-05-16 08:15', active: true },
      { id: 'tok-3', username: 'medico', createdAt: '2026-05-14 14:00', active: false },
    ];
  }

  deleteToken(tokenId: string): void {
    // mock — no-op
  }

  getAllUsers(): User[] {
    return [...this.users];
  }

  deleteUser(userId: string): void {
    const idx = this.users.findIndex(u => u.id === userId);
    if (idx >= 0) this.users.splice(idx, 1);
  }

  getAllPatients(): Child[] {
    return [...this.childrenPool];
  }

  getAggregatedStats(): {
    totalChildren: number;
    totalPlayTimeHours: number;
    avgScore: number;
    byLevel: { level: string; count: number }[];
    byCategory: { name: string; xp: number }[];
    individual: { childName: string; xp: number; level: string; color: string }[];
  } {
    const allStats: GameStat[] = [];
    const allProgress: ChildProgress[] = [];
    this.stats.forEach(s => allStats.push(...s));
    this.progress.forEach(p => allProgress.push(...p));

    const totalPlayTimeHours = Math.round(allStats.reduce((a, s) => a + s.totalPlayTime, 0) / 3600 * 10) / 10;
    const avgScore = allStats.length ? Math.round(allStats.reduce((a, s) => a + s.totalScore, 0) / allStats.length) : 0;

    const levelOrder = ['Inicial', 'Basico', 'Intermedio', 'Avanzado', 'Experto'];
    const byLevel = levelOrder.map(level => {
      const levelProgress = this.childrenPool.filter(c => {
        const p = this.progress.get(c.id);
        return p?.some(pr => pr.level === level);
      });
      return { level, count: levelProgress.length };
    });

    const byCategory = this.categories.map(cat => {
      let totalXp = 0;
      this.progress.forEach(p => {
        const match = p.find(pr => pr.categoryId === cat.id);
        if (match) totalXp += match.xp;
      });
      return { name: cat.name, xp: totalXp };
    });

    const levelColors: Record<string, string> = {
      Inicial: '#FF6B6B', Basico: '#FFB347', Intermedio: '#4ECDC4',
      Avanzado: '#45B7D1', Experto: '#A29BFE',
    };
    const individual = this.childrenPool.map(c => {
      const p = this.progress.get(c.id);
      const totalXp = p ? p.reduce((a, pr) => a + pr.xp, 0) : 0;
      const topLevel = p?.sort((a, b) => levelOrder.indexOf(b.level) - levelOrder.indexOf(a.level))[0];
      return {
        childName: c.names,
        xp: totalXp,
        level: topLevel?.level || 'Inicial',
        color: levelColors[topLevel?.level || 'Inicial'],
      };
    });

    return { totalChildren: this.childrenPool.length, totalPlayTimeHours, avgScore, byLevel, byCategory, individual };
  }

  // Document Type CRUD
  createDocumentType(type: string): void {
    const id = 'dt-' + String(Date.now());
    this.documentTypes.push({ id, type });
  }

  updateDocumentType(id: string, type: string): void {
    const d = this.documentTypes.find(dt => dt.id === id);
    if (d) d.type = type;
  }

  deleteDocumentType(id: string): void {
    const idx = this.documentTypes.findIndex(dt => dt.id === id);
    if (idx >= 0) this.documentTypes.splice(idx, 1);
  }
}
