export type UserRole = 'DemoUser' | 'PremiumUser' | 'Medic' | 'FMAdmin';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  documentType?: string;
  document?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Child {
  id: string;
  names: string;
  lastName: string;
  birthDate: string;
  age?: number;
  tceClassification: TceClassification;
  documentType?: string;
  document?: number;
  avatar?: string;
  profileId?: string;
  profileName?: string;
}

export interface TceClassification {
  id: string;
  classification: 'Leve' | 'Moderado' | 'Grave' | 'No especificado';
}

export interface GuardianChildren {
  id: string;
  guardian: User;
  child: Child;
  relationship: string;
}

export interface GameStat {
  totalPlayTime: number;
  totalScore: number;
  bestScore: number;
  lastPlay: string;
  gameId: string;
  childId: string;
}

export interface ChildProgress {
  xp: number;
  attemptsDaily: number;
  level: 'Inicial' | 'Basico' | 'Intermedio' | 'Avanzado' | 'Experto';
  categoryId: string;
  childId: string;
}
