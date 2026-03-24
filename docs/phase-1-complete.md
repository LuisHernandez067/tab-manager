# Phase 1 Complete — Tab Manager MVP Scaffold & Capture Flow

**Completed**: 2026-03-24  
**Verification result**: PASS — 17/17 tasks verified  
**SDD Artifacts**: Proposal #4, Spec #5, Design #6, Tasks #7, Apply-progress #10, Verify-report #11 (Engram)

---

## What Was Built

- **Angular 19 multi-project workspace** — four isolated extension surfaces (popup, side-panel, dashboard scaffold, options scaffold), each compiled to an independent bundle under `dist/extension/`.
- **All 6 domain model interfaces** — `SessionSnapshot`, `SavedTab`, `Collection`, `Tag`, `Rule`, `BackupRecord` — fully typed with `readonly` on immutable fields, matching `docs/requirements.md §8`.
- **Dexie v1 schema** (`TabManagerDB`) — all six stores, proper indexes per design, including compound `[sessionId+domain]` index on `savedTabs`.
- **Reactive repositories** — `SessionRepository` and `TabRepository` expose `liveQuery` observables bridged to Angular Signals via `toSignal()`; writes throw on failure (persistence-first invariant).
- **Typed message contract** — `TabManagerMessage` discriminated union covering all current SW ↔ UI messages; `MessageSenderService` generic send helper.
- **Extension Service Worker** (`workers/extension-worker.ts`) — panic-capture flow with atomic Dexie transaction; tab removal only executes after persistence is confirmed; handles `PANIC_CAPTURE`, `GET_SESSION_COUNT`, `RESTORE_SESSION`, `DELETE_SESSION`, `OPEN_DASHBOARD`, `OPEN_SIDE_PANEL`.
- **Popup UI** — `PanicButtonComponent` (loading/success/error states), `SessionCountBadgeComponent` (reactive via `toSignal`), dashboard navigation link.
- **Side Panel UI** — `SessionListComponent` renders recent sessions sorted newest-first with name, count, and timestamp; reactive via `toSignal(repo.getRecent$())`.
- **Build pipeline** — `build-worker.mjs` (esbuild, ESM, Chrome 120 target), `scripts/post-build.mjs` assembles `dist/extension/`; `manifest.json` MV3 with correct relative paths.

---

## Requirements Coverage (from `docs/requirements.md`)

| Requirement | Status | Notes |
|---|---|---|
| RF-001 Capture current window tabs | ✅ | Service worker capture flow |
| RF-002 Panic button accessible | ✅ | Popup + keyboard shortcut (`Ctrl+Shift+P`) |
| RF-003 Keyboard shortcut via `commands` | ✅ | `manifest.json` `commands` declaration |
| RF-004 Persist to IndexedDB | ✅ | Dexie `TabManagerDB` |
| RF-005 Close tabs after confirmed persistence | ⚠️ | Persistence-first guard implemented; tab close disabled for Phase 1 (accepted deviation) |
| RF-006 Side panel | ✅ | Session list scaffold |
| RF-007 Dashboard (full library view) | 🔲 | Scaffold only — Phase 2 |
| RF-008 Options page | ⚠️ | Scaffold only — Phase 3 |
| RF-009 Search | 🔲 | Phase 2 |
| RF-010–012 Restore flows | 🔲 | Phase 2 (stubs return "not implemented") |
| RF-013 Auto-categorization rules | 🔲 | Models defined; engine Phase 2 |
| RF-014–015 Export/import backup | 🔲 | Phase 3 |
| RF-016 Settings in `chrome.storage.local` | ✅ | `SettingsService` scaffold |
| RF-017 No backend | ✅ | Fully local-first |
| RNF-002 Persistence invariant | ✅ | Zero data loss guarantee enforced |

---

## Accepted Deviations

