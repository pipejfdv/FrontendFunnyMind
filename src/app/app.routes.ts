import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'wizard',
    loadComponent: () =>
      import('./pages/wizard/wizard.page').then((m) => m.WizardPage),
  },
  {
    path: 'child',
    loadComponent: () =>
      import('./pages/child-dashboard/child-dashboard.page').then((m) => m.ChildDashboardPage),
  },
  {
    path: 'guardian',
    loadComponent: () =>
      import('./pages/guardian-dashboard/guardian-dashboard.page').then((m) => m.GuardianDashboardPage),
  },
  {
    path: 'guardian/edit',
    loadComponent: () =>
      import('./pages/edit-guardian/edit-guardian.page').then((m) => m.EditGuardianPage),
  },
  {
    path: 'guardian/stats',
    loadComponent: () =>
      import('./pages/child-stats/child-stats.page').then((m) => m.ChildStatsPage),
  },
  {
    path: 'medic',
    loadComponent: () =>
      import('./pages/medic-dashboard/medic-dashboard.page').then((m) => m.MedicDashboardPage),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.page').then((m) => m.AdminDashboardPage),
  },
  {
    path: 'game/hanoi',
    loadComponent: () =>
      import('./pages/game-hanoi/game-hanoi.page').then((m) => m.GameHanoiPage),
  },
  {
    path: 'game/memory',
    loadComponent: () =>
      import('./pages/game-memory/game-memory.page').then((m) => m.GameMemoryPage),
  },
  {
    path: 'game/reaction',
    loadComponent: () =>
      import('./pages/game-reaction/game-reaction.page').then((m) => m.GameReactionPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
