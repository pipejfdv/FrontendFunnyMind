# FrontFM - FunnyMind Platform

Frontend SPA para juegos terapeuticos dirigidos a ninos con Traumatismo Craneoencefalico (TCE).
Construido con Angular 20 + Ionic 8 (componentes standalone, sin NgModules).

---

## Inicio rapido

```bash
npm install
npm start          # ng serve -> http://localhost:4200
npm run build      # ng build -> www/
npm run lint       # ng lint (pasa antes de commit)
```

## Archivos eliminados

| Archivo | Motivo |
|---------|--------|
| `src/app/core/services/mock-data.service.ts` | Ya no se usa. Todo el proyecto funciona con datos reales del backend. |

---

## Arquitectura del sistema

```
Navegador -> Angular (localhost:4200 o Render)
  |-> Llamadas API a traves de nginx proxy (en produccion)
  |     |-> /pipejfdv/api/v1/* -> BACKEND_URL (ngrok o dominio real)
  |     |     |-> /auth/*        -> MCSAuth (puerto 9000) - login, JWT, logout
  |     |     |-> /funnyMind/*   -> MCSUsersFM (puerto 8090) - usuarios, ninos, guardianes
  |     |     |-> /games/*       -> MCSJuegos (puerto 8091) - juegos, progreso, XP
  |     |-> /mediastack-api/*  -> api.mediastack.com - noticias
```

---

## Autenticacion (JWT)

### Login
1. `POST /auth/login` con `{ username, password }`
2. MCSAuth verifica contra MCSUsersFM via Feign, retorna JWT
3. El JWT contiene: `{ jti: userId, sub: username, accountType: rol }`
4. El frontend extrae `jti` como userId y `accountType` como rol del payload del JWT

### Logout
- `POST /auth/logout` revoca todos los tokens activos del usuario en la BD
- Se llama desde `auth.service.ts` antes de limpiar localStorage

### Interceptor HTTP (`auth.interceptor.ts`)
Toda peticion HTTP incluye automaticamente:
- `Authorization: Bearer <token>` (del localStorage)
- `Accept: application/json`
- `ngrok-skip-browser-warning: true` (para desarrollo con ngrok)

---

## Roles y routing

| Rol | Ruta | Dashboard |
|-----|------|-----------|
| FMAdmin | /admin | Panel de administracion: usuarios, pacientes, tokens, reportes |
| Medic | /medic | Panel clinico: pacientes, progreso, noticias, actualizar TCE |
| PremiumUser | /guardian | Dashboard guardian: perfiles Netflix, estadisticas por nino |
| DemoUser | /child | Solo juegos, sin progreso |
| DemoUser/PremiumUser (nuevo) | /wizard | Formulario de registro inicial de 4 pasos |

### Wizard dinamico
- **PremiumUser/DemoUser**: 4 pasos (Tutor -> Relacion -> Nino -> TCE)
- **FMAdmin/Medic**: 1 paso (solo datos personales del tutor, saltan wizard)

---

## Estructura del proyecto

```
src/app/
  core/                           # Servicios singleton y modelos
    models/
      user.model.ts               # User, Child, TceClassification, ChildProgress, GameStat
      game.model.ts               # Game, GameCategory
      registration.model.ts       # WizardData, TCE questionnaire
    services/
      api.service.ts              # Capa HTTP: todas las llamadas al backend
      auth.service.ts             # Autenticacion: login, logout, JWT, sesion en localStorage
      games.service.ts            # Categorias desde API, juegos estaticos, guardado de progreso
      news.service.ts             # Noticias desde mediastack API via proxy
      registration.service.ts     # Orquestador del wizard de registro
      loading.service.ts          # Estado global de carga (spinner)
    interceptors/
      auth.interceptor.ts         # Anade token JWT + headers a toda peticion HTTP
    utils/
      error.utils.ts              # extractError(): extrae mensajes de error del backend

  pages/                          # Componentes de pagina (lazy loading)
    home/                         # Landing page publica
    login/                        # Formulario de inicio de sesion
    register/                     # Registro con seleccion de plan (Demo/Premium)
    wizard/                       # Wizard multi-paso para nuevo usuario
    guardian-dashboard/           # Perfiles estilo Netflix para elegir nino
    child-dashboard/              # Seleccion de juegos por categoria
    child-stats/                  # Estadisticas de progreso por nino
    edit-guardian/                # Editar datos del tutor y ninos
    admin-dashboard/              # Panel de administracion completo
    medic-dashboard/              # Panel clinico con pacientes y noticias
    game-hanoi/                   # Torre de Hanoi (funcion ejecutiva)
    game-memory/                  # Los Pares (memoria y atencion)
    game-reaction/                # Tiro al Blanco (velocidad de procesamiento)
```

