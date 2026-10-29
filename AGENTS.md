## Agent instructions

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.
## TypeScript Best Practices
- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
## Angular Best Practices
- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- For global state, use NgRx (NgRx v22+)
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.
## Accessibility Requirements
- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.
### Components
- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Never use inline templates for components. Always use external templates and stylesheets.
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.
## State Management
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
## Templates
- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
## Services
- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

## General
- Do not restructure the project (renaming/moving files or directories) unless the feature or fix requires it.
- Do not change the build system or swap out build tooling.
- Never use deprecated libraries, APIs or methods.
- Add unit tests for new features and bug fixes.
- Document complex logic and non-obvious decisions with TSDoc comments.

## Project Overview

Tailormap Viewer is the Angular frontend for **Tailormap**, an open-source web GIS platform. It renders interactive maps (OpenLayers 2D + Cesium 3D) and provides an administration interface for configuring maps, layers, users, and data sources. It is a pure frontend that talks to the **tailormap-api** backend (Java / Spring Boot, developed separately at https://github.com/Tailormap/tailormap-api) over a RESTful API.

Stack: **TypeScript 5.x**, **Angular 22.x**, **OpenLayers 10.x**, **Cesium**, **NgRx** for state, **RxJS** for reactivity, **Angular Material** for UI, **Vitest** for tests. Node **>= 24** is required.

## Commands

```bash
npm install                # install dependencies
npm run start              # dev server on http://localhost:4200 (viewer + admin at /admin/)
npm run start-nl           # Dutch-localized dev server
PROXY_USE_LOCALHOST=true npm run start   # proxy /api to local backend (127.0.0.1:8080) instead of snapshot.tailormap.nl

npm run build              # production build (custom builder: tm-build-application)
npm run watch              # build with --watch (localized)

npm run test               # run all Vitest tests (viewer + admin)
npx ng test core --no-watch                 # run one library's tests (core|api|shared|map|admin-core|admin-api)
npx ng test core --no-watch --include lib/path/to/file.spec.ts  # run one spec file or directory (relative to the project's src/)
npx ng test core --no-watch --filter '^MyComponent'             # run only tests whose suite/test name matches a regex
npm run test-core          # Vitest UI for one library (also test-map, test-shared, test-admin-core)

npm run lint               # ng lint (ESLint over .ts + .html)
npm run lint-fix           # autofix; run this before committing
npx ng lint <project> --lint-file-patterns <file>  # lint a single file (e.g. project "core")
npx tsc --noEmit -p projects/<project>/tsconfig.lib.json  # type-check one library without building
npm run analyze-bundle     # esbuild bundle stats
```

Lint config: a single flat `eslint.config.js` at the repo root (ESLint 9 / `@angular-eslint/builder` v22 require flat config; there is no per-project `.eslintrc.js` anymore). It composes `eslint:recommended`, `typescript-eslint`, and `angular-eslint`'s recommended configs, then appends one block per library with that project's `parserOptions.project` tsconfigs and its `no-restricted-imports` rule (built from `.eslint-custom-rules.js`). `npx eslint <file>` now works directly since the flat config is auto-discovered, but prefer `ng lint` as shown above so results match CI.

Note: the dev server proxies `/api` to `https://snapshot.tailormap.nl` by default (see `proxy.config.js`), so **no local backend or database is needed** for frontend work. Set `PROXY_USE_LOCALHOST=true` to point at a locally running tailormap-api.

Before committing, run `npm run lint-fix` and `npm run test`.

## Monorepo Layout

This is a single Angular workspace (`angular.json`) with **one application (`app`)** and **six libraries**, referenced via TypeScript path aliases (`tsconfig.json`) so `@tailormap-viewer/core` etc. resolve to source directly (no pre-build). The Vitest test builds resolve the same aliases.

| Project | Alias | Purpose |
|---|---|---|
| `app` | — | Thin bootstrap application (`projects/app`). Composes libraries, environments, i18n configs. Selector prefix `app`. |
| `api` | `@tailormap-viewer/api` | Backend API client, DTO/models, injection tokens. No UI, no OpenLayers. |
| `shared` | `@tailormap-viewer/shared` | Reusable UI components, pipes, directives, helpers (Material-based). Selector prefix `tm`. |
| `map` | `@tailormap-viewer/map` | **The OpenLayers/Cesium wrapper.** Selector prefix `lib`. |
| `core` | `@tailormap-viewer/core` | The viewer application logic: map components, tools, NgRx state, routing. Selector prefix `tm`. |
| `admin-api` | `@tailormap-admin/admin-api` | API client + models for the admin REST API. |
| `admin-core` | `@tailormap-admin/admin-core` | The admin interface, lazy-loaded at the `/admin` route. Selector prefix `tm-admin`. |

Dependency direction (enforced by lint, see below): `app` → `core` → (`map`, `shared`, `api`); admin libraries build on the same viewer libraries. Libraries must not import from their own alias (no circular refs), and viewer code must not import from `@tailormap-admin/*`.

## Architecture

### Routing entry points
`projects/core/src/lib/core.routes.ts` defines the top-level routes. `ViewerAppComponent` handles `''`, `app/:name`, and `service/:name` (the map viewer). `/admin` **lazy-loads** `adminRoutes` from `@tailormap-admin/admin-core` via `loadChildren`. There is no separate admin app — viewer and admin ship in the same bundle, admin behind a lazy route + `AdminAuthGuard`.

### The map abstraction (critical)
All OpenLayers and Cesium usage is **encapsulated in the `map` library**. ESLint forbids importing `ol` / `ol/*` anywhere outside `map` (`.eslint-custom-rules.js`), with a small allowlist of exceptions. Consuming code interacts with the map only through `MapService` (`projects/map/src/lib/map-service/map.service.ts`), which exposes RxJS observables over manager objects:

- `OpenLayersMap` — the concrete map instance, wrapping OL + a `CesiumManager` for 3D.
- **Manager models** returned as observables: `LayerManagerModel`, `ToolManagerModel`, tooltip, snapping, event managers. New map behavior is typically a new "tool" or an operation on a manager, not direct OL calls in components.

When adding map functionality, add it inside `projects/map` and expose it through `MapService` / a manager, then consume it via injection elsewhere.

### State management (NgRx)
Feature state lives under each library's `state/` folder, e.g. `projects/core/src/lib/state` with the conventional `*.actions.ts`, `*.reducer.ts`, `*.selectors.ts`, `*.effects.ts`, `*.state.ts` split. Feature keys are exported constants (e.g. `coreStateKey = 'core'`). Nested feature state (e.g. `filter-state/`) follows the same pattern. Prefer selectors + effects over touching the store directly in components.

### API layer
`@tailormap-viewer/api` centralizes backend communication. Services are provided behind **injection tokens** (e.g. `tailormap-api-v1.service.injection-token.ts`) with real and **mock** implementations (`*-mock.service.ts`, plus `mock-data/`) so tests and Storybook-like scenarios can swap the backend. Models in `api/models` are plain TypeScript interfaces/DTOs mirroring the backend. The backend contract derives from OpenAPI definitions.

### Components & registration
Viewer UI is organized as feature component groups under `projects/core/src/lib/components` (attribute-list, drawing, edit, feature-info, filter, legend, print, toc, toolbar, etc.). Components register themselves via a `ComponentRegistrationService` / `registered-components-renderer` so the viewer can dynamically place enabled components based on application config from the backend.

## Conventions

- **Angular style**: standalone components, directives and pipes (there are no `@NgModule`s; the app bootstraps from `projects/app/src/main.ts`), dependency injection via `inject()` (an `@angular-eslint/prefer-inject` rule is enforced), one responsibility per class/service. Keep components thin — business logic and data access belong in services.
- **Explicit member accessibility** is required on TS members (`@typescript-eslint/explicit-member-accessibility`). `any` is disallowed.
- **Naming**: `kebab-case` filenames, `PascalCase` class names. Selector prefixes per library (see table above).
- **Do not import OpenLayers outside the `map` library**; wrap it instead.
- **Do not import `@angular/localize/init` / `$localize`** — it is provided once in `polyfills.ts`.
- **i18n**: locale messages are extracted with `npm run extract-locale`. The default build is English; `nl`/`de` are localized configurations.
- **Scaffolding**: `npm run ng -- generate component components/[name] --project core|map`. For an HTTP service: `npm run ng -- generate service services/[name] --project core|map --http-service`.

## Testing Patterns

Tests run on **Vitest** via Angular's `@angular/build:unit-test` builder (`ng test <project>`), configured per library in `angular.json`; there is no Jest anymore. Shared config:

- `vitest-base.config.ts` — workspace Vitest config (`isolate: true`, global setup in `test-globals.ts`, which forces `TZ=UTC`).
- `test-setup.ts` — runs before every spec file: loads polyfills + `zone.js/testing`, registers `@testing-library/jest-dom` matchers, stubs `ResizeObserver` / `IntersectionObserver` / `EventSource` / `localStorage` / `sessionStorage` / `scrollTo`, mocks `jsts` WKT/buffer modules, and in a global `beforeEach` adds `MatIconTestingModule` and disables Material animations. Specs therefore don't need to import `MatIconTestingModule` or set up these stubs themselves.

Conventions:

- Specs live next to the code as `*.spec.ts`. Import test APIs explicitly: `import { describe, test, expect, vi } from 'vitest';` (globals are typed but the codebase imports them).
- Use `vi.fn()`, `vi.spyOn()`, `vi.mock()`, `vi.useFakeTimers()` — never `jest.*`.
- **Components**: render with `render(Component, { imports, providers, inputs, configureTestBed })` from `@testing-library/angular`, query via `screen` (prefer `getByRole` / `findByRole` / `getByText`) and assert with jest-dom matchers (`toBeInTheDocument`, `toHaveTextContent`, ...). Simulate interaction with `await userEvent.click(...)` / `await userEvent.type(...)` from `@testing-library/user-event`; use `await waitFor(...)` or `findBy*` for async updates. To shallow-render, use `configureTestBed: tb => tb.overrideComponent(Comp, { set: { imports: [...], schemas: [NO_ERRORS_SCHEMA] } })`.
- **Services / effects**: use `TestBed.configureTestingModule` + `TestBed.inject(...)`. For HTTP services use `provideHttpClient()` + `provideHttpClientTesting()` and `HttpTestingController`.

Common building blocks:

- **NgRx**: `provideMockStore({ initialState, selectors: [{ selector, value }] })` from `@ngrx/store/testing` (or `createMockStore(...)` when you need the instance directly). Change values per test with `store.overrideSelector(...)` followed by `store.refreshState()`. Capture dispatches with `store.dispatch = vi.fn()` or `vi.spyOn(store, 'dispatch')`. `getFullInitialAppState()` (`projects/core/src/lib/test-helpers/full-app-state.mock.ts`) provides a complete viewer state.
- **Map**: never construct a real `MapService` / OpenLayers map in a test. Use `getMapServiceMock(createdTool?, projectionCode?, overrides?)` from `projects/core/src/lib/test-helpers/map-service.mock.ts`; add its `.provider` to `providers`. It returns a mocked `MapService` whose methods are `vi.fn()`s returning observables; `createMapServiceMockWithDrawingTools()` covers drawing-tool scenarios.
- **API**: provide the mock implementations behind the injection tokens instead of hitting the network, e.g. `{ provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService }` (and `TailormapSecurityApiV1MockService`, `TailormapAdminApiV1MockService`); fixtures live in each API library's `mock-data/`.
- **Auth**: `AuthenticatedUserTestHelper.provideAuthenticatedUserService(isAuthenticated, roles)` (or `...WithUser()` / `...WithAdminUser()`) in `projects/core/src/lib/test-helpers/` (an admin-core variant lives in `projects/admin-core/src/lib/test-helpers/`, alongside `TestSaveHelper` for admin save flows).