| Deviation | Reason | Phase |
|---|---|---|
| No automated tests (`*.spec.ts`) | Accepted for Phase 1 scaffold | Phase 2 |
| Angular 19 (not 21+) | Angular 21 not yet stable at time of implementation | N/A |
| esbuild binary mismatch in WSL | Windows-installed `node_modules`; `npm ci` on Linux resolves it | Operational |
| Missing PNG icon assets | Placeholder `.gitkeep` in `public/icons/` | Pre-publish |
| `options_ui` not declared in `manifest.json` | Options scaffold exists; manifest wiring deferred | Phase 3 |
| Tab close after capture disabled | Accepted explicitly for Phase 1 | Phase 2 |

---

## Files Created (Phase 1)

**Config & Build (root)**
- `package.json`, `angular.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.worker.json`, `tsconfig.spec.json`
- `manifest.json`, `build-worker.mjs`, `scripts/post-build.mjs`

**Domain Models** (`src/app/shared/models/`)
- `session-snapshot.model.ts`, `saved-tab.model.ts`, `collection.model.ts`, `tag.model.ts`, `rule.model.ts`, `backup-record.model.ts`, `index.ts`

**Data Layer** (`src/app/data/`)
- `dexie/tab-manager-db.ts`, `dexie/db.provider.ts`
- `repositories/session.repository.ts`, `repositories/tab.repository.ts`, `repositories/index.ts`
- `mappers/tab.mapper.ts`

**Shared Utilities** (`src/app/shared/`)
- `utils/url.utils.ts`, `constants/app.constants.ts`

**Messaging** (`src/app/core/messaging/`)
- `tab-manager-message.types.ts`, `message-sender.service.ts`, `index.ts`

**Popup Feature** (`src/app/features/popup/`)
- `main.ts`, `app.component.ts`
- `components/panic-button/panic-button.component.ts`
- `components/session-count-badge/session-count-badge.component.ts`

**Side Panel Feature** (`src/app/features/side-panel/`)
- `main.ts`, `app.component.ts`
- `components/session-list/session-list.component.ts`

**Dashboard / Options Scaffolds**
- `src/app/features/dashboard/main.ts`, `app.component.ts`
- `src/app/features/options/main.ts`, `app.component.ts`

**Service Worker**
- `workers/extension-worker.ts`

**Public Assets**
- `public/popup/index.html`, `public/side-panel/index.html`, `public/dashboard/index.html`, `public/options/index.html`
- `public/icons/.gitkeep`

---

## Known Gaps for Phase 2

1. **Dashboard UI** — session browsing, search, filters, tag/collection management (RF-007, RF-009, RF-013).
2. **Restore flows** — individual tab, multi-select, full session (RF-010, RF-011, RF-012). Current worker stubs return "not implemented".
3. **Tab close after capture** — the persistence guard is in place; the `chrome.tabs.remove()` call needs to be re-enabled in `extension-worker.ts` with user confirmation UX.
4. **Collections CRUD** — models and Dexie table exist; no UI or repository methods yet.
5. **Automated tests** — no `*.spec.ts` files; `TestBed` + mock Chrome APIs setup needed.
6. **`SettingsService`** integration — `chrome.storage.local` wrapper exists; not yet wired to any preference UI.

## Known Gaps for Phase 3

7. **Export/import backup** — `dexie-export-import` package not yet installed; `BackupRecord` model and store ready (RF-014, RF-015).
8. **Options page UI** — scaffold only; `options_ui` entry missing from `manifest.json`.
9. **Real icon assets** — PNG icons needed before Chrome Web Store submission.

---

## Architectural Notes for Future Phases

- The `liveQuery` → `toSignal()` bridge pattern works cleanly with `OnPush` change detection. No `NgZone.run()` hacks needed — keep this pattern.
- All six Dexie stores are schema-v1. Future schema additions use `this.version(2).stores({}).upgrade()` — do NOT modify v1 stores destructively.
- The `TabManagerMessage` discriminated union is the single source of truth for SW ↔ UI communication. Add new message variants here first before implementing handlers.
- The esbuild WSL/Windows mismatch resolves with `npm ci` on Linux. Document this in the dev setup README before onboarding new contributors.
- `crypto.randomUUID()` is used throughout for entity IDs — available in Chrome 92+ in both extension pages and the service worker. No UUID library needed.