---

## Flujo de datos

### Creacion de usuario
```
Register -> POST /User/create/{rol} -> Login -> GET /User/exists/{id}
  -> false -> Wizard (completa datos) -> POST /Guardian/create/{userId}/{docType}
  -> POST /children/create/{docType}/{tceId} -> POST /guardianChildren/create
  -> Redirect a /guardian
```

### Juego y guardado de progreso
```
Jugar -> Completar nivel -> saveGameResult()
  -> PUT /games/progress con formato segun tipo de juego:
    - Sin tiempo (Hanoi, Memory): { correctAnswer, totalItems, mistakes, timeTaken: null }
    - Con tiempo (Reaction): { correctAnswer: 0, timeTaken: "PT{X}S", maxTime: "PT30M" }
```

### Visualizacion de estadisticas
```
GET /games/progress/{childId}/{categoryId}
  -> Retorna { xp, attemptsDaily, level }
  -> Se muestra en child-stats, medic-dashboard, admin-dashboard
```

---

## Componentes clave

### api.service.ts
- Unico punto de entrada para llamadas HTTP al backend
- Todas las URLs parten de `environment.apiUrl`:
  - Desarrollo: `http://localhost:8080/pipejfdv/api/v1`
  - Produccion: `/pipejfdv/api/v1` (relativo, nginx proxy maneja)
- NO usa mock data. Todo va al backend real.
- Los errores HTTP se capturan y extraen con `extractError()` (mensajes del backend o genericos por status code)

### auth.service.ts
- `currentUser` signal: almacena el usuario activo
- `token` signal: almacena el JWT
- En login: decodifica el JWT para extraer userId (jti) y rol (accountType)
- En logout: llama `POST /auth/logout` al backend antes de limpiar localStorage
- Guarda registro de inicio de sesion en `localStorage('fm_token_logs')` para el admin

### games.service.ts
- `categories` signal: se carga desde `GET /games/listCategories` (MCSJuegos)
- `games` signal: datos estaticos de los 3 juegos (Hanoi, Memory, Reaction)
- `saveGameResult()`: construye el body correcto segun si el juego tiene tiempo o no y llama a `PUT /games/progress`

### news.service.ts
- Llama a `/mediastack-api/news?...` que es proxy por nginx a la API de mediastack
- Si falla (429 limite de peticiones), retorna array vacio

---

## Juegos

### Torre de Hanoi (FUNCION EJECUTIVA)
- 6 niveles: 4,5,6,7,8,9 discos
- Sin tiempo limite
- Interaccion: drag & drop + click + botones
- Victoria: todos los discos en torre 3
- Puntaje calculado por eficiencia (movimientos realizados vs optimos)

### Los Pares (MEMORIA Y ATENCION)
- 4 niveles: 3,4,5,6 pares
- Sin tiempo limite
- Interaccion: click para voltear cartas con animacion 3D
- Imagenes en `assets/cartas/`
- Victoria: todos los pares encontrados

### Tiro al Blanco / Reaction (VELOCIDAD DE PROCESAMIENTO)
- 5 niveles: target visible 3s, 2.5s, 2s, 1.5s, 1s
- 30 segundos de juego por ronda
- Interaccion: click/tap en los blancos que aparecen aleatoriamente
- Victoria: fin del tiempo, muestra aciertos/fallos

---

## Panel de administracion

