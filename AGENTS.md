# FrontFM — FunnyMind Platform

Frontend SPA for therapeutic games targeting children with Traumatic Brain Injury (TCE). Built with **Angular 20 + Ionic 8** (standalone components, no NgModules).

## Quick start

```bash
npm start        # ng serve → http://localhost:4200
npm run build    # ng build → www/
npm run lint     # ng lint (must pass before committing)
npm test         # ng test (Karma + Jasmine)
```

Always run `npm run lint && npm run build` after making changes.

## Project structure

```
src/app/
├── core/                       # Singleton services & models
│   ├── models/
│   │   ├── user.model.ts       # User, Child, TceClassification, GameStat, ChildProgress
│   │   └── game.model.ts       # Game, GameCategory
│   └── services/
│       ├── auth.service.ts     # login/logout, role routing, session in localStorage
│       ├── games.service.ts    # wraps MockDataService for games/progress/stats
│       └── mock-data.service.ts# All data is mock — swap for HTTP calls later
├── pages/                      # Lazy-loaded route pages
│   ├── home/                   # Landing page (public)
│   ├── login/                  # Login form
│   ├── child-dashboard/        # DemoUser — just game cards
│   ├── guardian-dashboard/     # PremiumUser — child progress + games
│   ├── medic-dashboard/        # Medic — patient list + stats
│   ├── admin-dashboard/        # FMAdmin — register doctors, manage users
│   └── game-hanoi/             # Hanoi Tower (drag & drop + buttons)
├── theme/variables.scss        # CSS custom properties (colors, radii, shadows)
└── app.routes.ts               # 8 lazy routes, wildcard → /
```

## Key architecture decisions

- **All standalone** — components import Ionic modules directly, no shared NgModule
- **`inject()` over constructor DI** — lint enforces `@angular-eslint/prefer-inject`
- **Mock data layer** — `MockDataService` replaces the backend until API integration. Swap via `GamesService` when ready.
- **Auth is fake** — hardcoded users in `MockDataService`, session stored in `localStorage('fm_user')`. Real JWT auth to be added later.
- **Role-based routing** — `AuthService.navigateByRole()` maps: `DemoUser→/child`, `PremiumUser→/guardian`, `Medic→/medic`, `FMAdmin→/admin`

## Test users (all: password `1234`)

| Username | Role | Dashboard |
|----------|------|-----------|
| `demo` | DemoUser | ❌ No puede iniciar sesión (solo PremiumUser y FMAdmin) |
| `tutor` | PremiumUser | Guardian — child progress + profiles Netflix |
| `medico` | Medic | ❌ No puede iniciar sesión |
| `admin` | FMAdmin | Admin panel — register doctors, tokens, users, patients, reports |

## Hanoi Tower game quirks

- **6 levels**: disks 4→5→6→7→8→9
- **No timer** — pure problem-solving, no pressure
- **Interaction**: drag & drop + click-to-select/click-to-place + tower buttons
- **Disk array order**: `[4,3,2,1]` — index 0 is largest (bottom), `pop()` returns smallest (top). `disksPerTower` getter does **not** reverse.
- **Victory**: all disks on tower index 2 → confetti overlay → next level button
- **`DISK_HEIGHT`** constant (28px) is also a component property for template bindings

## Memory Game "Los Pares" quirks

- **4 levels**: 3→4→5→6 pairs (6→8→10→12 cards)
- **No timer** — memory & concentration, no pressure
- **Interaction**: click to flip, match pairs, 3D CSS flip animation
- **Card images**: `assets/cartas/{1-12}.png` (faces), `assets/cartas/reverso.jpg` (back)
- **Victory**: all pairs matched → overlay → next level button
- **Mobile**: 3 columns with `max-width: 110px` for 412px viewports

## Reaction Game "Tiro al Blanco" quirks

- **5 levels**: target visible for 3s→2.5s→2s→1.5s→1s
- **Timer**: 30 seconds per round (pressure-based, for Processing Speed category)
- **Interaction**: tap/click 🎯 targets that appear at random positions
- **Scoring**: hits counted, auto-miss if target disappears
- **Result**: shows hits, misses, accuracy % after time runs out

## Hanoi Tower game quirks

- **6 levels**: disks 4→5→6→7→8→9
- **No timer** — pure problem-solving, no pressure
- **Interaction**: drag & drop + click-to-select/click-to-place + tower buttons
- **Disk array order**: `[4,3,2,1]` — index 0 is largest (bottom), `pop()` returns smallest (top). `disksPerTower` getter does **not** reverse.
- **Victory**: all disks on tower index 2 → confetti overlay → next level button
- **`DISK_HEIGHT`** constant (28px) is also a component property for template bindings

## Color & design tokens (in `theme/variables.scss`)

```css
--coral: #FF6B6B    --teal: #4ECDC4
--dark: #2D3436     --bg-warm: #FFF8F0
```

Fonts: Fredoka (headings), Nunito (body). Loaded from Google Fonts in `index.html`.

Dark mode palette import is **disabled** in `global.scss`. App is warm/light only.

## CSS budget (angular.json)

Component style budgets: warning 10KB, error 15KB. If exceeded, increase limits in `angular.json`.

## Backend (separate repo)

Microservices at `pipejfdvBlog`: gateway `:8080/pipejfdv/api/v1/`, JWT auth, PostgreSQL + MySQL. MCSJuegos handles game stats/progress/XP. Connect via `HttpClient` when ready.
