# FrontFM — FunnyMind Platform

Frontend SPA for therapeutic games targeting children with Traumatic Brain Injury (TCE). Built with Angular 20 + Ionic 8 (standalone components).

## Quick Start

```bash
npm install
npm start          # http://localhost:4200
npm run build      # build to www/
```

## Backend Requirements

This frontend connects to a microservices backend (pipejfdvBlog) running at the URL configured in `src/environments/environment.ts`:

```typescript
apiUrl: 'http://localhost:8080/pipejfdv/api/v1'
```

Required services:
- MCSGateway (port 8080)
- MCSAuth (port 9000)
- MCSUsersFM (port 8090)
- MCSJuegos (port 8091)

## Test Users

| Username   | Password | Role        | Dashboard                     |
|------------|----------|-------------|-------------------------------|
| admin2     | FMAdmin  | FMAdmin     | Admin panel + reports         |
| draLaura   | 1234     | Medic       | Clinical panel + patients     |
| family1    | 1234     | PremiumUser | Guardian dashboard + children |
| family2    | 1234     | PremiumUser | Guardian dashboard + children |
| family3    | 1234     | PremiumUser | Guardian dashboard + children |

## Docker

```bash
# Build with custom API URL
docker build -t frontfm --build-arg API_URL=https://api.example.com/pipejfdv/api/v1 .

# Run
docker run -d -p 80:80 frontfm
```

## Project Structure

```
src/app/
  core/               # Services, models, interceptors
    services/         # ApiService, AuthService, GamesService
    models/           # User, Game, registration models
    interceptors/     # JWT auth interceptor
  pages/              # Lazy-loaded route pages
    home/             # Landing page
    login/            # Login form
    register/         # Registration with plan selection
    wizard/           # Multi-step setup wizard
    guardian-dashboard/  # Netflix-style child profiles
    child-dashboard/  # Game selection per child
    child-stats/      # Progress charts per category
    admin-dashboard/  # User/patient/document management
    medic-dashboard/  # Patient list + TCE management
    game-hanoi/       # Tower of Hanoi
    game-memory/      # Matching pairs
    game-reaction/    # Reaction time trainer
```

## Key Architecture

- Standalone components (no NgModules)
- JWT auth stored in localStorage, extracted from token claims
- Real-time API integration with backend microservices
- Role-based routing (PremiumUser, Medic, FMAdmin, DemoUser)
- Game progress saved to MCSJuegos on level completion

## Tech Stack

- Angular 20
- Ionic 8 (standalone)
- RxJS
- nginx (Docker)
