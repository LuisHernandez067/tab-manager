# AGENTS.md — Tab Manager (Chrome Extension)

> Coding agent reference for this repository. Read this before writing any code.

## Project Overview

**Tab Manager** is a local-first Chrome Extension (Manifest V3) built with:

- **Angular 21+** — standalone components only, no NgModules
- **Bootstrap 5** — layout and visual toolkit
- **TypeScript** — throughout, strict mode
- **Dexie** — IndexedDB ORM for primary persistence
- **`chrome.storage.local`** — lightweight settings only
- **Extension Service Worker** — background logic, no DOM access

This is a **greenfield** project. When code exists, follow its patterns exactly.

---

## Build & Dev Commands

> These commands will be available once the project is scaffolded with Angular CLI.

```bash
# Install dependencies
npm install

# Development build (watch mode)
ng build --watch

# Production build (for extension packaging)
ng build --configuration production

# Serve (not applicable for extensions — load unpacked in chrome://extensions)
# Load the `dist/` folder as an unpacked extension

# Run all tests
ng test

# Run a single test file
ng test --include='**/sessions.service.spec.ts'

# Run tests matching a describe/it string
ng test --include='**/*.spec.ts' -- --grep="SessionSnapshot"

# Lint
ng lint

# Type check without building
npx tsc --noEmit
```

---

## Project Structure

```
src/
  app/
    core/           # Cross-cutting services: messaging, permissions, settings, boot
    shared/         # Reusable UI components, models, utils, constants
    features/       # Domain modules: popup, side-panel, dashboard, options,
                    #   sessions, collections, backup, search
    data/           # Dexie DB, repositories, mappers, rules
    workers/        # extension-worker.ts (service worker entry point)
manifest.json
angular.json
tsconfig.json
```

---

## Architecture Rules

### Standalone Components Only
- **Never** create `NgModule`. Every component, pipe, and directive must be `standalone: true`.
- Import dependencies directly in the component's `imports: []` array.

### Feature Isolation
- Each feature under `features/` is self-contained.
- Cross-feature communication goes through services in `core/messaging/`.
- Features **never** import from sibling features directly.

### Service Worker Constraints
- `workers/extension-worker.ts` has **zero DOM access**. No `document`, no `window`, no Angular.
- It is plain TypeScript. Only Chrome Extension APIs and Dexie are allowed there.
- All UI logic lives in Angular components/services (popup, side-panel, dashboard, options).

### Persistence Split
- **IndexedDB (Dexie)** — all session/tab/collection/rule data. Never use `chrome.storage` for domain data.
- **`chrome.storage.local`** — settings and preferences only (theme, language, flags).
- **Never close tabs** before confirming that `SessionSnapshot` and all `SavedTab` records were persisted successfully.

### Message Passing
- All communication between the service worker and extension pages uses `chrome.runtime.sendMessage` / `chrome.runtime.connect`.
- Define typed message interfaces in `core/messaging/`.

---

## TypeScript Style

### Strict Mode
- `tsconfig.json` must have `strict: true`. Never disable strict checks.
- Avoid `any`. Use `unknown` when the type is truly unknown, then narrow it.

### Types and Interfaces
- Use `interface` for data shapes and domain models.
- Use `type` for unions, intersections, and aliases.
- All domain entities (`SessionSnapshot`, `SavedTab`, `Collection`, `Tag`, `Rule`, `BackupRecord`) live in `shared/models/`.
- Use `readonly` on properties that should not be mutated after creation.

```typescript
// Good
interface SessionSnapshot {
  readonly id: string;
  readonly createdAt: Date;
  name: string;
  status: 'active' | 'archived' | 'deleted';
  collectionId?: string;
}

// Bad — avoid loose shapes
const snapshot: any = { ... };
```