El admin (`admin`/`FMAdmin2026`) puede:
- **Dashboard**: cards con secciones colapsables
- **Agregar Doctor**: crea usuarios con rol Medic
- **Tokens**: lista de inicios de sesion desde localStorage. Boton para revocar (DELETE /auth/deleted/{userId})
- **Usuarios**: lista desde GET /User/list. Modal con datos + documento del guardian (via /Guardian/admin)
- **Pacientes**: lista con nombre, edad, TCE, documento. Modal con progreso por categoria
- **Tipos Documento**: CRUD completo
- **Clasif. TCE**: lista de clasificaciones (carga bajo demanda)
- **Reportes**: distribucion por nivel, XP por categoria, progreso individual

---

## Panel del medico

El medico (`draLaura`/`1234`) puede:
- **Noticias**: 3 tabs (Salud, Tecnologia, Ciencia) desde mediastack API
- **Pacientes**: lista completa con edad y TCE
- **Modal detalle**: progreso por categoria con nombres, XP, nivel
- **Actualizar TCE**: dropdown para cambiar la clasificacion TCE del nino
  - Llama a `PUT /tceClassification/updateByChildren/{childId}/{tceId}`

---

## Panel del guardian

El guardian premium (`guardianTest`/`1234`) puede:
- **Perfiles Netflix**: seleccionar nino para jugar
- **Estadisticas**: progreso por categoria con barras de XP
- **Editar info**: modificar datos del tutor + nombre/ perfil de los ninos
- **Agregar nino**: modal de 3 pasos para registrar nuevo nino

---

## Docker y despliegue

### Build de imagen
```dockerfile
FROM node:20-alpine AS build
# Compila Angular
FROM nginx:alpine
# Sirve con nginx, entrypoint.sh reemplaza __BACKEND_URL__ al arrancar
```

### Variables de entorno
| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| BACKEND_URL | URL del backend para el proxy nginx | https://tu-ngrok.ngrok-free.dev |

### nginx.conf
- `location /pipejfdv/` -> proxy_pass a BACKEND_URL
- `location /mediastack-api/` -> proxy_pass a api.mediastack.com/v1/
- SPA routing: todas las rutas caen a index.html

### Render
- Tipo: Web Service
- Build: Dockerfile
- Env var: BACKEND_URL = https://tu-ngrok.ngrok-free.dev

---

## Usuarios de prueba

| Usuario | Rol | Pass | Notas |
|---------|-----|------|-------|
| admin | FMAdmin | FMAdmin2026 | Admin completo |
| admin2 | FMAdmin | FMAdmin | Alternativo |
| draLaura | Medic | 1234 | Panel clinico |
| guardianTest | PremiumUser | 1234 | 2 ninos con progreso |
| family1|2|3 | PremiumUser | 1234 | 6 ninos (test) |

---

## Seguridad (backend)

### MCSUsersFM (SpringSecurityConfig.java)
- `/funnyMind/children/Ad_Me/list` -> Medic y FMAdmin
- `/funnyMind/children/public/list` -> PremiumUser, DemoUser, Medic, FMAdmin
- `/funnyMind/Guardian/create/**` -> requiere JWT
- `/funnyMind/User/Auth/**` -> publico (para Feign de MCSAuth)

### MCSJuegos (SpringSecurityConfig.java)
- `/games/progress/**` -> PremiumUser, Medic, FMAdmin
- `/games/listGames`, `/games/listCategories` -> publico
- `/games/createGameStat` -> PremiumUser, FMAdmin

---

## Glosario de terminos

| Termino | Significado |
|---------|-------------|
| TCE | Traumatismo Craneoencefalico |
| FE | Funcion Ejecutiva (categoria de juego) |
| MA | Memoria y Atencion (categoria de juego) |
| VP | Velocidad de Procesamiento (categoria de juego) |
| XP | Puntos de experiencia acumulados por nivel superado |
| JWT | JSON Web Token, usado para autenticacion |
| Gateway | Punto de entrada unico a los microservicios (puerto 8080) |
| ngrok | Tunel HTTPS para conectar backend local con Render |
