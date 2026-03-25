// Angular's Karma builder only collects spec entrypoints that live under the
// popup project's source tree. Keep the real worker integration spec next to
// the worker code and expose a source-root shim here so the existing popup test
// runner includes it.

import '../../../workers/extension-worker.spec';