### Naming Conventions
| Construct | Convention | Example |
|---|---|---|
| Classes / Interfaces / Types | PascalCase | `SessionSnapshot`, `TabRepository` |
| Variables / functions / methods | camelCase | `savedTabs`, `captureCurrentWindow()` |
| Constants | UPPER_SNAKE_CASE | `MAX_TABS_PER_SESSION` |
| Files | kebab-case | `session-snapshot.model.ts` |
| Angular components | kebab-case selector | `<tm-session-card>` |
| Prefix for selectors | `tm-` | `tm-panic-button`, `tm-session-list` |
| Enums | PascalCase, members PascalCase | `SessionStatus.Active` |

### Imports Order
1. Angular core (`@angular/core`, `@angular/common`, etc.)
2. Third-party libraries (`dexie`, `bootstrap`, etc.)
3. Chrome types (`chrome`) — no import needed, available globally
4. Internal absolute paths (`@app/...` if path aliases configured)
5. Relative imports (`./`, `../`)

Separate each group with a blank line.

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import Dexie from 'dexie';

import { SessionRepository } from '@app/data/repositories/session.repository';
import { SessionSnapshot } from '@app/shared/models/session-snapshot.model';

import { PanicButtonComponent } from './panic-button.component';
```

---

## Error Handling

- **Never swallow errors silently.** Always log or propagate.
- In services, throw typed errors or return `Result`-style objects (`{ data, error }`).
- In the service worker, wrap all async Chrome API calls in try/catch — Chrome APIs can fail silently.
- **Critical invariant**: wrap tab-close logic so it only executes after persistence is confirmed.

```typescript
// Good — explicit guard before destructive operation
async function captureAndClose(windowId: number): Promise<void> {
  const tabs = await chrome.tabs.query({ windowId });
  await sessionRepository.saveSnapshot(tabs); // throws on failure
  await chrome.tabs.remove(tabs.map(t => t.id!)); // only reached if save succeeded
}
```

---

## Angular Specifics

- Use `inject()` function for dependency injection, not constructor injection.
- Use Signals (`signal()`, `computed()`, `effect()`) for reactive state inside components.
- Prefer `OnPush` change detection strategy on all components.
- Use `toSignal()` to bridge RxJS observables from services to component templates.
- Avoid `ngOnInit` lifecycle when `inject()` + signals can initialize state inline.

```typescript
@Component({
  selector: 'tm-session-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `...`,
})
export class SessionListComponent {
  private sessionRepo = inject(SessionRepository);
  sessions = toSignal(this.sessionRepo.getAll$(), { initialValue: [] });
}
```

---

## Manifest V3 Rules

- **No remote code**. All scripts, styles, and assets must be bundled inside the extension package. Never load from a CDN at runtime.
- Declare the minimum permissions needed. Current MVP set: `tabs`, `storage`, `commands`, `sidePanel`.
- Do not add `content_scripts`, `scripting`, or `host_permissions` unless a concrete feature requires them.
- The service worker entry point must be declared in `manifest.json` under `"background": { "service_worker": "..." }`.

---

## Testing Conventions

- Test files live alongside their source: `session.service.spec.ts` next to `session.service.ts`.
- Use Angular's `TestBed` for component and service tests.
- Mock Chrome APIs with a manual mock object — do not rely on real extension APIs in tests.
- Mock Dexie with an in-memory implementation or `jest-fake-indexeddb` (or equivalent for Karma/Jest).
- Describe blocks mirror the class name; `it` blocks state the expected behavior in plain English.

```typescript
describe('SessionRepository', () => {
  it('should persist a snapshot before any tabs are closed', async () => { ... });
  it('should throw if IndexedDB write fails', async () => { ... });
});
```

---

## What NOT to Do

- Do not add backend, authentication, or cloud sync — this is local-first by design.
- Do not use `NgModule` — standalone only.
- Do not store domain data in `chrome.storage` — use IndexedDB.
- Do not close tabs before confirming persistence.
- Do not load any resource from a remote URL at runtime.
- Do not use `any` — use proper types or `unknown`.
- Do not skip `readonly` on immutable domain model properties.
