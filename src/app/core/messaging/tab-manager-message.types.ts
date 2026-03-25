import type { CaptureMode, CaptureScope } from '@app/shared/models';

export type { CaptureMode, CaptureScope } from '@app/shared/models';

// ---------------------------------------------------------------------------
// Request messages — UI → Service Worker
// ---------------------------------------------------------------------------

/** Trigger a capture using the persisted scope preference */
export interface CaptureRequest {
  readonly type: 'CAPTURE';
  readonly mode: CaptureMode;
  readonly tabIds?: readonly number[];
  /** Omit to resolve from the active browser window */
  readonly currentWindowId?: number;
}

/** Get total saved (non-deleted) session count */
export interface GetSessionCountRequest {
  readonly type: 'GET_SESSION_COUNT';
}

/** Restore a saved session by opening its tabs */
export interface RestoreSessionRequest {
  readonly type: 'RESTORE_SESSION';
  readonly sessionId: string;
  /** true = open in a new window; false = open in the current window */
  readonly newWindow: boolean;
}

/** Permanently delete a saved session and its tabs */
export interface DeleteSessionRequest {
  readonly type: 'DELETE_SESSION';
  readonly sessionId: string;
}

/** Open the dashboard page in a new tab */
export interface OpenDashboardRequest {
  readonly type: 'OPEN_DASHBOARD';
}

/** Open the side panel */
export interface OpenSidePanelRequest {
  readonly type: 'OPEN_SIDE_PANEL';
}

// ---------------------------------------------------------------------------
// Event messages — Service Worker → UI (pushed, not request/response)
// ---------------------------------------------------------------------------

/** Capture completed successfully */
export interface CaptureCompleteEvent {
  readonly type: 'CAPTURE_COMPLETE';
  readonly result: CaptureResult;
}

/** Capture failed */
export interface CaptureFailedEvent {
  readonly type: 'CAPTURE_FAILED';
  readonly error: string;
}

/** Response to GET_SESSION_COUNT */
export interface SessionCountEvent {
  readonly type: 'SESSION_COUNT';
  readonly count: number;
}

// ---------------------------------------------------------------------------
// Response messages — Service Worker → UI (request/response pattern)
// ---------------------------------------------------------------------------

export interface SuccessResponse<T = void> {
  readonly success: true;
  readonly data: T;
}

export interface ErrorResponse {
  readonly success: false;
  readonly error: string;
}

export type TabManagerResponse<T = void> = SuccessResponse<T> | ErrorResponse;

// ---------------------------------------------------------------------------
// Specific response data types
// ---------------------------------------------------------------------------

export interface CaptureResult {
  readonly captureMode: CaptureMode;
  readonly scope: CaptureScope;
  readonly sessionId?: string;
  readonly standaloneGroupId?: string;
  readonly tabCount: number;
  readonly dryRunClosedCount: number;
  readonly message: string;
}

export interface SessionCountResult {
  readonly count: number;
}

// ---------------------------------------------------------------------------
// Union of all request messages (discriminated by `type`)
// ---------------------------------------------------------------------------

export type TabManagerRequest =
  | CaptureRequest
  | GetSessionCountRequest
  | RestoreSessionRequest
  | DeleteSessionRequest
  | OpenDashboardRequest
  | OpenSidePanelRequest;

// ---------------------------------------------------------------------------
// Full discriminated union — ALL messages in the system (requests + events)
// Used for handler registration and generic message routing.
// ---------------------------------------------------------------------------

export type TabManagerMessage =
  | CaptureRequest
  | GetSessionCountRequest
  | RestoreSessionRequest
  | DeleteSessionRequest
  | OpenDashboardRequest
  | OpenSidePanelRequest
  | CaptureCompleteEvent
  | CaptureFailedEvent
  | SessionCountEvent;
